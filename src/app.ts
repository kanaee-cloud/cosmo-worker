import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import workerRoutes from './routes/workerRoutes';
import { FRONTEND_URL, ALLOWED_ORIGINS } from './config/env';

const app = express();

// Middleware
// Security: CORS configured to accept only requests from known frontends
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    } else {
      console.warn(`[CORS BLOCKED] Origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Logging: Expanded logging using Morgan
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use(express.json());

// Custom Logging Middleware for detailed request body (optional, be careful with secrets)
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`[INCOMING REQUEST] ${req.method} ${req.originalUrl}`);
    // console.log('Body:', JSON.stringify(req.body, null, 2)); // Uncomment for debugging, avoid valid/sensitive data in prod logs
  }
  next();
});

// Routes
app.use('/api', workerRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Cosmo AI Worker is Operational. Security protocols active.');
});

export default app;
