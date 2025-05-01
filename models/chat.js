const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    messages: [messageSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    unread: {
        buyer: {
            type: Boolean,
            default: false
        },
        seller: {
            type: Boolean,
            default: false
        }
    }
});

module.exports = mongoose.model('Chat', chatSchema); 