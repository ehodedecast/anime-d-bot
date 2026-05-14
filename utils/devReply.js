async function devReply(

  message,

  content

) {

  try {

    await message.author.send(
      content
    );

  } catch (err) {

    console.log(

      'Failed to send dev DM'
    );

    return message.reply(
      content
    );
  }
}

module.exports =
  devReply;