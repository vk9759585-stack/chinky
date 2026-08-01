require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.use(
"/api/media",
require("./routes/mediaRoutes")
);

mongoose
.connect(process.env.MONGO_URI)
.then(() => {

    console.log("MongoDB Connected");

})
.catch((err) => {

    console.log(err);

});

const server = http.createServer(app);

const io = new Server(server, {

    cors: {

        origin: "*",

        methods: ["GET", "POST"]

    }

});

require("./socket/socket")(io);

// ============================
// ROUTES
// ============================

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/chat", require("./routes/chatRoutes"));

app.use("/api/reels", require("./routes/reelRoutes"));

app.use("/api/reel-comments", require("./routes/reelCommentRoutes"));

app.use("/api/upload", require("./routes/uploadRoutes"));

app.use("/api/call", require("./routes/callRoutes"));

app.use("/api/notifications", require("./routes/notificationRoutes"));

app.use("/api/admin", require("./routes/adminRoutes"));

app.use("/api/wallet", require("./routes/walletRoutes"));

app.use("/api/subscription", require("./routes/subscriptionRoutes"));

app.use("/api/referral", require("./routes/referralRoutes"));

app.use("/api/security", require("./routes/securityRoutes"));

app.use("/api/otp", require("./routes/otpRoutes"));

app.get("/", (req, res) => {

    res.json({

        success: true,

        app: "Chinky API",

        status: "Running"

    });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log(`Server Running on ${PORT}`);

});