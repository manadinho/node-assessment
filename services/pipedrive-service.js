const axios = require("axios");
const pipedrive_api_url = "https://api.pipedrive.com/v1/";
const pipedrive_url = "pipedrive.com";
const { sendToChannel } = require("../websocket-server");

module.exports = {
  /**
   * This function searches for a contact using the Pipedrive API and returns contact information.
   * @param {object} _req - Request object that presumably contains the contact number.
   * @returns {object} An object with success status, message, and contact data.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async searchContact(_req) {
    try {
      const response = await axios.get(
        `${pipedrive_api_url}persons/search?api_token=${this.getToken(
          _req
        )}&limit=1&start=0&term=${this.getFromatedPhoneNumber(
          _req.params.contact_number
        )}`
      );

      // EARLY RETURN IF CONTACT NOT FOUND
      if (!response || !response.data.data.items) {
        return {
          success: false,
          message: "Contact not found",
          data: {},
        };
      }

      let owner = "N/A";
      if (response?.data?.data?.items[0]?.item?.owner?.id) {
        owner = await this.getOwner(
          _req,
          response?.data?.data?.items[0]?.item?.owner?.id
        );
      }

      const domain = await this.getDomain(_req);

      const data = {
        id: this.getDataFromObject(
          response.data.data.items[0]?.item,
          "id",
          null
        ),
        properties: {
          firstname: this.getDataFromObject(
            response.data.data.items[0]?.item,
            "name"
          ),
          lastname: "",
          email: response.data.data.items[0]?.item?.emails[0] || "N/A",
          company: this.getDataFromObject(
            response.data.data.items[0]?.item?.organization,
            "name"
          ),
          owner: owner,
        },
        crm_detail_url: `https://${domain}.${pipedrive_url}/person/${response.data.data.items[0]?.item?.id}`,
      };
      return { success: true, message: "Success", data };
    } catch (error) {
      return { success: false, message: error.message, data: {} };
    }
  },

  /**
   * Retrieves a value from an object using a specified key, with an optional default value.
   *
   * @param {object} data - The object from which to retrieve the value.
   * @param {string} key - The key used to access the value in the object.
   * @param {any} [default_value="N/A"] - An optional default value to return if the key is not found in the object.
   * @returns {any} The value associated with the key in the object, or the default value if not found.
   * @throws {Error} If an error occurs during the retrieval process, an Error object is thrown with an error message.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  getDataFromObject(data, key, default_value = "N/A") {
    try {
      return data[key] ? data[key] : default_value;
    } catch (error) {
      return default_value;
    }
  },

  /**
   * Get the API token from the CRM configuration.
   *
   * @param {Object} _req - The request object containing CRM configuration.
   * @returns {string} The API token.
   * @throws {Error} If an error occurs while getting the API token.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  getToken(_req) {
    try {
      return _req.crm_config.api_token;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Retrieve the company domain from the user's profile.
   *
   * @param {object} _req - The request object.
   * @returns {Promise<string|null>} The company domain if available, or null.
   * @throws {Error} If an error occurs while fetching the profile.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async getDomain(_req) {
    try {
      const profile = await this.getProfile(_req);

      return profile?.company_domain || null;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Retrieves the user profile using the Pipedrive API.
   *
   * @param {object} _req - The request object.
   * @param {string} _req.params.contact_number - The contact number to search for.
   * @returns {Promise<object>} A Promise that resolves to the user profile data.
   * @throws {Error} If an error occurs during the API request.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async getProfile(_req) {
    try {
      const response = await axios.get(
        `${pipedrive_api_url}users/me?api_token=${this.getToken(
          _req
        )}&limit=1&start=0&term=${this.getFromatedPhoneNumber(
          _req.params.contact_number
        )}`
      );

      return response.data.data;
    } catch (error) {
      throw new Error(error.message);
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
    try {
      return `+${contact_number.replace(/[ -]/g, "")}`;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async getOwner(_req, owner_id) {
    try {
      const response = await axios.get(
        `${pipedrive_api_url}users/${owner_id}?api_token=${this.getToken(_req)}`
      );

      return response?.data?.data?.name || "N/A";
    } catch (error) {
      return "N/A";
    }
  },

  /**
   * Create a note using the Pipedrive API.
   *
   * @param {object} _req - The request object containing the note data.
   * @param {string} _req.body.content - The content of the note.
   * @param {string} _req.body.contact_id - The ID of the person associated with the note.
   * @returns {Promise<object>} A Promise that resolves to an object with the result of the operation.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async createNote(_req) {
    try {
      const noteData = {
        content: _req.body.content,
        person_id: _req.body.contact_id,
      };

      await axios.post(
        `https://api.pipedrive.com/v1/notes?api_token=${this.getToken(_req)}`,
        noteData
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
};
