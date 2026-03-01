import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPost extends Document {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  imageUrl?: string;
  imageKeywords?: string;
  likesCount: number;
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    imageKeywords: {
      type: String,
      required: false,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
  },
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ content: "text", imageKeywords: "text" });

export default mongoose.model<IPost>("Post", PostSchema);
