import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
console.log("ENV CHECK:", {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUD_KEY: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
});

import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`SERVER IS RUNNING IN THE PORT: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("mongodb connection failed ", err);
  });

// (async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_name}`)
//         app.on("error", (error)=>{
//             console.log('ERROR', error)
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log('app is listenign')
//         })

//     } catch (error) {
//         console.log(error)

//     }
// })
// ()
