let port; // 시리얼 포트 객체
let connectBtn; // 연결 버튼
let redSlider, yellowSlider, greenSlider; // 슬라이더
let mode = "NORMAL"; // 현재 모드
let brightness = 255; // 밝기
let redDuration = 2000; // 각 신호등의 지속 시간
let yellowDuration = 500;
let greenDuration = 2000;
let redState = false; // 각 신호등의 상태
let yellowState = false;
let greenState = false;
let messageLog = []; // 시리얼 메시지 로그

// Handpose 관련 변수
let handPose; // Handpose 객체
let video; // 비디오 객체
let hands = []; // 손 인식 결과

// p5.js preload 함수
function preload() {
  handPose = ml5.handPose(); // ml5.js Handpose 모델 로드
}

// 시리얼 포트 연결 및 UI 생성
function setup() {
  createCanvas(950, 1050); // 캔버스 생성
  background(50); // 배경색 설정

  // 비디오 캡처 설정
  video = createCapture(VIDEO, { flipped: true }); // 비디오 캡처 생성
  video.size(640, 480); // 비디오 크기 설정
  video.hide(); // 비디오 숨기기
  handPose.detectStart(video, gotHands); // 비디오에서 손 인식 시작

  createUI(); // UI 생성
  port = createSerial(); // 시리얼 포트 생성
}

// 손 인식 결과 처리
function gotHands(results) {
  hands = results; // 손 인식 결과 저장
}

// UI 생성
function createUI() {
  connectBtn = createButton("Connect to Arduino"); // 연결 버튼
  connectBtn.position(110, 440); // 위치 설정
  connectBtn.size(150, 40); // 크기 설정
  connectBtn.mousePressed(connectBtnClick); // 클릭 이벤트 설정

  redSlider = createSlider(500, 5000, redDuration, 100); // 슬라이더 생성
  redSlider.position(550, 410); // 위치 설정
  redSlider.size(300); // 크기 설정

  yellowSlider = createSlider(100, 2000, yellowDuration, 100); // 슬라이더 생성
  yellowSlider.position(550, 450); // 위치 설정
  yellowSlider.size(300); // 크기 설정

  greenSlider = createSlider(500, 5000, greenDuration, 100); // 슬라이더 생성
  greenSlider.position(550, 490); // 위치 설정
  greenSlider.size(300); // 크기 설정
}

// 프레임마다 실행되는 함수
function draw() {
  background(50); // 배경색 설정
  checkSerial(); // 시리얼 메시지 확인

  // 손 인식 결과가 있으면 제스처 처리
  if (hands.length > 0 && port.opened()) {
    processHandGestures(); 
  }

  fill(255); // 텍스트 색상 설정
  textSize(16); // 텍스트 크기 설정
  text("Red Duration (500ms ~ 5000ms):", 292, 425); // 텍스트 생성
  text("Yellow Duration (100ms ~ 2000ms):", 274, 465); // 텍스트 생성
  text("Green Duration (500ms ~ 5000ms):", 275, 505); // 텍스트 생성

  drawTrafficLight(); // 신호등 그리기
  applyDurations(); // 지속 시간 적용
  drawInfoPanel(); // 정보 패널 그리기
  drawMessageLog(); // 메시지 로그 그리기
  drawVideoFeed(); // 비디오 피드 그리기

  if (!port.opened()) {
    // 포트가 닫혀있으면
    connectBtn.html("Connect to Arduino"); // 버튼 텍스트 변경
  } else {
    connectBtn.html("Disconnect");
  }
}

// 모드 변경
function setMode(newMode) {
  if (port.opened()) {
    // 포트가 열려있으면
    port.write("MODE:" + newMode + "\n"); // 메시지 전송
  }
  mode = newMode;
}

