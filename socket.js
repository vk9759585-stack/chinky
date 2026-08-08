const Chat = require("./models/Chat");

module.exports = (io) => {

    io.on("connection", (socket) => {

        console.log("User Connected :", socket.id);

        socket.on("join", (userId) => {
            socket.join(userId);
        });

        socket.on("send_message", async (data) => {

            try {

                const message = await Chat.create({

                    sender: data.senderId,

                    receiver: data.receiverId,

                    message: data.message,

                    image: data.image || "",

                    video: data.video || "",

                    voice: data.voice || ""

                });

                io.to(data.receiverId).emit(
                    "receive_message",
                    message
                );

                io.to(data.senderId).emit(
                    "receive_message",
                    message
                );

            } catch (err) {

                console.log(err);

            }

        });

        socket.on("typing", (data) => {

            io.to(data.receiverId).emit(
                "typing",
                data.senderId
            );

        });

        socket.on("stop_typing", (data) => {

            io.to(data.receiverId).emit(
                "stop_typing"
            );

        });

        socket.on("disconnect", () => {

            console.log("Disconnected");

        });

    });

};