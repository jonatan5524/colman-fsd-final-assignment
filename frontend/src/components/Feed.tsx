import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Post, FeedResponse } from "../services/postsService";
import { postsService } from "../services/postsService";
import PostCard from "./PostCard";
import "../styles/Feed.css";

interface FeedProps {
  userId?: string;
  myPostsOnly?: boolean;
  onPostUpdate?: () => void;
}

export const Feed: React.FC<FeedProps> = ({
  myPostsOnly = false,
  onPostUpdate,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const skipRef = useRef(0);
  const isFetchingRef = useRef(false);
  const limit = 10;
  const currentUserId = localStorage.getItem("userId");

  // Fetch posts
  const fetchPosts = useCallback(
    async (skipValue: number) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      skipRef.current = skipValue;
      setLoading(true);
      setError(null);
      try {
        let data: FeedResponse;

        if (myPostsOnly) {
          data = await postsService.getMyPosts(limit, skipValue);
        } else {
          data = await postsService.getFeed(limit, skipValue);
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
        isFetchingRef.current = false;
      }
    },
    [myPostsOnly, limit],
  );

  // Initial load
  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          !isFetchingRef.current
        ) {
          const nextSkip = skipRef.current + limit;
          fetchPosts(nextSkip);
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, limit, fetchPosts]);

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
      await postsService.updatePost(postId, {
        content: editText,
        image: editImage || undefined,
      });
      setEditingPostId(null);
      setEditText("");
      setEditImage(null);
      setEditImagePreview(null);
      skipRef.current = 0;
      isFetchingRef.current = false;
      await fetchPosts(0);
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await postsService.deletePost(postId);
      setPosts(posts.filter((p) => p._id !== postId));
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  return (
    <div className="feed-container">
      {error && <div className="feed-error">{error}</div>}

      <div className="posts-list">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={currentUserId}
            isEditing={editingPostId === post._id}
            editText={editText}
            editImagePreview={editImagePreview}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onDelete={handleDelete}
            onEditTextChange={setEditText}
            onEditImageSelect={handleEditImageSelect}
          />
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
