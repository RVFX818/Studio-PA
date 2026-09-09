const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const {
  findManagedMessage,
} = require("../utils/managedMessage");

const {
  dataDirectory: DATA_DIRECTORY,
  getDataFile,
} = require("../utils/runtimeData");

const DATA_FILE = getDataFile("faqMessage.json");

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

function buildFaqEmbeds() {
  const introEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{2753} RVFX Studio FAQ"
      )
      .setThumbnail(
        `attachment://${THUMBNAIL_NAME}`
      )
      .setDescription(
        [
          "Welcome to the **RVFX Studio FAQ**.",
          "",
          "Below you'll find answers to common questions about the community, sharing your work, contacting the team, joining productions, and supporter access.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const studioEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F3AC} What is RVFX Studio?"
      )
      .setDescription(
        [
          "**RVFX Studio** is the community and creative side of **Renaissance VFX**.",
          "",
          "It's where we bring artists, performers, and creators together to collaborate on cinematic shorts, fan projects, trailers, VFX, animation, and behind-the-scenes content.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const chatEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F4AC} Where can I chat?"
      )
      .setDescription(
        [
          "Use **#general-chat** for conversations about Renaissance VFX, our projects, community updates, and related topics.",
          "",
          "Use **#off-topic-chat** for casual conversations that aren't directly related to RVFX or our projects.",
          "",
          "Please keep all community spaces respectful, friendly, and welcoming.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const artEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F5BC}\u{FE0F} Where do I share my art or personal projects?"
      )
      .setDescription(
        [
          "Share your finished creative work in **#art-showcase**.",
          "",
          "Finished artwork, videos, edits, writing, 3D work, builds, and other personal creative projects are welcome as long as they fit the channel and aren't overly promotional or spammy.",
          "",
          "**Work-in-progress (WIP)** posts should stay out of finished-work channels unless the channel specifically allows them.",
          "",
          "WIP posts may be removed or redirected to a more appropriate space.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const questionsEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F64B} Where do I ask the team questions?"
      )
      .setDescription(
        [
          "Please do not **@mention team members directly** for general questions.",
          "",
          "Instead, ask your question in **#off-topic**.",
          "",
          "A team member may respond when available, and if no one from the team is around, someone from the community may still be able to help.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const productionEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F3A5} How can I contribute to a production?"
      )
      .setDescription(
        [
          "There are several ways to contribute to an **RVFX Studio** production, including acting, voice work, VFX, animation, 3D art, editing, writing, and other creative or production support.",
          "",
          "Open roles and contribution opportunities are posted on **[RVFX Studio](https://www.rvfxstudio.com/)** and announced in **#announcements**.",
          "",
          "If a role matches your skills or interests, follow the application instructions on the opportunity page.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const supporterEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{2B50} How do I get supporter access?"
      )
      .setDescription(
        [
          "Supporter access is connected to our **[Patreon](https://patreon.com/RenaissanceVFX)**.",
          "",
          "Once you become a supporter, connect your Discord account to Patreon. Your supporter role and access to the appropriate channels should be granted automatically.",
          "",
          "If your access doesn't appear right away, make sure your Discord account is properly connected to your Patreon account.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  return [
    introEmbed,
    studioEmbed,
    chatEmbed,
    artEmbed,
    questionsEmbed,
    productionEmbed,
    supporterEmbed,
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
          "Saved FAQ message not found. Creating a new one."
        );
      }
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


