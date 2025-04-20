const express = require("express");
const router = express.Router();
const { isLoggedIn, isBuyer } = require("../middleware");


router.get("/buyer/dashboard", isLoggedIn, isBuyer, (req, res) => {
  res.render("buyer/dashboard");
});

module.exports = router;