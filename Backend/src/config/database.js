// It connect Node.js to MongoDB Atlas
// called once at server startup from server.js


const mongoose = require('mongoose');  //mongoose is a library that help Node.js to connect with MONGODB
//PRovide us schema, models,and a clean query API

const connectDB = async () => {
    try{
       const conn = await mongoose.connect(process.env.MONGODB_URI);
       console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch{
        console.log(`MongoDB connection failed:n ${error.message}`);

        process.exit(1);
    }
};
module.exports = connectDB;      //export so server.js can call connectDB() at startup
