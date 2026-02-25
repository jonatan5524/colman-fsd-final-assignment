import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILike extends Document {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

const LikeSchema: Schema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent a user from liking the same post twice
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ILike>("Like", LikeSchema);
