import { useState, useCallback } from "react";
import CreatePost from "./components/CreatePost";
import Feed from "./components/Feed";
import "./App.css";

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"feed" | "my-posts">("feed");

  const userId = "mock-user-id-123";
  const userName = "Demo User";

  const handlePostCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handlePostUpdate = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
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

      <main className="app-main">
        <>
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
        </>
      </main>
    </div>
  );
}

export default App;
