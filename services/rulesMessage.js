const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const {
  dataDirectory: DATA_DIRECTORY,
  getDataFile,
} = require("../utils/runtimeData");

const DATA_FILE =
  getDataFile("rulesMessage.json");

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
      "Failed to read rules message data:",
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

async function findRulesMessage(
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
            "✅｜RULES"
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

function buildRulesEmbeds() {
  const headerEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setTitle(
        "✅｜RULES"
      )
      .setThumbnail(
        `attachment://${THUMBNAIL_NAME}`
      )
      .setDescription(
        "Please carefully review the community rules and safety guidelines below before participating in the server."
      );

  const rulesEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setTitle(
        "🧭 Community Rules"
      )
      .setDescription(
        [
          "These guidelines help keep the community safe, respectful, and enjoyable for everyone.",
          "By participating in this server, you agree to use good judgment when communicating, posting, sharing links, or uploading files.",
          "",
          "😃 **1. Be cool, kind, and respectful to one another.**",
          "",
          "📇 **2. Keep your Discord profile appropriate.**",
          "",
          "🚫 **3. Do not spam.**",
          "",
          "🔔 **4. Do not @mention or directly message staff unless necessary or invited to do so.**",
          "",
          "📣 **5. No self-promotion or advertisements.**",
          "",
          "🛡️ **6. Do not share personal information.**",
          "",
          "🤬 **7. No hate speech, harassment, threats, or harmful language.**",
          "",
          "🏛️ **8. No political or religious discussions.**",
          "",
          "🚨 **9. No piracy, sexual content, NSFW content, malware, scams, or otherwise suspicious material.**",
          "",
          "🤔 **10. Rules are subject to common sense and moderator discretion.**",
        ].join("\n")
      );

  const safetyEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setTitle(
        "‼️ File & Link Safety"
      )
      .setDescription(
        [
          "Members may share artwork, files, links, and other creative materials.",
          "For your safety, **do not download files from users you do not know or trust**.",
          "",
          "Use caution with unexpected downloads, shortened links, executables, archives, scripts, or anything that appears suspicious.",
          "You are responsible for your own device security and online safety.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA • Renaissance VFX",
      });

  return [
    headerEmbed,
    rulesEmbed,
    safetyEmbed,
  ];
}

async function syncRulesMessage(client) {
  try {
    const channelId =
      process.env.RULES_CHANNEL_ID;

    if (!channelId) {
      throw new Error(
        "RULES_CHANNEL_ID is missing from .env"
      );
    }

    if (!fs.existsSync(THUMBNAIL_PATH)) {
      throw new Error(
        `Rules thumbnail not found: ${THUMBNAIL_PATH}`
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
        "The configured rules channel could not be found."
      );
    }

    const embeds =
      buildRulesEmbeds();

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
          "Rules message updated."
        );

        return {
          message:
            existingMessage,
          created:
            false,
        };
      } catch (error) {
        console.log(
          "Saved rules message not found. Looking for existing managed message."
        );
      }
    }

    const recoveredMessage =
      await findRulesMessage(
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
        `Rules message recovered and updated: ${recoveredMessage.id}`
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
      `Rules message created: ${newMessage.id}`
    );

    return {
      message:
        newMessage,
      created:
        true,
    };
  } catch (error) {
    console.error(
      "Rules message sync failed:",
      error
    );

    throw error;
  }
}

module.exports = {
  buildRulesEmbeds,
  syncRulesMessage,
};




