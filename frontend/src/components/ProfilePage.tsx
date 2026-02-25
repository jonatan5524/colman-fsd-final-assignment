import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import Feed from './Feed';
import '../styles/ProfilePage.scss';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  profilePicUrl?: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getMe();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError('Could not load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="profile-container"><div className="loading-state">Loading profile...</div></div>;
  }

  if (error) {
    return <div className="profile-container"><div className="error-state">{error}</div></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <img 
            src={profile?.profilePicUrl || profile?.avatarUrl || '/default-avatar.png'} 
            alt={`${profile?.username}'s avatar`} 
            className="profile-avatar-large" 
          />
          <h2 className="profile-username">{profile?.username}</h2>
        </div>
        <div className="profile-details">
          <p className="profile-email">{profile?.email}</p>
        </div>
      </div>

      <div className="profile-posts-section">
        <h3>My Posts</h3>
        {profile && (
          <Feed 
            userId={profile._id} 
            myPostsOnly={true} 
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
