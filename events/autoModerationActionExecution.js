const {
  EmbedBuilder,
  AutoModerationActionType,
} = require("discord.js");

const {
  addAutoModOffense,
} = require("../stores/moderationStore");

const {
  config,
  getEscalationMinutes,
} = require("../config/studioConfig");

function getEscalation(offenseCount) {
  const minutes = getEscalationMinutes(
    config.moderation.autoMod.escalation,
    offenseCount
  );

  if (minutes === null) {
    return null;
  }

  let label;

  if (minutes === 10) {
    label = "10-minute timeout";
  } else if (minutes === 60) {
    label = "1-hour timeout";
  } else {
    label = "24-hour timeout";
  }

  return { minutes, label };
}

module.exports = {
  async execute(action) {
    try {
      if (action.guild.id !== process.env.GUILD_ID) return;

      //
      // ONLY HANDLE BLOCKED MESSAGE ACTIONS
      //
      if (
        action.action.type !==
        AutoModerationActionType.BlockMessage
      ) {
        return;
      }

      const logChannel = action.guild.channels.cache.get(
        process.env.LOGGING_CHANNEL_ID
      );

      if (!logChannel || !logChannel.isTextBased()) return;

      const member =
        action.member ||
        action.guild.members.cache.get(action.userId) ||
        null;

      const user =
        member?.user ||
        action.guild.members.cache.get(action.userId)?.user ||
        null;

      let ruleName = "Unknown Rule";

      try {
        const rule =
          await action.guild.autoModerationRules.fetch(
            action.ruleId
          );

        if (rule) {
          ruleName = rule.name;
        }
      } catch {
        // Keep Unknown Rule
      }

      //
      // RECORD OFFENSE
      //
      const offenseCount = addAutoModOffense(
        action.userId,
        {
          ruleId: action.ruleId,
          ruleName,
          channelId: action.channelId,
          matchedKeyword: action.matchedKeyword,
        }
      );

      //
      // DETERMINE ESCALATION
      //
      const escalation = getEscalation(offenseCount);

      let moderationAction = "Logged only";
      let timeoutApplied = false;

      if (escalation && member) {
        try {
          if (member.moderatable) {
            const reason =
              `Automatic AutoMod escalation: ` +
              `${offenseCount} recorded offenses`;

            await member.timeout(
              escalation.minutes * 60 * 1000,
              reason
            );

            timeoutApplied = true;
            moderationAction = escalation.label;
          } else {
            moderationAction =
              `${escalation.label} could not be applied ` +
              `(member is not moderatable)`;
          }
        } catch (error) {
          console.error(
            "Failed to apply automatic timeout:",
            error
          );

          moderationAction =
            `${escalation.label} failed`;
        }
      }

      //
      // BUILD LOG EMBED
      //
      const embed = new EmbedBuilder()
        .setTitle("AutoMod Action")
        .setThumbnail(
          user
            ? user.displayAvatarURL({
                size: 256,
              })
            : null
        )
        .addFields(
          {
            name: "User",
            value: user
              ? `${user}`
              : `<@${action.userId}>`,
            inline: true,
          },
          {
            name: "User ID",
            value: action.userId,
            inline: true,
          },
          {
            name: "Channel",
            value: action.channelId
              ? `<#${action.channelId}>`
              : "Unknown",
            inline: true,
          },
          {
            name: "Rule",
            value: ruleName,
            inline: true,
          },
          {
            name: "Matched Keyword",
            value:
              action.matchedKeyword ||
              "Not provided",
            inline: false,
          },
          {
            name: "Matched Content",
            value:
              action.matchedContent?.slice(
                0,
                1024
              ) ||
              "Not provided by Discord",
            inline: false,
          },
          {
            name: "Recorded AutoMod Offenses",
            value: String(offenseCount),
            inline: true,
          },
          {
            name: "Automatic Action",
            value: moderationAction,
            inline: true,
          }
        )
        .setFooter({
          text: "Studio PA � AutoMod",
        })
        .setTimestamp();

      await logChannel.send({
        embeds: [embed],
      });

      //
      // TRY TO NOTIFY USER IF TIMED OUT
      //
      if (timeoutApplied && user) {
        try {
          await user.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  "Automatic Moderation Action"
                )
                .setDescription(
                  `You have been temporarily timed out in ` +
                  `**${action.guild.name}** because of repeated ` +
                  `AutoMod violations.`
                )
                .addFields(
                  {
                    name: "Total AutoMod Offenses",
                    value: String(offenseCount),
                  },
                  {
                    name: "Timeout",
                    value: escalation.label,
                  },
                  {
                    name: "Triggered Rule",
                    value: ruleName,
                  }
                )
                .setFooter({
                  text:
                    "Studio PA � Renaissance VFX",
                })
                .setTimestamp(),
            ],
          });
        } catch {
          // Ignore closed DMs
        }
      }

      console.log(
        `${action.userId} now has ${offenseCount} ` +
        `AutoMod offense(s). Action: ${moderationAction}`
      );
    } catch (error) {
      console.error(
        "Failed to process AutoMod action:",
        error
      );
    }
  },
};
