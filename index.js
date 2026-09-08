require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
} = require("discord.js");

const ready = require("./events/ready");
const interactionCreate = require("./events/interactionCreate");
const guildMemberUpdate = require("./events/guildMemberUpdate");
const guildMemberRemove = require("./events/guildMemberRemove");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, (...args) =>
  ready.execute(...args)
);

client.on(Events.InteractionCreate, (...args) =>
  interactionCreate.execute(...args)
);

client.on(Events.GuildMemberUpdate, (...args) =>
  guildMemberUpdate.execute(...args)
);

client.on(Events.GuildMemberRemove, (...args) =>
  guildMemberRemove.execute(...args)
);

client.login(process.env.DISCORD_TOKEN);
