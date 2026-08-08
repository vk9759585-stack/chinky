const {
  addUser,
  removeUser,
  getSocket,
  getOnlineUsers,
} = require("./users");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Socket Connected:", socket.id);

    // ===============================
    // JOIN EVENT
    // ===============================
    socket.on("join", (userId) => {
      try {
        if (!userId) return;

        socket.join(`user:${userId}`);
        addUser(userId, socket.id);

        io.emit("onlineUsers", getOnlineUsers());
      } catch (error) {
        console.error("Join Error:", error.message);
      }
    });

    // ===============================
    // TYPING EVENT
    // ===============================
    socket.on("typing", ({ senderId, receiverId }) => {
      try {
        if (!senderId || !receiverId) return;

        io.to(`user:${receiverId}`).emit("typing", { senderId });
      } catch (error) {
        console.error("Typing Error:", error.message);
      }
    });

    // ===============================
    // STOP TYPING EVENT
    // ===============================
    socket.on("stopTyping", ({ senderId, receiverId }) => {
      try {
        if (!senderId || !receiverId) return;

        io.to(`user:${receiverId}`).emit("stopTyping", { senderId });
      } catch (error) {
        console.error("StopTyping Error:", error.message);
      }
    });

    // ===============================
    // DISCONNECT EVENT
    // ===============================
    socket.on("disconnect", () => {
      try {
        removeUser(socket.id);

        io.emit("onlineUsers", getOnlineUsers());

        console.log("❌ Socket Disconnected:", socket.id);
      } catch (error) {
        console.error("Disconnect Error:", error.message);
      }
    });
  });
};
