const express = require('express')
const { getConnection } = require('../db');
const dropdownRouter = express.Router();

dropdownRouter.get('/lines', async(req, res)=>{
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT line_id, line_name
            FROM PRODUCTION_LINES
            WHERE status = 'Active'
            ORDER BY line_name
        `);
        res.json(result.rows);
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
    finally {
        if (connection) await connection.close();
    }
})

dropdownRouter.get('/models', async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
            SELECT model_id, model_name
            FROM CAR_MODELS
            WHERE is_active = 'Y'
            ORDER BY model_name
        `);

        res.json(result.rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = dropdownRouter;