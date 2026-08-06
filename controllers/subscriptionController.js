const Subscription = require("../models/Subscription");

// ======================================
// CREATE SUBSCRIPTION
// ======================================

exports.createSubscription = async (req, res) => {
    try {
        const {
            plan,
            price,
            expiryDate
        } = req.body;

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: "Subscription plan is required"
            });
        }

        const existingSubscription =
            await Subscription.findOne({
                user: req.user.id
            });

        if (existingSubscription) {
            existingSubscription.plan = plan;
            existingSubscription.price = price;
            existingSubscription.expiryDate = expiryDate;

            await existingSubscription.save();

            return res.json({
                success: true,
                message: "Subscription updated successfully",
                data: existingSubscription
            });
        }

        const subscription =
            await Subscription.create({
                user: req.user.id,
                plan,
                price,
                expiryDate
            });

        return res.status(201).json({
            success: true,
            message: "Subscription created successfully",
            data: subscription
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// GET SUBSCRIPTION
// ======================================

exports.getSubscription = async (req, res) => {
    try {
        const subscription =
            await Subscription.findOne({
                user: req.user.id
            });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found"
            });
        }

        return res.json({
            success: true,
            data: subscription
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// CANCEL SUBSCRIPTION
// ======================================

exports.cancelSubscription = async (req, res) => {
    try {
        await Subscription.findOneAndDelete({
            user: req.user.id
        });

        return res.json({
            success: true,
            message: "Subscription cancelled successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};