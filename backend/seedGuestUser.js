const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/userModel");
const connectDB = require("./config/db");

const seedGuestUser = async () => {
    try {
        await connectDB();

        // Delete existing guest user if exists
        await User.deleteOne({ email: "guest@example.com" });
        console.log("Cleared any existing guest user...");

        // Create the guest user with plain password
        // The pre-save hook in userModel will hash it
        // No pic - Avatar will show "G" for Guest User
        const guestUser = await User.create({
            name: "Guest User",
            email: "guest@example.com",
            password: "123456",  // Plain password - will be hashed by pre-save hook
            pic: "",  // Empty pic - will show "G" initial in Avatar
            isAdmin: false,
        });

        console.log("Guest user created successfully!");
        console.log("Email: guest@example.com");
        console.log("Password: 123456");
        console.log("Profile: Shows 'G' letter as avatar");

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

seedGuestUser();
