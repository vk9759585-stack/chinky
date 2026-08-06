const users = new Map(); // userId -> Set of socketIds
const socketToUser = new Map(); // socketId -> userId

function addUser(userId, socketId) {
  if (!users.has(userId)) {
    users.set(userId, new Set());
  }

  users.get(userId).add(socketId);
  socketToUser.set(socketId, userId);
}

function removeUser(socketId) {
  const userId = socketToUser.get(socketId);

  if (!userId) return;

  const sockets = users.get(userId);

  if (sockets) {
    sockets.delete(socketId);

    // Agar user ke paas koi active socket nahi bacha
    if (sockets.size === 0) {
      users.delete(userId);
    }
  }

  socketToUser.delete(socketId);
}

function getSockets(userId) {
  return users.get(userId) || new Set();
}

function getOnlineUsers() {
  return [...users.keys()];
}

module.exports = {
  addUser,
  removeUser,
  getSockets,
  getOnlineUsers,
};