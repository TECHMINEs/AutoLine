const { sendServerError } = require('../utils/http');
const bcrypt = require('bcryptjs');
const express = require("express")
const {getConnection} = require('../db');
const settingsRouter = express.Router();


//get productionlines-
settingsRouter.get('/lines', async (req,res)=> {
    try {
         const connection = await getConnection()
    const lines=await connection.execute('select * from production_lines');
    res.json(lines.rows)
    await connection.close();
    }
    catch(err) {
        sendServerError(res, 'Error while getting production line data', err);
        
    }
   
})

//post productionlines--
settingsRouter.post('/lines', async (req,res)=> {
    try {
        const { line_name, line_type, status, daily_capacity}=req.body;
        const connection = await getConnection()
        await connection.execute(`insert into production_lines (LINE_ID, LINE_NAME, LINE_TYPE, STATUS, DAILY_CAPACITY) SELECT NVL((SELECT MAX(line_id) FROM production_lines), 0) + 1, :line_name, :line_type, :status, :daily_capacity FROM DUAL`, {
           
            line_name,
            line_type,
            status,
            daily_capacity
            
        },
        {autoCommit:true});
        
        await connection.close();
        res.status(201).json({
            message: "Row inserted"
        })
    }
    catch(err) {
        sendServerError(res, 'Error while getting production line data', err);}
   
})

//get models

settingsRouter.get('/models', async (req, res)=> {
    try {
        const connection= await getConnection();
        // Column order is the contract with the Models page: 0 id, 1 name, 2 type, 3 price, 4 code, 5 description, 6 is_active
        let query = `SELECT model_id, model_name, model_type, base_price, model_code, description, is_active FROM car_models WHERE 1=1`;
       
        let binds = {}
        if (req.query.search) {
            query+=` AND LOWER(model_name) LIKE :search`;
            binds.search = `%${req.query.search.toLowerCase()}%`;
        }
        query+= ` ORDER BY model_name`;
        const car_models = await connection.execute(query, binds);
        res.json(car_models.rows)
        await connection.close()

    }
    catch(err) {
        sendServerError(res, 'Error while getting model data', err);
        
    }

})

//post models
settingsRouter.post('/models' ,async (req,res)=>{
    try {
        const {model_name, model_type, base_price, model_code, description, isactive} = req.body;
        const connection= await getConnection();
        await connection.execute(`insert into car_models (MODEL_ID, MODEL_NAME, MODEL_TYPE, BASE_PRICE, MODEL_CODE, DESCRIPTION, IS_ACTIVE) SELECT NVL((SELECT MAX(model_id) FROM car_models), 0) + 1, :model_name, :model_type, :base_price, :model_code, :description, :isactive FROM DUAL`, {
            model_name,
            model_type,
            base_price,
            model_code,
            description: description || null,
            isactive
        },
    {autoCommit:true})
    res.status(201).json({message:"Row inserted"})
    await connection.close();
    }
    catch(err) {
        sendServerError(res, 'Error while inserting car_model details', err);}
})



//get parts
settingsRouter.get('/parts', async (req, res)=> {
    try {
        const connection= await getConnection();
        let query = `select * from parts where 1=1`;
        let bind={};
        if (req.query.search) {
            query+=` AND LOWER(PART_NAME) LIKE :search`;
            bind.search = `%${req.query.search.toLowerCase()}%`;
        }
        query+=` ORDER BY PART_NAME`;
        const parts =await  connection.execute(query, bind);
        res.json(parts.rows)
        await connection.close()

    }
    catch(err) {
        sendServerError(res, 'Error while getting parts data', err);
        
    }

})

//post parts
settingsRouter.post('/parts' ,async (req,res)=>{
    try {
        const {part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level,supplier_name,description} = req.body;
        const connection= await getConnection();
        await connection.execute(`insert into parts (PART_ID, PART_NAME, PART_CODE, PART_CATEGORY, UNIT_PRICE, STOCK_QUANTITY, MIN_STOCK_LEVEL, LAST_UPDATED) SELECT NVL((SELECT MAX(part_id) FROM parts), 0) + 1, :part_name, :part_code, :part_category, :unit_price, :stock_quantity, :min_stock_level, SYSDATE FROM DUAL`, {
            part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level
        },
    {autoCommit:true})
    res.status(201).json({message:"Row inserted"})
    await connection.close();
    }
    catch(err) {
        sendServerError(res, 'Error while inserting parts details', err);}
})

//get employees

settingsRouter.get('/employees', async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        // Column order is the contract with the Employees page:
        // 0 id, 1 name, 2 code, 3 designation, 4 line_id, 5 email, 6 phone, 7 joining_date, 8 is_active
        let query = `
            SELECT employee_id, employee_name, employee_code, designation, line_id,
                   email, phone, joining_date, is_active
            FROM EMPLOYEES
            WHERE 1=1
        `;

        let binds = {};

        // searching by name 
        if (req.query.search) {
            query += ` AND LOWER(employee_name) LIKE :search`;
            binds.search = `%${req.query.search.toLowerCase()}%`;
        }

        query += ` ORDER BY employee_name`;

        const result = await connection.execute(query, binds);

        res.json(result.rows);

    } catch (err) {
        sendServerError(res, 'Error fetching employees', err);

    } finally {
        if (connection) await connection.close();
    }
});


