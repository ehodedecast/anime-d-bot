const checkAnime =
  require('../utils/checkAnime');

const OWNER_ID =
  process.env.OWNER_ID;
  if (OWNER_ID) {

  console.log(
    '✅ OWNER_ID confirmed'
  );

} else {

  console.log(
    '❌ OWNER_ID missing'
  );
}

async function forcecheck(
  
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
try {

  await message.delete();

} catch {

  console.log(
    '⚠️ Could not delete forcecheck message'
  );
}
  await message.author.send(
  '🔄 Running forced check...'
);

  try {

    await checkAnime(client);

    return message.author.send(
      '✅ Forced check completed.'
    );

  } catch (err) {

    console.log(err);

    return message.author.send(
      '❌ Error during forced check.'
    );
  }
}

module.exports = forcecheck;