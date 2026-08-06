const Vibes = require("../models/Vibes");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// ======================================
// GET VIBES
// ======================================

exports.getVibes = async (req, res) => {
    try {
        const vibes = await Vibes.find({
            expiresAt: {
                $gt: new Date()
            }
        })
            .populate(
                "user",
                "name username profileImage verified isPrivate followers"
            )
            .sort({
                createdAt: -1
            });

        const visibleVibes = vibes.filter((vibe) => {
            const owner = vibe.user;

            if (!owner) {
                return false;
            }

            return (
                !owner.isPrivate ||
                owner._id.toString() === req.user.id ||
                owner.followers.some(
                    (id) => id.toString() === req.user.id
                )
            );
        });

        return res.json({
            success: true,
            data: visibleVibes
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// CREATE VIBES
// ======================================

exports.createVibes = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vibes media is required"
            });
        }

        const isVideo = req.file.mimetype.startsWith(
            "video/"
        );

        let mediaUrl;

        try {
            const upload = await cloudinary.uploader.upload(
                req.file.path,
                {
                    resource_type: isVideo
                        ? "video"
                        : "image",
                    folder: "chinky/vibes"
                }
            );

            mediaUrl = upload.secure_url;

            await fs.promises.unlink(
                req.file.path
            ).catch(() => {});

        } catch (error) {

            mediaUrl =
                `${req.protocol}://${req.get(
                    "host"
                )}/uploads/${req.file.filename}`;
        }

        const vibe = await Vibes.create({
            user: req.user.id,
            media: mediaUrl,
            isVideo,
            caption: req.body.caption || ""
        });

        return res.status(201).json({
            success: true,
            data: vibe
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// DELETE VIBES
// ======================================

exports.deleteVibes = async (req, res) => {
    try {
        const vibe = await Vibes.findById(
            req.params.id
        );

        if (!vibe) {
            return res.status(404).json({
                success: false,
                message: "Vibes not found"
            });
        }

        if (
            vibe.user.toString() !== req.user.id
        ) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        await Vibes.findByIdAndDelete(
            req.params.id
        );

        return res.json({
            success: true,
            message: "Vibes deleted successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
