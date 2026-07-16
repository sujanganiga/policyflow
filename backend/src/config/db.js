const crypto = require("crypto");
const mongoose = require("mongoose");

if (!global.crypto) {
  global.crypto = crypto;
}

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    console.log(
      "URI:",
      mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//<username>:<password>@"),
    );

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 20000,
      family: 4,
      retryWrites: true,
      w: "majority",
    });

    console.log("Connected:", conn.connection.host);
    return conn;
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
