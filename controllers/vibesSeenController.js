const Vibes = require("../models/Vibes");

// ======================================
// MARK VIBES AS SEEN
// ======================================

exports.vibesSeen = async (req, res) => {
    try {
        const userId = req.user.id;
        const counted = await Vibes.findOneAndUpdate(
            { _id: req.params.id, views: { $ne: userId } },
            { $addToSet: { views: userId } },
            { new: true }
        ).select("views");

        if (counted) {
            return res.json({
                success: true,
                totalViews: counted.views.length,
                counted: true
            });
        }

        const existing = await Vibes.findById(req.params.id).select("views");
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Vibes not found"
            });
        }

        return res.json({
            success: true,
            totalViews: existing.views.length,
            counted: false
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.getViewers = async (req, res) => {
    try {
        const vibe = await Vibes.findOne({ _id: req.params.id, user: req.user.id })
            .populate('views', 'name username profileImage verified')
            .select('views');
        if (!vibe) return res.status(404).json({ success: false, message: 'Vibes not found.' });
        return res.json({
            success: true,
            count: vibe.views.length,
            data: vibe.views.map(user => ({
                id: String(user._id),
                name: user.name || '',
                username: user.username || '',
                profileImage: user.profileImage || '',
                verified: user.verified === true,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
