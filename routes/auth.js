const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");

router.get("/register", (req, res) => {
  res.render("auth/register");
});

router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  const user = new User({ username, role });
  const registeredUser = await User.register(user, password);
  res.redirect("/login");
});

router.get("/login", (req, res) => {
  res.render("auth/login");
});

router.post("/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    // redirect by role
    if (req.user.role === "seller") return res.redirect("/seller/dashboard");
    res.redirect("/buyer/dashboard");
  });

router.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

module.exports = router;