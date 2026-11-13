
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const User = require("./models/User");
const fileRoutes = require("./routes/fileRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.get("/api/protected", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("name email");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Welcome! You are authenticated.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});
app.get("/", (req, res) => {
    res.send("Cloud File Sharing System Backend is Running!");
});

app.get("/api/test", (req, res) => {
    res.json({
        message: "Backend API is working successfully!"
    });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
