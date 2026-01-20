import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import { app } from "./app.js";
console.log("ENV CHECK:", {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUD_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUD_SECRET: process.env.CLOUDINARY_API_SECRET,
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`SERVER IS RUNNING IN THE PORT: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("mongodb connection failed ", err);
  });
