const mongoose = require("mongoose");
const { createHmac, randomBytes } = require("node:crypto");
// const { createtoken } = require("../services/jwtcreater");

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
});

userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) return next(); // fixed

  const secret = randomBytes(16).toString("hex");
  const pass = createHmac("sha256", secret)
    .update(user.password)
    .digest("hex");

  user.salt = secret;
  user.password = pass;
  next();
});

// userSchema.statics.checkuserandverify = async function (email, password) {
//   const user = await this.findOne({ email }); // make sure email is in schema
//   if (!user) throw new Error("User not found");

//   const hashedInputPassword = createHmac("sha256", user.salt)
//     .update(password)
//     .digest("hex");

//   if (hashedInputPassword !== user.password) throw new Error("Wrong password");

//   const token = createtoken(user);
//   return token;
// };

module.exports = mongoose.model("User", userSchema);
