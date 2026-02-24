import { useState, useCallback, useEffect } from "react";
import CreatePost from "../components/CreatePost";
import Feed from "../components/Feed";
import "../styles/home.scss";

const Home = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"feed" | "my-posts">("feed");

  const userId = "507f1f77bcf86cd799439011";
  const userName = "Demo User";

  // Store userId in localStorage for use in Feed component
  useEffect(() => {
    localStorage.setItem("userId", userId);
  }, [userId]);

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
              className={`nav-button ${activeTab === "my-posts" ? "active" : ""}`}
              onClick={() => setActiveTab("my-posts")}
            >
              My Posts
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
                userName={userName || "Anonymous"}
              />
              <Feed key={refreshTrigger} onPostUpdate={handlePostUpdate} />
            </>
          )}

          {activeTab === "my-posts" && (
            <Feed
              key={refreshTrigger}
              userId={userId}
              userPostsOnly={true}
              onPostUpdate={handlePostUpdate}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