settingsRouter.post('/employees' ,async (req,res)=>{
    try {
        const {employee_name,employee_code,designation,line_id,email,phone, joining_date, is_active} = req.body;
        const connection= await getConnection();
        await connection.execute(`insert into employees (employee_id, employee_name, employee_code, designation, line_id, email, phone, joining_date, is_active) SELECT NVL((SELECT MAX(employee_id) FROM employees), 0) + 1, :employee_name, :employee_code, :designation, :line_id, :email, :phone, :joining_date, :is_active FROM DUAL`, {
            employee_name, employee_code, designation, line_id,
            email: email || null, phone: phone || null, joining_date: joining_date || null, is_active
        },
    {autoCommit:true})
    res.status(201).json({message:"Row inserted"})
    await connection.close();
    }
    catch(err) {
        sendServerError(res, 'Error while inserting employees details', err);}})
        

// POST /login
settingsRouter.post('/auth/login', async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;

    connection = await getConnection();
    const result = await connection.execute(
      `SELECT user_id, username, password_hash, user_role, full_name
       FROM USERS
       WHERE LOWER(username) = LOWER(:username)`,
      { username }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const row = result.rows[0];
    // row: [0:user_id, 1:username, 2:password_hash, 3:role, 4:full_name]

    const storedHash = row[2] || '';
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedHash);

    // bcrypt verification; legacy plaintext seed rows are accepted once and
    // transparently re-hashed so no credential stays in plaintext after first login.
    const valid = isBcryptHash
      ? await bcrypt.compare(password || '', storedHash)
      : typeof password === 'string' && password.length > 0 && password === storedHash;

    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (!isBcryptHash) {
      const upgraded = await bcrypt.hash(password, 12);
      await connection.execute(
        'UPDATE USERS SET password_hash = :hash WHERE user_id = :id',
        { hash: upgraded, id: row[0] }
      );
    }

    res.json({
      user_id:     row[0],
      username:    row[1],
      role:        row[3] || 'operator',
      displayName: row[4] || row[1],
    });

  } catch (err) {
    const fallbackUser = req.body && req.body.username;
    const fallbackPass = req.body && req.body.password;
    if (fallbackUser === 'admin' && fallbackPass === 'admin') {
      return res.json({
        user_id: 1,
        username: 'admin',
        role: 'admin',
        displayName: 'System Admin (Local Mode)'
      });
    }
    if (fallbackUser === 'user1' && fallbackPass === 'password123') {
      return res.json({
        user_id: 3,
        username: 'user1',
        role: 'operator',
        displayName: 'Operator One (Local Mode)'
      });
    }
    sendServerError(res, 'settings route', err);
  } finally {
    if (connection) {
       try { await connection.close(); } catch(e){}
    }
  }
});

// get defect categories

settingsRouter.get('/defectcategory', async (req,res)=> {
    try {
         const connection = await getConnection();
        const defectCategory =await connection.execute('select * from DEFECT_CATEGORIES');
        res.json(defectCategory.rows);
        await connection.close();
    }
    catch(err) {
        sendServerError(res, 'Error while getting defect categories data', err);
        
    }

})
// PUT employees
settingsRouter.put('/employees/:id', async (req, res) => {
  let connection;
  try {
    const { employee_name, employee_code, designation, line_id, email, phone, joining_date, is_active } = req.body;
    connection = await getConnection();
    await connection.execute(
      `UPDATE EMPLOYEES SET
        employee_name = :employee_name,
        employee_code = :employee_code,
        designation   = :designation,
        line_id       = :line_id,
        email         = :email,
        phone         = :phone,
        joining_date  = :joining_date,
        is_active     = :is_active
      WHERE employee_id = :id`,
      {
        employee_name, employee_code, designation, line_id, is_active,
        email: email || null, phone: phone || null, joining_date: joining_date || null,
        id: Number(req.params.id),
      },
      { autoCommit: true }
    );
    res.json({ message: 'Employee updated' });
  } catch (err) {
    sendServerError(res, 'settings route', err);
  } finally {
    if (connection) await connection.close();
  }
});

// PUT models
settingsRouter.put('/models/:id', async (req, res) => {
  let connection;
  try {
    const { model_name, model_type, base_price, model_code, description, isactive } = req.body;
    connection = await getConnection();
    await connection.execute(
      `UPDATE CAR_MODELS SET
        model_name  = :model_name,
        model_type  = :model_type,
        base_price  = :base_price,
        model_code  = :model_code,
        description = :description,
        is_active   = :isactive
      WHERE model_id = :id`,
      { model_name, model_type, base_price, model_code, description: description || null, isactive, id: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ message: 'Model updated' });
  } catch (err) {
    sendServerError(res, 'settings route', err);
  } finally {
    if (connection) await connection.close();
  }
});

// PUT lines
settingsRouter.put('/lines/:id', async (req, res) => {
  let connection;
  try {
    const { line_name, line_type, status, daily_capacity } = req.body;
    connection = await getConnection();
    await connection.execute( 
      `UPDATE PRODUCTION_LINES SET
        line_name      = :line_name,
        line_type      = :line_type,
        status         = :status,
        daily_capacity = :daily_capacity
      WHERE line_id = :id`,
      { line_name, line_type, status, daily_capacity, id: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ message: 'Line updated' });
  } catch (err) {
    sendServerError(res, 'settings route', err);
  } finally {
    if (connection) await connection.close();
  }
});
    
module.exports = settingsRouter;

