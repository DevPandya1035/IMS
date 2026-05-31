import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { apiLimiter, authLimiter } from './middlewares/rateLimiter.middleware.js';
import router from './routes/index.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(','),
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting
// app.use('/api/auth', authLimiter);
// app.use('/api', apiLimiter);

// Routes
app.use('/api', router);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

export default app;
export { app };
