require('dotenv').config();
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
const { createtoken,validate, validator } = require("./services/jwtcreater.js");
const cookieParser = require("cookie-parser");
const { checkuser } = require("./services/cokkiechecker.js");
const multer = require("multer");
const { sendBidSelectedEmail } = require('./services/emailService');
const flash = require('connect-flash');

// Database connection
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log("Connected to DB"))
    .catch(err => console.error("DB connection error:", err));

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

// Middleware setup
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session(sessionConfig));
app.use(flash());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// Make flash messages and current user available in all templates
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
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

// Authentication routes
app.get("/register", (req, res) => { 
    res.render("register");
});

app.post("/register", async (req, res) => {
    try {
        const { username, password, role, email } = req.body;
        const user = new User({ username, role, password, email });
        await user.save();
        
        req.flash('success', 'Registration successful! Please login.');
        res.redirect("/login");
    } catch (error) {
        console.log(error);
        req.flash('error', 'Registration failed. Please try again.');
        res.redirect("/register");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }

        const token = createtoken(user);
        res.cookie('token', token);
        
        // Redirect based on role
        if (user.role === "seller") {
            return res.redirect("/seller/dashboard");
        } else {
            return res.redirect("/buyer/dashboard");
        }
    } catch (error) {
        console.log(error);
        req.flash('error', 'Login failed. Please try again.');
        res.redirect('/login');
    }
});

app.get("/logout", (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'Logged out successfully');
    res.redirect('/');
});

app.use(checkuser)

// main rout
app.get("/", async(req,res)=>{
  if(req.user){
    console.log('//');
    const dataa = await Listing.find()
    .sort({ _id: -1 })  
    .populate('createdby', 'username email');
    // console.log(dataa);  
    return res.render('home2', { products: dataa, data: req.user });

    // return res.send(`logined ${req.user.user},${req.user._id}`)
  }
  else {return  res.render('home',{data:null});}
});

app.get('/createList', (req, res) => {
    try {
        if (!req.user) {
            req.flash('error', 'You must be logged in to create a listing');
            return res.redirect('/login');
        }

        if (req.user.role !== 'seller') {
            req.flash('error', 'Only sellers can create listings');
            return res.redirect('/');
        }

        res.render('Poductbuilder');
    } catch (error) {
        console.error('Error in createList route:', error);
        req.flash('error', 'Something went wrong');
        res.redirect('/');
    }
});
// image uplload rouuter
const storage=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,path.resolve(__dirname,'../FARMER/public/productimage'));
  },
  filename:function(req,file,cb){
    const name=`${Date.now()}-${file.originalname}`
    cb(null,name)
  }
})

const upload=multer({storage:storage})

app.post('/createproduct', upload.single('image'), async (req, res) => {
    try {
        if (!req.user) {
            req.flash('error', 'You must be logged in to create a product');
            return res.redirect('/login');
        }

        if (req.user.role !== 'seller') {
            req.flash('error', 'Only sellers can create products');
            return res.redirect('/');
        }

        const { title, description, location, country, price } = req.body;
        
        if (!title || !description || !location || !country || !price) {
            req.flash('error', 'All fields are required');
            return res.redirect('/createList');
        }

        if (!req.file) {
            req.flash('error', 'Image is required');
            return res.redirect('/createList');
        }

        const data = await Listing.create({
            title,
            description,
            image: req.file.filename,
            location,
            country,
            price,
            createdby: req.user._id
        });

        req.flash('success', 'Product created successfully!');
        res.redirect('/seller/listings');
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error', 'Something went wrong while creating the product');
        res.redirect('/createList');
    }
});

app.get("/listings", async (req, res) => {
    try {
        if (req.user) {
            if (req.user.role === 'seller') {
                return res.redirect('/seller/listings');
            } else if (req.user.role === 'buyer') {
                return res.redirect('/');
            }
        }
        // If no user is logged in, redirect to home
        res.redirect('/');
    } catch (err) {
        console.error('Error in listings route:', err);
        req.flash('error', 'Something went wrong');
        res.redirect('/');
    }
});

