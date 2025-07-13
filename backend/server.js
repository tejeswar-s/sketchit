const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/database');
const rateLimiter = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const roomsRouter = require('./routes/rooms');
const gameRouter = require('./routes/game');
const healthRouter = require('./routes/health');
const initSocket = require('./socket');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use('/api/rooms', roomsRouter);
app.use('/api/game', gameRouter);
app.use('/api/health', healthRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = 5000;
const MONGO_URI = 'mongodb://localhost:27017/sketchit';

const server = http.createServer(app);

// Connect to DB and start server
connectDB(MONGO_URI).then(() => {
  initSocket(server);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}); 