const Referral = require("../models/Referral");
const User = require("../models/User");

// =====================================
// CREATE REFERRAL
// =====================================

exports.createReferral = async (req, res) => {
    try {
        const referrerId = req.user.id;
        const referredUserId = req.body.userId;

        if (!referredUserId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        if (referrerId === referredUserId) {
            return res.status(400).json({
                success: false,
                message: "You cannot refer yourself"
            });
        }

        const user = await User.findById(referredUserId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const existingReferral = await Referral.findOne({
            referrer: referrerId,
            referredUser: referredUserId
        });

        if (existingReferral) {
            return res.status(400).json({
                success: false,
                message: "Referral already exists"
            });
        }

        const referral = await Referral.create({
            referrer: referrerId,
            referredUser: referredUserId,
            status: "pending",
            createdAt: new Date()
        });

        return res.status(201).json({
            success: true,
            message: "Referral created successfully",
            data: referral
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// GET MY REFERRALS
// =====================================

exports.getMyReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find({
            referrer: req.user.id
        })
            .populate(
                "referredUser",
                "name username profileImage"
            )
            .sort({
                createdAt: -1
            });

        return res.json({
            success: true,
            count: referrals.length,
            data: referrals
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};