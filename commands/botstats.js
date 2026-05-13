const os = require('os');

const OWNER_ID =
  process.env.OWNER_ID;

async function botstats(
  message,
  client
) {

  if (
    String(message.author.id) !==
    String(OWNER_ID)
  ) {

    return;
  }

  try {

    await message.delete();

  } catch {}

  const uptime =
    process.uptime();

  const days =
    Math.floor(
      uptime / 86400
    );

  const hours =
    Math.floor(
      uptime % 86400 / 3600
    );

  const minutes =
    Math.floor(
      uptime % 3600 / 60
    );

  const memoryUsage =
    (
      process.memoryUsage()
        .rss / 1024 / 1024
    ).toFixed(2);

  const servers =
    client.guilds.cache.size;

  const users =
    client.guilds.cache.reduce(

      (acc, guild) =>

        acc + guild.memberCount,

      0
    );

  const ping =
    client.ws.ping;

  return message.author.send(

`⚙️ AnimeDBot Stats

🌍 Servers: ${servers}
👥 Users: ${users}

📡 Ping: ${ping}ms
🧠 RAM Usage: ${memoryUsage} MB

⏳ Uptime:
${days}d ${hours}h ${minutes}m`
  );
}

module.exports = botstats;