// 손 제스처 처리
function processHandGestures() {
  let hand = hands[0]; // 첫 번째 손 인식 결과 사용

  // 손 인식 결과가 없으면 종료
  if (!hand || !hand.keypoints || hand.keypoints.length === 0) return;

  // 검지, 중지, 약지, 새끼손가락 위치 찾기
  let indexTip = findKeypoint(hand, "index_finger_tip");
  let middleTip = findKeypoint(hand, "middle_finger_tip");
  let ringTip = findKeypoint(hand, "ring_finger_tip");
  let pinkyTip = findKeypoint(hand, "pinky_finger_tip");

  // 손가락 관절 위치 찾기
  let indexPip = findKeypoint(hand, "index_finger_pip");
  let middlePip = findKeypoint(hand, "middle_finger_pip");
  let ringPip = findKeypoint(hand, "ring_finger_pip");
  let pinkyPip = findKeypoint(hand, "pinky_finger_pip");

  let wrist = findKeypoint(hand, "wrist"); // 손목 위치 찾기
  let fingersUp = 0; // 손가락이 펴져 있는지 확인하는 변수

  // 손가락이 펴져 있는지 확인 (손가락 끝이 관절보다 위에 있는지)
  if (wrist && indexTip && indexPip && indexTip.y < indexPip.y) {
    fingersUp++; // 검지 손가락 
  }
  if (wrist && middleTip && middlePip && middleTip.y < middlePip.y) {
    fingersUp++; // 중지 손가락
  }
  if (wrist && ringTip && ringPip && ringTip.y < ringPip.y) {
    fingersUp++; // 약지 손가락
  }
  if (wrist && pinkyTip && pinkyPip && pinkyTip.y < pinkyPip.y) {
    fingersUp++; // 새끼 손가락
  }

  if (fingersUp === 4) { // 손가락이 네 개만 펴져 있을 때
    if (mode !== "BLINKING") { 
      setMode("BLINKING");
    }
  } else if (fingersUp === 3) { // 손가락이 세 개만 펴져 있을 때
    if (mode !== "EMERGENCY") {
      setMode("EMERGENCY");
    }
  } else if (fingersUp === 2) { // 손가락이 두 개만 펴져 있을 때
    if (mode !== "NORMAL") {
      setMode("NORMAL");
    }
  } else if (fingersUp === 1) { // 손가락이 하나만 펴져 있을 때
    if (mode !== "OFF") {
      setMode("OFF");
    }
  }

  // 두 번째 손이 있는지 확인
  let hand2 = null;
  if (hands.length > 1) { // 두 번째 손 인식 결과가 있으면
    hand2 = hands[1]; // 두 번째 손 인식 결과 사용
  }

  if (hand2 && hand2.keypoints && hand2.keypoints.length > 0) {
    // 두 번째 손의 손가락 위치 찾기
    let indexTip2 = findKeypoint(hand2, "index_finger_tip");
    let middleTip2 = findKeypoint(hand2, "middle_finger_tip");
    let ringTip2 = findKeypoint(hand2, "ring_finger_tip");
    let pinkyTip2 = findKeypoint(hand2, "pinky_finger_tip");

    let indexPip2 = findKeypoint(hand2, "index_finger_pip");
    let middlePip2 = findKeypoint(hand2, "middle_finger_pip");
    let ringPip2 = findKeypoint(hand2, "ring_finger_pip");
    let pinkyPip2 = findKeypoint(hand2, "pinky_finger_pip");

    let wrist2 = findKeypoint(hand2, "wrist"); // 손목 위치 찾기
    let fingersUp2 = 0; // 손가락이 펴져 있는지 확인하는 변수

    // 손가락이 펴져 있는지 확인 (손가락 끝이 관절보다 위에 있는지)
    if (wrist2 && indexTip2 && indexPip2 && indexTip2.y < indexPip2.y) {
      fingersUp2++; // 검지 손가락
    }
    if (wrist2 && middleTip2 && middlePip2 && middleTip2.y < middlePip2.y) {
      fingersUp2++; // 중지 손가락
    }
    if (wrist2 && ringTip2 && ringPip2 && ringTip2.y < ringPip2.y) {
      fingersUp2++; // 약지 손가락
    }
    if (wrist2 && pinkyTip2 && pinkyPip2 && pinkyTip2.y < pinkyPip2.y) {
      fingersUp2++; // 새끼 손가락
    }

    if (fingersUp2 === 3) { // 손가락이 세 개만 펴져 있을 때
      let newValue = map(wrist2.y, 200, 400, 5000, 500); // 슬라이더 값 조정
      greenSlider.value(newValue); // 슬라이더 값 설정
    } else if (fingersUp2 === 2) { // 손가락이 두 개만 펴져 있을 때
      let newValue = map(wrist2.y, 200, 400, 2000, 100); // 슬라이더 값 조정
      yellowSlider.value(newValue); // 슬라이더 값 설정
    } else if (fingersUp2 === 1) { // 손가락이 하나만 펴져 있을 때
      let newValue = map(wrist2.y, 200, 400, 5000, 500); // 슬라이더 값 조정
      redSlider.value(newValue); // 슬라이더 값 설정
    }
  }
}

