const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const Listing = require('../models/listing');
const mongoose = require('mongoose');

// Create a valid temporary user ID
const TEMP_USER_ID = new mongoose.Types.ObjectId('000000000000000000000000');

// Middleware to count unread messages
const countUnreadMessages = async (req, res, next) => {
    try {
        const chats = await Chat.find({
            participants: req.user?._id || TEMP_USER_ID
        });
        
        let unreadCount = 0;
        chats.forEach(chat => {
            if (req.user?.role === 'buyer' && chat.unread?.buyer) {
                unreadCount++;
            } else if (req.user?.role === 'seller' && chat.unread?.seller) {
                unreadCount++;
            }
        });
        
        res.locals.unreadMessages = unreadCount;
        next();
    } catch (error) {
        console.error('Error counting unread messages:', error);
        res.locals.unreadMessages = 0;
        next();
    }
};

// Get all chats
router.get('/', countUnreadMessages, async (req, res) => {
    try {
        const chats = await Chat.find({})
            .populate('participants', 'username')
            .populate('listing', 'title')
            .sort({ lastUpdated: -1 });
        
        res.render('chat/index', { 
            chats,
            currentUser: req.user || { _id: TEMP_USER_ID }
        });
    } catch (error) {
        console.error('Error loading chats:', error);
        res.redirect('/');
    }
});

// Get buyer-specific chats
router.get('/buyer', countUnreadMessages, async (req, res) => {
    try {
        const chats = await Chat.find({})
            .populate('participants', 'username')
            .populate('listing', 'title')
            .sort({ lastUpdated: -1 });
        
        res.render('chat/buyer', { 
            chats,
            currentUser: req.user || { _id: TEMP_USER_ID }
        });
    } catch (error) {
        console.error('Error loading buyer chats:', error);
        res.redirect('/');
    }
});

// Get seller-specific chats
router.get('/seller', countUnreadMessages, async (req, res) => {
    try {
        const chats = await Chat.find({})
            .populate('participants', 'username')
            .populate('listing', 'title')
            .sort({ lastUpdated: -1 });
        
        res.render('chat/seller', { 
            chats,
            currentUser: req.user || { _id: TEMP_USER_ID }
        });
    } catch (error) {
        console.error('Error loading seller chats:', error);
        res.redirect('/');
    }
});

