const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const config = {
  discord: {
    guildId: process.env.GUILD_ID,

    roles: {
      communityMember:
        process.env.COMMUNITY_MEMBER_ROLE_ID,

      admin:
        process.env.ADMIN_ROLE_ID,
    },

    channels: {
      logging:
        process.env.LOGGING_CHANNEL_ID,

      info:
        process.env.INFO_CHANNEL_ID,

      youtubeAlerts:
        process.env.YOUTUBE_ALERT_CHANNEL_ID,
    },
  },

  moderation: {
    raidProtection: {
      joinThreshold: 8,
      windowMs: 60 * 1000,
    },

    newAccountRisk: {
      highRiskAgeMs: 1 * DAY,
      cautionAgeMs: 7 * DAY,
    },

    autoMod: {
      escalation: {
        firstTimeoutOffense: 3,

        timeoutMinutes: {
          3: 10,
          4: 60,
          default: 1440,
        },
      },
    },

    messageProtection: {
      repeatedMessages: {
        count: 3,
        windowMs: 20 * 1000,
      },

      excessiveCaps: {
        minimumLetters: 12,
        ratio: 0.8,
      },

      repeatedCharacters: {
        count: 8,
      },

      escalation: {
        firstTimeoutOffense: 3,

        timeoutMinutes: {
          3: 10,
          4: 60,
          default: 1440,
        },
      },
    },
  },

  youtube: {
    enabled: true,

    apiKey:
      process.env.YOUTUBE_API_KEY,

    channelId:
      process.env.YOUTUBE_CHANNEL_ID,

    discordChannelId:
      process.env.YOUTUBE_ALERT_CHANNEL_ID,

    checkIntervalMs:
      5 * MINUTE,

    recentActivityLimit:
      10,

    storedVideoLimit:
      100,

    channelName:
      "Renaissance VFX",

    pingEveryone:
      true,
  },

  storage: {
    moderationFile:
      "moderation.json",

    channelSettingsFile:
      "channelSettings.json",

    youtubeFile:
      "youtubeAlerts.json",
  },
};

function getEscalationMinutes(escalation, offenseCount) {
  if (
    offenseCount <
    escalation.firstTimeoutOffense
  ) {
    return null;
  }

  return (
    escalation.timeoutMinutes[offenseCount] ??
    escalation.timeoutMinutes.default
  );
}

function validateCoreConfig() {
  const missing = [];

  if (!process.env.DISCORD_TOKEN) {
    missing.push("DISCORD_TOKEN");
  }

  if (!config.discord.guildId) {
    missing.push("GUILD_ID");
  }

  if (!config.discord.roles.admin) {
    missing.push("ADMIN_ROLE_ID");
  }

  if (!config.discord.channels.logging) {
    missing.push("LOGGING_CHANNEL_ID");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required configuration: ${missing.join(", ")}`
    );
  }
}

module.exports = {
  config,
  getEscalationMinutes,
  validateCoreConfig,

  time: {
    MINUTE,
    HOUR,
    DAY,
  },
};
