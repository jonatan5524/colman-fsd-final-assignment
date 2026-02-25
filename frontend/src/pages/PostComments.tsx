import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Post } from "../services/postsService";
import postsService from "../services/postsService";
import type { Comment } from "../services/commentsService";
import commentsService from "../services/commentsService";
import { useAuth } from "../hooks/useAuth";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/PostComments.scss";

const PostComments: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  const loadData = useCallback(async () => {
    if (!postId) {
      setError("Post ID is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [postData, commentsData] = await Promise.all([
        postsService.getPost(postId),
        commentsService.getComments(postId),
      ]);

      setPost(postData);
      setComments(commentsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load post and comments",
      );
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !commentText.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const newComment = await commentsService.addComment(
        postId,
        commentText.trim(),
      );
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDeleteComment = (comment: Comment) => {
    setCommentToDelete(comment);
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      await commentsService.deleteComment(commentToDelete._id);
      setComments((prev) => prev.filter((c) => c._id !== commentToDelete._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setCommentToDelete(null);
    }
  };

  const handleCancelDeleteComment = () => {
    setCommentToDelete(null);
  };

  const fromTab =
    (location.state as { fromTab?: "feed" | "my-posts" } | null)?.fromTab;

  const handleBack = () => {
    if (fromTab === "my-posts") {
      navigate("/", { state: { initialTab: "my-posts" } });
    } else {
      navigate("/", { state: { initialTab: "feed" } });
    }
  };

  if (loading) {
    return <div className="post-comments-page">Loading...</div>;
  }

  if (error && !post) {
    return (
      <div className="post-comments-page">
        <button type="button" className="back-button" onClick={handleBack}>
          {fromTab === "my-posts" ? "← Back to my posts" : "← Back to feed"}
        </button>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-comments-page">
        <button type="button" className="back-button" onClick={handleBack}>
          {fromTab === "my-posts" ? "← Back to my posts" : "← Back to feed"}
        </button>
        <div className="error-message">Post not found</div>
      </div>
    );
  }

  return (
    <div className="post-comments-page">
      <button type="button" className="back-button" onClick={handleBack}>
        {fromTab === "my-posts" ? "← Back to my posts" : "← Back to feed"}
      </button>

      {error && <div className="error-message">{error}</div>}

      <section className="post-section">
        <h2>Post</h2>
        <div className="post-card">
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
                  {post.authorId
                    ? post.authorId.username
                    : "Unknown Author"}
                </h3>
                <span className="post-time">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="post-content">
            <p className="post-text">{post.content}</p>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post"
                className="post-image"
              />
            )}
          </div>
        </div>
      </section>

      <section className="comments-section">
        <h2>Comments</h2>

        {user && (
          <form
            className="add-comment-form"
            onSubmit={handleAddComment}
          >
            <textarea
              className="comment-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={1000}
              disabled={submitting}
            />
            <div className="add-comment-actions">
              <span className="char-count">
                {commentText.length}/1000
              </span>
              <button
                type="submit"
                className="submit-comment-button"
                disabled={submitting || !commentText.trim()}
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>
        )}

        {comments.length === 0 && (
          <div className="no-comments">
            No comments yet. Be the first!
          </div>
        )}

        <ul className="comments-list">
          {comments.map((comment) => (
            <li key={comment._id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  {comment.authorId.profilePicUrl && (
                    <img
                      src={comment.authorId.profilePicUrl}
                      alt={comment.authorId.username}
                      className="comment-avatar"
                    />
                  )}
                  <div className="comment-author-details">
                    <span className="comment-author-name">
                      {comment.authorId.username}
                    </span>
                    <span className="comment-time">
                      {new Date(
                        comment.createdAt,
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
                {user && user._id === comment.authorId._id && (
                  <button
                    type="button"
                    className="delete-comment-button"
                    onClick={() => handleRequestDeleteComment(comment)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="comment-content">{comment.content}</p>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        isOpen={commentToDelete !== null}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        isDangerous={true}
        onCancel={handleCancelDeleteComment}
        onConfirm={handleConfirmDeleteComment}
      />
    </div>
  );
};

export default PostComments;
