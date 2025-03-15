let port;
let connectBtn;
let redSlider, yellowSlider, greenSlider;
let mode = "NORMAL";
let brightness = 255;
let redDuration = 2000;
let yellowDuration = 500;
let greenDuration = 2000;
let redState = false;
let yellowState = false;
let greenState = false;
let lastMessage = "";
let blinkTimer = 0;
let blinkState = false;

function setup() {
  createCanvas(520, 400);
  background(220);

  port = createSerial();

  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 9600);
  }

  // Web serial connect button
  connectBtn = createButton("Connect to Arduino");
  connectBtn.position(350, 30);
  connectBtn.mousePressed(connectBtnClick);

  // Create sliders for each light duration
  textSize(14);
  
  text("Red Duration (ms):", 10, 35);
  redSlider = createSlider(500, 5000, redDuration, 10);
  redSlider.position(150, 25);
  redSlider.size(180);
  redSlider.mouseReleased(() => changeDuration("RED", redSlider.value()));
  
  text("Yellow Duration (ms):", 10, 65);
  yellowSlider = createSlider(100, 2000, yellowDuration, 10);
  yellowSlider.position(150, 55);
  yellowSlider.size(180);
  yellowSlider.mouseReleased(() => changeDuration("YELLOW", yellowSlider.value()));
  
  text("Green Duration (ms):", 10, 95);
  greenSlider = createSlider(500, 5000, greenDuration, 10);
  greenSlider.position(150, 85);
  greenSlider.size(180);
  greenSlider.mouseReleased(() => changeDuration("GREEN", greenSlider.value()));
  
  // Mode buttons
  createButton("NORMAL").position(350, 60).mousePressed(() => setMode("NORMAL"));
  createButton("EMERGENCY").position(350, 90).mousePressed(() => setMode("EMERGENCY"));
  createButton("BLINKING").position(350, 120).mousePressed(() => setMode("BLINKING"));
  createButton("OFF").position(350, 150).mousePressed(() => setMode("OFF"));
}

function draw() {
  background(220);
  
  // Read from serial port
  let n = port.available();
  if (n > 0) {
    let str = port.readUntil("\n");
    str = str.trim();
    if (str.length > 0) {
      lastMessage = str;
      parseMessage(str);
    }
  }
  
  // Display traffic lights
  drawTrafficLights();
  
  // Display info
  textSize(16);
  fill(0);
  
  // Draw separator line
  stroke(150);
  line(10, 120, 510, 120);
  noStroke();
  
  text("Mode: " + mode, 10, 150);
  text("Brightness: " + brightness, 10, 175);
  
  text("Red Duration: " + redDuration + " ms", 10, 210);
  text("Yellow Duration: " + yellowDuration + " ms", 10, 235);
  text("Green Duration: " + greenDuration + " ms", 10, 260);
  
  // Display last message
  text("Last message: " + lastMessage, 10, 295);
  
  // Connection status
  if (!port.opened()) {
    connectBtn.html("Connect to Arduino");
  } else {
    connectBtn.html("Disconnect");
  }
}

function drawTrafficLights() {
  // Draw traffic light housing
  fill(50);
  rect(30, 20, 160, 80, 10);
  
  // Handle blinking animation
  if (mode === "BLINKING") {
    // Update blink state every 500ms
    if (millis() - blinkTimer > 500) {
      blinkTimer = millis();
      blinkState = !blinkState;
    }
    
    if (blinkState) {
      redState = true;
      yellowState = true;
      greenState = true;
    } else {
      redState = false;
      yellowState = false;
      greenState = false;
    }
  } else if (mode === "EMERGENCY") {
    redState = true;
    yellowState = false;
    greenState = false;
  } else if (mode === "OFF") {
    redState = false;
    yellowState = false;
    greenState = false;
  }
  // In NORMAL mode, let the Arduino control the states

  // Draw the lights
  // Red light
  if (redState) {
    fill(255, 0, 0, map(brightness, 0, 255, 50, 255));
  } else {
    fill(100, 0, 0, 100);
  }
  ellipse(70, 60, 40, 40);
  
  // Yellow light
  if (yellowState) {
    fill(255, 255, 0, map(brightness, 0, 255, 50, 255));
  } else {
    fill(100, 100, 0, 100);
  }
  ellipse(110, 60, 40, 40);
  
  // Green light
  if (greenState) {
    fill(0, 255, 0, map(brightness, 0, 255, 50, 255));
  } else {
    fill(0, 100, 0, 100);
  }
  ellipse(150, 60, 40, 40);
  
  // Add labels
  fill(255);
  textSize(12);
  text("R", 66, 64);
  text("Y", 106, 64);
  text("G", 146, 64);
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
}

function connectBtnClick() {
  if (!port.opened()) {
    port.open(9600);
  } else {
    port.close();
  }
}

function changeDuration(light, duration) {
  if (port.opened()) {
    port.write(light + ":" + duration + "\n");
  }
}

function setMode(newMode) {
  if (port.opened()) {
    port.write("MODE:" + newMode + "\n");
    mode = newMode; // Update UI immediately
  }
}