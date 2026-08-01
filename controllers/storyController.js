exports.uploadStory = async (req, res) => {

    try {

        const story = await Story.create({

            user: req.user.id,

            media: req.file.filename,

            isVideo: false

        });

        res.status(201).json(story);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};