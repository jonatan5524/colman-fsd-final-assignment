import React, { useState, useCallback } from "react";
import type { CreatePostData } from "../services/postsService";
import { postsService } from "../services/postsService";
import "../styles/CreatePost.scss";

interface CreatePostProps {
  onPostCreated?: () => void;
  userName?: string;
}

export const CreatePost: React.FC<CreatePostProps> = ({
  onPostCreated,
  userName,
}) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError("Image must be less than 5MB");
          return;
        }

        // Validate file type
        if (
          !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
            file.type,
          )
        ) {
          setError("Only image files are allowed (JPEG, PNG, GIF, WebP)");
          return;
        }

        setImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setSuccess(false);

      if (!content.trim()) {
        setError("Post content cannot be empty");
        return;
      }

      if (content.length > 5000) {
        setError("Post content must not exceed 5000 characters");
        return;
      }

      setLoading(true);
      try {
        const data: CreatePostData = {
          content: content.trim(),
        };

        if (image) {
          data.image = image;
        }

        await postsService.createPost(data);
        setContent("");
        setImage(null);
        setImagePreview(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

        if (onPostCreated) {
          onPostCreated();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create post");
      } finally {
        setLoading(false);
      }
    },
    [content, image, onPostCreated],
  );

  const handleRemoveImage = useCallback(() => {
    setImage(null);
    setImagePreview(null);
  }, []);

  return (
    <div className="create-post-container">
      <div className="create-post-card">
        <div className="create-post-header">
          <div className="user-info">
            {/* <img src={userProfilePic || '/default-avatar.png'} alt={userName} className='user-avatar' /> */}
            <span className="user-name">{userName || "Anonymous"}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          <textarea
            className="post-input"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={5000}
            disabled={loading}
          />

          <div className="char-count">{content.length}/5000</div>

          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={handleRemoveImage}
                disabled={loading}
              >
                ✕ Remove Image
              </button>
            </div>
          )}

          <div className="post-actions">
            <label htmlFor="image-input" className="image-upload-label">
              📸 Add Image
            </label>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              disabled={loading}
              style={{ display: "none" }}
            />

            <button
              type="submit"
              className="post-submit-btn"
              disabled={loading || !content.trim()}
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-message">Post created successfully!</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
