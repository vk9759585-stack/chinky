const ScheduledLive = require("../models/ScheduledLive");
const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendNotification } = require("./notificationService");

let timer = null;
async function tick() {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 15 * 60 * 1000);
    const rows = await ScheduledLive.find({ status:"scheduled", reminderSent:false, scheduledFor:{ $gt:now, $lte:soon } }).limit(20);
    for (const live of rows) {
      const follows = await Follow.find({ following: live.host }).select("follower").lean();
      const ids = follows.map(x=>x.follower);
      if (ids.length) {
        await Notification.insertMany(ids.map(receiver=>({ sender:live.host, receiver, type:"live", title:"Live starting soon", body:`${live.title} starts in about 15 minutes`, link:`/live/scheduled/${live._id}` })), { ordered:false }).catch(()=>{});
        const users = await User.find({ _id:{ $in:ids } }).select("+fcmTokens appSettings").lean();
        for (const user of users) {
          const settings = user.appSettings || {};
          if (settings.settings_notifications === false ||
              settings.settings_quiet_mode === true ||
              settings.settings_notify_live === false) continue;
          const body = settings.settings_notify_preview === false
            ? "Open CHINKY to view this notification."
            : `${live.title} starts in about 15 minutes`;
          await sendNotification(user.fcmTokens || [], "Live starting soon", body, {
            type:"scheduled_live",
            scheduleId:String(live._id),
          }, { sound: settings.settings_notify_sound !== false });
        }
      }
      live.reminderSent = true;
      await live.save();
    }
  } catch (e) { console.warn("Scheduled live reminder skipped:", e.message); }
}
function startScheduledLiveReminders(){ if(timer)return; timer=setInterval(tick,60*1000); timer.unref?.(); setTimeout(tick,5000).unref?.(); }
module.exports={startScheduledLiveReminders};
