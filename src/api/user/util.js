// Node imports
const crypto = require('crypto');

export function getNewSalt() {
  return crypto.randomBytes(128).toString('base64');
}

export async function hashPassword(password, salt, iterations) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, 512, 'sha512', (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey.toString('hex'));
      }
    });
  });
}

export async function isPasswordCorrect(user, password) {
  const hashedPassword = await hashPassword(password, user.salt, user.iterations);
  return user.password === hashedPassword;
}
