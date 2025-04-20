const mongoose = require("mongoose");
const  data =  require("./data.js");
const Listing =  require("../models/listing.js");
const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";  


main()
  .then(() => { 
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    try {
        await Listing.deleteMany({}); 
        await Listing.insertMany(data.data); 
        console.log("Data is initialized");
    } catch (err) {
        console.error("Error initializing DB:", err);
    } finally {
        mongoose.connection.close();
    }
};

initDB();
