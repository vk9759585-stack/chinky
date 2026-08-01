const User = require("../models/User");

exports.getProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        res.json(user);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};