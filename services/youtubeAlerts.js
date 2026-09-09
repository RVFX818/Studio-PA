const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const {
  config,
} = require("../config/studioConfig");

const DATA_DIRECTORY =
  path.join(__dirname, "..", "data");

const DATA_FILE =
  path.join(
    DATA_DIRECTORY,
    config.storage.youtubeFile
  );

let checkRunning = false;
let intervalHandle = null;

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
          initialized: false,
          seenVideoIds: [],
          lastSuccessfulCheck: null,
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
    const parsed =
      JSON.parse(
        fs.readFileSync(
          DATA_FILE,
          "utf8"
        )
      );

    return {
      initialized:
        parsed.initialized === true,

      seenVideoIds:
        Array.isArray(parsed.seenVideoIds)
          ? parsed.seenVideoIds
          : [],

      lastSuccessfulCheck:
        parsed.lastSuccessfulCheck ?? null,
    };
  } catch (error) {
    console.error(
      "Failed to read YouTube alert data:",
      error
    );

    return {
      initialized: false,
      seenVideoIds: [],
      lastSuccessfulCheck: null,
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

function youtubeConfigured() {
  return Boolean(
    config.youtube.enabled &&
    config.youtube.apiKey &&
    config.youtube.channelId &&
    config.youtube.discordChannelId
  );
}

async function getRecentUploads() {
  const params =
    new URLSearchParams({
      part:
        "snippet,contentDetails",

      channelId:
        config.youtube.channelId,

      maxResults:
        String(
          config.youtube.recentActivityLimit
        ),

      key:
        config.youtube.apiKey,
    });

  const response =
    await fetch(
      "https://www.googleapis.com/youtube/v3/activities?" +
      params.toString()
    );

  if (!response.ok) {
    let details = "";

    try {
      const body =
        await response.json();

      details =
        body?.error?.message ?? "";
    } catch {
      // Ignore response parsing errors.
    }

    throw new Error(
      `YouTube API returned ${response.status}` +
      (details
        ? `: ${details}`
        : "")
    );
  }

  const data =
    await response.json();

  return (data.items ?? [])
    .filter(
      (item) =>
        item?.contentDetails
          ?.upload
          ?.videoId
    )
    .map((item) => {
      const videoId =
        item.contentDetails
          .upload.videoId;

      return {
        id:
          videoId,

        title:
          item.snippet?.title ??
          `New ${config.youtube.channelName} Video`,

        published:
          item.snippet
            ?.publishedAt ??
          null,

        thumbnail:
          item.snippet
            ?.thumbnails
            ?.maxres
            ?.url ||

          item.snippet
            ?.thumbnails
            ?.standard
            ?.url ||

          item.snippet
            ?.thumbnails
            ?.high
            ?.url ||

          item.snippet
            ?.thumbnails
            ?.medium
            ?.url ||

          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,

        link:
          `https://www.youtube.com/watch?v=${videoId}`,
      };
    });
}

async function sendVideoAlert(
  discordChannel,
  video
) {
  const embed =
    new EmbedBuilder()
      .setTitle(video.title)
      .setURL(video.link)
      .setDescription(
        `A new video from **${config.youtube.channelName}** is now live on YouTube.`
      )
      .setImage(
        video.thumbnail
      )
      .addFields({
        name:
          "Watch Now",

        value:
          `[Open on YouTube](${video.link})`,

        inline:
          false,
      })
      .setFooter({
        text:
          `${config.youtube.channelName} • YouTube`,
      });

  if (video.published) {
    const date =
      new Date(
        video.published
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      embed.setTimestamp(
        date
      );
    }
  }

  const payload = {
    embeds: [embed],
    allowedMentions: {
      parse: [],
    },
  };

  if (
    config.youtube.pingEveryone
  ) {
    payload.content =
      `@everyone\n\u{1F4FA} **New ${config.youtube.channelName} Video**`;

    payload.allowedMentions.parse =
      ["everyone"];
  } else {
    payload.content =
      `\u{1F4FA} **New ${config.youtube.channelName} Video**`;
  }

  await discordChannel.send(
    payload
  );
}

async function checkYouTube(
  client
) {
  if (
    checkRunning ||
    !youtubeConfigured()
  ) {
    return;
  }

  checkRunning = true;

  try {
    const videos =
      await getRecentUploads();

    if (
      videos.length === 0
    ) {
      console.log(
        "YouTube check completed: no uploads found."
      );

      return;
    }

    const store =
      readStore();

    if (
      !store.initialized
    ) {
      store.initialized =
        true;

      store.seenVideoIds =
        videos.map(
          (video) =>
            video.id
        );

      store.lastSuccessfulCheck =
        new Date()
          .toISOString();

      writeStore(
        store
      );

      console.log(
        `YouTube alerts initialized with ${videos.length} existing uploads.`
      );

      return;
    }

    const seen =
      new Set(
        store.seenVideoIds
      );

    const newVideos =
      videos
        .filter(
          (video) =>
            !seen.has(
              video.id
            )
        )
        .reverse();

    if (
      newVideos.length === 0
    ) {
      store.lastSuccessfulCheck =
        new Date()
          .toISOString();

      writeStore(
        store
      );

      console.log(
        "YouTube check completed: no new uploads."
      );

      return;
    }

    const discordChannel =
      await client.channels.fetch(
        config.youtube.discordChannelId
      );

    if (
      !discordChannel ||
      !discordChannel.isTextBased()
    ) {
      throw new Error(
        "YouTube alert channel could not be found."
      );
    }

    const botMember =
      discordChannel.guild?.members?.me;

    if (botMember) {
      const permissions =
        discordChannel.permissionsFor(
          botMember
        );

      if (
        !permissions?.has(
          PermissionFlagsBits.SendMessages
        )
      ) {
        throw new Error(
          "Studio PA cannot send messages in the YouTube alert channel."
        );
      }

      if (
        !permissions?.has(
          PermissionFlagsBits.EmbedLinks
        )
      ) {
        throw new Error(
          "Studio PA cannot send embeds in the YouTube alert channel."
        );
      }

      if (
        config.youtube.pingEveryone &&
        !permissions?.has(
          PermissionFlagsBits.MentionEveryone
        )
      ) {
        throw new Error(
          "Studio PA cannot mention @everyone in the YouTube alert channel."
        );
      }
    }

    for (
      const video
      of newVideos
    ) {
      await sendVideoAlert(
        discordChannel,
        video
      );

      seen.add(
        video.id
      );

      console.log(
        `YouTube alert posted: ${video.title}`
      );
    }

    store.seenVideoIds =
      Array.from(
        seen
      ).slice(
        -config.youtube
          .storedVideoLimit
      );

    store.lastSuccessfulCheck =
      new Date()
        .toISOString();

    writeStore(
      store
    );
  } catch (error) {
    console.error(
      "YouTube alert check failed:",
      error
    );
  } finally {
    checkRunning = false;
  }
}

function startYouTubeAlerts(
  client
) {
  if (
    !config.youtube.enabled
  ) {
    console.log(
      "YouTube alerts disabled."
    );

    return;
  }

  if (
    !youtubeConfigured()
  ) {
    console.log(
      "YouTube alerts disabled: configuration incomplete."
    );

    return;
  }

  if (intervalHandle) {
    return;
  }

  console.log(
    `Starting ${config.youtube.channelName} YouTube alerts...`
  );

  checkYouTube(
    client
  );

  intervalHandle =
    setInterval(
      () => {
        checkYouTube(
          client
        );
      },
      config.youtube
        .checkIntervalMs
    );
}

module.exports = {
  startYouTubeAlerts,
  checkYouTube,
};
