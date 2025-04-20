const express = require("express");
const router = express.Router();
const { isLoggedIn, isSeller } = require("../middleware");



// Seller dashboard
router.get("/seller/dashboard", isLoggedIn, isSeller, (req, res) => {
  res.render("seller/dashboard");
});

module.exports = router;