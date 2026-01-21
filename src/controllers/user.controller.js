import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloundinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "somethig went wrong while genrating refresh and access token "
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from front end
  const { fullname, email, username, password } = req.body;

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

  // check for images , check for avatar
  const avatarlocalpath = req.files?.avatar[0]?.path;
  // const coverimagelocalpath = req.files?.coverImage[0]?.path;
  let coverimagelocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverimagelocalpath = req.files.coverImage[0].path;
  }

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

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  const { email, username, password } = req.body;

  // username , email
  if (!email || !username) {
    {
      if (!email && !username) {
        throw new ApiError(400, "username or email is required ");
      }
    }
  }
  //find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user doesnot exist ");
  }

  // password check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //access and refresh token
  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          loggedInUser,
          // accessToken,
          // refreshToken,
        },
        "user loggedin successfully "
      )
    );

  //send cookies
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  };
  return res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .status(200)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
