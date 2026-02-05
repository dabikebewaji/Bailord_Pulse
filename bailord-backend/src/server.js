import app from "./app.js";
import { createServer } from 'http';
import dotenv from "dotenv";
import { initializeSocket } from './socket/socketManager.js';

dotenv.config();

const startServer = async (initialPort = 5000) => {
  const server = createServer(app);
  const io = initializeSocket(server);
  global.io = io; // Store io instance globally for use in other modules

  // Try ports sequentially until one works
  let currentPort = initialPort;
  const maxAttempts = 10; // Try up to 10 ports
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        server.listen(currentPort, () => {
          console.log(`🚀 Server running on port ${currentPort}`);
          resolve();
        });

        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${currentPort} is in use, trying next port...`);
            currentPort++;
            reject(error);
          } else {
            console.error('❌ Server error:', error);
            reject(error);
          }
        });
      });
      
      // If we get here, the server started successfully
      return;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        console.error(`❌ Could not find an available port after ${maxAttempts} attempts`);
        process.exit(1);
      }
      // Continue to next iteration to try next port
    }
  }
};

// Start the server with initial port from env or 5000
startServer(process.env.PORT || 5000).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
