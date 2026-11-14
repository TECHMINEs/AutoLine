const { getConnection } = require('../db');

// Columns the UI collects that were missing from the SQLite schema (data used to be dropped)
const COLUMNS = [
  { table: 'EMPLOYEES', column: 'email', type: 'TEXT' },
  { table: 'EMPLOYEES', column: 'phone', type: 'TEXT' },
  { table: 'EMPLOYEES', column: 'joining_date', type: 'TEXT' },
  { table: 'CAR_MODELS', column: 'description', type: 'TEXT' },
];

/** Idempotent: adds each column only if the table does not already have it. */
async function addProfileColumns() {
  const connection = await getConnection();
  try {
    for (const { table, column, type } of COLUMNS) {
      const { rows } = await connection.execute(`SELECT name FROM pragma_table_info('${table}')`);
      if (rows.some(([name]) => name.toLowerCase() === column)) continue;
      await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`[migrations] Added ${table}.${column}`);
    }
  } finally {
    await connection.close();
  }
}

module.exports = { addProfileColumns };
