const { sendToChannel } = require("../websocket-server");
const axios = require("axios");
const crmConfigController = require("../controllers/crm-config-controller");

// todo: create both run time  recomended way
const code_verifier = "a157c07d2c5037d48bc632ede211df8b29a8fe4e2b4";
const code_challenge = "RN5z5rCJSMwaOo6aeTs4B09JE29keG_6XirPvCxR84Q";

let ACCESS_TOKEN = null;

module.exports = {
  connect(_req, _res) {
    const url = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${process.env.SALESFORCE_CLIENT_ID}&redirect_uri=${process.env.SALESFORCE_REDIRECT_URI}&code_challenge=${code_challenge}&code_challenge_method=S256&state=${_req.user.id}AND${_req.headers.referer}`;

    return _res.redirect(url);
  },

  async callback(_req, _res) {
    const code = _req.query.code;
    const state = _req.query.state;
    const [user_id, frontend_url] = state.split("AND");

    const client_id = process.env.SALESFORCE_CLIENT_ID;
    const client_secret = process.env.SALESFORCE_CLIENT_SECRET;
    const redirect_uri = process.env.SALESFORCE_REDIRECT_URI;

    const body = {
      code,
      client_id,
      client_secret,
      grant_type: "authorization_code",
      redirect_uri,
      code_verifier,
    };

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    axios
      .post("https://login.salesforce.com/services/oauth2/token", body, {
        headers,
      })
      .then(async (response) => {
        const expires_at = this.getExpiresAt();
        const user = await this.fetchCurrentUserInfo(response.data);
        const data = {
          body: {
            user_id,
            name: "SALESFORCE",
            config: {
              salesforce_userid: user.user_id,
              organization_id: user.organization_id,
              name: user.display_name || "N/A",
              email: user.email || "N/A",
              ...response.data,
              expires_at,
            },
          },
        };

        await crmConfigController.create(data);
        _res.redirect(process.env.SALESFORCE_INSTALL_URL);
      })
      .catch((error) => {
        _res.redirect(
          `${frontend_url}ui2/user/crm?connected=fale&crm=SALESFORCE&error=${error.message}`
        );
      });
  },

  async fetchCurrentUserInfo(req) {
    try {
      const user = await axios.get(req.id, {
        headers: { Authorization: `Bearer ${req.access_token}` },
      });
      return user.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Calculates the expiration date/time based on the current date/time and a given duration.
   *
   * @returns {Date} The expiration date/time.
   */
  getExpiresAt() {
    const now = new Date();
    return new Date(now.getTime() + 3600 * 1000);
  },

  /**
   * Queries the Contact object in the database based on the provided WHERE clause.
   *
   * @param {Object} _req - The request object.
   * @param {string} where - The WHERE clause for the SQL query.
   * @returns {Promise} A Promise that resolves with the query result or rejects with an error.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async queryContact(_req, where) {
    try {
      const user_id = crmConfigController.getRefId(_req);
      ACCESS_TOKEN = _req.crm_config.access_token;

      if (this.checkTokenValidity(_req.crm_config.expires_at)) {
        ACCESS_TOKEN = await this.refreshToken(_req.crm_config, user_id);
      }

      const query = encodeURIComponent(
        `SELECT Id, FirstName, LastName, Email, Phone, Account.Name, Owner.Name FROM Contact WHERE ${where}`
      );
      const url = `${_req.crm_config.instance_url}/services/data/v52.0/query?q=${query}`;
      const result = await axios.get(url, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      });

      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search for a contact in the Salesforce.
   *
   * @param {Object} _req - The request object.
   * @param {Object} _res - The response object.
   * @returns {Object} An object containing the search result.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async searchContact(_req, _res) {
    try {
      const formated_phone_number = this.getFromatedPhoneNumber(
        _req.params.contact_number
      );

      const lastTenNumbers = _req.params.contact_number.substring(
        _req.params.contact_number.length - 10
      );

      const contryCode = _req.params.contact_number.substring(
        0,
        _req.params.contact_number.length - 10
      );
      const allFormats = this.getAllFromatsOfPhoneNumbers(
        lastTenNumbers,
        contryCode
      );
      let where = `Phone LIKE '%${formated_phone_number}' OR Phone LIKE '${formated_phone_number}%' OR Phone LIKE '%${_req.params.contact_number}' OR Phone LIKE '${_req.params.contact_number}%'`;

      for (const contact in allFormats) {
        if (!allFormats[contact]) continue;

        where += ` OR Phone LIKE '%${allFormats[contact]}' OR Phone LIKE '${allFormats[contact]}%'`;
      }

      const result = await this.queryContact(_req, where);

      // EARLY RETURN IF CONTACT NOT FOUND
      if (!result.data || !result.data.records.length) {
        return {
          success: false,
          message: "Contact not found",
          data: {},
        };
      }

      const data = {
        id: result.data.records[0]?.Id,
        properties: {
          firstname: result.data.records[0]?.FirstName,
          lastname: result.data.records[0]?.LastName,
          email: result.data.records[0]?.Email,
          company: result.data.records[0]?.Account
            ? result.data.records[0]?.Account?.Name
            : "N/A",
          owner: result.data.records[0].Owner
            ? result.data.records[0].Owner.Name
            : "N/A",
        },
        crm_detail_url:
          _req.crm_config.instance_url + "/" + result.data.records[0]?.Id,
      };

      return {
        success: true,
        message: "success",
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: {},
      };
    }
  },

  /**
   * Formats a contact number by removing spaces and hyphens and prepends a plus sign.
   *
   * @param {string} contact_number - The contact number to format.
   * @returns {string} The formatted contact number.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  getFromatedPhoneNumber(contact_number) {
    return `+${contact_number.replace(/[ -]/g, "")}`;
  },

  /**
   * Asynchronously create a note.
   * @param {Object} _req - The request object.
   * @returns {Object} - An object containing success status, a message, and data.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async createNote(_req) {
    try {
      const noteData = {
        ParentId: _req.body.contact_id,
        Title: _req.body.content,
        Body: _req.body.content,
      };

      const user_id = crmConfigController.getRefId(_req);
      ACCESS_TOKEN = _req.crm_config.access_token;

      if (this.checkTokenValidity(_req.crm_config.expires_at)) {
        ACCESS_TOKEN = await this.refreshToken(_req.crm_config, user_id);
      }

      await axios.post(
        _req.crm_config.instance_url + "/services/data/v52.0/sobjects/Note",
        noteData,
        { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
      );

      return {
        success: true,
        message: "Note created",
        data: {},
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: {},
      };
    }
  },

  /**
   * Perform an outbound call.
   * @async
   * @param {Object} _req - The request object.
   * @param {string} _req.query.phone_number - The phone number to call.
   * @returns {void}
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async outBoundCall(_req) {
    const phone_number = this.standardizePhoneNumber(
      _req.query.phone_number.trim()
    );
    const data = {
      event: "make-call",
      message: "Make call",
      data: { phone_number },
    };

    sendToChannel(`pbx-channel-${_req.crm_ref_id}`, data);
    return;
  },

  standardizePhoneNumber(number) {
    // Remove non-numeric characters
    let cleanedNumber = number.replace(/[^0-9]/g, "");

    // Check if the length indicates absence of country code (assuming US numbers)
    if (cleanedNumber.length === 10) {
      cleanedNumber = "1" + cleanedNumber; // Prepend default country code for US
    }

    // Return the standardized number with '+'
    return "+" + cleanedNumber;
  },

  getAllFromatsOfPhoneNumbers(number, countryCode) {
    const areaCode = number.substring(0, 3);
    const middleThree = number.substring(3, 6);
    const lastFour = number.substring(6);

    countryCode = countryCode ?? "+1";

    return {
      international: `${countryCode} ${areaCode} ${middleThree} ${lastFour}`,
      standardUSWithSpace: `(${areaCode}) ${middleThree}-${lastFour}`,
      standardUSWithoutSpace: `(${areaCode})${middleThree}-${lastFour}`,
      dottedFormat: `${areaCode}.${middleThree}.${lastFour}`,
      withCountryCode: `${countryCode} ${areaCode} ${middleThree} ${lastFour}`,
      spacedOut: `${countryCode} ${areaCode} ${middleThree} ${lastFour}`,
      compactWithHyphensWithCountryCode: `${countryCode}-${areaCode}-${middleThree}-${lastFour}`,
      compactWithHyphensWithoutCountryCode: `${areaCode}-${middleThree}-${lastFour}`,
    };
  },

  /**
   * Checks if a given expiration date/time has passed.
   *
   * @param {string} expires_at - The expiration date/time to check.
   * @returns {boolean} True if the expiration date/time has passed, false otherwise.
   */
  checkTokenValidity(expires_at) {
    const now = new Date();
    const target = new Date(expires_at);

    return target < now;
  },

  async refreshToken(config, user_id) {
    try {
      const client_id = process.env.SALESFORCE_CLIENT_ID;
      const client_secret = process.env.SALESFORCE_CLIENT_SECRET;
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      const data = {
        grant_type: "refresh_token",
        client_id,
        client_secret,
        refresh_token: config.refresh_token,
      };
      const response = await axios.post(
        "https://login.salesforce.com/services/oauth2/token",
        data,
        {
          headers,
        }
      );

      const expires_at = this.getExpiresAt();
      const _data = {
        body: {
          user_id,
          name: "SALESFORCE",
          config: {
            ...config,
            access_token: response.data.access_token,
            expires_at,
          },
        },
      };

      await crmConfigController.create(_data);
      return response.data.access_token;
    } catch (error) {
      throw error;
    }
  },
};
