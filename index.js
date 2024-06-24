/**
 * Author: Muhammad Imran Israr
 * Email: mimranisrar6@gmail.com
 * Date: 20-09-2023
 * Description: This file initializes the server and starts it.
 */
const dotEnv = require("./config/dot-env");
dotEnv.config();
const server = require("./server");

// MY CUSTOM DEBUGGER JUST FOR LOCAL DEVELOPMENT
// const { fast } = require("fast-debugger");
// global.fast = fast;

try {
  server.run();
} catch (error) {
  // TOTOD:: ADD YOUR LOGGER

  console.log("SERVER_START_ERR", error);
  process.exit(error);
}
