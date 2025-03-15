let port;
let connectBtn;
let redSlider, yellowSlider, greenSlider;
let modeButtons = [];
let mode = "NORMAL";
let brightness = 255;
let redDuration = 2000;
let yellowDuration = 500;
let greenDuration = 2000;
let redState = false;
let yellowState = false;
let greenState = false;
let blinkTimer = 0;
let blinkState = false;
let messageLog = [];

function setup() {
  createCanvas(950, 650);
  background(50);
  
  port = createSerial();
  
  // Try to connect to previously used ports
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 9600);
  }
  
  // Create UI elements
  createUI();
}

function createUI() {
  // Connect button
  connectBtn = createButton("Connect to Arduino");
  connectBtn.position(50, 540);
  connectBtn.size(200, 40);
  connectBtn.mousePressed(connectBtnClick);
  
  // Duration sliders
  fill(255);
  textSize(16);
  text("Red Duration (ms):", 62, 425);
  redSlider = createSlider(500, 5000, redDuration, 100);
  redSlider.position(200, 410);
  redSlider.size(300);
  
  text("Yellow Duration (ms):", 45, 455);
  yellowSlider = createSlider(100, 2000, yellowDuration, 100);
  yellowSlider.position(200, 440);
  yellowSlider.size(300);
  
  text("Green Duration (ms):", 45, 485);
  greenSlider = createSlider(500, 5000, greenDuration, 100);
  greenSlider.position(200, 470);
  greenSlider.size(300);
  
  // Apply button for all sliders
  let applyBtn = createButton("Apply Durations");
  applyBtn.position(520, 440);
  applyBtn.size(150, 40);
  applyBtn.mousePressed(applyDurations);
  
  // Mode buttons
  let modes = ["NORMAL", "EMERGENCY", "BLINKING", "OFF"];
  for (let i = 0; i < modes.length; i++) {
    let btn = createButton(modes[i]);
    btn.position(300 + i*120, 540);
    btn.size(110, 40);
    btn.mousePressed(() => setMode(modes[i]));
    modeButtons.push(btn);
  }
}

function draw() {
  // Read from serial port
  checkSerial();
  
  // Draw the traffic light
  drawTrafficLight();
  
  // Draw information panel
  drawInfoPanel();
  
  // Draw message log
  drawMessageLog();
  
  // Update connection button text
  if (!port.opened()) {
    connectBtn.html("Connect to Arduino");
  } else {
    connectBtn.html("Disconnect");
  }
}

function checkSerial() {
  let n = port.available();
  if (n > 0) {
    let message = port.readUntil("\n");
    message = message.trim();
    if (message.length > 0) {
      // Add message to log
      messageLog.unshift(message);
      // Keep only the last 8 messages
      if (messageLog.length > 8) {
        messageLog.pop();
      }
      
      // Parse the message
      parseMessage(message);
    }
  }
}

function parseMessage(message) {
  console.log("Received: " + message);
  
  // Parse mode
  if (message.startsWith("MODE:")) {
    mode = message.substring(5);
    return;
  }
  
  // Parse brightness
  if (message.startsWith("Brightness:")) {
    brightness = parseInt(message.substring(12).trim());
    return;
  }
  
  // Parse durations
  if (message.startsWith("RED_DURATION:")) {
    redDuration = parseInt(message.substring(13).trim());
    redSlider.value(redDuration);
    return;
  }
  if (message.startsWith("YELLOW_DURATION:")) {
    yellowDuration = parseInt(message.substring(16).trim());
    yellowSlider.value(yellowDuration);
    return;
  }
  if (message.startsWith("GREEN_DURATION:")) {
    greenDuration = parseInt(message.substring(15).trim());
    greenSlider.value(greenDuration);
    return;
  }
  
  // Parse light states
  if (message === "RED") {
    redState = true;
    yellowState = false;
    greenState = false;
    return;
  }
  if (message === "YELLOW") {
    redState = false;
    yellowState = true;
    greenState = false;
    return;
  }
  if (message === "GREEN") {
    redState = false;
    yellowState = false;
    greenState = true;
    return;
  }
  if (message === "GREEN_BLINK_ON") {
    redState = false;
    yellowState = false;
    greenState = true;
    return;
  }
  if (message === "GREEN_BLINK_OFF") {
    redState = false;
    yellowState = false;
    greenState = false;
    return;
  }
  if(message === "BLINKING_ALL_ON") {
    redState = true;
    yellowState = true;
    greenState = true;
    return;
  }
  if (message === "BLINKING_ALL_OFF") {
    redState = false;
    yellowState = false;
    greenState = false;
    return;
  }
  if(message === "ALL_LEDs_OFF") {
    redState = false;
    yellowState = false;
    greenState = false;
    return;
  }
  if(message === "EMERGENCY_RED_ON") {
    redState = true;
    yellowState = false;
    greenState = false;
    return;
  }
}

