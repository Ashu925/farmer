const express = require("express");
const router = express.Router();
const { isLoggedIn, isSeller } = require("../middleware");
const Listing = require("../models/listing");

// Seller dashboard
router.get("/seller/dashboard", isLoggedIn, isSeller, async (req, res) => {
    try {
        // Find all listings created by the current seller
        const products = await Listing.find({ createdby: req.user._id })
            .populate({
                path: 'bids.bidder',
                select: 'username email' // Only select necessary fields
            })
            .sort({ createdAt: -1 });

        // Calculate highest bid for each product
        const productsWithHighestBid = products.map(product => {
            const highestBid = product.bids.length > 0 
                ? Math.max(...product.bids.map(bid => bid.amount))
                : 0;
            return {
                ...product.toObject(),
                highestBid
            };
        });

        res.render("seller/dashboard", { 
            products: productsWithHighestBid,
            currentUser: req.user 
        });
    } catch (error) {
        console.error('Error in seller dashboard:', error);
        req.flash('error', 'Something went wrong while fetching your products');
        res.redirect('/');
    }
});

module.exports = router;