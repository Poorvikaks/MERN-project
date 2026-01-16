import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloundinary = async (localFilepathFile) => {
  try {
    if (!localFilepathFile) return null;

    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilepathFile, {
      resource_type: "auto",
    });
    //file has been uploaded successfullly
    console.log("file is uploaded on cloudnary, ", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilepathFile); // remove the locally saved temp file as the upload operation got failed
    return null;
  }
};

export { uploadOnCloundinary };
