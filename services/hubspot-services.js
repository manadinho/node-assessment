const { sendToChannel } = require("../websocket-server");
const axios = require("axios");
const crmConfigController = require("../controllers/crm-config-controller");

let ACCESS_TOKEN = null;

module.exports = {
  /**
   * Redirects the user to the HubSpot installation URL.
   *
   * @param {_req} object - The request object, containing user and headers information.
   * @param {_res} object - The response object, used to redirect the user.
   */
  connect(_req, _res) {
    _res.redirect(
      `${process.env.HUBSPOT_INSTALL_URL}&state=${_req.user.id}AND${_req.headers.referer}`
    );
  },
  /**
   * Callback function for handling the OAuth 2.0 authorization code flow.
   *
   * @param {Object} _req - The request object.
   * @param {Object} _res - The response object.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  callback(_req, _res) {
    const code = _req.query.code;
    const state = _req.query.state;
    const [user_id, frontend_url] = state.split("AND");

    const app_id = process.env.HUBSPOT_APP_ID;
    const client_id = process.env.HUBSPOT_CLIENT_ID;
    const client_secret = process.env.HUBSPOT_CLIENT_SECRET;
    const redirect_uri = process.env.HUBSPOT_REDIRECT_URL;

    const body = {
      code,
      client_id,
      app_id,
      client_secret,
      grant_type: "authorization_code",
      redirect_uri,
    };

    // Use the querystring.stringify() method to format the data
    // const formData = querystring.stringify(body);

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    axios
      .post("https://api.hubapi.com/oauth/v1/token", body, {
        headers,
      })
      .then(async (response) => {
        const expires_at = this.getExpiresAt(response.data.expires_in);
        const user = await this.fetchCurrentUserInfo(
          response.data.access_token
        );
        const data = {
          body: {
            user_id,
            name: "HUBSPOT",
            config: { ...response.data, expires_at, portalId: user.portalId },
          },
        };

        await crmConfigController.create(data);
        _res.redirect(`${frontend_url}ui2/user/crm?connected=true&crm=HUBSPOT`);
      })
      .catch((error) => {
        _res.redirect(
          `${frontend_url}ui2/user/crm?connected=fale&crm=ZOHO&error=${error.message}`
        );
      });
  },

  /**
   * Calculates the expiration date/time based on the current date/time and a given duration.
   *
   * @param {number} expires_in - The duration (in seconds) until expiration.
   * @returns {Date} The expiration date/time.
   */
  getExpiresAt(expires_in) {
    const now = new Date();
    return new Date(now.getTime() + expires_in * 1000);
  },

  /**
   * Fetches the current user's information from the HubSpot API.
   *
   * @async
   * @param {string} access_token - The access token for the HubSpot API.
   * @returns {Promise<Object>} The data of the current user.
   * @throws {Error} Will throw an error if the request fails.
   */
  async fetchCurrentUserInfo(access_token) {
    console.log("fetchCurrentUserInfo is called");
    try {
      const response = await axios.get(
        "https://api.hubapi.com/integrations/v1/me",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
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

  /**
   * Refreshes the HubSpot OAuth token.
   *
   * @param {Object} config - The configuration object containing the refresh token and portal ID.
   * @param {string} user_id - The ID of the user for whom the token is being refreshed.
   * @returns {Promise<string>} The new access token.
   * @throws {Error} If an error occurs during the token refresh process.
   */
  async refreshToken(config, user_id) {
    try {
      const client_id = process.env.HUBSPOT_CLIENT_ID;
      const client_secret = process.env.HUBSPOT_CLIENT_SECRET;
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
        "https://api.hubapi.com/oauth/v1/token",
        data,
        {
          headers,
        }
      );

      const expires_at = this.getExpiresAt(response.data.expires_in);
      const _data = {
        body: {
          user_id,
          name: "HUBSPOT",
          config: { ...response.data, expires_at, portalId: config.portalId },
        },
      };

      await crmConfigController.create(_data);
      return response.data.access_token;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Searches for a contact in the CRM using their phone number.
   *
   * @param {Object} _req - The request object containing contact_number in params.
   * @returns {Promise} - A promise that resolves with the search results or an empty array if no results are found.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async searchContact(_req) {
    const user_id = crmConfigController.getRefId(_req);
    try {
      ACCESS_TOKEN = _req.crm_config.access_token;
      if (this.checkTokenValidity(_req.crm_config.expires_at)) {
        ACCESS_TOKEN = await this.refreshToken(_req.crm_config, user_id);
      }

      const url = "https://api.hubapi.com/crm/v3/objects/contacts/search";
      const body = this.prepareQuery(_req);
      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      return this.searchContactResponse(response, _req);
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: {},
      };
    }
  },

  /**
   * Processes the response from a contact search, retrieving additional information as needed.
   *
   * @param {Object} response - The response from the HubSpot API contact search.
   * @param {Object} _req - The original request object.
   * @returns {Promise<Object>} An object containing the success status, a message, and the contact data.
   * @throws {Error} If an error occurs during processing.
   */
  async searchContactResponse(response, _req) {
    try {
      if (response.data.results.length) {
        let company = "N/A";
        let owner = "N/A";
        if (response.data.results[0].properties.associatedcompanyid) {
          company = await this.getCompany(
            response.data.results[0].properties.associatedcompanyid
          );
        }

        if (response.data.results[0].properties.hubspot_owner_id) {
          owner = await this.getOwner(
            response.data.results[0].properties.hubspot_owner_id
          );
        }

        const id = response.data.results[0].properties.hs_object_id || null;
        const data = {
          id,
          properties: {
            firstname: response.data.results[0].properties.firstname || "N/A",
            lastname: response.data.results[0].properties.lastname || "",
            email: response.data.results[0].properties.email || "N/A",
            company,
            owner,
          },
          crm_detail_url: `https://app.hubspot.com/contacts/${_req.crm_config.portalId}/contact/${id}`,
        };
        return {
          success: true,
          message: "success",
          data,
        };
      }

      return {
        success: false,
        message: "Contact not found",
        data: {},
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Prepares a query object for the HubSpot API based on a given request.
   *
   * @param {_req} object - The request object, containing the contact number in the params.
   * @returns {Object} The prepared query object, ready to be sent to the HubSpot API.
   */
  prepareQuery(_req) {
    const formated_phone_number = this.getFromatedPhoneNumber(
      _req.params.contact_number
    );
    return {
      filterGroups: [
        {
          filters: [
            {
              propertyName: "phone",
              operator: "EQ",
              value: formated_phone_number,
            },
          ],
        },
      ],
      properties: [
        "firstname",
        "lastname",
        "email",
        "phone",
        "company",
        "hubspot_owner_id",
        "associatedcompanyid",
      ],
      limit: 1,
    };
  },

  /**
   * Get company details by its associated company ID.
   *
   * @param {number} associatedCompanyId - The associated company ID.
   * @returns {Promise<string>} A promise that resolves to the company name or "N/A" if there's an error.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async getCompany(associatedcompanyid) {
    try {
      const url = `https://api.hubapi.com/crm/v3/objects/companies/${associatedcompanyid}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      return response.data.properties.domain || "N/A";
    } catch (error) {
      return "N/A";
    }
  },

  /**
   * Retrieves the name of a HubSpot owner based on their ID.
   *
   * @param {string} ownerId - The ID of the owner to retrieve.
   * @returns {Promise<string>} The name of the owner, or "N/A" if the owner could not be retrieved.
   * @throws {Error} If an error occurs during the retrieval process.
   */
  async getOwner(ownerId) {
    try {
      let ownerName = "N/A";
      const url = `https://api.hubapi.com/crm/v3/owners/${ownerId}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.firstName) {
        const lastName = response.data.lastName || "";

        ownerName = response.data.firstName + " " + lastName;
      }

      return ownerName;
    } catch (error) {
      return "N/A";
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
    let cleanedNumber = contact_number.replace(/[^0-9]/g, "");
    if (cleanedNumber.length === 10) {
      cleanedNumber = "1" + cleanedNumber;
    }
    return "+" + cleanedNumber;
  },

  /**
   * Creates a new note in HubSpot CRM.
   *
   * @param {Object} _req - The request object containing necessary data.
   * @returns {Promise<Object>} A promise that resolves to the created note object or an empty object on error.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async createNote(_req) {
    try {
      const noteData = await this.prepareNoteData(_req);

      ACCESS_TOKEN = _req.crm_config.access_token;
      if (this.checkTokenValidity(_req.crm_config.expires_at)) {
        ACCESS_TOKEN = await this.refreshToken(_req.crm_config, user_id);
      }

      const url = `https://api.hubapi.com/crm/v3/objects/notes`;
      const response = await axios.post(url, noteData, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.log(error);
      return {};
    }
  },

  /**
   * Prepares the data for a note to be created in HubSpot.
   *
   * @param {_req} object - The request object, containing the note content and contact ID in the body.
   * @returns {Promise<Object>} An object containing the prepared note data.
   * @throws {Error} If an error occurs during the preparation process.
   */
  async prepareNoteData(_req) {
    try {
      const hubspot_owner_id = await this.getOwnerId(_req);
      return {
        properties: {
          hs_timestamp: new Date().toISOString(),
          hs_note_body: _req.body.content,
          hubspot_owner_id,
          hs_attachment_ids: _req.body.contact_id,
        },
        associations: [
          {
            to: {
              id: _req.body.contact_id,
            },
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: 202,
              },
            ],
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Gets the owner ID from a CRM client request.
   *
   * @param {_req} _req - The CRM client request object.
   * @returns {Promise<number|null>} A promise that resolves to the owner ID or null if there's an error.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async getOwnerId(_req) {
    try {
      const url = `https://api.hubapi.com/crm/v3/owners`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.results[0].id;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Initiates an outbound call to a given phone number.
   *
   * @param {_req} object - The request object, containing the phone number in the body and the CRM reference ID.
   * @returns {Promise<void>} Resolves when the call has been initiated.
   * @throws {Error} If an error occurs during the call initiation process.
   */
  async outBoundCall(_req) {
    const phone_number = _req.body.phone_number;
    const data = {
      event: "make-call",
      message: "Make call",
      data: { phone_number },
    };

    sendToChannel(`pbx-channel-${_req.crm_ref_id}`, data);
    return;
  },
};
