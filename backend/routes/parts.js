const express = require("express")
const partsusageRouter = express.Router();
const {getConnection} = require('../db');

// get parts usage
partsusageRouter.get('/partsusage', async(req, res)=> {

    try {
        const connection = await getConnection();
        const parts_usage_data = await connection.execute('SELECT pu.usage_id, pu.usage_date, p.part_name, pu.quantity_used, pu.total_cost, l.line_name FROM PARTS_USAGE pu JOIN PARTS p ON pu.part_id = p.part_id JOIN PRODUCTION_LINES l ON pu.line_id = l.line_id');
        res.json(parts_usage_data.rows);
        await connection.close();

    }
    catch(err) {
        console.log('Error while getting parts usage data.', err);
        res.status(500).json({ error: err.message }); 
        
    }
})

// post parts usage
partsusageRouter.post('/partsusage', async(req, res)=> {

    try {
        const {usage_date,
            part_id,
            quantity_used,
            unit_price,
            line_id,
            production_id} = req.body;

        const total_cost=quantity_used*unit_price;

        const connection = await getConnection();
            await connection.execute(`INSERT INTO PARTS_USAGE 
            (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, line_id, production_id) 
            VALUES 
            (seq_usage.NEXTVAL, TO_DATE(:usage_date,'YYYY-MM-DD'), :part_id, :quantity_used, :unit_price, :total_cost, :line_id, :production_id)`, {
                usage_date,
                part_id,
                quantity_used,
                unit_price,
                total_cost,
                line_id,
                production_id
            },
        {autoCommit:true});

        await connection.close();
        res.json({message:"Parts usage row inserted"});
        await connection.close();

    }
    catch(err) {
        console.log('Error while inserting parts usage data.', err);
        res.status(500).json({ error: err.message }); 
        
    }
})

//parts summary
partsusageRouter.get('/parts/summary', async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
            SELECT
                COUNT(*) AS total_parts,
                NVL(SUM(unit_price * stock_quantity), 0) AS total_inventory_value,

                SUM(CASE 
                    WHEN stock_quantity < min_stock_level AND stock_quantity > 0 
                    THEN 1 ELSE 0 
                END) AS low_stock_count,

                SUM(CASE 
                    WHEN stock_quantity = 0 
                    THEN 1 ELSE 0 
                END) AS out_of_stock_count

            FROM PARTS
        `);

        const row = result.rows[0];

        res.json({
            total_parts: row[0],
            total_inventory_value: row[1],
            low_stock_count: row[2],
            out_of_stock_count: row[3]
        });

    } catch (err) {
        console.log("Error fetching parts summary", err);
        res.status(500).json({ error: err.message });

    } finally {
        if (connection) await connection.close();
    }
});


partsusageRouter.post('/parts/bulk-update', async (req, res) => {
    let connection;

    try {
        const { updates } = req.body;

        connection = await getConnection();

        for (let item of updates) {

            let query = "";
            
            if (item.type === "ADD") {
                query = `
                    UPDATE PARTS 
                    SET stock_quantity = stock_quantity + :qty
                    WHERE part_id = :id
                `;
            }

            else if (item.type === "SUBTRACT") {
                query = `
                    UPDATE PARTS 
                    SET stock_quantity = stock_quantity - :qty
                    WHERE part_id = :id
                `;
            }

            else if (item.type === "SET") {
                query = `
                    UPDATE PARTS 
                    SET stock_quantity = :qty
                    WHERE part_id = :id
                `;
            }

            await connection.execute(query, {
                qty: item.quantity,
                id: item.part_id
            });
        }

        await connection.commit();

        res.json({ message: "Bulk update successful" });

    } catch (err) {
        console.log("Bulk update error", err);
        res.status(500).json({ error: err.message });

    } finally {
        if (connection) await connection.close();
    }
});

//calculate bill
// NEW — calculates AND updates stock in DB
partsusageRouter.post('/parts/order', async (req, res) => {
    let connection;
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }

        let total = 0;
        items.forEach(item => {
            total += item.quantity * item.unit_price;
        });

        connection = await getConnection();

        // ADD ordered quantity to stock for each part
        for (const item of items) {
            await connection.execute(
                `UPDATE PARTS
                 SET stock_quantity = stock_quantity + :qty,
                     last_updated   = SYSDATE
                 WHERE part_id = :id`,
                { qty: item.quantity, id: item.part_id }
            );
        }

        await connection.commit();

        res.json({ total_cost: total, items });

    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (_) {}
        }
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

const PDFDocument = require("pdfkit");

partsusageRouter.post('/parts/order/pdf', (req, res) => {
    const { items } = req.body;

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).text("Parts Order Bill", { align: "center" });

    let total = 0;

    items.forEach(item => {
        const cost = item.quantity * item.unit_price;
        total += cost;

        doc.text(
            `Part ID: ${item.part_id} | Qty: ${item.quantity} | ₹${cost}`
        );
    });

    doc.text("-----------------------------");
    doc.text(`Total Cost: ₹${total}`);

    doc.end();
});
module.exports = partsusageRouter;