// 손가락 위치 찾기
// 손가락 이름을 통해 손가락 위치를 찾는 함수
function findKeypoint(hand, name) {
  if (!hand || !hand.keypoints) return null; // 손 인식 결과가 없으면 null 반
  for (let i = 0; i < hand.keypoints.length; i++) { // 손가락 위치를 찾기 위해 반복문 실행
    if (hand.keypoints[i].name === name) { // 손가락 이름과 일치하는 키포인트 찾기
      return hand.keypoints[i]; // 일치하는 키포인트 반환
    }
  }
  return null; // 일치하는 키포인트가 없으면 null 반환
}

function drawVideoFeed() { // 비디오 피드 그리기
  translate(150, 520);  // 비디오 위치 조정
  image(video, 0, 0, 640, 480); // 비디오 이미지 그리기

  if (hands.length > 0) { // 손 인식 결과가 있으면
    for (let i = 0; i < hands.length; i++) { 
      let hand = hands[i];
      for (let j = 0; j < hand.keypoints.length; j++) { // 손가락 위치를 반복문으로 그리기
        let keypoint = hand.keypoints[j]; // 손가락 위치
        if (keypoint.score < 0.5) continue; // 신뢰도가 낮으면 건너뛰기
        fill(255, 0, 0); // 색상 설정
        noStroke(); // 테두리 없음
        circle(640 - keypoint.x, keypoint.y, 10); // 원 그리기
      }
    }
  }
}

// 시리얼 메시지 확인
function checkSerial() {
  let n = port.available(); // 수신된 바이트 수
  if (n > 0) {
    // 수신된 바이트가 있으면
    let message = port.readUntil("\n"); // 메시지 읽기
    message = message.trim(); // 공백 제거
    if (message.length > 0) {
      // 메시지가 있으면
      messageLog.unshift(message); // 메시지 로그에 추가
      if (messageLog.length > 11) {
        // 메시지 로그가 11개 이상이면
        messageLog.pop(); // 가장 오래된 메시지 삭제
      }
      parseMessage(message); // 메시지 파싱
    }
  }
}

// 시리얼 메시지 파싱
function parseMessage(message) {
  if (message.startsWith("MODE:")) {
    // 메시지가 MODE:로 시작하면
    mode = message.substring(5);
    return;
  }
  if (message.startsWith("Brightness:")) {
    // 메시지가 Brightness:로 시작하면
    brightness = parseInt(message.substring(12).trim());
    return;
  }
  if (message === "RED") {
    // 메시지가 RED이면
    redState = true; // 빨간색 신호등 켜기
    yellowState = false; // 노란색 신호등 끄기
    greenState = false; // 초록색 신호등 끄기
    return;
  }
  if (message === "YELLOW") {
    // 메시지가 YELLOW이면
    redState = false; // 빨간색 신호등 끄기
    yellowState = true; // 노란색 신호등 켜기
    greenState = false; // 초록색 신호등 끄기
    return;
  }
  if (message === "GREEN") {
    // 메시지가 GREEN이면
    redState = false; // 빨간색 신호등 끄기
    yellowState = false; // 노란색 신호등 끄기
    greenState = true; // 초록색 신호등 켜기
    return;
  }
  if (message === "BLINKING_ALL_ON") {
    // 메시지가 BLINKING_ALL_ON이면
    redState = true; // 빨간색 신호등 켜기
    yellowState = true; // 노란색 신호등 켜기
    greenState = true; // 초록색 신호등 켜기
    return;
  }
  if (message === "ALL_LEDs_OFF") {
    // 메시지가 ALL_LEDs_OFF이면
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

  if (redState) {
    // 빨간색 신호등
    fill(255, 0, 0, brightness); // 색상 설정
  } else {
    fill(255, 0, 0, 0); // 색상 설정
  }
  ellipse(190, 130, 100, 100); // 원 그리기

  if (yellowState) {
    // 노란색 신호등
    fill(255, 255, 0, brightness); // 색상 설정
  } else {
    fill(255, 255, 0, 0); // 색상 설정
  }
  ellipse(190, 230, 100, 100); // 원 그리기

  if (greenState) {
    // 초록색 신호등
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
  for (let i = 0; i < messageLog.length; i++) {
    // 메시지 로그 출력
    text("> " + messageLog[i], 630, 115 + i * 25);
  }
}

// 각 신호등의 지속 시간을 적용
function applyDurations() {
  if (port.opened()) {
    // 포트가 열려있으면
    if (redSlider.value() !== redDuration) {
      // 슬라이더 값이 변경되면
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