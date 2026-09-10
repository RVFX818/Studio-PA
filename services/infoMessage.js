const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const {
  dataDirectory: DATA_DIRECTORY,
  getDataFile,
} = require("../utils/runtimeData");

const DATA_FILE =
  getDataFile("infoMessage.json");

const THUMBNAIL_PATH =
  path.join(
    __dirname,
    "..",
    "assets",
    "RVFXStudioThumbnail_00000.jpg"
  );

const THUMBNAIL_NAME =
  "RVFXStudioThumbnail_00000.jpg";

function ensureStore() {
  if (!fs.existsSync(DATA_DIRECTORY)) {
    fs.mkdirSync(
      DATA_DIRECTORY,
      {
        recursive: true,
      }
    );
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          messageId: null,
        },
        null,
        2
      )
    );
  }
}

function readStore() {
  ensureStore();

  try {
    return JSON.parse(
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      )
    );
  } catch (error) {
    console.error(
      "Failed to read info message data:",
      error
    );

    return {
      messageId: null,
    };
  }
}

function writeStore(data) {
  ensureStore();

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      data,
      null,
      2
    )
  );
}

async function findInfoMessage(
  channel,
  botUserId
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
          message.author?.id ===
            botUserId &&
          message.embeds?.[0]?.title ===
            "📌｜INFO"
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

function buildInfoEmbeds(serverName) {
  const headerEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setTitle(
        "📌｜INFO"
      )
      .setThumbnail(
        `attachment://${THUMBNAIL_NAME}`
      )
      .setDescription(
        "Quick links and information about Renaissance VFX, RVFX Studio, and this community."
      );

  const infoEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setDescription(
        [
          `💬 **${serverName} Discord**`,
          "This server brings together the Renaissance VFX professional team and the RVFX Studio community. It’s a place to follow updates, connect with creatives, join discussions, and get involved with casting, opportunities, and community projects.",
          "",
          "🎥 **Renaissance VFX**",
          "Renaissance VFX is our cinematic production and visual effects studio, focused on trailers, launch films, VFX, and ambitious branded content.",
          "**[renaissancevfx.com](https://www.renaissancevfx.com)**",
          "",
          "🎬 **RVFX Studio**",
          "RVFX Studio is our community and talent side, where we share casting calls, creative opportunities, auditions, and ways to get involved with upcoming projects.",
          "**[rvfxstudio.com](https://www.rvfxstudio.com)**",
          "",
          "🌐 **Official Links**",
          "[Main YouTube - Renaissance VFX](https://youtube.com/@renaissancevfx)",
          "[Second YouTube - RVFX Studio](https://www.youtube.com/@RVFXStudio)",
          "[Twitch](https://www.twitch.tv/rvfxstudio)",
          "[Instagram](https://www.instagram.com/renaissancevfx/)",
          "[TikTok](https://www.tiktok.com/@renaissance.vfx)",
          "",
          "⭐ **Support RVFX**",
          "Join us on **[Patreon](https://patreon.com/RenaissanceVFX)** for supporter access, exclusive content, and community perks.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA • Renaissance VFX",
      });

  return [
    headerEmbed,
    infoEmbed,
  ];
}

async function syncInfoMessage(client) {
  try {
    const channelId =
      process.env.INFO_CHANNEL_ID;

    if (!channelId) {
      throw new Error(
        "INFO_CHANNEL_ID is missing from .env"
      );
    }

    if (!fs.existsSync(THUMBNAIL_PATH)) {
      throw new Error(
        `Info thumbnail not found: ${THUMBNAIL_PATH}`
      );
    }

    const channel =
      await client.channels.fetch(
        channelId
      );

    if (
      !channel ||
      !channel.isTextBased()
    ) {
      throw new Error(
        "The configured info channel could not be found."
      );
    }

    const serverName =
      channel.guild?.name ||
      "RVFX";

    const embeds =
      buildInfoEmbeds(serverName);

    const files = [
      {
        attachment:
          THUMBNAIL_PATH,
        name:
          THUMBNAIL_NAME,
      },
    ];

    const store =
      readStore();

    if (store.messageId) {
      try {
        const existingMessage =
          await channel.messages.fetch(
            store.messageId
          );

        await existingMessage.edit({
          embeds,
          files,
          attachments: [],
        });

        console.log(
          "Info message updated."
        );

        return {
          message:
            existingMessage,
          created:
            false,
        };
      } catch (error) {
        console.log(
          "Saved info message not found. Looking for existing managed message."
        );
      }
    }

    const recoveredMessage =
      await findInfoMessage(
        channel,
        client.user.id
      );

    if (recoveredMessage) {
      await recoveredMessage.edit({
        embeds,
        files,
        attachments: [],
      });

      writeStore({
        messageId:
          recoveredMessage.id,
      });

      console.log(
        `Info message recovered and updated: ${recoveredMessage.id}`
      );

      return {
        message:
          recoveredMessage,
        created:
          false,
      };
    }

    const newMessage =
      await channel.send({
        embeds,
        files,
      });

    writeStore({
      messageId:
        newMessage.id,
    });

    console.log(
      `Info message created: ${newMessage.id}`
    );

    return {
      message:
        newMessage,
      created:
        true,
    };
  } catch (error) {
    console.error(
      "Info message sync failed:",
      error
    );

    throw error;
  }
}

module.exports = {
  buildInfoEmbeds,
  syncInfoMessage,
};

