const WebSocket = require("ws");

const axios = require("axios");

let wss;

// Authentication function to validate client access tokens
async function authenticate(account_id, token) {
  try {
    const url = `${process.env.API_BASE_URL}accounts/${account_id}/lists/null/entries`;

    const headers = {
      "X-Auth-Token": token,
    };

    const res = await axios.get(url, { headers });

    if (res.data.status) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

function createWebSocketServer(server) {
  try {
    wss = new WebSocket.Server({ server });

    wss.on("connection", async (ws, req) => {
      const params = req.url.split("&");
      let accountId = null;
      let token = null;

      // Iterate through the parameters to find 'account_id' and 'token'
      for (const param of params) {
        if (param.includes("account_id=")) {
          accountId = param.split("=")[1];
        }
        if (param.includes("token=")) {
          token = param.split("=")[1];
        }
      }

      // todo: remove this for authentication
      // Authenticate the client
      // if (!token || !accountId || !(await authenticate(accountId, token))) {
      //   console.error("Authentication failed. Closing the connection.");
      //   ws.send('{"error": "Authentication failed"}');
      //   ws.terminate();
      //   return;
      // }

      console.log("Client connected");

      // Set a flag on the client to track if it is alive
      ws.isAlive = true;

      // Handle pong response from the client
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);

          if (data.action === "subscribe" && data.channel) {
            ws.channel = true;
            ws.channel_name = data.channel;
          } else if (data.channel && data.action === "publish") {
            // Broadcast the published message to all clients subscribed to prticular channel
            wss.clients.forEach((client) => {
              if (client.channel && client.channel_name === data.channel) {
                client.send(JSON.stringify({ data: data.message }));
              }
            });
            console.log(
              `Message published to '${data.channel}': ${data.message}`
            );
          }
        } catch (error) {
          console.error("Invalid message:", message);
        }
      });

      // Handle client disconnect
      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });
  } catch (error) {
    console.error("Failed to create WebSocket Server:", error);
  }
}

// Function to send a ping to each client
function heartbeat() {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();

    ws.isAlive = false;
    ws.ping(null, false, true);
  });
}

// Set an interval for sending pings
setInterval(heartbeat, 30000); // Every 30 seconds

function sendToChannel(channel, data) {
  let _client = null;
  for(const client of wss.clients) {
    if (client.channel && client.channel_name === channel) {
      _client = client;
    }
  }

  if (_client) {
    _client.send(JSON.stringify({ data }));
  }
}

module.exports = { createWebSocketServer, sendToChannel };
