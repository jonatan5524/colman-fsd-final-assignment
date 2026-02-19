import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import type { RegisterCredentials, User, LoginCredentials } from '../services/authService';
import { getAccessToken, setTokens, clearTokens } from '../services/api';

export interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	login: (credentials: LoginCredentials) => Promise<void>;
	register: (credentials: RegisterCredentials) => Promise<void>;
	logout: () => Promise<void>;
	loginWithGoogle: () => void;
	clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const initializeAuth = async () => {
			const token = getAccessToken();
			if (token) {
				try {
					const userData = await authService.getMe();
					setUser(userData);
				} catch {
					clearTokens();
				}
			}
			setIsLoading(false);
		};

		initializeAuth();
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const accessToken = params.get('accessToken');
		const refreshToken = params.get('refreshToken');
		const oauthError = params.get('error');

		if (oauthError) {
			setError('Google login failed. Please try again.');
			navigate('/login', { replace: true });
			return;
		}

		if (accessToken && refreshToken) {
			setTokens(accessToken, refreshToken);
			authService.getMe()
				.then((userData) => {
					setUser(userData);
					navigate('/', { replace: true });
				})
				.catch(() => {
					clearTokens();
					setError('Failed to get user information');
					navigate('/login', { replace: true });
				});
		}
	}, [location, navigate]);

	const login = useCallback(async (credentials: LoginCredentials) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await authService.login(credentials);
			setUser(response.user);
			navigate('/');
		} catch (err: unknown) {
			const error = err as { response?: { data?: { message?: string } } };
			setError(error.response?.data?.message || 'Login failed');
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [navigate]);

	const register = useCallback(async (credentials: RegisterCredentials) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await authService.register(credentials);
			setUser(response.user);
			navigate('/');
		} catch (err: unknown) {
			const error = err as { response?: { data?: { message?: string } } };
			setError(error.response?.data?.message || 'Registration failed');
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [navigate]);

	const logout = useCallback(async () => {
		setIsLoading(true);
		try {
			await authService.logout();
		} finally {
			setUser(null);
			setIsLoading(false);
			navigate('/login');
		}
	}, [navigate]);

	const loginWithGoogle = useCallback(() => {
		window.location.href = authService.getGoogleAuthUrl();
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const value: AuthContextType = {
		user,
		isAuthenticated: !!user,
		isLoading,
		error,
		login,
		register,
		logout,
		loginWithGoogle,
		clearError,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
