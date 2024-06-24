const express = require("express");
const cluster = require("cluster");
const os = require("os");
const path = require("path");

const cors = require("cors");
const authMiddleware = require("./middlewares/auth");
const apiResponse = require("./middlewares/api-response");
const errorResponse = require("./middlewares/error-handler");
const contactRoutes = require("./routes/contacts");
const configRoutes = require("./routes/crm-config");
const hubspotAppRoutes = require("./routes/hubspot-app");
const salesforceRoutes = require("./routes/salesforce");
const webhooks = require("./webhooks/webhooks");
const http = require("http");
const { createWebSocketServer } = require("./websocket-server");
const app = express();

const numCPUs = os.cpus().length;
const port = process.env.PORT || 3000;

module.exports = {
  /**
   * This function sets up and runs an Express.js server.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  run() {
    // TODO:: IMPLEMENT WEBSOCKET SERVER OUT THE CHILD PROCESS
    // if (cluster.isMaster) {
    //   for (let i = 0; i < numCPUs; i++) {
    //     cluster.fork();
    //   }

    //   // Listen for when a child process exits and replace it
    //   cluster.on("exit", (worker, code, signal) => {
    //     console.log(`Worker ${worker.process.pid} died`);
    //     cluster.fork();
    //   });
    // } else {
    try {
      const server = http.createServer(app);

      createWebSocketServer(server);

      app.use(express.static(path.join(__dirname, "public")));

      app.set("view engine", "ejs");

      app.get("/dialer", (_req, _res) => {
        _res.render("dialer", {
          phone_number: _req.query.phone_number,
          userid: _req.query.userid,
          platform: _req.query.platform,
        });
      });

      app.get("/call-initiated", (_req, _res) => {
        _res.sendFile(path.join(__dirname, "./public", "index.html"));
      });

      app.get("/crm-not-active", (_req, _res) => {
        _res.sendFile(path.join(__dirname, "./public", "crm-not-active.html"));
      });

      // Middleware: This will parse JSON bodies and URL-encoded bodies
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cors({ origin: "*" }));
      // Enable trust proxy for rate limmit
      app.set("trust proxy", 1);

      app.get("/health", (_req, _res) => _res.send("SERVER IS RUNNING"));

      app.use(apiResponse);
      app.use("/webhooks", webhooks);
      app.use(authMiddleware);
      app.use("/hubspot", hubspotAppRoutes);
      app.use("/salesforce", salesforceRoutes);
      app.use("/contacts", contactRoutes);
      app.use("/crm-config", configRoutes);

      // ERRO MIDDLEWARE TO HANDLE ERRORS IN OUR SYSTEM
      app.use(errorResponse);

      server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    } catch (error) {
      throw new Error(error.message);
    }
    // }
  },
};
