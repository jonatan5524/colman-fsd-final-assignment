interface GoogleTokenResponse {
	access_token: string;
	expires_in: number;
	token_type: string;
	scope: string;
	id_token?: string;
	refresh_token?: string;
}

interface GoogleUserInfo {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export const isGoogleOAuthConfigured = (): boolean => {
	return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

export const getGoogleAuthUrl = (): string => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/google/callback`;

	const params = new URLSearchParams({
		client_id: clientId!,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'openid email profile',
		access_type: 'offline',
		prompt: 'consent',
	});

	return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const exchangeCodeForTokens = async (code: string): Promise<GoogleTokenResponse> => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/google/callback`;

	const response = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			code,
			client_id: clientId!,
			client_secret: clientSecret!,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code',
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to exchange code for tokens: ${error}`);
	}

	return response.json() as Promise<GoogleTokenResponse>;
};

export const getGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
	const response = await fetch(GOOGLE_USERINFO_URL, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		throw new Error('Failed to get user info from Google');
	}

	return response.json() as Promise<GoogleUserInfo>;
};

export type { GoogleUserInfo };
