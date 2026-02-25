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
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const handleEditClick = () => {
    if (profile) {
      setEditUsername(profile.username);
      setEditImagePreview(profile.profilePicUrl || profile.avatarUrl || '/default-avatar.png');
      setIsEditing(true);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditUsername('');
    setEditImage(null);
    setEditImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClick = async () => {
    if (profile) {
      try {
        const formData = new FormData();
        formData.append('username', editUsername);
        if (editImage) {
          formData.append('file', editImage);
        }

        const updatedUser = await authService.updateProfile(profile._id, formData);
        setProfile(updatedUser);
        setIsEditing(false);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Failed to update profile:', error);
        setError('Failed to update profile. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="profile-container"><div className="loading-state">Loading profile...</div></div>;
  }

  if (error) {
    return <div className="profile-container"><div className="error-state">{error}</div></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {isEditing ? (
          <div className="profile-edit-mode">
            <div className="profile-header">
              <div className="profile-image-container">
                <img 
                  src={editImagePreview || '/default-avatar.png'} 
                  alt="Profile Preview" 
                  className="profile-avatar-large" 
                />
                <label className="image-upload-label" style={{ marginTop: '10px', display: 'block', cursor: 'pointer' }}>
                  📸 Change Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
              <input 
                type="text" 
                value={editUsername} 
                onChange={(e) => setEditUsername(e.target.value)}
                className="edit-username-input"
                style={{ marginTop: '10px', padding: '5px', fontSize: '1.2rem' }}
              />
            </div>
            <div className="profile-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleSaveClick} className="save-btn">Save</button>
              <button onClick={handleCancelClick} className="cancel-btn">Cancel</button>
            </div>
          </div>
        ) : (
          <>
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
            <button onClick={handleEditClick} className="profile-edit-btn" style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit Profile</button>
          </>
        )}
      </div>

      <div className="profile-posts-section">
         <h3 style={{ color: 'white' }}>My Posts</h3>
        {profile && (
          <Feed 
            userId={profile._id} 
            myPostsOnly={true}
            key={refreshTrigger}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
