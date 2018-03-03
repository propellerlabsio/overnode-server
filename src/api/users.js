import nJwt from 'njwt';
import validator from 'validator';
import * as util from './user/util';
import { knex } from '../knex';

const users = {
  async create({ email, password }) {
    if (!validator.isEmail(email)) {
      throw new Error(`'${email}' is not a valid email address`);
    }

    const [existing] = await knex('user')
      .where('email', email);
    if (existing) {
      throw new Error('An account with that email already exists.');
    }

    const salt = util.getNewSalt();
    const iterations = Number(process.env.HASH_PASSWORD_ITERATIONS);
    const hashedPassword = await util.hashPassword(password, salt, iterations);

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

  /**
   * Validates a token returning an object with the user id and
   * permissions
   */
  validateAccess: ({ token, permission }) => {
    if (!token) {
      throw new Error('Missing access token');
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
        throw new Error('Access token expired');
      } else {
        throw new Error('Invalid access token');
      }
    }

    // Verify permissions
    if (!verifiedJwt.body.permissions.includes(permission)) {
      throw new Error(`The requestor does not have '${permission.split('_').join(' ')}' access permission.`);
    }
    return {
      id: String(verifiedJwt.body.sub),
      permissions: verifiedJwt.body.permissions,
    };
  },
};

export default users;
