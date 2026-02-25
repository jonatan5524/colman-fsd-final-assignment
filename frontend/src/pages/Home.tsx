import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import CreatePost from "../components/CreatePost";
import Feed from "../components/Feed";
import { useAuth } from "../hooks/useAuth";

const Home = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const { user } = useAuth();

  const state = location.state as { initialTab?: "feed" | "my-posts" } | null;
  const activeTab = state?.initialTab === "my-posts" ? "my-posts" : "feed";

  const handlePostCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handlePostUpdate = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  if (!user) return null;

  return (
    <>
      {activeTab === "feed" && (
        <>
          <CreatePost
            onPostCreated={handlePostCreated}
            userName={user.username || "Anonymous"}
          />
          <Feed
            key={refreshTrigger}
            onPostUpdate={handlePostUpdate}
            userId={user._id}
          />
        </>
      )}

      {activeTab === "my-posts" && (
        <Feed
          key={refreshTrigger}
          myPostsOnly={true}
          onPostUpdate={handlePostUpdate}
          userId={user._id}
        />
      )}
    </>
  );
};

export default Home;
