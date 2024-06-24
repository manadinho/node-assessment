let phone_number_count = 0; // Tracks the number of digits entered
let dialed_phoneNumber = ""; // Stores the phone number being dialed
let call_timer = null; // Reference to the call timer interval

document.addEventListener("DOMContentLoaded", () => {
  // Attach click event listeners to digits for dialing
  document.querySelectorAll(".digit").forEach((element) => {
    element.addEventListener("click", () => {
      let soundPath = "/audio/button_pressed.wav"; // Update this path to where your audio file is located
      let audio = new Audio(soundPath);

      // Play the sound
      audio
        .play()
        .catch((error) => console.error("Error playing the sound:", error));

      let num = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.nodeValue)
        .join("")
        .trim();

      const outputDiv = document.getElementById("output");
      const spanElements = outputDiv.querySelectorAll("span");
      const phone_number_count = spanElements.length;

      // Append num to the output element if less than 11 digits
      if (phone_number_count < 15) {
        appendNumber(num);
      }
    });
  });

  // Attach click event listener for backspace
  document.querySelectorAll(".fa-long-arrow-left").forEach((element) => {
    element.addEventListener("click", () => {
      const output = document.getElementById("output");
      if (output.lastElementChild) {
        output.removeChild(output.lastElementChild);
        phone_number_count--;
      }
    });
  });
});

function appendNumber(num) {
  const output = document.getElementById("output");
  const span = document.createElement("span");
  span.textContent = num;
  output.appendChild(span);
  phone_number_count++;
}

// Function to initiate the call
async function initiateCall() {
  // let soundPath = "/audio/outgoing_tone.wav";
  // let audio = new Audio(soundPath);
  // audio
  //   .play()
  //   .catch((error) => console.error("Error playing the sound:", error));
  try {
    const output = document.getElementById("output");
    dialed_phoneNumber = Array.from(output.children)
      .map((child) => child.textContent)
      .join("");

    if (dialed_phoneNumber.length < 1) {
      alert("Please enter a valid phone number");
      return;
    }

    if (PLATFORM == "SALESFORCE") {
      await salesforcefInitiateCall();
    }

    displayScreen("calling-section");
  } catch (error) {
    alert(error.message);
  }
}

async function salesforcefInitiateCall() {
  try {
    await fetch(
      window.location.origin +
        "/webhooks/outbound-call/?platform=SALESFORCE&phone_number=" +
        dialed_phoneNumber +
        "&userid=" +
        PLATFORM_USER_ID
    );
    return true;
  } catch (error) {
    throw error;
  }
}

// Function to switch display between different screens
function displayScreen(screen) {
  const screens = ["dialler-section", "calling-section", "inprogress-section"];
  screens.forEach((scr) => {
    const element = document.getElementById(scr);
    element.style.display = scr === screen ? "block" : "none";
  });
}

// Function to handle the call in progress state
function callInProgress() {
  displayScreen("inprogress-section");
  startCallTimer();
}

// Function to start the call timer
function startCallTimer() {
  const timerElement = document.getElementById("call-timer");
  let seconds = 0,
    minutes = 0,
    hours = 0;

  // Function to increment the timer and format the time
  const incrementTimer = () => {
    seconds++;
    if (seconds >= 60) {
      seconds = 0;
      minutes++;
      if (minutes >= 60) {
        minutes = 0;
        hours++;
      }
    }

    // Format the time to HH:MM:SS
    timerElement.textContent = [hours, minutes, seconds]
      .map((unit) => unit.toString().padStart(2, "0"))
      .join(":");
  };

  // Start the timer to call incrementTimer every second
  call_timer = setInterval(incrementTimer, 1000);
}

// Function to end the call
function endCall() {
  clearInterval(call_timer);
  displayScreen("dialler-section");
  document.getElementById("call-timer").textContent = "00:00:00";
  document.getElementById("output").textContent = "";
  phone_number_count = 0;
  dialed_phoneNumber = "";
}
