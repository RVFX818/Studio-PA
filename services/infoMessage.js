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

const DATA_FILE = getDataFile("infoMessage.json");

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

function buildInfoEmbeds() {
  const socialsEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F310} Socials"
      )
      .setThumbnail(
        `attachment://${THUMBNAIL_NAME}`
      )
      .setDescription(
        [
          "[**Official YouTube Channel**](https://youtube.com/@renaissancevfx)",
          "Official videos, trailers, and studio releases",
          "",
          "[**Second YouTube Channel**](https://www.youtube.com/@RVFXStudio)",
          "Extra content, behind-the-scenes videos, experiments, and bonus uploads",
          "",
          "[**Twitch**](https://www.twitch.tv/rvfxstudio)",
          "Live streams",
          "",
          "[**Instagram**](https://www.instagram.com/renaissancevfx/)",
          "Shorts, image posts, and quick updates",
          "",
          "[**TikTok**](https://www.tiktok.com/@renaissance.vfx)",
          "Short-form videos, clips, and studio content",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const supporterEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{2B50} Supporter Access"
      )
      .setDescription(
        [
          "Join us on **[Patreon](https://patreon.com/RenaissanceVFX)** to unlock exclusive supporter access.",
          "",
          "Already a patron? Join the Discord through Patreon so your account links correctly and your perks unlock automatically.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const rvfxStudioEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F3AC} RVFX Studio"
      )
      .setDescription(
        [
          "**Interested in joining a production?**",
          "",
          "Explore auditions, open roles, and official project opportunities through **RVFX Studio**.",
          "",
          "**[www.rvfxstudio.com](https://www.rvfxstudio.com)**",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const renaissanceVfxEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F3A5} Renaissance VFX"
      )
      .setDescription(
        [
          "Our official services website for cinematic production, VFX, trailers, advertisements, and client collaborations.",
          "",
          "**[www.renaissancevfx.com](https://www.renaissancevfx.com)**",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  return [
    socialsEmbed,
    supporterEmbed,
    rvfxStudioEmbed,
    renaissanceVfxEmbed,
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

    const embeds =
      buildInfoEmbeds();

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
          "Saved info message not found. Creating a new one."
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


