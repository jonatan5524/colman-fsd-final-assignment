import api, { setTokens, clearTokens, getRefreshToken } from './api';

export interface User {
	_id: string;
	email: string;
	username: string;
	profilePicUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	user: User;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterCredentials {
	email: string;
	password: string;
	username: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authService = {
	async register(credentials: RegisterCredentials): Promise<AuthResponse> {
		const response = await api.post<AuthResponse>('/auth/register', credentials);
		setTokens(response.data.accessToken, response.data.refreshToken);
		return response.data;
	},

	async login(credentials: LoginCredentials): Promise<AuthResponse> {
		const response = await api.post<AuthResponse>('/auth/login', credentials);
		setTokens(response.data.accessToken, response.data.refreshToken);
		return response.data;
	},

	async logout(): Promise<void> {
		const refreshToken = getRefreshToken();
		if (refreshToken) {
			try {
				await api.post('/auth/logout', { refreshToken });
			} catch {
				// Ignore errors during logout
			}
		}
		clearTokens();
	},

	async getMe(): Promise<User> {
		const response = await api.get<User>('/profile/');
		return response.data;
	},

	getGoogleAuthUrl(): string {
		return `${API_URL}/auth/google`;
	},

	async updateProfile(userId: string, formData: FormData): Promise<User> {
		const response = await api.put<User>(`/profile/users/${userId}`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	},
};

export default authService;
