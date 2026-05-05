const add = require('./add');
const list = require('./list');
const next = require('./next');
const info = require('./info');

module.exports = async (message, animeList, waitingForAdd) => {

  if (waitingForAdd[message.author.id]) {
    return add(message, animeList, waitingForAdd, true);
  }

  if (message.content.startsWith('!add ')) {
    return add(message, animeList);
  }

  if (message.content === '!list') {
    return list(message, animeList);
  }

  if (message.content.startsWith('!next ')) {
    return next(message);
  }

  if (message.content.startsWith('!info ')) {
    return info(message);
  }
};