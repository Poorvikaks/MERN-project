import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema(
  {
    vedio: { type: Schema.Types.ObjectId, ref: "Vedio" },
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    tweet: { type: Schema.Types.ObjectId, ref: "Tweet" },
    likedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

likeSchema.plugin(mongooseAggregatePaginate);

export const Likes = mongoose.Schema("Likes", likeSchema);