app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs");
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
app.post("/listings/edit/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;

  const updatedData = { ...req.body };

  // If a new image was uploaded, add it to the update
  if (req.file) {
    updatedData.image = req.file.filename; // Or `path` or custom storage filename
  }

  await Listing.findByIdAndUpdate(id, updatedData);
  res.redirect(`/listings/${id}`);
});
//delete route 
app.delete("/listings/:id", async(req,res)=>{
  let {id} =  req.params;
  let deletedListing = await Listing.findByIdAndDelete(id)
  console.log(deletedListing);
  res.redirect("/listings")
});
//show route 
app.get("/listings/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Listing.findById(id).populate('createdby');
    
    if (!data) {
      req.flash('error', 'Listing not found');
      return res.redirect('/listings');
    }

    // If user is not logged in, render with null user data
    if (!req.user) {
      return res.render('listings/show_buyer', { listing: data, data: null });
    }

    // Render based on user role
    if (req.user.role === "buyer") {
      return res.render('listings/show_buyer', { listing: data, data: req.user });
    } else {
      return res.render('listings/show_seller', { listing: data, data: req.user });
    }
  } catch (err) {
    console.error('Error in listing route:', err);
    req.flash('error', 'Something went wrong');
    res.redirect('/listings');
  }
});

app.get('/l')

// POST - Place a bid
app.post("/listings/:id/bids", async (req, res) => {
    try {
        if (!req.user) {
            req.flash('error', 'You must be logged in to place a bid');
            return res.redirect('/login');
        }

        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            console.error('Listing not found:', req.params.id);
            req.flash('error', 'Listing not found');
            return res.redirect('/listings');
        }

        // Check if the listing already has a selected bid
        if (listing.selectedBid) {
            req.flash('error', 'This listing has already been closed');
            return res.redirect(`/listings/${listing._id}`);
        }

        // Check if the bid amount is valid
        const bidAmount = parseFloat(req.body.amount);
        if (isNaN(bidAmount)) {
            console.error('Invalid bid amount:', req.body.amount);
            req.flash('error', 'Invalid bid amount');
            return res.redirect(`/listings/${listing._id}`);
        }

        if (bidAmount <= parseFloat(listing.price)) {
            req.flash('error', 'Bid amount must be higher than the listed price');
            return res.redirect(`/listings/${listing._id}`);
        }

        // Add the bid
        const newBid = {
            bidder: req.user._id,
            amount: bidAmount,
            message: req.body.message || '',
            createdAt: new Date()
        };

        // Force update the listing
        await Listing.findByIdAndUpdate(
            listing._id,
            { 
                $push: { bids: newBid },
                $set: { createdby: listing.createdby || req.user._id } // Ensure createdby is set
            },
            { new: true, upsert: true }
        );

        console.log('Bid placed successfully:', {
            listingId: listing._id,
            bidderId: req.user._id,
            amount: bidAmount
        });

        req.flash('success', 'Bid placed successfully!');
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        console.error('Error in bid route:', err);
        req.flash('error', 'Something went wrong while placing your bid');
        res.redirect('/listings');
    }
});

// POST - Select a bid (seller only)
app.post("/listings/:id/select/:bidId", async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'seller') {
            req.flash('error', 'Only sellers can select bids');
            return res.redirect('/listings');
        }

        const listing = await Listing.findById(req.params.id).populate('bids.bidder');
        
        // Check if the listing belongs to the current user
        if (listing.createdby.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only select bids for your own listings');
            return res.redirect(`/listings/${listing._id}`);
        }

        const bid = listing.bids.id(req.params.bidId);
        if (!bid) {
            req.flash('error', 'Bid not found');
            return res.redirect(`/listings/${listing._id}`);
        }

        // Mark the bid as selected
        listing.selectedBid = bid.bidder;
        await listing.save();

        // Send email notification to the winning bidder
        try {
            const bidder = await User.findById(bid.bidder);
            if (bidder && bidder.email) {
                await sendBidSelectedEmail(bidder.email, listing.title, bid.amount);
            }
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Continue even if email fails
        }

        req.flash('success', 'Bid selected successfully!');
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        console.error('Error in select bid route:', err);
        req.flash('error', 'Something went wrong while selecting the bid');
        res.redirect('/listings');
    }
});

// Add new route for seller's listings
app.get("/seller/listings", async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'seller') {
            req.flash('error', 'You must be a seller to view this page');
            return res.redirect('/listings');
        }

        const sellerListings = await Listing.find({ createdby: req.user._id })
            .populate({
                path: 'bids.bidder',
                select: 'username email'
            })
            .sort({ createdAt: -1 });

        res.render("seller/listings", { 
            listings: sellerListings,
            currentUser: req.user 
        });
    } catch (err) {
        console.error('Error fetching seller listings:', err);
        req.flash('error', 'Error fetching your listings');
        res.redirect('/');
    }
});

app.listen(8080,()=>{
    console.log("server  is listening to 8080");
});