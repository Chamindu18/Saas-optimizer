/**
 * Server Entry Point
 * 
 * This file starts the Express server and listens for incoming requests.
 */

import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║  SaaS Management Platform - Backend    ║
  ║  Server running on port ${PORT}          ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}               ║
  ╚════════════════════════════════════════╝
  `);
  console.log(`API available at: http://localhost:${PORT}`);
  console.log('Press CTRL+C to stop the server');
});
