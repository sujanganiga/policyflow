const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("URI:", process.env.MONGODB_URI);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("Connected:", conn.connection.host);
  } catch (err) {
    console.error(err);

    if (err.reason?.servers) {
      for (const [host, server] of err.reason.servers.entries()) {
        console.log("\n==========");
        console.log("Host:", host);
        console.dir(server.error, { depth: null });
      }
    }

    process.exit(1);
  }
};

module.exports = connectDB;
