require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
} = require("discord.js");

const {
  validateCoreConfig,
} = require("./config/studioConfig");

const ready =
  require("./events/ready");

const interactionCreate =
  require("./events/interactionCreate");

const guildMemberAdd =
  require("./events/guildMemberAdd");

const guildMemberUpdate =
  require("./events/guildMemberUpdate");

const guildMemberRemove =
  require("./events/guildMemberRemove");

const messageCreate =
  require("./events/messageCreate");

const autoModerationActionExecution =
  require("./events/autoModerationActionExecution");

const {
  startYouTubeAlerts,
} = require("./services/youtubeAlerts");

const {
  syncInfoMessage,
} = require("./services/infoMessage");

const {
  syncRulesMessage,
} = require("./services/rulesMessage");

const {
  syncFaqMessage,
} = require("./services/faqMessage");

validateCoreConfig();

const client =
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.AutoModerationExecution,
    ],
  });

client.once(
  Events.ClientReady,
  async (readyClient) => {
    await ready.execute(
      readyClient
    );

    try {
      await syncInfoMessage(
        readyClient
      );
    } catch (error) {
      console.error(
        "Startup info sync failed:",
        error
      );
    }

    try {
      await syncRulesMessage(
        readyClient
      );
    } catch (error) {
      console.error(
        "Startup rules sync failed:",
        error
      );
    }

    try {
      await syncFaqMessage(
        readyClient
      );
    } catch (error) {
      console.error(
        "Startup FAQ sync failed:",
        error
      );
    }

    startYouTubeAlerts(
      readyClient
    );
  }
);

client.on(
  Events.InteractionCreate,
  interactionCreate.execute
);

client.on(
  Events.GuildMemberAdd,
  guildMemberAdd.execute
);

client.on(
  Events.GuildMemberUpdate,
  guildMemberUpdate.execute
);

client.on(
  Events.GuildMemberRemove,
  guildMemberRemove.execute
);

client.on(
  Events.MessageCreate,
  messageCreate.execute
);

client.on(
  Events.AutoModerationActionExecution,
  autoModerationActionExecution.execute
);

client.login(
  process.env.DISCORD_TOKEN
);
