import nJwt from 'njwt';
import validator from 'validator';
import * as util from './user/util';
import { knex } from '../io/knex';

// Temporary DDoS / flood control measure
const MAX_USERS = 5;

const users = {
  async create({ email, password }) {
    // Check valid email provided
    if (!validator.isEmail(email)) {
      throw new Error(`'${email}' is not a valid email address`);
    }

    // Check we haven't oversubscribed (prevent DDoS / flood control)
    const { count } = await knex('user').count().first();
    if (Number(count) > MAX_USERS) {
      throw new Error('Sorry, this server is over subscribed and not accepting new registrations.');
    }

    // Check email isn't already registered
    const [existing] = await knex('user')
      .where('email', email);
    if (existing) {
      throw new Error('An account with that email already exists.');
    }

    // Hash password
    const salt = util.getNewSalt();
    const iterations = Number(process.env.HASH_PASSWORD_ITERATIONS);
    const hashedPassword = await util.hashPassword(password, salt, iterations);

    // Insert user and hashed password into the database
    return knex('user').insert({
      email,
      password: hashedPassword,
      salt,
      iterations,
    });
  },

  /**
   * Takes email and password and returns JSON web token (compacted)
   * via a promise
   *
   * Resolves to JWT if valid user/password.  Rejects with error otherwise.
   */
  getToken: async ({ email, password, permanent }) =>
    new Promise(async (resolve, reject) => {
      const [user] = await knex('user').where('email', email);
      if (user && await util.isPasswordCorrect(user, password)) {
        // Valid user/password.  Determine permissions
        const permissions = [
          'user',
        ];
        if (user.is_admin) {
          permissions.push('admin');
        }

        // Build claims of JWT
        const claims = {
          sub: user.id,
          iss: 'https://overnode.org',
          permissions,
        };

        // Create token and return compacted version
        const token = nJwt.create(claims, process.env.JWT_SIGNING_KEY);

        // If permanent token requested, set expiry out to end of the century
        if (permanent) {
          token.setExpiration(new Date('2099-12-31'));
        }

        const compactToken = token.compact();
        resolve(compactToken);
      } else {
        reject(new Error('Email or password is incorrect.'));
      }
    }),

  isAdmin(token) {
    if (!token) {
      // No token
      throw new Error('Not authorized');
    }

    // Validate token provided hasn't expired and token gives requester
    // admin rights (throws exception if not)
    users.validateAccess({ token, permission: 'admin' });

    // Return true if we get this far
    return true;
  },

  /**
   * Validates a token is valid, not expired and contains the
   * nominated permission.  Throws exception if any of these
   * tests fail otherwise returns without throwing exception.
   */
  validateAccess: ({ token, permission }) => {
    if (!token) {
      throw new Error('Not authorized');
    }
    if (!permission) {
      throw new Error('Server error - invalid parameters in call to validateAccess');
    }

    // Parse/verify token itself
    let verifiedJwt;
    try {
      verifiedJwt = nJwt.verify(token, process.env.JWT_SIGNING_KEY);
    } catch (err) {
      // Humanize error messages
      if (err.message.includes('expired')) {
        throw new Error('Access expired');
      } else {
        throw new Error('Not authorized');
      }
    }

    // Verify permissions
    if (!verifiedJwt.body.permissions.includes(permission)) {
      throw new Error('Not authorized');
    }
  },
};

export default users;
