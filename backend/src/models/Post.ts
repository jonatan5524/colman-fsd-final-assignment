import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPost extends Document {
	_id: Types.ObjectId;
	authorId: Types.ObjectId;
	text: string;
	imageUrl?: string;
	createdAt: Date;
	updatedAt: Date;
}

const PostSchema: Schema = new Schema(
	{
		authorId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		imageUrl: {
			type: String,
			required: false,
		},
	},
	{
		timestamps: true,
	}
);

// Index for feed sorting
PostSchema.index({ createdAt: -1 });

export default mongoose.model<IPost>('Post', PostSchema);
