import { useState, useCallback } from "react";
import CreatePost from "../components/CreatePost";
import Feed from "../components/Feed";
import "../styles/home.scss";
import type { User } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

const Home = ({ user }: { user: User }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"feed" | "my-posts">("feed");
  const { logout } = useAuth();

  const handlePostCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handlePostUpdate = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <h1>📱 Social Feed</h1>
          <nav className="header-nav">
            <button
              className={`nav-button ${activeTab === "feed" ? "active" : ""}`}
              onClick={() => setActiveTab("feed")}
            >
              Feed
            </button>
            <button
              className={`nav-button ${
                activeTab === "my-posts" ? "active" : ""
              }`}
              onClick={() => setActiveTab("my-posts")}
            >
              My Posts
            </button>
            <button className="nav-button logout-button" onClick={logout}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="home-main">
        <div className="feed-wrapper">
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
        </div>
      </main>
    </div>
  );
};

export default Home;
