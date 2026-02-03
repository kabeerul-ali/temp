// src/routes/user.routes.js
import express from "express";
import {
  getProfile,
  getWalletBalance,
  updateWallet,
  getAllAddresses,
  addAddress,
  editAddress,
  setDefaultAddress,
  removeAddress,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.get("/wallet", protect, getWalletBalance); // GET wallet balance
router.patch("/wallet/update", protect, updateWallet); // UPDATE wallet (+/-)
//address
router.get("/address", protect, getAllAddresses); // GET all addresses
router.post("/address", protect, addAddress); // ADD new address
router.put("/address/:id", protect, editAddress); // EDIT address by ID
router.patch("/address/:id/default", protect, setDefaultAddress); // SET as default address
router.delete("/address/:id", protect, removeAddress); // REMOVE address by ID

export default router;
