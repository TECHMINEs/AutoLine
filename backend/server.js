require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { hashPlaintextPasswords } = require('./migrations/hashPlaintextPasswords');
const { addProfileColumns } = require('./migrations/addProfileColumns');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/dashboard', require('./routes/dashboard'));
app.use('/dropdown', require('./routes/dropdown'));
app.use('/', require('./routes/quality'));
app.use('/', require('./routes/settings'));
app.use('/', require('./routes/production'));
app.use('/', require('./routes/parts'));

const PORT = process.env.PORT || 8080;

addProfileColumns()
  .then(hashPlaintextPasswords)
  .catch((err) => console.error('[migrations] Startup migration failed', err))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`AutoLine API running on port ${PORT}`);
    });
  });
