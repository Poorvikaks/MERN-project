import mongoose from "mongoose";
import { DB_name } from "../constants.js";

const connectDB = async () => {
  try {
    const connectiononInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_name}`
    );
    console.log(`mongodb connected, ${connectiononInstance.connection.host}`);
  } catch (error) {
    console.log("mongodb connection error ", error);
    process.exit(1);
  }
};
export default connectDB;
