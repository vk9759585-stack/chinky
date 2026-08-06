const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// =====================================
// REGISTER
// =====================================

exports.register = async (req, res) => {
    try {
        const {
            name,
            username,
            email,
            phone,
            password
        } = req.body;

        if (
            !name ||
            !username ||
            !email ||
            !phone ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email },
                { username },
                { phone }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const user = await User.create({
            name,
            username,
            email,
            phone,
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// =====================================
// LOGIN
// =====================================

exports.login = async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({
                success: false,
                message: "Login credentials are required"
            });
        }

        const user = await User.findOne({
            $or: [
                { email: login },
                { username: login },
                { phone: login }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.banned) {
            return res.status(403).json({
                success: false,
                message: "Your account has been banned."
            });
        }

        const matchedPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!matchedPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "30d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};