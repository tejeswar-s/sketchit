const mongoose = require('mongoose');

const connectDB = async (uri) => {
  const MONGO_URI = uri || 'mongodb+srv://thisistejeswar:thisistejeswar@sketchit.j9hzhwn.mongodb.net/';
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 