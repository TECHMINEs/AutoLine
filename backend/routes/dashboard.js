const { sendServerError } = require('../utils/http');
const {getConnection} = require('../db');
 
const express = require("express")
const dashboardRouter = express.Router()


//total production 

dashboardRouter.get('/total-production', async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(SUM(quantity_produced), 0)
            FROM DAILY_PRODUCTION
        `);

        res.json({
            total_production: result.rows[0][0]
        });

    } catch (err) {
        sendServerError(res, 'dashboard route', err);
    } finally {
        if (connection) await connection.close();
    }
});

//total cost
dashboardRouter.get('/total-cost', async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(SUM(total_cost), 0)
            FROM PARTS_USAGE
        `);

        res.json({
            total_cost: result.rows[0][0]
        });

    } catch (err) {
        sendServerError(res, 'dashboard route', err);
    } finally {
        if (connection) await connection.close();
    }
});

//defect rate
dashboardRouter.get('/defect-rate', async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(AVG(defect_percentage), 0)
            FROM QUALITY_TESTING
        `);

        res.json({
            defect_rate: result.rows[0][0]
        });

    } catch (err) {
        sendServerError(res, 'dashboard route', err);
    } finally {
        if (connection) await connection.close();
    }
});

//production trend,  needs today and yesterday entries!!
dashboardRouter.get('/production-trend', async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
            SELECT 
                today_count AS today, 
                yesterday_count AS yesterday,
                ROUND(NVL((today_count - yesterday_count) / NULLIF(yesterday_count, 0) * 100, 0), 1) AS trend_pct
            FROM (
                SELECT 
                    NVL(SUM(CASE WHEN TRUNC(production_date) = TRUNC(SYSDATE) THEN quantity_produced END), 0) AS today_count,
                    NVL(SUM(CASE WHEN TRUNC(production_date) = TRUNC(SYSDATE) - 1 THEN quantity_produced END), 0) AS yesterday_count
                FROM DAILY_PRODUCTION
            )
        `);

        const today = result.rows[0][0] || 0;
        const yesterday = result.rows[0][1] || 0;
        const trend = result.rows[0][2] || 0;

        res.json({
            today,
            yesterday,
            trend: trend,
            direction: today >= yesterday ? "UP" : "DOWN"
        });

    } catch (err) {
        sendServerError(res, 'dashboard route', err);
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = dashboardRouter;