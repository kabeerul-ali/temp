import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
  {
    localAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    country: { type: String, default: "India", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

// MINIMAL CHANGE: Add 'type' field to existing cart schema
const cartSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["product", "offer"],
      default: "product",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: function () {
        return this.type === "product";
      },
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: function () {
        return this.type === "offer";
      },
    },
    quantity: { type: Number, min: 1, default: 1 },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{10}$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    image: String,
    addresses: [addressSchema],
    cart: [cartSchema], // Still same field name
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/* ✅ FIXED HOOK */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ UPDATED: Get total items in cart
userSchema.methods.getCartTotal = function () {
  return this.cart.reduce((t, i) => t + i.quantity, 0);
};

// ✅ NEW: Simple add to cart method (works for both)
userSchema.methods.addToCart = function (type, itemId, quantity = 1) {
  // Check if item already exists
  const existingIndex = this.cart.findIndex((item) => {
    if (type === "product") {
      return (
        item.type === "product" &&
        item.productId &&
        item.productId.toString() === itemId.toString()
      );
    } else {
      return (
        item.type === "offer" &&
        item.offerId &&
        item.offerId.toString() === itemId.toString()
      );
    }
  });

  if (existingIndex > -1) {
    // Update quantity
    this.cart[existingIndex].quantity += quantity;
  } else {
    // Add new item
    const newItem = {
      type,
      quantity,
    };

    if (type === "product") {
      newItem.productId = itemId;
    } else {
      newItem.offerId = itemId;
    }

    this.cart.push(newItem);
  }

  return this.save();
};

// ✅ NEW: Remove from cart
userSchema.methods.removeFromCart = function (type, itemId) {
  this.cart = this.cart.filter((item) => {
    if (type === "product") {
      return !(
        item.type === "product" &&
        item.productId &&
        item.productId.toString() === itemId.toString()
      );
    } else {
      return !(
        item.type === "offer" &&
        item.offerId &&
        item.offerId.toString() === itemId.toString()
      );
    }
  });

  return this.save();
};

const User = mongoose.model("User", userSchema);
export default User;
