const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bidSchema = new Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const listingSchema = new Schema({
  createdby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  bids: [bidSchema],
  selectedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

// Virtual for getting the highest bid
listingSchema.virtual('highestBid').get(function() {
  if (this.bids.length === 0) return 0;
  return Math.max(...this.bids.map(bid => bid.amount));
});

// Method to check if a user can place a bid
listingSchema.methods.canPlaceBid = function(userId) {
  if (!userId) return false;
  if (this.createdby.toString() === userId.toString()) return false;
  if (this.selectedBid) return false;
  return true;
};

// Method to check if a user can select a bid
listingSchema.methods.canSelectBid = function(userId) {
  if (!userId) return false;
  if (this.createdby.toString() !== userId.toString()) return false;
  if (this.selectedBid) return false;
  return true;
};

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

  