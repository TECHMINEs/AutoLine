const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

async function seed() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const schemaPath = path.join(__dirname, '../database_schema.sql');

    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec("PRAGMA foreign_keys = OFF;");

    const schema = fs.readFileSync(schemaPath, 'utf8');

    let sqliteSchema = schema
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--.*$/gm, '') // Remove single line comments
        .replace(/BEGIN[\s\S]*?END;/gi, '')
        .replace(/\//g, '')
        .replace(/CREATE SEQUENCE.*?;/gi, '')
        .replace(/VARCHAR2/gi, 'TEXT')
        .replace(/VARCHAR/gi, 'TEXT')
        .replace(/NUMBER\(\s*\d+\s*,\s*\d+\s*\)/gi, 'NUMERIC')
        .replace(/NUMBER/gi, 'INTEGER')
        .replace(/SYSTIMESTAMP/gi, 'CURRENT_TIMESTAMP')
        .replace(/SYSDATE/gi, 'CURRENT_TIMESTAMP')
        .replace(/TO_DATE\('([^']+)',\s*'[^']+'\)/gi, "'$1'");

    const queries = sqliteSchema.split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0 && !q.startsWith('--') && !q.startsWith('COMMIT') && !q.startsWith('DECLARE'));

    for (let q of queries) {
        try {
            await db.exec(q);
        } catch (e) {
            console.error("Failed on query: ", q)
            console.error("Error: ", e.message);
        }
    }
    
    console.log("Seeding complete.");
}

seed();
