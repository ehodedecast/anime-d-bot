module.exports = (message, animeList) => {
  if (animeList.length === 0) {
    return message.reply('📭 Nenhum anime.');
  }

  return message.reply(
    '📺 Lista:\n' + animeList.map(a => `• ${a}`).join('\n')
  );
};