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

console.log('Starting server...');
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI);

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

// Add top-level error handlers
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Connect to DB and start server
connectDB(process.env.MONGO_URI).then(() => {
  initSocket(server);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}); 