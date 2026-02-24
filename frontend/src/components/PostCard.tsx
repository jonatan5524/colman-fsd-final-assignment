import React, { useState, useCallback } from "react";
import type { Post } from "../api/postsAPI";
import "../styles/PostCard.css";

interface PostCardProps {
  post: Post;
  currentUserId: string | null;
  isEditing: boolean;
  editText: string;
  editImagePreview: string | null;
  onEdit: (post: Post) => void;
  onCancelEdit: () => void;
  onSaveEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onEditTextChange: (text: string) => void;
  onEditImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  isEditing,
  editText,
  editImagePreview,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditTextChange,
  onEditImageSelect,
}) => {
  const isOwner = post.authorId && currentUserId === post.authorId._id;

  if (isEditing) {
    return (
      <article className="post-card editing">
        <div className="edit-post-form">
          <textarea
            className="edit-textarea"
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            maxLength={5000}
          />
          {editImagePreview && (
            <img
              src={editImagePreview}
              alt="Edit preview"
              className="edit-preview"
            />
          )}
          <label className="edit-image-label">
            📸 Change Image
            <input
              type="file"
              accept="image/*"
              onChange={onEditImageSelect}
              style={{ display: "none" }}
            />
          </label>
          <div className="edit-actions">
            <button className="save-btn" onClick={() => onSaveEdit(post._id)}>
              Save
            </button>
            <button className="cancel-btn" onClick={onCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="author-info">
          {post.authorId && post.authorId.profilePicUrl && (
            <img
              src={post.authorId.profilePicUrl}
              alt={post.authorId.username || "Author"}
              className="author-avatar"
            />
          )}
          <div className="author-details">
            <h3 className="author-name">
              {post.authorId ? post.authorId.username : "Unknown Author"}
            </h3>
            <span className="post-time">{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {isOwner && (
          <div className="post-actions">
            <button
              className="edit-btn"
              onClick={() => onEdit(post)}
              title="Edit post"
            >
              ✏️
            </button>
            <button
              className="delete-btn"
              onClick={() => onDelete(post._id)}
              title="Delete post"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <div className="post-content">
        <p className="post-text">{post.content}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="Post" className="post-image" />
        )}
      </div>

      <div className="post-footer">
        <span className="post-date">
          {new Date(post.createdAt).toLocaleString()}
        </span>
      </div>
    </article>
  );
};

export default PostCard;
