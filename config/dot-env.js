const fs = require("fs");
const dotenv = require("dotenv");

module.exports = {
  /**
   * Initializes the configuration for the application.
   * This function checks for the existence of a .env file, loads it using dotenv,
   * and ensures that all required keys from .env.example are present.
   * @throws {Error} If the .env file is missing or if it's missing required keys.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  config() {
    // Check if .env file exists
    if (!fs.existsSync(".env")) {
      console.error("Error: The .env file is missing.");
      process.exit(1); // Exit the server with an error code
    }

    // Load the .env file
    dotenv.config();

    // Load the .env.example file to get the expected keys
    const exampleEnvConfig = dotenv.parse(fs.readFileSync(".env.example"));

    // Check if all keys from .env.example exist in .env
    const missingKeys = Object.keys(exampleEnvConfig).filter(
      (key) => typeof process.env[key] === "undefined"
    );

    if (missingKeys.length > 0) {
      console.error(
        "Error: The .env file is missing the following keys:",
        missingKeys.join(", ")
      );
      process.exit(1); // Exit the server with an error code
    }
  },
};