function drawTrafficLight() {
  // Traffic light casing
  fill(30);
  stroke(0);
  strokeWeight(2);
  rect(100, 70, 180, 320, 20);
  
  // Red light
  stroke(0);
  if (redState) {
    fill(255, 0, 0, map(brightness, 0, 255, 50, 255));
  } else {
    fill(100, 0, 0, 100);
  }
  ellipse(190, 130, 100, 100);
  
  // Yellow light
  if (yellowState) {
    fill(255, 255, 0, map(brightness, 0, 255, 50, 255));
  } else {
    fill(100, 100, 0, 100);
  }
  ellipse(190, 230, 100, 100);
  
  // Green light
  if (greenState) {
    fill(0, 255, 0, map(brightness, 0, 255, 50, 255));
  } else {
    fill(0, 100, 0, 100);
  }
  ellipse(190, 330, 100, 100);
  
  // Labels
  fill(255);
  textSize(20);
  text("R", 185, 135);
  text("Y", 185, 235);
  text("G", 185, 335);
}

function drawInfoPanel() {
  // Panel background
  fill(40);
  stroke(100);
  rect(300, 70, 300, 320, 10);
  
  // Title
  fill(255);
  textSize(20);
  text("Traffic Light Controller", 350, 100);
  
  // Connection status
  textSize(16);
  text("Status: " + (port.opened() ? "Connected" : "Disconnected"), 320, 130);
  
  // Current mode
  text("Mode: " + mode, 320, 160);
  
  // Brightness
  text("Brightness: " + brightness, 320, 190);
  
  // Light durations
  text("Red Duration: " + redDuration + " ms", 320, 220);
  text("Yellow Duration: " + yellowDuration + " ms", 320, 250);
  text("Green Duration: " + greenDuration + " ms", 320, 280);
}

function drawMessageLog() {
  // Message log background
  fill(20);
  stroke(100);
  rect(620, 160, 230, 230, 10);
  
  // Title
  fill(255);
  textSize(16);
  text("Serial Messages:", 630, 180);
  
  // Messages
  textSize(14);
  for (let i = 0; i < messageLog.length; i++) {
    text("> " + messageLog[i], 630, 205 + i * 25);
  }
}

function applyDurations() {
  if (port.opened()) {
    // Send all durations to Arduino
    port.write("RED:" + redSlider.value() + "\n");
    port.write("YELLOW:" + yellowSlider.value() + "\n");
    port.write("GREEN:" + greenSlider.value() + "\n");
    
    // Update local values
    redDuration = redSlider.value();
    yellowDuration = yellowSlider.value();
    greenDuration = greenSlider.value();
  }
}

function connectBtnClick() {
  if (!port.opened()) {
    port.open(9600);
  } else {
    port.close();
  }
}

function setMode(newMode) {
  if (port.opened()) {
    port.write("MODE:" + newMode + "\n");
  }
  // Update UI immediately
  mode = newMode;
}