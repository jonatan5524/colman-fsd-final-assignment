import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Post } from "../services/postsService";
import ConfirmDialog from "./ConfirmDialog";
import "../styles/PostCard.scss";

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
  sourceTab: "feed" | "profile";
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
  sourceTab,
}) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOwner = post.authorId && currentUserId === post.authorId._id;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(post._id);
  };

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
          <label className="image-upload-label">
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
              onClick={handleDeleteClick}
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
        <div className="post-footer-main">
          <span className="post-date">
            {new Date(post.createdAt).toLocaleString()}
          </span>
          <button
            type="button"
            className="post-comments-link"
            onClick={() =>
              navigate(`/posts/${post._id}/comments`, {
                state: { fromTab: sourceTab },
              })
            }
          >
            {post.comments.length === 0 && "No comments yet"}
            {post.comments.length === 1 && "1 comment"}
            {post.comments.length > 1 && `${post.comments.length} comments`}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        isDangerous={true}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />
    </article>
  );
};

export default PostCard;
