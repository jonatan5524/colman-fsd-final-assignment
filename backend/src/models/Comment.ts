import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
	_id: Types.ObjectId;
	postId: Types.ObjectId;
	authorId: Types.ObjectId;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
	{
		postId: {
			type: Schema.Types.ObjectId,
			ref: 'Post',
			required: true,
		},
		authorId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<IComment>('Comment', CommentSchema);
