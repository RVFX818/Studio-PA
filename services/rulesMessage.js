const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const DATA_DIRECTORY =
  path.join(__dirname, "..", "data");

const DATA_FILE =
  path.join(
    DATA_DIRECTORY,
    "rulesMessage.json"
  );

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

function buildRulesEmbeds() {
  const introEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F4DC} Server Rules & Guidelines"
      )
      .setThumbnail(
        `attachment://${THUMBNAIL_NAME}`
      )
      .setDescription(
        [
          "**Welcome!** Please take a moment to read the rules below.",
          "",
          "These guidelines help keep the community safe, respectful, and enjoyable for everyone.",
          "",
          "By participating in this server, you agree to use good judgment when communicating, posting, sharing links, or uploading files.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const rulesEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{1F9ED} Community Rules"
      )
      .setDescription(
        [
          "\u{1F603} **1. Be cool, kind, and respectful to one another.**",
          "",
          "\u{1F4C7} **2. Keep your Discord profile appropriate.**",
          "",
          "\u{2709}\u{FE0F} **3. Do not spam.**",
          "",
          "\u{1F514} **4. Do not @mention or directly message staff unless necessary or invited to do so.**",
          "",
          "\u{1F4E3} **5. No self-promotion or advertisements.**",
          "",
          "\u{1F6E1}\u{FE0F} **6. Do not share personal information.**",
          "",
          "\u{1F92C} **7. No hate speech, harassment, threats, or harmful language.**",
          "",
          "\u{1F3DB}\u{FE0F} **8. No political or religious discussions.**",
          "",
          "\u{1F6A8} **9. No piracy, sexual content, NSFW content, malware, scams, or otherwise suspicious material.**",
          "",
          "\u{1F914} **10. Rules are subject to common sense and moderator discretion.**",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const safetyEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{203C}\u{FE0F} File & Link Safety Notice"
      )
      .setDescription(
        [
          "This is a community server where members may share artwork, files, links, and other creative materials.",
          "",
          "For your safety, **do not download files from users you do not know or trust**.",
          "",
          "The server team cannot guarantee that every file or link shared by members is safe.",
          "",
          "Be cautious with unexpected downloads, shortened links, executables, archives, scripts, or anything that appears suspicious.",
          "",
          "By participating in this server, you are responsible for your own device security and online safety.",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  const discordEmbed =
    new EmbedBuilder()
      .setTitle(
        "\u{2705} Discord Terms & Age Requirement"
      )
      .setDescription(
        [
          "Participation in this server requires compliance with Discord's **Terms of Service** and **Community Guidelines**.",
          "",
          "By using Discord, you must also meet the minimum age of digital consent required in your country.",
          "",
          "**[Discord Terms of Service](https://discord.com/terms)**",
          "",
          "**[Discord Community Guidelines](https://discord.com/guidelines)**",
        ].join("\n")
      )
      .setFooter({
        text:
          "Studio PA \u{2022} Renaissance VFX",
      });

  return [
    introEmbed,
    rulesEmbed,
    safetyEmbed,
    discordEmbed,
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
          "Saved rules message not found. Creating a new one."
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
