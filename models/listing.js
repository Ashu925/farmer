
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  createdby: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  },
  title: String,
  description: String,
  image: String,
  price: String,
  location: String,
  country: String,
  bids: [
    {
      bidder: { type: mongoose.Types.ObjectId, ref: "User" },
      amount: Number,
      message: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  selectedBid: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

  