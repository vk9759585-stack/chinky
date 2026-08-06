const Spark = require("../models/Spark");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// ======================================
// CREATE SPARK
// ======================================

exports.createSpark = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Spark video is required"
            });
        }

        let videoUrl;

        try {
            const upload = await cloudinary.uploader.upload(
                req.file.path,
                {
                    resource_type: "video",
                    folder: "chinky/sparks"
                }
            );

            videoUrl = upload.secure_url;

            await fs.promises.unlink(req.file.path).catch(() => {});
        } catch (error) {
            videoUrl = `${req.protocol}://${req.get(
                "host"
            )}/uploads/${req.file.filename}`;
        }

        const spark = await Spark.create({
            user: req.user.id,
            caption: req.body.caption,
            video: videoUrl,
            thumbnail: req.body.thumbnail,
            music: req.body.music,
            filter: req.body.filter,
            duration: req.body.duration,
            hashtags: req.body.hashtags
        });

        return res.status(201).json({
            success: true,
            data: spark
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// GET SPARKS
// ======================================

exports.getSparks = async (req, res) => {
    try {
        const sparks = await Spark.find()
            .populate(
                "user",
                "username profileImage verified isPrivate followers"
            )
            .sort({
                createdAt: -1
            });

        const visibleSparks = sparks.filter((spark) => {
            const owner = spark.user;

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
            data: visibleSparks
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// LIKE SPARK
// ======================================

exports.likeSpark = async (req, res) => {
    try {
        const spark = await Spark.findById(req.params.id);

        if (!spark) {
            return res.status(404).json({
                success: false,
                message: "Spark not found"
            });
        }

        const userId = req.user.id;

        const index = spark.likes.findIndex(
            (id) => id.toString() === userId
        );

        if (index === -1) {
            spark.likes.push(userId);
        } else {
            spark.likes.splice(index, 1);
        }

        await spark.save();

        return res.json({
            success: true,
            likes: spark.likes.length
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// SAVE SPARK
// ======================================

exports.saveSpark = async (req, res) => {
    try {
        const spark = await Spark.findById(req.params.id);

        if (!spark) {
            return res.status(404).json({
                success: false,
                message: "Spark not found"
            });
        }

        const userId = req.user.id;

        const index = spark.saves.findIndex(
            (id) => id.toString() === userId
        );

        if (index === -1) {
            spark.saves.push(userId);
        } else {
            spark.saves.splice(index, 1);
        }

        await spark.save();

        return res.json({
            success: true,
            saves: spark.saves.length
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// ADD VIEW
// ======================================

exports.addView = async (req, res) => {
    try {
        const spark = await Spark.findById(req.params.id);

        if (!spark) {
            return res.status(404).json({
                success: false,
                message: "Spark not found"
            });
        }

        spark.views += 1;

        await spark.save();

        return res.json({
            success: true,
            views: spark.views
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// SHARE SPARK
// ======================================

exports.shareSpark = async (req, res) => {
    try {
        const spark = await Spark.findById(req.params.id);

        if (!spark) {
            return res.status(404).json({
                success: false,
                message: "Spark not found"
            });
        }

        spark.shares += 1;

        await spark.save();

        return res.json({
            success: true,
            shares: spark.shares
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};