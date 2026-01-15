import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB();

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
