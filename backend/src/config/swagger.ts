import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Authentication API',
			version: '1.0.0',
			description: 'API documentation for authentication endpoints including local and Google OAuth',
		},
		servers: [
			{
				url: 'http://localhost:3000',
				description: 'Development server',
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'Enter your JWT access token',
				},
			},
			schemas: {
				User: {
					type: 'object',
					properties: {
						_id: { type: 'string', description: 'User ID' },
						email: { type: 'string', format: 'email' },
						username: { type: 'string' },
						profilePicUrl: { type: 'string', nullable: true },
						createdAt: { type: 'string', format: 'date-time' },
						updatedAt: { type: 'string', format: 'date-time' },
					},
				},
				RegisterRequest: {
					type: 'object',
					required: ['email', 'password', 'username'],
					properties: {
						email: { type: 'string', format: 'email', example: 'user@example.com' },
						password: { type: 'string', minLength: 6, example: 'password123' },
						username: { type: 'string', example: 'johndoe' },
					},
				},
				LoginRequest: {
					type: 'object',
					required: ['email', 'password'],
					properties: {
						email: { type: 'string', format: 'email', example: 'user@example.com' },
						password: { type: 'string', example: 'password123' },
					},
				},
				AuthResponse: {
					type: 'object',
					properties: {
						accessToken: { type: 'string', description: 'JWT access token' },
						refreshToken: { type: 'string', description: 'JWT refresh token' },
						user: { $ref: '#/components/schemas/User' },
					},
				},
				RefreshRequest: {
					type: 'object',
					required: ['refreshToken'],
					properties: {
						refreshToken: { type: 'string', description: 'The refresh token' },
					},
				},
				TokenResponse: {
					type: 'object',
					properties: {
						accessToken: { type: 'string' },
						refreshToken: { type: 'string' },
					},
				},
				LogoutRequest: {
					type: 'object',
					required: ['refreshToken'],
					properties: {
						refreshToken: { type: 'string' },
					},
				},
				ErrorResponse: {
					type: 'object',
					properties: {
						message: { type: 'string' },
					},
				},
			},
		},
	},
	apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
