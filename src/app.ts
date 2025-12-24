import express, { NextFunction, Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'reflect-metadata';
import dotenv from 'dotenv';
import { PORT } from '@utils/contants';
import createLogger from '@utils/logger';
import { errorHandler } from '@middleware/error';
import servicecart from '@controller/serviceCart';

import user from '@controller/user';
import service from '@controller/service';
import doctor from '@controller/doctor';
import booking from '@controller/booking';
import review from '@controller/review';
import notification from '@controller/notification';
import vat from '@controller/vat';
import redeem from '@controller/redeem';
import branch from '@controller/branch';
import banner from '@controller/banner';
import settings from '@controller/setting';
import upload from '@controller/upload';
// import payment from '@controller/payment';
import payment from "@controller/payment";

import https from 'https';
import fs from 'fs';
import path from 'path';


import pool from '@utils/db';

dotenv.config();
const logger = createLogger('@app');

// Global crash/error catchers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

async function start() {
  const app: Application = express();

  // Test DB connection (optional but useful)
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Failed to connect to the database:', err);
    process.exit(1);
  }

  // Middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // app.use(cors({ origin: '*',credentials: true}));

  // app.options('*', cors());
  
  const allowedOrigins = [
  'https://qualitycareadmin-git-main-akashgbpp9s-projects.vercel.app',
  'https://safweteltatwer.com', // if your backend is also calling APIs
  'http://localhost:3000', // local frontend dev
  'https://secure.paytabs.com',
  'https://secure.paytabs.sa'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed from this origin'));
    }
  },
  credentials: true
}));

  app.use(morgan('combined'));

  // Serve static files from /public for simple flows like account deletion page
  app.use(express.static('public'));

  // Routes
  app.use('/servicecart', servicecart);
  app.use('/user', user);
  app.use('/service', service);
  app.use('/doctor', doctor);
  app.use('/booking', booking);
  app.use('/review', review);
  app.use('/notification', notification);
  app.use('/vat', vat);
  app.use('/redeem', redeem);
  app.use('/branch', branch);
  app.use('/banner', banner);
  app.use('/setting', settings);
  app.use('/upload', upload);
  app.use('/payment', payment);

  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
  });

  // Custom file size error handling middleware (if needed)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: true,
        message: 'File size exceeds limit.',
      });
    }
    console.error('Unhandled error middleware:', err);
    res.status(500).json({
      error: true,
      message: err.message || 'Internal Server Error',
    });
  });

  // Global error handler (after all routes)
  app.use(errorHandler);


  //-------------------------------------Local Code---------------------------------//
  app.listen(PORT, () => {
    logger.info(`🚀 App is listening on port ${PORT}`);
  });
  //-------------------------------------Local Code End---------------------------------//


  //-------------------------------------Production  Start---------------------------------//
  // const port = 6002;
  // const certPath = '/etc/letsencrypt/live/qc.atlasits.cloud/fullchain.pem'; // Adjust path as needed
  // const keyPath = '/etc/letsencrypt/live/qc.atlasits.cloud/privkey.pem';   // Adjust path as needed
  // // HTTPS options
  // const options = {
  //   key: fs.readFileSync(keyPath),
  //   cert: fs.readFileSync(certPath),
  // };
  // app.get('/', (req, res) => {
  //   res.send('<h1>HTTPS is working with TypeScript and Node.js!</h1>');
  // });
  
  // // Create and start the HTTPS server
  // https.createServer(options, app).listen(port, () => {
  //   console.log(`HTTPS Server listening on port ${port}`);
  //   console.log(`Access at: https://localhost:${port}`);
  // });

  //-------------------------------------Production End---------------------------------//  

}

// Start with top-level error handling
start().catch((err) => {
  console.error('❌ Fatal error during app startup:', err);
  process.exit(1);
});

console.log("🚀 Safwa API started: Build time", new Date().toISOString());




