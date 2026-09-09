require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
} = require("discord.js");

const ready = require("./events/ready");
const interactionCreate = require("./events/interactionCreate");
const guildMemberAdd = require("./events/guildMemberAdd");
const guildMemberUpdate = require("./events/guildMemberUpdate");
const guildMemberRemove = require("./events/guildMemberRemove");
const messageCreate = require("./events/messageCreate");

const autoModerationActionExecution = require(
  "./events/autoModerationActionExecution"
);

const client = new Client({
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
  (...args) => ready.execute(...args)
);

client.on(
  Events.InteractionCreate,
  (...args) =>
    interactionCreate.execute(...args)
);

client.on(
  Events.GuildMemberAdd,
  (...args) =>
    guildMemberAdd.execute(...args)
);

client.on(
  Events.GuildMemberUpdate,
  (...args) =>
    guildMemberUpdate.execute(...args)
);

client.on(
  Events.GuildMemberRemove,
  (...args) =>
    guildMemberRemove.execute(...args)
);

client.on(
  Events.MessageCreate,
  (...args) =>
    messageCreate.execute(...args)
);

client.on(
  Events.AutoModerationActionExecution,
  (...args) =>
    autoModerationActionExecution.execute(...args)
);

client.login(process.env.DISCORD_TOKEN);
