import CallingExtensions, { Constants } from "@hubspot/calling-extensions-sdk";
const { errorType, callEndStatus } = Constants;
const axios = require("axios");
const crypto = require("crypto-js");

const state = {
  phoneNumber: "",
  engagementId: 0,
};

const sizeInfo = {
  width: 400,
  height: 600,
};

let HUBSPOT_OUTBOUND_CALL_BODY = {};

const createSignatuter = (data) => {
  data = JSON.stringify(data);

  const secret_key = "091425a170ab88ade932e80719fd13c8";

  return crypto.HmacSHA256(data, secret_key).toString(crypto.enc.Hex);
};

const cti = new CallingExtensions({
  debugMode: true,
  eventHandlers: {
    onReady: () => {
      cti.initialized({
        isLoggedIn: false,
        sizeInfo,
      });
    },
    onDialNumber: (data, rawEvent) => {
      const output = document.getElementById("output");
      output.innerHTML = "";

      const { phone_number, phoneNumber, portalId } = data;
      if (phone_number) {
        phone_number.split("").forEach((digit) => {
          appendNumber(digit);
        });
      }

      HUBSPOT_OUTBOUND_CALL_BODY = {
        phone_number,
        portalId,
        platform: "HUBSPOT",
      };
    },
    onEngagementCreated: (data, rawEvent) => {
      const { engagementId } = data;

      state.engagementId = engagementId;
    },
    onEndCall: () => {
      window.setTimeout(() => {
        cti.callEnded();
      }, 500);
    },
    onVisibilityChanged: (data, rawEvent) => {},
  },
});

function appendNumber(num) {
  const output = document.getElementById("output");
  const span = document.createElement("span");
  span.textContent = num;
  output.appendChild(span);
  phone_number_count++;
}

document.getElementById("call").addEventListener("click", hubspotInitiateCall);

async function hubspotInitiateCall() {
  try {
    const output = document.getElementById("output");
    let phone_number = Array.from(output.children)
      .map((child) => child.textContent)
      .join("");

    if (phone_number.length < 1) {
      alert("Please enter a valid phone number");
      return;
    }

    HUBSPOT_OUTBOUND_CALL_BODY["phone_number"] = phone_number;

    const signature = createSignatuter(HUBSPOT_OUTBOUND_CALL_BODY);
    const headers = { "pxb-signature": signature };
    const apiUrl = window.location.origin + "/webhooks/outbound-call";

    await axios.post(apiUrl, HUBSPOT_OUTBOUND_CALL_BODY, { headers });
    displayScreen("calling-section");

    setTimeout(() => {
      displayScreen("dialler-section");
    }, 5000);
  } catch (error) {
    if (error.response) {
      const errorMessage = error.response.data.message;
      alert(errorMessage);
    } else if (error.request) {
      alert("No response received from the server");
    } else {
      alert("Error setting up the request: " + error.message);
    }
  }
}
