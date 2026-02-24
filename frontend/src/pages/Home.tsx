import { useAuth } from '../hooks/useAuth';
import '../styles/auth.scss';

const Home = () => {
	const { user, logout, isLoading } = useAuth();

	return (
		<div className="auth-page">
			<div className="auth-card">
				<div className="auth-header">
					<h1>Welcome, {user?.username}!</h1>
					<p>You are now logged in</p>
				</div>

				<div style={{ marginBottom: '1.5rem' }}>
					<p><strong>Email:</strong> {user?.email}</p>
					<p><strong>Username:</strong> {user?.username}</p>
					{user?.profilePicUrl && (
						<img 
							src={user.profilePicUrl} 
							alt="Profile" 
							style={{ 
								width: 80, 
								height: 80, 
								borderRadius: '50%', 
								marginTop: '1rem' 
							}} 
						/>
					)}
				</div>

				<button 
					className="submit-btn" 
					onClick={logout}
					disabled={isLoading}
					style={{ width: '100%' }}
				>
					{isLoading ? 'Logging out...' : 'Logout'}
				</button>
			</div>
		</div>
	);
};

export default Home;
