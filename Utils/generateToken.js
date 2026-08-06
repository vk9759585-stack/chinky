const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  if (!id) {
    throw new Error("User ID is required to generate token");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  try {
    const token = jwt.sign(
      { id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "30d",
      }
    );

    return token;
  } catch (error) {
    console.error("JWT Generate Error:", error.message);
    throw new Error("Failed to generate token");
  }
};

module.exports = generateToken;