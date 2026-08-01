const Post = require("../models/Post");

// =========================
// CREATE POST
// =========================

exports.createPost = async (req, res) => {

    try {

        const post = await Post.create({

            user: req.user.id,

            image: req.file.filename,

            caption: req.body.caption

        });

        res.status(201).json(post);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

// =========================
// GET FEED
// =========================

exports.getFeed = async (req, res) => {

    try {

        const posts = await Post.find()

            .populate(
                "user",
                "name username profileImage verified"
            )

            .sort({

                createdAt: -1

            });

        res.json(posts);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

// =========================
// DELETE POST
// =========================

exports.deletePost = async (req, res) => {

    try {

        const post = await Post.findById(

            req.params.id

        );

        if (!post) {

            return res.status(404).json({

                message: "Post not found"

            });

        }

        if (

            post.user.toString() !==

            req.user.id

        ) {

            return res.status(401).json({

                message: "Unauthorized"

            });

        }

        await Post.findByIdAndDelete(

            req.params.id

        );

        res.json({

            success: true

        });

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};