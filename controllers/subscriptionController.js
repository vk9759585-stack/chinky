const Subscription =
require("../models/Subscription");

exports.createSubscription =
async (req, res) => {

    try {

        const subscription =
            await Subscription.create({

                user: req.user.id,

                plan: req.body.plan,

                price: req.body.price,

                expiryDate:
                    req.body.expiryDate

            });

        res.status(201).json({

            success: true,

            data: subscription

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

exports.getSubscription =
async (req, res) => {

    try {

        const subscription =
            await Subscription.findOne({

                user: req.user.id

            });

        res.json({

            success: true,

            data: subscription

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};