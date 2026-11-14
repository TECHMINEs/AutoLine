const { sendServerError } = require('../utils/http');
    const express = require("express")
    const {getConnection} = require('../db');
    const Qualityrouter = express.Router()

    //posting in table QUALITY_TESTING
    Qualityrouter.post('/qualitytest', async (req,res)=> {
        try {
            const connection = await getConnection();
            const { test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed,inspector_id, shift, notes} = req.body;
            await connection.execute(`INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed,  inspector_id, shift, notes) VALUES (quality_testing_seq.NEXTVAL, TO_DATE(:test_date,'YYYY-MM-DD'), :line_id, :model_id, :production_id, :cars_tested, :cars_passed, :cars_failed, :inspector_id, :shift, :notes)`,
            {
                test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, inspector_id, shift, notes
            },
            {autoCommit:true});

            res.status(201).json({message:"Row inserted into quality_testing"});
            await connection.close();
        }
        catch(err) {
            sendServerError(res, 'Error while inserting into quality_testing', err); 
            
        }

    })
    Qualityrouter.get('/qualitytest', async (req, res)=> {
        try {
            const connection = await getConnection();
            const result =  await connection.execute('Select * from QUALITY_TESTING')
            res.json(result.rows);
            await connection.close();
        }
        catch(err) {
            sendServerError(res, 'Error getting quality testing data', err);
            
        }
    })

Qualityrouter.get('/qualitytest/summary', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    // Defect rate by production line
    const byLine = await connection.execute(`
      SELECT l.line_name, 
             ROUND(AVG(q.defect_percentage), 2) AS avg_defect,
             COUNT(*) AS test_count,
             SUM(q.cars_failed) AS total_failed
      FROM QUALITY_TESTING q
      JOIN PRODUCTION_LINES l ON q.line_id = l.line_id
      GROUP BY l.line_name
      ORDER BY avg_defect DESC
    `);

    // Defect rate by car model
    const byModel = await connection.execute(`
      SELECT m.model_name,
             ROUND(AVG(q.defect_percentage), 2) AS avg_defect,
             COUNT(*) AS test_count,
             SUM(q.cars_failed) AS total_failed
      FROM QUALITY_TESTING q
      JOIN CAR_MODELS m ON q.model_id = m.model_id
      GROUP BY m.model_name
      ORDER BY avg_defect DESC
    `);

    res.json({
      by_line:  byLine.rows,
      by_model: byModel.rows,
    });

  } catch (err) {
    sendServerError(res, 'quality route', err);
  } finally {
    if (connection) await connection.close();
  }
});



    module.exports=Qualityrouter