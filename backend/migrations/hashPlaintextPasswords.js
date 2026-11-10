const bcrypt = require('bcryptjs');
const { getConnection } = require('../db');

const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/;

/**
 * One-time, idempotent migration: replaces any plaintext password left by the seed data
 * with a bcrypt hash, so no credential is ever stored in plaintext at rest.
 */
async function hashPlaintextPasswords() {
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute('SELECT user_id, password_hash FROM USERS');
    let migrated = 0;
    for (const [userId, stored] of rows) {
      if (!stored || BCRYPT_PATTERN.test(stored)) continue;
      const hash = await bcrypt.hash(stored, 12);
      await connection.execute('UPDATE USERS SET password_hash = :hash WHERE user_id = :id', { hash, id: userId });
      migrated += 1;
    }
    if (migrated > 0) console.log(`[migrations] Hashed ${migrated} plaintext password(s)`);
  } finally {
    await connection.close();
  }
}

module.exports = { hashPlaintextPasswords };
