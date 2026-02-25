import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/home.scss";

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const locationState = location.state as {
    initialTab?: "feed" | "profile";
    fromTab?: "feed" | "profile";
  } | null;

  const isOnCommentsPage = location.pathname.includes("/comments");

  const getActiveTab = (): "feed" | "profile" => {
    if (isOnCommentsPage) {
      return locationState?.fromTab === "profile" ? "profile" : "feed";
    }
    return locationState?.initialTab === "profile" ? "profile" : "feed";
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
              className={`nav-button ${activeTab === "profile" ? "active" : ""}`}
              onClick={() =>
                navigate("/", { state: { initialTab: "profile" } })
              }
            >
              Profile
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
