require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const login = process.env.ADMIN_LOGIN.toLowerCase();

  const user = await User.findOneAndUpdate(
    {
      $or: [
        { email: login },
        { username: login }
      ]
    },
    {
      $set: { role: "admin" }
    },
    { new: true }
  );

  if (!user) {
    console.log("User not found");
  } else {
    console.log("ADMIN CREATED:", user.email, user.username, user.role);
  }

  await mongoose.disconnect();
})();
