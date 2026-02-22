import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import chalk from 'chalk';
dotenv.config();
import { connectDB } from './src/config/database.js';

import productRoutes from './src/routes/product.routes.js';
import offerRoutes from './src/routes/offer.routes.js';
import userRoutes from './src/routes/user.routes.js';
import cartRoutes from './src/routes/cart.routes.js';
import otpRoutes from './src/routes/otp.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import orderRoutes from './src/routes/order.routes.js'; // NEW
import paymentRoutes from './src/routes/payment.routes.js'; // NEW

const app = express();

/* =======================
   ENV
======================= */
const PORT = process.env.PORT || 5000;
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';
const BASE_URL = `http://localhost:${PORT}`;

/* =======================
   CORS
======================= */
app.use(
  cors({
    origin: FRONT_URL,
    credentials: true,
  })
);

/* =======================
   MIDDLEWARE
======================= */
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =======================
   ROUTES MAP
======================= */
const routes = [
  { name: 'Products', path: '/api/products', route: productRoutes },
  { name: 'Offers', path: '/api/offers', route: offerRoutes },
  { name: 'Cart', path: '/api/cart', route: cartRoutes },
  { name: 'Users', path: '/api/users', route: userRoutes },
  { name: 'OTP', path: '/api/otp', route: otpRoutes },
  { name: 'Auth', path: '/api/auth', route: authRoutes },
  { name: 'Orders', path: '/api/orders', route: orderRoutes }, // NEW
  { name: 'Payments', path: '/api/payments', route: paymentRoutes }, // NEW
];

routes.forEach(r => app.use(r.path, r.route));

/* =======================
   HEALTH
======================= */
app.get('/', (_, res) => {
  res.json({ success: true, message: 'API is running 🚀' });
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, async () => {
  await connectDB();

  console.clear();

  console.log(chalk.green.bold('\n✔ SERVER STARTED SUCCESSFULLY\n'));

  console.log(chalk.gray('────────────────────────────────────────'));
  console.log(`${chalk.blue('🌐 Backend URL')}  ${chalk.white(BASE_URL)}`);
  console.log(`${chalk.blue('🖥  Frontend')}    ${chalk.white(FRONT_URL)}`);
  console.log(`${chalk.blue('🍪 Cookies')}     ${chalk.green('Enabled')}`);
  console.log(`${chalk.blue('📦 Environment')} ${chalk.green(process.env.NODE_ENV || 'development')}`);
  console.log(chalk.gray('────────────────────────────────────────\n'));

  console.log(chalk.yellow.bold('📌 API ENDPOINTS'));
  routes.forEach(r => {
    console.log(
      `${chalk.green('➜')} ${chalk.cyan(r.name.padEnd(10))} ${chalk.white(
        `${BASE_URL}${r.path}`
      )}`
    );
  });
  console.log(chalk.green.bold('\n✔ ready to accept api requvest\n'));

  console.log(
    `${chalk.green('➜')} ${chalk.cyan('Health'.padEnd(10))} ${chalk.white(
      `${BASE_URL}/`
    )}\n`
  );
});