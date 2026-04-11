const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function getConnection() {
    const db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    return {
        execute: async (query, binds = {}, options = {}) => {
            let sqliteQuery = query;
            const sqliteBinds = {};

            if (binds && !Array.isArray(binds)) {
                for (const key in binds) {
                    // Replace :key with $key but only if it's not a string literal (rudimentary regex)
                    const regex = new RegExp(':' + key + '\\b', 'g');
                    sqliteQuery = sqliteQuery.replace(regex, '$' + key);
                    sqliteBinds['$' + key] = binds[key];
                }
            }

            // Oracle to SQLite function translations
            sqliteQuery = sqliteQuery.replace(/NVL\(/gi, 'IFNULL(');
            sqliteQuery = sqliteQuery.replace(/TRUNC\(SYSDATE\)\s*-\s*(\d+)/gi, "DATE('now', '-$1 days')");
            sqliteQuery = sqliteQuery.replace(/TRUNC\(SYSDATE\)/gi, "DATE('now')");
            sqliteQuery = sqliteQuery.replace(/TRUNC\(([a-zA-Z0-9_]+)\)/gi, 'DATE($1)');
            sqliteQuery = sqliteQuery.replace(/SYSTIMESTAMP/gi, "CURRENT_TIMESTAMP");
            sqliteQuery = sqliteQuery.replace(/SYSDATE/gi, "CURRENT_TIMESTAMP");
            sqliteQuery = sqliteQuery.replace(/seq_usage\.NEXTVAL/gi, '(SELECT COALESCE(MAX(usage_id), 0) + 1 FROM PARTS_USAGE)');
            sqliteQuery = sqliteQuery.replace(/seq_production\.NEXTVAL/gi, '(SELECT COALESCE(MAX(production_id), 0) + 1 FROM DAILY_PRODUCTION)');
            sqliteQuery = sqliteQuery.replace(/TO_DATE\(\s*(\$[a-zA-Z0-9_]+)\s*,\s*'[^']+'\s*\)/gi, '$1');

            const isSelect = sqliteQuery.trim().toUpperCase().startsWith('SELECT');

            try {
                if (isSelect) {
                    const rowsObj = await db.all(sqliteQuery, sqliteBinds);
                    const rows = rowsObj.map(obj => Object.values(obj));
                    return { rows };
                } else {
                    const result = await db.run(sqliteQuery, sqliteBinds);
                    return { rowsAffected: result.changes };
                }
            } catch (error) {
                console.error("SQL Error in wrapper:", error.message);
                console.error("Executed Query:", sqliteQuery);
                throw error;
            }
        },
        commit: async () => {}, // Mock commit
        rollback: async () => {}, // Mock rollback
        close: async () => {
            await db.close();
        }
    };
}

module.exports = { getConnection };
