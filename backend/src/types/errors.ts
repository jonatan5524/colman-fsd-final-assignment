/**
 * Shared application error types.
 *
 * These extend the native Error class with additional properties
 * for HTTP status codes and domain-specific context.
 */

// --- Base ---

export class HttpError extends Error {
	public status: number;

	constructor(message: string, status: number = 500) {
		super(message);
		this.name = "HttpError";
		this.status = status;
	}
}

// --- Validation ---

export class ValidationError extends HttpError {
	constructor(message: string) {
		super(message, 400);
		this.name = "ValidationError";
	}
}

// --- AI / LLM ---

export class LLMServiceError extends HttpError {
	constructor(message: string = "AI service encountered an error", status: number = 500) {
		super(message, status);
		this.name = "LLMServiceError";
	}
}

export class LLMUnavailableError extends LLMServiceError {
	constructor(message: string = "AI service is not configured. Missing GEMINI_API_KEY.") {
		super(message, 503);
		this.name = "LLMUnavailableError";
	}
}

export class LLMQuotaError extends LLMServiceError {
	constructor(message: string = "AI service quota exceeded or unavailable") {
		super(message, 429);
		this.name = "LLMQuotaError";
	}
}

// --- File System ---

export class FileError extends HttpError {
	constructor(message: string = "File operation failed", status: number = 500) {
		super(message, status);
		this.name = "FileError";
	}
}

export class FileNotFoundError extends FileError {
	constructor(message: string = "File not found") {
		super(message, 404);
		this.name = "FileNotFoundError";
	}
}

// --- Auth ---

export class AuthError extends HttpError {
	constructor(message: string = "Authentication required", status: number = 401) {
		super(message, status);
		this.name = "AuthError";
	}
}

export class ForbiddenError extends HttpError {
	constructor(message: string = "You do not have permission to perform this action") {
		super(message, 403);
		this.name = "ForbiddenError";
	}
}

// --- Resource ---

export class NotFoundError extends HttpError {
	constructor(resource: string = "Resource") {
		super(`${resource} not found`, 404);
		this.name = "NotFoundError";
	}
}

// --- Utility ---

/**
 * Type guard: checks if an unknown caught error is an HttpError.
 */
export const isHttpError = (error: unknown): error is HttpError => {
	return error instanceof HttpError;
};
