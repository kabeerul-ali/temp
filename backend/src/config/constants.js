// src/config/constants.js

export const ORDER_STATUS = {
  PROCESSING: 'processing',
  CONFIRMED: 'confirmed',
  OUT_FOR_DELIVERY: 'out-for-delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed'
};

export const PAYMENT_METHOD = {
  COD: 'cod',
  ONLINE: 'online'
};

export const PRODUCT_CATEGORIES = {
  FRUIT: 'fruit',
  VEGETABLE: 'vegetable',
  DAIRY: 'dairy',
  BEVERAGE: 'beverage'
};

export const OTP_PURPOSE = {
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgotPassword'
};

export const DELIVERY_CHARGES = {
  FLAT_RATE: 40,
  FREE_ABOVE: 500
};

export const ORDER_CANCELLATION_TIME = 10; // minutes

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superAdmin'
};