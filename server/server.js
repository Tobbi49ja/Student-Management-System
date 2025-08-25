require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const apiRouter = require('./routes/api');
const Student = require('./models/student');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.static('../client'));

// MongoDB Connection
const localMongoUri = process.env.LOCAL_URI || 'mongodb://localhost:27017/studentsDB';
const atlasMongoUri = process.env.ATLAS_URI || '';
const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
};

// Connections
let atlasConnection = null;
let localConnection = null;

// Function to check internet connectivity
async function isOnline() {
  try {
    await require('dns').promises.lookup('mongodb.net');
    return true;
  } catch {
    return false;
  }
}

// Function to generate custom student ID
async function generateStudentId(db) {
  const StudentModel = db.model('Student', require('./models/student').schema);
  const year = new Date().getFullYear();
  const prefix = `STU-${year}-`;
  const lastStudent = await StudentModel.findOne({ studentId: { $regex: `^${prefix}` } })
    .sort({ studentId: -1 });
  let nextNumber = 1;
  if (lastStudent && lastStudent.studentId) {
    const lastNumber = parseInt(lastStudent.studentId.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// Function to create admin account
async function createAdminAccount(db, connectionType) {
  const adminUsername = 'admin';
  const adminEmail = 'admin@tobbi.com';
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error(`${connectionType}: ADMIN_PASSWORD is not set in .env file`);
    return;
  }

  const StudentModel = db.model('Student', require('./models/student').schema);
  const existingAdmin = await StudentModel.findOne({ username: adminUsername });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const studentId = await generateStudentId(db);
    const admin = new StudentModel({
      studentId,
      name: 'Admin User',
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true,
    });
    await admin.save();
    console.log(`${connectionType}: Admin account created: ${adminUsername} with studentId: ${studentId}`);
  } else {
    console.log(`${connectionType}: Admin account already exists: ${adminUsername}`);
  }
}

// Function to sync data between local and Atlas
async function syncDatabases() {
  if (!atlasConnection || !localConnection) {
    console.log('Sync skipped: Both connections are not available');
    return;
  }

  try {
    const AtlasStudent = atlasConnection.model('Student', require('./models/student').schema);
    const LocalStudent = localConnection.model('Student', require('./models/student').schema);

    // Sync from Atlas to Local
    const atlasStudents = await AtlasStudent.find();
    for (const atlasStudent of atlasStudents) {
      const localStudent = await LocalStudent.findOne({ studentId: atlasStudent.studentId });
      if (!localStudent) {
        await new LocalStudent(atlasStudent).save();
      } else if (localStudent.updatedAt < atlasStudent.updatedAt) {
        await LocalStudent.findOneAndUpdate({ studentId: atlasStudent.studentId }, atlasStudent, { new: true });
      }
    }

    // Sync from Local to Atlas
    const localStudents = await LocalStudent.find();
    for (const localStudent of localStudents) {
      const atlasStudent = await AtlasStudent.findOne({ studentId: localStudent.studentId });
      if (!atlasStudent) {
        await new AtlasStudent(localStudent).save();
      } else if (atlasStudent.updatedAt < localStudent.updatedAt) {
        await AtlasStudent.findOneAndUpdate({ studentId: localStudent.studentId }, localStudent, { new: true });
      }
    }

    console.log('Database sync completed successfully');
  } catch (error) {
    console.error('Error during database sync:', error);
  }
}

const connectToMongoDB = async () => {
  try {
    const online = await isOnline();

    if (online && atlasMongoUri) {
      console.log('Attempting to connect to MongoDB Atlas...');
      atlasConnection = mongoose.createConnection(atlasMongoUri, connectionOptions);
      atlasConnection.on('connected', () => {
        console.log('Connected to MongoDB Atlas');
        app.locals.dbEnv = 'atlas';
      });
      atlasConnection.on('error', err => {
        console.error('MongoDB Atlas connection error:', err);
      });
      await atlasConnection.asPromise();
      await createAdminAccount(atlasConnection, 'Atlas');
    } else {
      console.warn('No internet or ATLAS_URI not set, skipping Atlas connection');
    }

    console.log('Attempting to connect to Local MongoDB...');
    localConnection = mongoose.createConnection(localMongoUri, connectionOptions);
    localConnection.on('connected', () => {
      console.log('Connected to Local MongoDB');
      if (!atlasConnection) app.locals.dbEnv = 'local';
    });
    localConnection.on('error', err => {
      console.error('Local MongoDB connection error:', err);
    });
    await localConnection.asPromise();
    await createAdminAccount(localConnection, 'Local');

    mongoose.set('strictQuery', true);
    await mongoose.connect(localMongoUri, connectionOptions);

    if (atlasConnection && localConnection) {
      await syncDatabases();
    }
  } catch (error) {
    console.error('MongoDB connection or admin setup failed:', error);
    process.exit(1);
  }
};

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

app.use('/', apiRouter);

setInterval(async () => {
  if (await isOnline() && atlasConnection && localConnection) {
    await syncDatabases();
  }
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 8000;
connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} at http://localhost:${PORT}`);
  });
});