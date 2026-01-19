import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloundinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from front end
  const { fullname, email, username, password } = req.body;
  console.log("email:", email);

  //validation - not empty
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all feilds are required ");
  }

  // check if user already exists : username , email
  const exsisteduser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (exsisteduser) {
    throw new ApiError(409, "user with username or email already esist");
  }
  console.log("FILES => ", req.files);

  // check for images , check for avatar
  const avatarlocalpath = req.files?.avatar[0]?.path;
  const coverimagelocalpath = req.files?.coverImage[0]?.path;
  if (!avatarlocalpath) {
    throw new ApiError(400, " avatar upload failed ");
  }

  // upload them to cloudinary , avatar
  const avatar = await uploadOnCloundinary(avatarlocalpath);
  const coverimage = await uploadOnCloundinary(coverimagelocalpath);
  if (!avatar) {
    throw new ApiError(500, "avatar upload failed (cloudinary)");
  }

  // create user object  - create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // remove password and refresh token field from  response
  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // check for user creation
  if (!createduser) {
    throw new ApiError(500, " something went wrong while registring a user  ");
  }
  // return  response
  return res
    .status(201)
    .json(new ApiResponse(200, createduser, "user registered successfully"));
});

export { registerUser };
