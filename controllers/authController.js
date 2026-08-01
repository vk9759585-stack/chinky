const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// ==========================
// REGISTER
// ==========================

exports.register = async (req, res) => {

    try {

        const {
            name,
            username,
            email,
            phone,
            password
        } = req.body;

        const exist = await User.findOne({
            $or: [
                { email },
                { username },
                { phone }
            ]
        });

        if (exist) {

            return res.status(400).json({
                message: "User already exists"
            });

        }

        const hash = await bcrypt.hash(password, 10);

        const user = await User.create({

            name,

            username,

            email,

            phone,

            password: hash

        });

        res.status(201).json({

            success: true,

            user

        });

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

// ==========================
// LOGIN
// ==========================

exports.login = async (req, res) => {

    try {

        const {
            login,
            password
        } = req.body;

        const user = await User.findOne({

            $or: [

                { email: login },

                { username: login },

                { phone: login }

            ]

        });

        if (!user) {

            return res.status(400).json({

                message: "User not found"

            });

        }

        const match = await bcrypt.compare(

            password,

            user.password

        );

        if (!match) {

            return res.status(400).json({

                message: "Wrong password"

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

        res.json({

            success: true,

            token,

            user

        });

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};