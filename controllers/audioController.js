const Audio = require("../models/Audio");
const Spark = require("../models/Spark");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const catalog = require("../data/audioCatalog");

const userId = (req) => (req.user?.id || req.user?._id || req.user?.userId || "").toString();

const absoluteUrl = (req, value) => {
  const url = String(value || "");
  if (!url.startsWith("/")) return url;
  return `${req.protocol}://${req.get("host")}${url}`;
};

const publicAudio = (req, audio, me) => ({
  ...audio,
  streamUrl: absoluteUrl(req, audio.streamUrl),
  saved: (audio.savedBy || []).some((id) => id.toString() === me),
  saves: (audio.savedBy || []).length,
  savedBy: undefined
});

let catalogSync = null;
const ensureCatalog = () => {
  if (catalogSync) return catalogSync;
  catalogSync = Audio.bulkWrite(
    catalog.map((item) => ({
      updateOne: {
        filter: { catalogKey: item.key },
        update: {
          $set: {
            title: item.title,
            artistName: "CHINKY Original",
            streamUrl: `/audio-library/${item.file}`,
            duration: item.duration,
            isOriginal: true,
            isCatalog: true,
            category: item.category,
            mood: item.mood,
            licenseLabel: "CHINKY Original • Royalty-free",
            licensePath: "/audio-library/LICENSE.md",
            reusable: true,
            blocked: false
          },
          $setOnInsert: { catalogKey: item.key, usageCount: 0, savedBy: [] }
        },
        upsert: true
      }
    })),
    { ordered: false }
  ).catch((error) => {
    catalogSync = null;
    throw error;
  });
  return catalogSync;
};

const audioFromSpark = async (spark) => {
  if (!spark) return null;
  if (spark.audio) {
    const existing = await Audio.findById(spark.audio);
    if (existing) return existing;
  }

  let streamUrl = "";
  if (spark.videoPublicId) {
    try {
      streamUrl = cloudinary.url(spark.videoPublicId, {
        resource_type: "video",
        secure: true,
        format: "mp3",
        transformation: [{ audio_codec: "mp3" }]
      });
    } catch (_) {}
  }
  if (!streamUrl) streamUrl = spark.video;

  const owner = await User.findById(spark.user).select("username name").lean();
  const audio = await Audio.create({
    owner: spark.user,
    sourceSpark: spark._id,
    title: spark.music && spark.music !== "Mute" ? spark.music : "Original audio",
    artistName: owner?.username || owner?.name || "Chinky creator",
    streamUrl,
    duration: Number(spark.duration) || 0,
    coverUrl: spark.thumbnail || "",
    isOriginal: true,
    category: "original",
    licenseLabel: "Creator original",
    reusable: true
  });
  spark.audio = audio._id;
  await spark.save();
  return audio;
};

exports.list = async (req, res) => {
  try {
    await ensureCatalog();
    const me = userId(req);
    const mode = String(req.query.mode || "trending");
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 60);
    const category = String(req.query.category || "").trim().toLowerCase();
    const filter = { reusable: true, blocked: false };
    if (mode === "saved") filter.savedBy = me;
    if (["music", "shorts", "shayari", "original"].includes(category)) filter.category = category;
    if (q) filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { artistName: { $regex: q, $options: "i" } },
      { mood: { $regex: q, $options: "i" } }
    ];
    const items = await Audio.find(filter)
      .populate("owner", "username name profileImage verified")
      .sort(mode === "trending" ? { usageCount: -1, createdAt: -1 } : { createdAt: -1 })
      .limit(limit)
      .lean();
    const data = items.map((audio) => publicAudio(req, audio, me));
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    await ensureCatalog();
    const me = userId(req);
    const audio = await Audio.findById(req.params.id)
      .populate("owner", "username name profileImage verified")
      .lean();
    if (!audio || audio.blocked || !audio.reusable) return res.status(404).json({ success: false, message: "Audio not available" });
    const data = publicAudio(req, audio, me);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.ensureFromSpark = async (req, res) => {
  try {
    const spark = await Spark.findById(req.params.sparkId);
    if (!spark) return res.status(404).json({ success: false, message: "Spark not found" });
    const audio = await audioFromSpark(spark);
    return res.json({ success: true, data: audio });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.setSaved = async (req, res) => {
  try {
    const me = userId(req);
    const audio = await Audio.findById(req.params.id);
    if (!audio || audio.blocked || !audio.reusable) return res.status(404).json({ success: false, message: "Audio not available" });
    const current = audio.savedBy.some((id) => id.toString() === me);
    const desired = typeof req.body?.saved === "boolean" ? req.body.saved : !current;
    if (desired) audio.savedBy.addToSet(me); else audio.savedBy.pull(me);
    await audio.save();
    return res.json({ success: true, saved: desired, saves: audio.savedBy.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordUse = async (req, res) => {
  try {
    const audio = await Audio.findOneAndUpdate(
      { _id: req.params.id, reusable: true, blocked: false },
      { $inc: { usageCount: 1 } },
      { new: true }
    );
    if (!audio) return res.status(404).json({ success: false, message: "Audio not available" });
    return res.json({ success: true, usageCount: audio.usageCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.audioFromSpark = audioFromSpark;
