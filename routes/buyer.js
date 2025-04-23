const express = require("express");
const router = express.Router();
const { isLoggedIn, isBuyer } = require("../middleware");
const Listing = require("../models/listing");
const Chat = require("../models/chat");

router.get("/buyer/dashboard", isLoggedIn, isBuyer, async (req, res) => {
    try {
        // Find all listings where the current user has placed bids
        const listings = await Listing.find({
            'bids.bidder': req.user._id
        }).populate('createdby', 'username email');

        // Get all chats for the current user
        const chats = await Chat.find({
            participants: req.user._id
        })
        .populate('participants', 'username')
        .populate('listing', 'title')
        .sort({ lastUpdated: -1 });

        // Format bids data
        const bids = listings.map(listing => {
            const userBid = listing.bids.find(bid => bid.bidder.equals(req.user._id));
            return {
                _id: userBid._id,
                amount: userBid.amount,
                listing: {
                    _id: listing._id,
                    title: listing.title,
                    selectedBid: listing.selectedBid
                }
            };
        });

        res.render("buyer/dashboard", { 
            bids,
            chats,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error in buyer dashboard:', error);
        req.flash('error', 'Something went wrong while fetching your dashboard data');
        res.redirect('/');
    }
});

// Buyer Messages
router.get("/buyer/messages", isLoggedIn, isBuyer, async (req, res) => {
    try {
        // Get all chats where the current user is a participant
        const chats = await Chat.find({
            participants: req.user._id
        })
        .populate('participants', 'username email')
        .populate('listing', 'title')
        .populate('messages.sender', 'username')
        .sort({ lastUpdated: -1 });

        // Mark messages as read for the buyer
        await Chat.updateMany(
            { 
                participants: req.user._id,
                'unread.buyer': true 
            },
            { 
                'unread.buyer': false 
            }
        );

        res.render("buyer/messages", { 
            chats,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error fetching buyer messages:', error);
        req.flash('error', 'Something went wrong while fetching your messages');
        res.redirect('/buyer/dashboard');
    }
});

module.exports = router;