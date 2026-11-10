const { sendServerError } = require('../utils/http');
const express = require("express")

const {getConnection} = require('../db');
const productionRouter = express.Router();

//get daily production

productionRouter.get('/dailyproduction', async (req,res)=> {
    let connection;
    try {
         connection = await getConnection();

        let query = `
            SELECT 
                p.production_id, 
                p.production_date,
                l.line_name, 
                m.model_name,
                p.quantity_produced, 
                p.shift
            FROM DAILY_PRODUCTION p
            JOIN PRODUCTION_LINES l ON p.line_id = l.line_id 
            JOIN CAR_MODELS m ON p.model_id = m.model_id
            WHERE 1=1
        `;

        let binds = {};

        if (req.query.search) {
            query += `
                AND (
                    LOWER(m.model_name) LIKE :search OR
                    LOWER(l.line_name) LIKE :search OR
                    LOWER(p.shift) LIKE :search
                )
            `;
            binds.search = `%${req.query.search.toLowerCase()}%`;
        }

        query += ` ORDER BY p.production_date DESC`;

        const result = await connection.execute(query, binds);

        res.json(result.rows);
    }
    catch(err) {
        sendServerError(res, 'Error while getting daily production line data', err); 
        
    }

})

// post daily production
productionRouter.post('/dailyproduction', async (req,res)=> {
    try {
        const { production_date,line_id,  model_id, quantity_produced,shift,supervisor_id, notes, created_by}=req.body;
        const connection = await getConnection()
        await connection.execute(
            `DECLARE
                v_prod_id NUMBER;
            BEGIN
                INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id, notes, created_at)
                VALUES (seq_production.NEXTVAL, TO_DATE(:production_date, 'YYYY-MM-DD'), :line_id, :model_id, :quantity_produced, :shift, :supervisor_id, :notes, SYSTIMESTAMP)
                RETURNING production_id INTO v_prod_id;

                INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, line_id, production_id)
                SELECT seq_usage.NEXTVAL, TO_DATE(:production_date, 'YYYY-MM-DD'), b.part_id, (b.quantity_per_car * :quantity_produced), p.unit_price, 
                       (b.quantity_per_car * :quantity_produced * p.unit_price), :line_id, v_prod_id
                FROM BILL_OF_MATERIALS b JOIN PARTS p ON b.part_id = p.part_id
                WHERE b.model_id = :model_id;
                
                COMMIT;
            END;`,
            {
               production_date: production_date || null,
               line_id: line_id || null,
               model_id: model_id || null,
               quantity_produced: quantity_produced || null,
               shift: shift || null,
               supervisor_id: supervisor_id || null,
               notes: notes || ''
            },
            {autoCommit:false}
        );
        
        await connection.close();
        res.status(201).json({
            message: "Row inserted"
        })
    }
    catch(err) {
        sendServerError(res, 'Error while inserting daily production data', err);}
   
})

module.exports = productionRouter;