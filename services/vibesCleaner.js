const Story = require("../models/Vibes");
const cron = require("node-cron");

// Run every 1 minute
cron.schedule("* * * * *", async () => {
  try {
    const result = await Story.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Deleted ${result.deletedCount} expired stories`);
    }
  } catch (error) {
    console.error("❌ Error deleting expired stories:", error.message);
  }
});