let port; // 시리얼 포트 객체
let connectBtn; // 연결 버튼
let redSlider, yellowSlider, greenSlider; // 슬라이더
let mode = "NORMAL"; // 현재 모드
let brightness = 0; // 밝기
let redDuration = 2000; // 각 신호등의 지속 시간
let yellowDuration = 500;
let greenDuration = 2000;
let redState = false; // 각 신호등의 상태
let yellowState = false;
let greenState = false;
let messageLog = []; // 시리얼 메시지 로그

// 시리얼 포트 연결 및 UI 생성
function setup() {
  createCanvas(950, 600); // 캔버스 생성
  background(50); // 배경색 설정
  createUI(); // UI 생성
  port = createSerial(); // 시리얼 포트 생성
}

// UI 생성
function createUI() {
  connectBtn = createButton("Connect to Arduino"); // 연결 버튼
  connectBtn.position(110, 440); // 위치 설정
  connectBtn.size(150, 40); // 크기 설정
  connectBtn.mousePressed(connectBtnClick); // 클릭 이벤트 설정
  
  fill(255); // 텍스트 색상 설정
  textSize(16); // 텍스트 크기 설정
  text("Red Duration (500ms ~ 5000ms):", 292, 425); // 텍스트 생성
  redSlider = createSlider(500, 5000, redDuration, 100); // 슬라이더 생성
  redSlider.position(550, 410); // 위치 설정
  redSlider.size(300); // 크기 설정
  
  text("Yellow Duration (100ms ~ 2000ms):", 274, 465); // 텍스트 생성
  yellowSlider = createSlider(100, 2000, yellowDuration, 100); // 슬라이더 생성
  yellowSlider.position(550, 450); // 위치 설정
  yellowSlider.size(300); // 크기 설정
  
  text("Green Duration (500ms ~ 5000ms):", 275, 505); // 텍스트 생성
  greenSlider = createSlider(500, 5000, greenDuration, 100); // 슬라이더 생성
  greenSlider.position(550, 490); // 위치 설정
  greenSlider.size(300); // 크기 설정
}

// 프레임마다 실행되는 함수
function draw() {
  checkSerial(); // 시리얼 메시지 확인
  drawTrafficLight(); // 신호등 그리기
  applyDurations(); // 지속 시간 적용
  drawInfoPanel(); // 정보 패널 그리기
  drawMessageLog(); // 메시지 로그 그리기
  
  if (!port.opened()) { // 포트가 닫혀있으면
    connectBtn.html("Connect to Arduino"); // 버튼 텍스트 변경
  } else {
    connectBtn.html("Disconnect");
  }
}

// 시리얼 메시지 확인
function checkSerial() {
  let n = port.available(); // 수신된 바이트 수
  if (n > 0) { // 수신된 바이트가 있으면
    let message = port.readUntil("\n"); // 메시지 읽기
    message = message.trim(); // 공백 제거
    if (message.length > 0) { // 메시지가 있으면
      messageLog.unshift(message); // 메시지 로그에 추가
      if (messageLog.length > 11) { // 메시지 로그가 11개 이상이면
        messageLog.pop(); // 가장 오래된 메시지 삭제
      }
      parseMessage(message); // 메시지 파싱
    }
  }
}

// 시리얼 메시지 파싱
function parseMessage(message) { 
  if (message.startsWith("MODE:")) { // 메시지가 MODE:로 시작하면
    mode = message.substring(5);
    return;
  }
  if (message.startsWith("Brightness:")) { // 메시지가 Brightness:로 시작하면
    brightness = parseInt(message.substring(12).trim());
    return;
  }
  if (message === "RED") { // 메시지가 RED이면
    redState = true; // 빨간색 신호등 켜기
    yellowState = false; // 노란색 신호등 끄기
    greenState = false; // 초록색 신호등 끄기
    return;
  }
  if (message === "YELLOW") { // 메시지가 YELLOW이면
    redState = false; // 빨간색 신호등 끄기
    yellowState = true; // 노란색 신호등 켜기
    greenState = false; // 초록색 신호등 끄기
    return;
  }
  if (message === "GREEN") { // 메시지가 GREEN이면
    redState = false; // 빨간색 신호등 끄기
    yellowState = false; // 노란색 신호등 끄기
    greenState = true; // 초록색 신호등 켜기
    return;
  }
  if(message === "BLINKING_ALL_ON") { // 메시지가 BLINKING_ALL_ON이면
    redState = true; // 빨간색 신호등 켜기
    yellowState = true; // 노란색 신호등 켜기
    greenState = true; // 초록색 신호등 켜기
    return;
  }
  if(message === "ALL_LEDs_OFF") { // 메시지가 ALL_LEDs_OFF이면
    redState = false; // 빨간색 신호등 끄기
    yellowState = false; // 노란색 신호등 끄기
    greenState = false; // 초록색 신호등 끄기
    return;
  }
}

