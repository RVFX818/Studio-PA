const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const {
  dataDirectory: DATA_DIRECTORY,
  getDataFile,
} = require("../utils/runtimeData");

const DATA_FILE =
  getDataFile("faqMessage.json");

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
      "Failed to read FAQ message data:",
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

function channelMention(channelId) {
  return channelId
    ? `<#${channelId}>`
    : "Channel unavailable";
}

async function findFaqMessage(
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
            "❓｜FAQ"
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

function buildFaqEmbeds() {
  const generalChat =
    channelMention(
      process.env.GENERAL_CHAT_CHANNEL_ID
    );

  const offTopicChat =
    channelMention(
      process.env.OFF_TOPIC_CHAT_CHANNEL_ID
    );

  const artShowcase =
    channelMention(
      process.env.ART_SHOWCASE_CHANNEL_ID
    );

  const announcements =
    channelMention(
      process.env.ANNOUNCEMENTS_CHANNEL_ID
    );

  const creatorRoom =
    channelMention(
      process.env.CREATOR_ROOM_CHANNEL_ID
    );

  const memeGallery =
    channelMention(
      process.env.MEME_GALLERY_CHANNEL_ID
    );

  const hallOfFame =
    channelMention(
      process.env.HALL_OF_FAME_CHANNEL_ID
    );

  const suggestionBox =
    channelMention(
      process.env.SUGGESTION_BOX_CHANNEL_ID
    );

  const stage =
    channelMention(
      process.env.STAGE_CHANNEL_ID
    );

  const chronicle =
    channelMention(
      process.env.CHRONICLE_CHANNEL_ID
    );

  const headerEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setTitle(
        "❓｜FAQ"
      )
      .setThumbnail(
        `attachment://${THUMBNAIL_NAME}`
      )
      .setDescription(
        "Quick answers and helpful links for navigating the RVFX community."
      );

  const communityEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setTitle(
        "💬 Community & Channels"
      )
      .setDescription(
        [
          "**RVFX and project discussion**",
          generalChat,
          "",
          "**Casual chat and general questions**",
          offTopicChat,
          "",
          "**Memes and community humor**",
          memeGallery,
          "",
          "**Community highlights and memorable moments**",
          hallOfFame,
          "",
          "**Ideas, feedback, and suggestions**",
          suggestionBox,
          "",
          "🖼️ **Where do I share my art or personal projects?**",
          "Share finished artwork, videos, edits, writing, 3D work, builds, and other personal creative work here:",
          artShowcase,
          "Work-in-progress posts are not permitted in this channel and may be removed. Please share only finished art pieces or completed creative work that you're excited to show.",
          "",
          "📖 **Where can I find community updates and records?**",
          "Meeting notes, vote results, community records, and other ongoing updates:",
          chronicle,
        ].join("\n")
      );

  const productionEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setTitle(
        "🎬 Productions"
      )
      .setDescription(
        [
          "🎥 **How can I contribute to a production?**",
          "RVFX Studio opportunities may include acting, voice work, VFX, animation, 3D art, editing, writing, and other creative or production support.",
          "",
          "Open roles are posted on **[RVFX Studio](https://www.rvfxstudio.com/)** and announced here:",
          announcements,
          "",
          "If a role matches your skills or interests, follow the application instructions on the opportunity page.",
        ].join("\n")
      );

  const supporterEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setTitle(
        "⭐ Supporters"
      )
      .setDescription(
        [
          "⭐ **How do I get supporter access?**",
          "Supporter access is connected to our **[Patreon](https://patreon.com/RenaissanceVFX)**.",
          "Already a patron? Connect your Discord account through Patreon to receive your supporter role and access automatically.",
          "",
          "🎨 **What does becoming a supporter get me in this server?**",
          "Supporters receive additional community perks, including:",
          "",
          "• Supporter roles and exclusive role colors",
          "",
          "• Access to the **Creator Room** where you can vote, share feedback, and help shape future projects:",
          creatorRoom,
          "",
          "• Access to community events and conversations with members of the Renaissance VFX professional team:",
          stage,
        ].join("\n")
      );

  const discordEmbed =
    new EmbedBuilder()
      .setColor(0xB71C1C)
      .setTitle(
        "✅ Discord Guidelines"
      )
      .setDescription(
        [
          "Use of this server is also subject to Discord's Terms of Service and Community Guidelines.",
          "",
          "**[Discord Terms of Service](https://discord.com/terms)**",
          "**[Discord Community Guidelines](https://discord.com/guidelines)**",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA • Renaissance VFX",
      });

  return [
    headerEmbed,
    communityEmbed,
    productionEmbed,
    supporterEmbed,
    discordEmbed,
  ];
}

async function syncFaqMessage(client) {
  try {
    const channelId =
      process.env.FAQ_CHANNEL_ID;

    if (!channelId) {
      throw new Error(
        "FAQ_CHANNEL_ID is missing from .env"
      );
    }

    if (!fs.existsSync(THUMBNAIL_PATH)) {
      throw new Error(
        `FAQ thumbnail not found: ${THUMBNAIL_PATH}`
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
        "The configured FAQ channel could not be found."
      );
    }

    const embeds =
      buildFaqEmbeds();

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
          "FAQ message updated."
        );

        return {
          message:
            existingMessage,
          created:
            false,
        };
      } catch (error) {
        console.log(
          "Saved FAQ message not found. Looking for existing managed message."
        );
      }
    }

    const recoveredMessage =
      await findFaqMessage(
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
        `FAQ message recovered and updated: ${recoveredMessage.id}`
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
      `FAQ message created: ${newMessage.id}`
    );

    return {
      message:
        newMessage,
      created:
        true,
    };
  } catch (error) {
    console.error(
      "FAQ message sync failed:",
      error
    );

    throw error;
  }
}

module.exports = {
  buildFaqEmbeds,
  syncFaqMessage,
};
