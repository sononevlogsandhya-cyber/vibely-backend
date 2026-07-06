const jwt = require("jsonwebtoken");
const User = require("../models/User");

const initSocket = (io) => {
  // Authenticate socket connection using JWT token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error: no token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) return next(new Error("Authentication error: user not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected: ${socket.user.username} (${userId})`);

    // Join a personal room named after the user's ID
    // this lets us do io.to(userId).emit(...) from controllers
    socket.join(userId);

    // Typing indicator for chat
    socket.on("typing", ({ receiverId }) => {
      io.to(receiverId).emit("userTyping", { senderId: userId });
    });

    socket.on("stopTyping", ({ receiverId }) => {
      io.to(receiverId).emit("userStoppedTyping", { senderId: userId });
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = initSocket;
