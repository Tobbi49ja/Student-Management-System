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

// Detect environment
const isProduction = process.env.NODE_ENV === 'production';

// Pick DB based on environment
const dbUri = isProduction ? process.env.ATLAS_URI : process.env.LOCAL_URI;
const primaryConnection = mongoose.createConnection(dbUri, { maxPoolSize: 10 });

primaryConnection
  .asPromise()
  .then(() => console.log(`Connected to ${isProduction ? 'MongoDB Atlas' : 'Local MongoDB'}`))
  .catch((err) => console.error(`Could not connect to ${isProduction ? 'MongoDB Atlas' : 'Local MongoDB'}:`, err.message));

// Always have an Atlas connection ready for sync (only relevant locally)
const atlasConnection = isProduction
  ? primaryConnection
  : mongoose.createConnection(process.env.ATLAS_URI, { maxPoolSize: 10 });

atlasConnection
  .asPromise()
  .then(() => console.log('Atlas connection ready for syncing'))
  .catch((err) => console.error('Could not connect to MongoDB Atlas for syncing:', err.message));

// Pass connections to routes
app.locals.primaryConnection = primaryConnection;
app.locals.atlasConnection = atlasConnection;
app.locals.dbEnv = isProduction ? 'atlas' : 'local';

// Routes
app.use('/', apiRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
