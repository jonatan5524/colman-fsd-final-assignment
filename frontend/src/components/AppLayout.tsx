import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/home.scss";

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const locationState = location.state as {
    initialTab?: "feed" | "my-posts";
    fromTab?: "feed" | "my-posts";
  } | null;

  const isOnCommentsPage = location.pathname.includes("/comments");

  const getActiveTab = (): "feed" | "my-posts" => {
    if (isOnCommentsPage) {
      return locationState?.fromTab === "my-posts" ? "my-posts" : "feed";
    }
    return locationState?.initialTab === "my-posts" ? "my-posts" : "feed";
  };

  const activeTab = getActiveTab();

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <h1>📱 Social Feed</h1>
          <nav className="header-nav">
            <button
              className={`nav-button ${activeTab === "feed" ? "active" : ""}`}
              onClick={() =>
                navigate("/", { state: { initialTab: "feed" } })
              }
            >
              Feed
            </button>
            <button
              className={`nav-button ${activeTab === "my-posts" ? "active" : ""}`}
              onClick={() =>
                navigate("/", { state: { initialTab: "my-posts" } })
              }
            >
              My Posts
            </button>
            <button
              className="nav-button logout-button"
              onClick={logout}
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="home-main">
        <div className="feed-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
