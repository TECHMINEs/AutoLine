require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { hashPlaintextPasswords } = require('./migrations/hashPlaintextPasswords');
const { addProfileColumns } = require('./migrations/addProfileColumns');

const app = express();
app.use(cors());
app.use(express.json());

// API router mounted on /api
const apiRouter = express.Router();
apiRouter.use('/dashboard', require('./routes/dashboard'));
apiRouter.use('/dropdown', require('./routes/dropdown'));
apiRouter.use('/', require('./routes/quality'));
apiRouter.use('/', require('./routes/settings'));
apiRouter.use('/', require('./routes/production'));
apiRouter.use('/', require('./routes/parts'));
app.use('/api', apiRouter);

// Direct routes for backward compatibility
app.use('/dashboard', require('./routes/dashboard'));
app.use('/dropdown', require('./routes/dropdown'));
app.use('/', require('./routes/quality'));
app.use('/', require('./routes/settings'));
app.use('/', require('./routes/production'));
app.use('/', require('./routes/parts'));

// Serve built frontend if dist exists
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/dashboard') ||
      req.path.startsWith('/dropdown')
    ) {
      return next();
    }
    if (req.method === 'GET') {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const PORT = process.env.PORT || 8080;

addProfileColumns()
  .then(hashPlaintextPasswords)
  .catch((err) => console.error('[migrations] Startup migration failed', err))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`AutoLine API running on port ${PORT}`);
    });
  });
