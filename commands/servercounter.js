const OWNER_ID =
  process.env.OWNER_ID;

async function servercounter(
  message,
  client
) {

  if (
    String(message.author.id) !==
    String(OWNER_ID)
  ) {

    return message.reply(
      '❌ You do not have permission.'
    );
  }

  const totalServers =
    client.guilds.cache.size;

  try {

  await message.delete();

} catch {}

return message.author.send(

  `🌍 AnimeDBot is currently active in ${totalServers} servers.`
);
}

module.exports =
  servercounter;