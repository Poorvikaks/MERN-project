import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
  {
    name: { type: String, required: true },
    decription: { type: String, required: true },
    vedios: [{ type: Schema.Types.ObjectId, ref: "Vedio" }],
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

playlistSchema.plugin(mongooseAggregatePaginate);

export const Playlist = mongoose.Schema("Playlist", playlistSchema);
