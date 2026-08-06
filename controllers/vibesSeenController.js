const Vibes = require("../models/Vibes");

// ======================================
// MARK VIBES AS SEEN
// ======================================

exports.vibesSeen = async (req, res) => {
    try {
        const vibe = await Vibes.findById(req.params.id);

        if (!vibe) {
            return res.status(404).json({
                success: false,
                message: "Vibes not found"
            });
        }

        const userId = req.user.id;

        const alreadySeen = vibe.views.some(
            (view) => view.toString() === userId
        );

        if (!alreadySeen) {
            vibe.views.push(userId);
            await vibe.save();
        }

        return res.json({
            success: true,
            totalViews: vibe.views.length
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};