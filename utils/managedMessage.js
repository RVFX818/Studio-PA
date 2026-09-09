async function findManagedMessage(
  channel,
  botUserId,
  firstEmbedTitle
) {
  let before;

  for (let page = 0; page < 5; page++) {
    const options = {
      limit: 100,
    };

    if (before) {
      options.before = before;
    }

    const messages =
      await channel.messages.fetch(
        options
      );

    const match =
      messages.find(
        (message) =>
          message.author?.id === botUserId &&
          message.embeds?.[0]?.title ===
            firstEmbedTitle
      );

    if (match) {
      return match;
    }

    if (messages.size < 100) {
      break;
    }

    before =
      messages.last()?.id;

    if (!before) {
      break;
    }
  }

  return null;
}

module.exports = {
  findManagedMessage,
};
