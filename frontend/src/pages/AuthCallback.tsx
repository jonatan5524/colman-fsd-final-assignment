import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setTokens } from '../services/api';
import authService from '../services/authService';
import '../styles/auth.scss';

const AuthCallback = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	useEffect(() => {
		const accessToken = searchParams.get('accessToken');
		const refreshToken = searchParams.get('refreshToken');
		const error = searchParams.get('error');

		if (error) {
			navigate('/login?error=oauth_failed', { replace: true });
			return;
		}

		if (accessToken && refreshToken) {
			setTokens(accessToken, refreshToken);
			// Verify the tokens work by fetching user
			authService.getMe()
				.then(() => {
					navigate('/', { replace: true });
				})
				.catch(() => {
					navigate('/login?error=oauth_failed', { replace: true });
				});
		} else {
			navigate('/login', { replace: true });
		}
	}, [searchParams, navigate]);

	return (
		<div className="loading-container">
			<div className="loading-spinner"></div>
			<p>Completing sign in...</p>
		</div>
	);
};

export default AuthCallback;
