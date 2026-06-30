import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env");
  }

  if (uri.includes("<db_password>")) {
    throw new Error("MONGODB_URI still contains <db_password>. Replace it with your real MongoDB Atlas database user password.");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });
  console.log("MongoDB Atlas connected");
}
