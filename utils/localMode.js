const DEFAULT_LOCAL_TEST_GUILD_ID =
  '1502263697337221230';

const DEFAULT_LOCAL_TEST_CHANNEL_ID =
  '1509569297289314345';

function isLocalTestMode() {

  return (
    process.env.LOCAL_TEST_MODE === 'true' ||
    process.env.LOCAL_TEST_MODE === '1'
  );
}

function getLocalTestGuildId() {

  return (
    process.env.LOCAL_TEST_GUILD_ID ||
    DEFAULT_LOCAL_TEST_GUILD_ID
  );
}

function getLocalTestChannelId() {

  return (
    process.env.LOCAL_TEST_CHANNEL_ID ||
    DEFAULT_LOCAL_TEST_CHANNEL_ID
  );
}

function getProductionIgnoredChannelIds() {

  const value =
    process.env.PRODUCTION_IGNORED_CHANNEL_IDS ||
    DEFAULT_LOCAL_TEST_CHANNEL_ID;

  return value
    .split(',')
    .map(channelId => channelId.trim())
    .filter(Boolean);
}

function getContextGuildId(context) {

  return context.guild?.id || null;
}

function getContextChannelId(context) {

  return (
    context.channelId ||
    context.channel?.id ||
    null
  );
}

function shouldIgnoreForLocalTest(context) {

  if (
    !context.guild
  ) {
    return false;
  }

  const channelId =
    getContextChannelId(context);

  if (!isLocalTestMode()) {

    return getProductionIgnoredChannelIds()
      .includes(channelId);
  }

  const testGuildId =
    getLocalTestGuildId();

  const testChannelId =
    getLocalTestChannelId();

  const guildId =
    getContextGuildId(context);

  if (
    testGuildId &&
    guildId !== testGuildId
  ) {
    return true;
  }

  if (
    testChannelId &&
    channelId !== testChannelId
  ) {
    return true;
  }

  return false;
}

function getEffectiveChannelId(guildConfig) {

  if (
    isLocalTestMode() &&
    getLocalTestChannelId()
  ) {
    return getLocalTestChannelId();
  }

  return guildConfig?.channelId || null;
}

module.exports = {
  isLocalTestMode,
  shouldIgnoreForLocalTest,
  getEffectiveChannelId
};
