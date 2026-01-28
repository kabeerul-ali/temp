import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './src/config/database.js';

import productRoutes from './src/routes/product.routes.js';
import offerRoutes from './src/routes/offer.routes.js';
import userRoutes from './src/routes/user.routes.js';
import cartRoutes from './src/routes/cart.routes.js';
import otpRoutes from './routes/otp.routes.js';

dotenv.config();

const app = express();

/* =======================
   CORS (ENV ONLY)
======================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

/* =======================
   MIDDLEWARE
======================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =======================
   ROUTES
======================= */
app.use('/api/products', productRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);


/* =======================
   HEALTH CHECK
======================= */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is working'
  });
});

/* =======================
   SERVER START
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Allowed CORS origin: ${process.env.FRONT_URL}`);
});
