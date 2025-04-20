const express = require("express");
const app =  express();
const mongoose =  require("mongoose")
const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";  
const Listing =  require("./models/listing.js")  
const path =  require("path")
const methodOverride =  require("method-override")
const ejsMate = require("ejs-mate");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const User = require("./models/user");
const authRoutes = require("./routes/auth");
const buyerRoutes = require("./routes/buyer");
const sellerRoutes = require("./routes/seller");
main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
};

app.get("/", (req,res)=>{
  res.send("ram ram ");
});
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride( "_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")))
// app.use(authRoutes);
app.use(buyerRoutes);
app.use(sellerRoutes);

app.use(session({
  secret: "secretkey",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/listings",async(req,res)=>{
  try{  const allListings =  await  Listing.find({});
    res.render("listings/index.ejs", {allListings});
  }
  catch(err){
    console.log(err)
res.send("internal error found")
  }

});
//new route 
app.get("/listings/new",(req,res)=>{
  res.render("listings/new.ejs");
  });

//create route 
app.get("/register", (req, res) => { 
  res.render("auth/register");
});

app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  const user = new User({ username, role });
  const registeredUser = await User.register(user, password);
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("auth/login");
});
app.post("/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    // redirect by role
    if (req.user.role === "seller") return res.redirect("/seller/dashboard");
    res.redirect("/buyer/dashboard");
  });

app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});




app.post("/listings",async(req,res)=>{
  const newListing =   new Listing(req.body.listing);
 await  newListing.save();
 res.redirect("/listings");
});
//edit route 
app.get("/listings/:id/edit", async(req,res)=>{
  let {id}= req.params;
  const listing =   await Listing.findById(id);
  res.render("listings/edit.ejs",{listing})
});
//update route 
app.put("/listings/:id",async (req,res)=>{
  let {id} =  req.params ;
  await  Listing.findByIdAndUpdate(id,{...req.body.listing});
  res.redirect(`/listings/${id}`)
});
//delete route 
app.delete("/listings/:id", async(req,res)=>{
  let {id} =  req.params;
  let deletedListing = await Listing.findByIdAndDelete(id)
  console.log(deletedListing);
  res.redirect("/listings")
});
//show route 
app.get("/listings/:id", async (req,res)=>{
  let {id}= req.params;
  const listing =   await Listing.findById(id);
  res.render("listings/show.ejs",{listing});
  
});
app.listen(8080,()=>{
    console.log("server  is listening to 8080");
});