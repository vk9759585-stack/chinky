const {
    addUser,
    removeUser,
    getSocket,
    getOnlineUsers
} = require("./users");

module.exports = (io) => {

    io.on("connection", (socket) => {

        console.log("Socket Connected:", socket.id);

        socket.on("join", (userId) => {

            addUser(userId, socket.id);

            io.emit(
                "onlineUsers",
                getOnlineUsers()
            );

        });

        socket.on("typing", (data) => {

            const receiverSocket =
                getSocket(data.receiverId);

            if (receiverSocket) {

                io.to(receiverSocket).emit(
                    "typing",
                    {
                        senderId: data.senderId
                    }
                );

            }

        });

        socket.on("stopTyping", (data) => {

            const receiverSocket =
                getSocket(data.receiverId);

            if (receiverSocket) {

                io.to(receiverSocket).emit(
                    "stopTyping",
                    {
                        senderId: data.senderId
                    }
                );

            }

        });

        socket.on("disconnect", () => {

            removeUser(socket.id);

            io.emit(
                "onlineUsers",
                getOnlineUsers()
            );

            console.log(
                "Socket Disconnected:",
                socket.id
            );

        });

    });

};