import { TokenPayload } from '../utils/tokenUtils';

declare global {
	namespace Express {
		interface Request {
			user?: TokenPayload;
		}
	}
}

export { };
