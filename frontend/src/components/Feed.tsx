import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Post, FeedResponse } from "../api/postsAPI";
import { postsAPI } from "../api/postsAPI";
import "../styles/Feed.css";

interface FeedProps {
  userId?: string;
  userPostsOnly?: boolean;
  onPostUpdate?: () => void;
}

export const Feed: React.FC<FeedProps> = ({
  userId,
  userPostsOnly = false,
  onPostUpdate,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const limit = 10;
  const currentUserId = localStorage.getItem("userId");

  // Fetch posts
  const fetchPosts = useCallback(
    async (skipValue: number) => {
      setLoading(true);
      setError(null);
      try {
        let data: FeedResponse;

        if (userPostsOnly && userId) {
          data = await postsAPI.getPostsByUser(userId, limit, skipValue);
        } else {
          data = await postsAPI.getFeed(limit, skipValue);
        }

        if (skipValue === 0) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setHasMore(data.pagination.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setLoading(false);
      }
    },
    [userId, userPostsOnly, limit],
  );

  // Initial load
  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextSkip = skip + limit;
          setSkip(nextSkip);
          fetchPosts(nextSkip);
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, skip, limit, fetchPosts]);

  const handleEdit = (post: Post) => {
    setEditingPostId(post._id);
    setEditText(post.content);
    if (post.imageUrl) {
      setEditImagePreview(post.imageUrl);
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditText("");
    setEditImage(null);
    setEditImagePreview(null);
  };

  const handleEditImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setEditImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async (postId: string) => {
    try {
      await postsAPI.updatePost(postId, {
        content: editText,
        image: editImage || undefined,
      });
      setEditingPostId(null);
      setEditText("");
      setEditImage(null);
      setEditImagePreview(null);
      setSkip(0);
      await fetchPosts(0);
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await postsAPI.deletePost(postId);
      setPosts(posts.filter((p) => p._id !== postId));
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

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

  return (
    <div className="feed-container">
      {error && <div className="feed-error">{error}</div>}

      <div className="posts-list">
        {posts.map((post) => (
          <article key={post._id} className="post-card">
            {editingPostId === post._id ? (
              <div className="edit-post-form">
                <textarea
                  className="edit-textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
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
                    onChange={handleEditImageSelect}
                    style={{ display: "none" }}
                  />
                </label>
                <div className="edit-actions">
                  <button
                    className="save-btn"
                    onClick={() => handleSaveEdit(post._id)}
                  >
                    Save
                  </button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="post-header">
                  <div className="author-info">
                    {post.authorId.profilePicUrl && (
                      <img
                        src={post.authorId.profilePicUrl}
                        alt={post.authorId.username}
                        className="author-avatar"
                      />
                    )}
                    <div className="author-details">
                      <h3 className="author-name">{post.authorId.username}</h3>
                      <span className="post-time">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {currentUserId === post.authorId._id && (
                    <div className="post-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(post)}
                        title="Edit post"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(post._id)}
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
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="post-image"
                    />
                  )}
                </div>

                <div className="post-footer">
                  <span className="post-date">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </article>
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="loading-more">
          {loading ? "Loading more posts..." : "Scroll to load more"}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="no-more-posts">No more posts to load</div>
      )}

      {posts.length === 0 && !loading && (
        <div className="no-posts">No posts yet. Be the first to post!</div>
      )}
    </div>
  );
};

export default Feed;
