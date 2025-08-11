const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const apiRouter = require('./routes/api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

// Primary connection based on DB_ENV (used for regular operations)
const dbUri = process.env.DB_ENV === 'atlas' ? process.env.ATLAS_URI : process.env.LOCAL_URI;
const primaryConnection = mongoose.createConnection(dbUri, { maxPoolSize: 10 });
primaryConnection
  .asPromise()
  .then(() => console.log(`Connected to ${process.env.DB_ENV === 'atlas' ? 'MongoDB Atlas' : 'Local MongoDB'}`))
  .catch((err) => console.error(`Could not connect to ${process.env.DB_ENV === 'atlas' ? 'MongoDB Atlas' : 'Local MongoDB'}:`, err.message, err));

// Secondary connection for syncing (always Atlas for local-to-cloud sync)
const atlasConnection = process.env.DB_ENV === 'local' ? mongoose.createConnection(process.env.ATLAS_URI, { maxPoolSize: 10 }) : primaryConnection;
atlasConnection
  .asPromise()
  .then(() => console.log('Atlas connection ready for syncing'))
  .catch((err) => console.error('Could not connect to MongoDB Atlas for syncing:', err.message, err));

// Make connections available to routes/controllers
app.locals.primaryConnection = primaryConnection;
app.locals.atlasConnection = atlasConnection;
app.locals.dbEnv = process.env.DB_ENV;

// Routes
app.use('/', apiRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});