// 신호등 그리기
function drawTrafficLight() {
  fill(30); // 색상 설정
  stroke(0); // 테두리 색상 설정
  rect(100, 70, 180, 320, 20); // 사각형 그리기
  
  if (redState) { // 빨간색 신호등
    fill(255, 0, 0, brightness); // 색상 설정
  } else { 
    fill(255, 0, 0, 0); // 색상 설정
    }
  ellipse(190, 130, 100, 100); // 원 그리기

  if (yellowState) { // 노란색 신호등
    fill(255, 255, 0, brightness); // 색상 설정
  } else {
    fill(255, 255, 0, 0); // 색상 설정
  }
  ellipse(190, 230, 100, 100); // 원 그리기
  
  if (greenState) { // 초록색 신호등
    fill(0, 255, 0, brightness); // 색상 설정
  } else { 
    fill(0, 255, 0, 0); // 색상 설정
  }
  ellipse(190, 330, 100, 100); // 원 그리기
  
  fill(255); // 텍스트 색상 설정
  textSize(20); // 텍스트 크기 설정
  text("R", 185, 135); 
  text("Y", 185, 235);
  text("G", 185, 335);
}

// 정보 패널 그리기
function drawInfoPanel() {
  fill(40); // 색상 설정
  stroke(100); // 테두리 색상 설정
  rect(300, 70, 300, 320, 10); // 사각형 그리기
  
  fill(255); // 텍스트 색상 설정
  textSize(20); // 텍스트 크기 설정
  text("Traffic Light Controller", 350, 100);
  
  textSize(16);
  text("Status: " + (port.opened() ? "Connected" : "Disconnected"), 320, 130);
  text("Mode: " + mode, 320, 160); 
  text("Brightness: " + brightness, 320, 190);
  text("Red Duration: " + redDuration + " ms", 320, 220);
  text("Yellow Duration: " + yellowDuration + " ms", 320, 250);
  text("Green Duration: " + greenDuration + " ms", 320, 280);
}

// 메시지 로그 그리기
function drawMessageLog() {
  fill(20); // 색상 설정
  stroke(100); // 테두리 색상 설정
  rect(620, 70, 230, 320, 10); // 사각형 그리기
  
  fill(255); // 텍스트 색상 설정
  textSize(16); // 텍스트 크기 설정
  text("Serial Messages:", 630, 90); 
  
  textSize(14); // 텍스트 크기 설정
  for (let i = 0; i < messageLog.length; i++) { // 메시지 로그 출력
    text("> " + messageLog[i], 630, 115 + i * 25);
  }
}

// 각 신호등의 지속 시간을 적용
function applyDurations() { 
  if (port.opened()) { // 포트가 열려있으면
    if (redSlider.value() !== redDuration) { // 슬라이더 값이 변경되면
      redDuration = redSlider.value(); // 지속 시간 설정
      port.write("RED:" + redSlider.value() + "\n"); // 메시지 전송
    }
    if (yellowSlider.value() !== yellowDuration) {
      yellowDuration = yellowSlider.value(); // 지속 시간 설정
      port.write("YELLOW:" + yellowSlider.value() + "\n");
    }
    if (greenSlider.value() !== greenDuration) {
      greenDuration = greenSlider.value(); // 지속 시간 설정
      port.write("GREEN:" + greenSlider.value() + "\n");
    }
  }
}

// 연결 버튼 클릭 이벤트
function connectBtnClick() {
  if (!port.opened()) {
    port.open(9600);
  } else {
    port.close();
  }
}