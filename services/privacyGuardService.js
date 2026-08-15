const User = require('../models/User');
const FamilyPairing = require('../models/FamilyPairing');

async function canInteract(ownerId, actorId, settingName) {
  const owner = String(ownerId || '');
  const actor = String(actorId || '');
  if (!owner || !actor) return false;
  if (owner === actor) return true;

  const user = await User.findById(owner)
    .select(`followers privacySettings.${settingName}`)
    .lean();
  if (!user) return false;
  const setting = user.privacySettings?.[settingName] || 'everyone';
  if (setting === 'no_one') return false;
  if (setting === 'friends') {
    return (user.followers || []).some((id) => String(id) === actor);
  }
  return true;
}

async function canDirectMessage(receiverId, senderId) {
  const receiver = String(receiverId || '');
  const sender = String(senderId || '');
  if (!receiver || !sender) return false;
  if (receiver === sender) return true;

  const family = await FamilyPairing.findOne({
    teen: receiver,
    status: 'active',
  })
    .select('parent controls.allowDirectMessages')
    .lean();
  if (
    family?.controls?.allowDirectMessages === false &&
    String(family.parent) !== sender
  ) {
    return false;
  }
  return canInteract(receiver, sender, 'directMessages');
}

async function isCommentFiltered(ownerId, text) {
  const user = await User.findById(ownerId)
    .select('privacySettings.filterUnwantedComments privacySettings.commentKeywords')
    .lean();
  if (!user || user.privacySettings?.filterUnwantedComments === false) return false;
  const content = String(text || '').trim().toLowerCase();
  return (user.privacySettings?.commentKeywords || []).some((keyword) => {
    const value = String(keyword || '').trim().toLowerCase();
    return value && content.includes(value);
  });
}

module.exports = { canInteract, canDirectMessage, isCommentFiltered };
