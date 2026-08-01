const users = new Map();

function addUser(userId, socketId) {
    users.set(userId, socketId);
}

function removeUser(socketId) {
    for (const [userId, id] of users.entries()) {
        if (id === socketId) {
            users.delete(userId);
            break;
        }
    }
}

function getSocket(userId) {
    return users.get(userId);
}

function getOnlineUsers() {
    return [...users.keys()];
}

module.exports = {
    addUser,
    removeUser,
    getSocket,
    getOnlineUsers
};