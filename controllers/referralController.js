const Referral = require("../models/Referral");

exports.createReferral = async (
    req,
    res
) => {

    try {

        const referral =
            await Referral.create({

                referrer: req.user.id,

                referredUser:
                    req.body.userId

            });

        res.json({

            success: true,

            data: referral

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};