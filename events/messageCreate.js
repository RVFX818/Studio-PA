const { EmbedBuilder } = require("discord.js");

const {
  addMessageProtectionOffense,
  addModAction,
} = require("../stores/moderationStore");

const {
  config,
  getEscalationMinutes,
} = require("../config/studioConfig");

const recentMessages = new Map();

const REPEAT_WINDOW_MS =
  config.moderation.messageProtection.repeatedMessages.windowMs;
const REPEAT_THRESHOLD =
  config.moderation.messageProtection.repeatedMessages.count;
const CAPS_MIN_LENGTH =
  config.moderation.messageProtection.excessiveCaps.minimumLetters;
const CAPS_RATIO =
  config.moderation.messageProtection.excessiveCaps.ratio;
const REPEATED_CHAR_THRESHOLD =
  config.moderation.messageProtection.repeatedCharacters.count;

function isMostlyCaps(content) {
  const letters = content.match(/[a-zA-Z]/g);

  if (!letters || letters.length < CAPS_MIN_LENGTH) {
    return false;
  }

  const uppercase = letters.filter(
    (letter) => letter === letter.toUpperCase()
  ).length;

  return uppercase / letters.length >= CAPS_RATIO;
}

function hasCharacterSpam(content) {
  const regex = new RegExp(
    `(.)\\1{${REPEATED_CHAR_THRESHOLD - 1},}`,
    "i"
  );

  return regex.test(content);
}

function isRepeatedMessage(message) {
  const userId = message.author.id;
  const now = Date.now();
  const normalized = message.content
    .trim()
    .toLowerCase();

  if (!normalized) return false;

  const history = recentMessages.get(userId) || [];

  const freshHistory = history.filter(
    (entry) =>
      now - entry.timestamp <= REPEAT_WINDOW_MS
  );

  freshHistory.push({
    content: normalized,
    timestamp: now,
  });

  recentMessages.set(userId, freshHistory);

  const matches = freshHistory.filter(
    (entry) => entry.content === normalized
  );

  return matches.length >= REPEAT_THRESHOLD;
}

function getEscalation(offenseCount) {
  const minutes = getEscalationMinutes(
    config.moderation.messageProtection.escalation,
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
  async execute(message) {
    try {
      if (!message.guild) return;

      if (message.guild.id !== process.env.GUILD_ID) {
        return;
      }

      if (message.author.bot) return;

      const member = message.member;

      if (
        member?.roles.cache.has(
          process.env.ADMIN_ROLE_ID
        )
      ) {
        return;
      }

      const content = message.content;

      if (!content) return;

      let violation = null;

      if (isRepeatedMessage(message)) {
        violation = "Repeated message spam";
      } else if (isMostlyCaps(content)) {
        violation = "Excessive capital letters";
      } else if (hasCharacterSpam(content)) {
        violation = "Repeated character spam";
      }

      if (!violation) return;

      if (message.deletable) {
        await message.delete().catch(() => {});
      }

      const offenseCount =
        addMessageProtectionOffense(
          message.author.id,
          {
            type: violation,
            channelId: message.channel.id,
            content: content.slice(0, 1000),
          }
        );

      const escalation =
        getEscalation(offenseCount);

      let automaticAction = "Logged only";
      let timeoutApplied = false;

      if (
        escalation &&
        member &&
        member.moderatable
      ) {
        try {
          const reason =
            `Automatic message-protection escalation: ` +
            `${offenseCount} recorded offenses`;

          await member.timeout(
            escalation.minutes * 60 * 1000,
            reason
          );

          addModAction(message.author.id, {
            type: "Automatic Timeout",
            moderatorId: null,
            reason,
            durationMinutes:
              escalation.minutes,
            source: "message-protection",
          });

          automaticAction =
            escalation.label;

          timeoutApplied = true;
        } catch (error) {
          console.error(
            "Failed to apply message-protection timeout:",
            error
          );

          automaticAction =
            `${escalation.label} failed`;
        }
      } else if (
        escalation &&
        member &&
        !member.moderatable
      ) {
        automaticAction =
          `${escalation.label} could not be applied`;
      }

      const logChannel =
        message.guild.channels.cache.get(
          process.env.LOGGING_CHANNEL_ID
        );

      if (
        logChannel &&
        logChannel.isTextBased()
      ) {
        const embed = new EmbedBuilder()
          .setTitle("Message Protection Action")
          .setThumbnail(
            message.author.displayAvatarURL({
              size: 256,
            })
          )
          .addFields(
            {
              name: "Member",
              value: `${message.author}`,
              inline: true,
            },
            {
              name: "Channel",
              value: `${message.channel}`,
              inline: true,
            },
            {
              name: "Violation",
              value: violation,
              inline: false,
            },
            {
              name: "Message",
              value:
                content.slice(0, 1000) ||
                "No content",
              inline: false,
            },
            {
              name: "Message Protection Offenses",
              value: String(offenseCount),
              inline: true,
            },
            {
              name: "Automatic Action",
              value: automaticAction,
              inline: true,
            }
          )
          .setFooter({
            text:
              "Studio PA � Message Protection",
          })
          .setTimestamp();

        await logChannel.send({
          embeds: [embed],
        });
      }

      if (timeoutApplied) {
        try {
          await message.author.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  "Automatic Moderation Action"
                )
                .setDescription(
                  `You have been temporarily timed out in ` +
                  `**${message.guild.name}** because of repeated ` +
                  `message-protection violations.`
                )
                .addFields(
                  {
                    name: "Violation",
                    value: violation,
                  },
                  {
                    name: "Recorded Offenses",
                    value:
                      String(offenseCount),
                  },
                  {
                    name: "Timeout",
                    value:
                      escalation.label,
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
      } else {
        const warningMessage =
          await message.channel.send({
            content:
              `${message.author}, your message was removed for **${violation.toLowerCase()}**.`,
            allowedMentions: {
              users: [message.author.id],
            },
          });

        setTimeout(() => {
          warningMessage
            .delete()
            .catch(() => {});
        }, 5000);
      }

      console.log(
        `${message.author.id} now has ${offenseCount} ` +
        `message-protection offense(s). Action: ${automaticAction}`
      );
    } catch (error) {
      console.error(
        "Message protection failed:",
        error
      );
    }
  },
};
