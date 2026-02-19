import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
	_id: Types.ObjectId;
	authorId: Types.ObjectId;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
	{
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
