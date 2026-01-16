import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
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
