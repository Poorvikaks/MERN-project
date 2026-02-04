import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./db/index.js";
import { app } from "./app.js";
import swaggerUi from "swagger-ui-express";

// 🔹 Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Load swagger JSON safely
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "swagger-output.json"), "utf-8")
);

// 🔹 Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed", err);
  });
