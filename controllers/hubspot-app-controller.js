const path = require("path");

module.exports = {
  /**
   * This function serves the index.html file.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  index(_req, _res) {
    _res.setHeader("Content-Type", "text/html");
    _res.sendFile(path.join(__dirname, "../public", "index.html"));
  },
};
