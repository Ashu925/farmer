function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
  }
  
  function isBuyer(req, res, next) {
    if (req.user.role === "buyer") return next();
    res.status(403).send("Access denied: Buyers only");
  }
  
  function isSeller(req, res, next) {
    if (req.user.role === "seller") return next();
    res.status(403).send("Access denied: Sellers only");
  }
  
  module.exports = { isLoggedIn, isBuyer, isSeller };