import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.scss';

const Register = () => {
	const { register, loginWithGoogle, isLoading, error, clearError } = useAuth();
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);

	useEffect(() => {
		clearError();
	}, [clearError]);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLocalError(null);

		if (!email.trim()) {
			setLocalError('Email is required');
			return;
		}
		if (!username.trim()) {
			setLocalError('Username is required');
			return;
		}
		if (!password) {
			setLocalError('Password is required');
			return;
		}
		if (password.length < 6) {
			setLocalError('Password must be at least 6 characters');
			return;
		}
		if (password !== confirmPassword) {
			setLocalError('Passwords do not match');
			return;
		}

		await register({
			email: email.trim(),
			username: username.trim(),
			password,
		});
	};

	const displayError = localError || error;

	return (
		<div className="auth-page">
			<div className="auth-card">
				<div className="auth-header">
					<h1>Create account</h1>
					<p>Sign up to get started</p>
				</div>

				<form className="auth-form" onSubmit={handleSubmit}>
					{displayError && (
						<div className="error-message">{displayError}</div>
					)}

					<div className="form-group">
						<label htmlFor="email">Email</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							disabled={isLoading}
							autoComplete="email"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="username">Username</label>
						<input
							type="text"
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Choose a username"
							disabled={isLoading}
							autoComplete="username"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Create a password (min. 6 characters)"
							disabled={isLoading}
							autoComplete="new-password"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="confirmPassword">Confirm Password</label>
						<input
							type="password"
							id="confirmPassword"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Confirm your password"
							disabled={isLoading}
							autoComplete="new-password"
						/>
					</div>

					<button type="submit" className="submit-btn" disabled={isLoading}>
						{isLoading && <span className="loading-spinner" />}
						{isLoading ? 'Creating account...' : 'Create account'}
					</button>
				</form>

				<div className="divider">
					<span>or</span>
				</div>

				<button
					type="button"
					className="google-btn"
					onClick={loginWithGoogle}
					disabled={isLoading}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						x="0px"
						y="0px"
						width="50"
						height="50"
						viewBox="0 0 48 48"
						className="google-icon"
					>
						<path fill="var(--google-yellow, #FFC107)" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
						<path fill="var(--google-red, #FF3D00)" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
						<path fill="var(--google-green, #4CAF50)" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
						<path fill="var(--google-blue, #1976D2)" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
					</svg>
					Continue with Google
				</button>

				<div className="auth-footer">
					<p>
						Already have an account? <Link to="/login">Sign in</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Register;
