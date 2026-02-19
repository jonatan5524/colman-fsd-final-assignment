import dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
	res.json({ message: 'Welcome to the Express API' });
});

app.get('/health', (req: Request, res: Response) => {
	res.json({ status: 'OK' });
});

// Start server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

export default app;
