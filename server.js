require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const initSocket = require("./socket/socket");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const notificationRoutes = require("./routes/notifications");
const storyRoutes = require("./routes/stories");
const messageRoutes = require("./routes/messages");
const reelRoutes = require("./routes/reels");
const accountRoutes = require("./routes/account");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const onlineUsers = new Map();
app.set("io", io);
app.set("onlineUsers", onlineUsers);

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/account", accountRoutes);

app.get("/", (req, res) => {
  res.send("Vibely API is running 🚀");
});

initSocket(io, onlineUsers);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Vibely backend running on port ${PORT}`));
