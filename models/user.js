const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const { createtoken } = require("../services/jwtcreater");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }, // added
  password: { type: String, required: true },
  salt: String, // added
  role: {
    type: String,
    enum: ["buyer", "seller"],
    required: true,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Static method to verify user credentials
userSchema.statics.checkuserandverify = async function (email, password) {
  try {
    const user = await this.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }
    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model("User", userSchema);
