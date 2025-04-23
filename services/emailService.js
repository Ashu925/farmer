const nodemailer = require('nodemailer');

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // You'll need to set these environment variables
        pass: process.env.EMAIL_PASS
    }
});

// Function to send bid selected email
const sendBidSelectedEmail = async (toEmail, listingTitle, bidAmount) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Your Bid Has Been Selected!',
            html: `
                <h2>Congratulations!</h2>
                <p>Your bid of ₹${bidAmount} for the listing "${listingTitle}" has been selected by the seller.</p>
                <p>Please contact the seller to proceed with the transaction.</p>
                <p>Best regards,<br>FarmConnect Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendBidSelectedEmail }; 