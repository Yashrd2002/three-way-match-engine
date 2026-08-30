const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/three_way_match';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[Database] Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.log('[Database] Local MongoDB unavailable, starting MongoMemoryServer...');
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`[Database] Connected to MongoMemoryServer at ${mongoUri}`);
    } catch (memErr) {
      console.error('[Database] Failed to connect to MongoDB Memory Server:', memErr);
      process.exit(1);
    }
  }
};

module.exports = { connectDB };
