import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import workerRoutes from './routes/workerRoutes';
import { FRONTEND_URL } from './config/env';

const app = express();

// Middleware
// Security: CORS configured to accept only requests from the frontend
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'https://cosmo-frontend.vercel.app'], // Add your production domains here
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
