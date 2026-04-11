require('dotenv').config(); 
const express = require("express")
const cors = require("cors")
const app = express()
const {getConnection} = require('./db');

app.use(cors())
app.use(express.json())
const qualityrouter = require('./routes/quality')
app.use('/', qualityrouter);

//dashboard router
app.use("/dashboard", require("./routes/dashboard"));
app.use('/', require('./routes/settings'));
app.use('/', require('./routes/production'));
app.use('/', require('./routes/parts'))
app.use("/dropdown", require('./routes/dropdown'));
app.use('/', require('./routes/quality'));
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});