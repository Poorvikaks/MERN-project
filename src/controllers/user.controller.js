import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloundinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";

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
  //access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //set cookies
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
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  };
  return res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .status(200)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshtoken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshtoken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshtoken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token ");
    }

    if (!user.refreshToken || incomingRefreshtoken !== user.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: false,
    };
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: refreshToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token ");
  }
});

const changecurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfuly "));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, " current user fecthed succcesfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new ApiError(400, "Request body is missing");
  }

  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "fullname and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname, email } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing ");
  }
  const avatar = await uploadOnCloundinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, "avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image file is missing ");
  }
  const coverImage = await uploadOnCloundinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "error while uploading on cover image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is  missing ");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedto",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelsSubscribedTocount: {
          $size: "$subscribedto",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscriberCount: 1,
        channelsSubscribedTocount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel doesnot exsist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "vedios",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully "
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changecurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
