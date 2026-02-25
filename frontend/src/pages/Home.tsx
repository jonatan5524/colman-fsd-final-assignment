import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import CreatePost from "../components/CreatePost";
import Feed from "../components/Feed";
import ProfilePage from "../components/ProfilePage";
import { useAuth } from "../hooks/useAuth";

const Home = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const { user } = useAuth();

  const state = location.state as { initialTab?: "feed" | "profile" } | null;
  const activeTab = state?.initialTab === "profile" ? "profile" : "feed";

  const handlePostCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handlePostUpdate = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  if (!user) return null;

  return (
    <>
      {activeTab === "feed" ? (
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
      ) : (
        <ProfilePage />
      )}
    </>
  );
};

export default Home;
