import app from "./app.js";
import { createServer } from "http";
import dotenv from "dotenv";
import { initializeSocket } from "./socket/socketManager.js";

dotenv.config();

const startServer = async (initialPort = 5000) => {
  const server = createServer(app);
  const io = initializeSocket(server);
  global.io = io; // Store io instance globally for use in other modules

  // Try ports sequentially until one works. The same `server` instance is
  // reused across attempts, so each attempt's error/listening listeners are
  // removed afterward — otherwise they accumulate and the success message
  // (and any 'listening' handler) fires once per prior failed attempt too.
  let currentPort = initialPort;
  const maxAttempts = 10; // Try up to 10 ports

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const onError = (error) => {
          server.removeListener("listening", onListening);
          if (error.code === "EADDRINUSE") {
            console.log(
              `⚠️ Port ${currentPort} is in use, trying next port...`,
            );
            currentPort++;
          } else {
            console.error(" Server error:", error);
          }
          reject(error);
        };
        const onListening = () => {
          server.removeListener("error", onError);
          console.log(`🚀 Server running on port ${currentPort}`);
          resolve();
        };

        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(currentPort);
      });

      // If we get here, the server started successfully
      return;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        console.error(
          ` Could not find an available port after ${maxAttempts} attempts`,
        );
        process.exit(1);
      }
      // Continue to next iteration to try next port
    }
  }
};

// Start the server with initial port from env or 5000
startServer(process.env.PORT || 5000).catch((error) => {
  console.error(" Failed to start server:", error);
  process.exit(1);
});
