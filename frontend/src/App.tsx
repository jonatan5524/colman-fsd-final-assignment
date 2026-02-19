import { useState, useCallback } from 'react';
import CreatePost from './components/CreatePost';
import Feed from './components/Feed';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'feed' | 'my-posts'>('feed');

  // Get user info from localStorage (set by auth system)
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  const handlePostCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handlePostUpdate = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className='app'>
      <header className='app-header'>
        <div className='header-content'>
          <h1>📱 Social Feed</h1>
          <nav className='header-nav'>
            <button
              className={`nav-button ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              Feed
            </button>
            <button
              className={`nav-button ${activeTab === 'my-posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-posts')}
            >
              My Posts
            </button>
          </nav>
        </div>
      </header>

      <main className='app-main'>
        {userId ? (
          <>
            {activeTab === 'feed' && (
              <>
                <CreatePost
                  onPostCreated={handlePostCreated}
                  userName={userName || 'Anonymous'}
                />
                <Feed key={refreshTrigger} onPostUpdate={handlePostUpdate} />
              </>
            )}

            {activeTab === 'my-posts' && (
              <Feed
                key={refreshTrigger}
                userId={userId}
                userPostsOnly={true}
                onPostUpdate={handlePostUpdate}
              />
            )}
          </>
        ) : (
          <div className='login-prompt'>
            <h2>Welcome to Social Feed</h2>
            <p>Please log in to view and create posts</p>
            <a href='/login' className='login-button'>
              Log In
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