// Start a new chat with specific buyer
router.post('/:listingId/start/:buyerId', async (req, res) => {
    try {
        console.log('Starting new chat:', {
            listingId: req.params.listingId,
            buyerId: req.params.buyerId,
            sellerId: req.user?._id
        });

        const listing = await Listing.findById(req.params.listingId)
            .populate('bids.bidder', '_id username');
        
        if (!listing) {
            console.log('Listing not found:', req.params.listingId);
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Find the specific buyer's bid
        const buyerBid = listing.bids.find(bid => 
            bid.bidder._id.toString() === req.params.buyerId
        );

        if (!buyerBid) {
            console.log('Buyer bid not found:', {
                listingId: req.params.listingId,
                buyerId: req.params.buyerId
            });
            return res.status(404).json({ error: 'Buyer bid not found' });
        }

        // Check if chat already exists
        const existingChat = await Chat.findOne({
            listing: listing._id,
            participants: {
                $all: [listing.createdby, req.params.buyerId]
            }
        });

        if (existingChat) {
            console.log('Chat already exists:', existingChat._id);
            return res.json({ 
                success: true, 
                chatId: existingChat._id,
                redirect: `/chat/${existingChat._id}`
            });
        }

        // Create new chat with both participants
        const chat = new Chat({
            participants: [listing.createdby, req.params.buyerId],
            listing: listing._id,
            messages: [],
            unread: {
                buyer: true,
                seller: false
            }
        });

        await chat.save();
        console.log('Created new chat:', {
            chatId: chat._id,
            sellerId: listing.createdby,
            buyerId: req.params.buyerId
        });

        res.json({ 
            success: true, 
            chatId: chat._id,
            redirect: `/chat/${chat._id}`
        });
    } catch (error) {
        console.error('Error starting chat:', error);
        res.status(500).json({ error: 'Failed to start chat' });
    }
});

// Get chat messages
router.get('/:chatId', countUnreadMessages, async (req, res) => {
    try {
        console.log('Fetching chat messages for chatId:', req.params.chatId);
        
        // Get chat with all necessary data
        const chat = await Chat.findById(req.params.chatId)
            .populate({
                path: 'participants',
                select: 'username email role _id'
            })
            .populate({
                path: 'listing',
                select: 'title createdby'
            })
            .populate({
                path: 'messages.sender',
                select: 'username _id'
            })
            .lean();

        if (!chat) {
            console.log('Chat not found:', req.params.chatId);
            return res.redirect('/chat');
        }

        // Verify user is a participant
        const isParticipant = chat.participants.some(p => 
            p._id.toString() === (req.user?._id || TEMP_USER_ID).toString()
        );

        if (!isParticipant) {
            console.log('User not authorized to view this chat:', {
                userId: req.user?._id,
                participants: chat.participants.map(p => p._id)
            });
            return res.redirect('/chat');
        }

        // Get all messages for this chat
        const messages = await Chat.findById(chat._id)
            .select('messages')
            .populate('messages.sender', 'username _id')
            .lean();

        console.log('Found messages:', {
            chatId: chat._id,
            messageCount: messages.messages.length
        });

        // Mark messages as read
        if (req.user?.role === 'buyer') {
            await Chat.findByIdAndUpdate(chat._id, {
                'unread.buyer': false
            });
        } else if (req.user?.role === 'seller') {
            await Chat.findByIdAndUpdate(chat._id, {
                'unread.seller': false
            });
        }

        // Sort messages by timestamp
        messages.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.render('chat/show', { 
            chat: {
                ...chat,
                messages: messages.messages
            },
            currentUser: req.user || { _id: TEMP_USER_ID }
        });
    } catch (error) {
        console.error('Error loading chat:', {
            error: error.message,
            stack: error.stack,
            chatId: req.params.chatId
        });
        req.flash('error', 'Something went wrong while loading the chat');
        res.redirect('/chat');
    }
});

// Send a message
router.post('/:chatId/message', async (req, res) => {
    try {
        console.log('Received message request:', {
            chatId: req.params.chatId,
            body: req.body,
            user: req.user
        });

        const { content } = req.body;
        if (!content || content.trim() === '') {
            console.log('Empty message content');
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Get chat and verify participants
        const chat = await Chat.findById(req.params.chatId)
            .populate('participants', 'username email role _id');

        if (!chat) {
            console.log('Chat not found:', req.params.chatId);
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Verify user is a participant
        const isParticipant = chat.participants.some(p => 
            p._id.toString() === (req.user?._id || TEMP_USER_ID).toString()
        );

        if (!isParticipant) {
            console.log('User not authorized to send messages in this chat:', {
                userId: req.user?._id,
                participants: chat.participants.map(p => p._id)
            });
            return res.status(403).json({ error: 'Not authorized to send messages in this chat' });
        }

        // Create and save new message
        const newMessage = {
            content: content.trim(),
            sender: req.user?._id || TEMP_USER_ID,
            timestamp: new Date()
        };

        // Update chat with new message and unread status
        const updatedChat = await Chat.findByIdAndUpdate(
            chat._id,
            {
                $push: { messages: newMessage },
                $set: {
                    lastUpdated: new Date(),
                    [`unread.${req.user?.role === 'buyer' ? 'seller' : 'buyer'}`]: true
                }
            },
            { new: true }
        )
        .populate('messages.sender', 'username _id')
        .populate('participants', 'username _id')
        .lean();

        // Get the last message
        const lastMessage = updatedChat.messages[updatedChat.messages.length - 1];

        console.log('Saved new message:', {
            chatId: updatedChat._id,
            messageId: lastMessage._id,
            sender: lastMessage.sender.username
        });

        // Emit the new message to all participants
        const io = req.app.get('io');
        if (io) {
            io.to(chat._id.toString()).emit('new-message', lastMessage);
        }

        res.json({
            success: true,
            message: lastMessage
        });
    } catch (error) {
        console.error('Error in message route:', {
            error: error.message,
            stack: error.stack,
            chatId: req.params.chatId,
            user: req.user
        });
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router; 