import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import {connectDB} from './config/database.js';
import {checkDatabaseHealth, quickHealthCheck} from './utils/dbHealth.js';

import authRoutes from './routes/auth.js';
import credentialRoutes from './routes/credentials.js';
import projectRoutes from './routes/projects.js';
import teamRoutes from './routes/teams.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
	origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
	credentials: true
}));

// Rate limiting - more lenient for development
const isDevelopment = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: isDevelopment ? 1000 : 100, // More requests allowed in development
	message: {
		error: 'Too many requests from this IP, please try again later.',
		retryAfter: '1 minute'
	},
	standardHeaders: true,
	legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: isDevelopment ? 50 : 20, // Fewer requests for auth endpoints
	message: {
		error: 'Too many authentication attempts, please try again later.',
		retryAfter: '1 minute'
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Body parsing middleware
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
	try {
		const health = await quickHealthCheck();
		res.json({
			...health,
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		});
	} catch (error) {
		res.status(500).json({
			status: 'unhealthy',
			error: error.message,
			timestamp: new Date().toISOString()
		});
	}
});

// Detailed database health check endpoint
app.get('/api/health/database', async (req, res) => {
	try {
		const health = await checkDatabaseHealth();
		const statusCode = health.status === 'healthy' ? 200 : 503;
		res.status(statusCode).json(health);
	} catch (error) {
		res.status(500).json({
			status: 'unhealthy',
			error: error.message,
			timestamp: new Date().toISOString()
		});
	}
});

// Error handling middleware
app.use((err, req, res, next) => {
	res.status(500).json({
		message: 'Something went wrong!',
		error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
	});
});

// 404 handler
app.use('*', (req, res) => {
	res.status(404).json({message: 'Route not found'});
});

// Connect to database and start server
connectDB().then(() => {
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
		console.log(`Environment: ${process.env.NODE_ENV}`);
	});
}).catch((error) => {
	console.error('Failed to start server:', error);
	process.exit(1);
});
