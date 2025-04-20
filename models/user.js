const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    password: String, // hash this in production!
    role: {
        type: String,
        enum: ["buyer", "seller"],
        required: true,
    },
});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);