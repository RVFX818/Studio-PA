const fs = require("fs");
const path = require("path");

const COMMANDS_DIRECTORY =
  path.join(__dirname, "..", "commands");

function loadCommandHandlers() {
  const handlers = new Map();

  const files =
    fs.readdirSync(COMMANDS_DIRECTORY)
      .filter(
        (file) =>
          file.endsWith(".js") &&
          !file.startsWith("_")
      );

  for (const file of files) {
    const fullPath =
      path.join(
        COMMANDS_DIRECTORY,
        file
      );

    try {
      delete require.cache[
        require.resolve(fullPath)
      ];

      const command =
        require(fullPath);

      /*
        Expected architecture:

        module.exports = {
          data: SlashCommandBuilder,
          execute: async () => {}
        }
      */

      if (
        !command ||
        typeof command.execute !== "function"
      ) {
        console.warn(
          `Skipping command file without execute(): ${file}`
        );

        continue;
      }

      if (!command.data) {
        console.warn(
          `Skipping command file without data: ${file}`
        );

        continue;
      }

      const commandName =
        typeof command.data.toJSON === "function"
          ? command.data.toJSON().name
          : command.data.name;

      if (
        handlers.has(commandName)
      ) {
        throw new Error(
          `Duplicate command name: ${commandName}`
        );
      }

      handlers.set(
        commandName,
        command
      );

      console.log(
        `Loaded command: /${commandName}`
      );
    } catch (error) {
      console.error(
        `Failed to load command file ${file}:`,
        error
      );
    }
  }

  return handlers;
}

function loadSelfRegisteredDefinitions() {
  const definitions = [];

  const files =
    fs.readdirSync(COMMANDS_DIRECTORY)
      .filter(
        (file) =>
          file.endsWith(".js") &&
          !file.startsWith("_")
      );

  for (const file of files) {
    const fullPath =
      path.join(
        COMMANDS_DIRECTORY,
        file
      );

    try {
      const command =
        require(fullPath);

      if (!command?.data) {
        continue;
      }

      if (
        typeof command.data.toJSON ===
        "function"
      ) {
        definitions.push(
          command.data.toJSON()
        );
      } else {
        definitions.push(
          command.data
        );
      }
    } catch (error) {
      console.error(
        `Failed to read command definition from ${file}:`,
        error
      );
    }
  }

  return definitions;
}

module.exports = {
  loadCommandHandlers,
  loadSelfRegisteredDefinitions,
};
