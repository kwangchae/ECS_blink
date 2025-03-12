#include <Arduino.h>
#include <TaskScheduler.h>

// 핀 번호 정의
#define RED_PIN 23  // RED_LED를 위한 PWM 핀
#define YELLOW_PIN 24  // YRLLOW_LED를 위한 PWM 핀
#define GREEN_PIN 25  // GREEN_LED를 위한 PWM 핀

#define BUTTON_EMERGENCY 21 // 비상모드를 위한 버튼이 연결된 핀
#define BUTTON_BLINKING 20 // 깜박임모드를 위한 버튼이 연결된 핀
#define BUTTON_TOGGLE 19 // ON/OFF를 위한 버튼이 연결된 핀

#define POTENTIOMETER_PIN A0 // 밝기 조절을 위한 가변저항이 연결된 핀
#define SERIAL_BAUDRATE 9600 // 시리얼 통신 속도

// 모드 정의
enum Mode {
    NORMAL, // 일반모드
    EMERGENCY, // 비상모드
    BLINKING, // 깜박임모드
    OFF // LED 끄기
};

// 전역 변수 선언
Mode currentMode = NORMAL; // 현재 모드 초기화
int brightness = 255; // 최대 밝기 초기화
unsigned long redDuration = 2000; // RED_LED가 켜져있는 시간 2초
unsigned long yellowDuration = 500; // YELLOW_LED가 켜져있는 시간 0.5초
unsigned long greenDuration = 2000; // GREEN_LED가 켜져있는 시간 2초
unsigned long blinkDuration = 1000; // 깜박임 시간 1초

// 버튼 디바운스 관련 변수
bool emergencyButtonState = false; // 비상모드 버튼 눌림 여부
bool blinkingButtonState = false; // 깜박임모드 버튼 눌림 여부
bool toggleButtonState = false; // ON/OFF 토글 버튼 상태
unsigned long lastDebounceTime = 0; // 마지막 디바운스 시간
unsigned long debounceDelay = 50; // 디바운스 딜레이

// 함수 선언
void normalSequence();
void emergencySequence();
void blinkingSequence();
void checkButtons();
void readPotentiometer();
void processSerial();

// TaskScheduler 객체 생성
Scheduler runner;

// 상태 시퀀스 Task
Task tNormal(redDuration, TASK_FOREVER, &normalSequence, &runner, false); // 일반모드 Task
Task tEmergency(100, TASK_FOREVER, &emergencySequence, &runner, false); // 비상모드 Task
Task tBlinking(500, TASK_FOREVER, &blinkingSequence, &runner, false); // 깜박임모드 Task

// 버튼 체크, 가변저항 값 읽기, 시리얼 입력 처리 Task
Task tButtons(50, TASK_FOREVER, &checkButtons, &runner, true); // 버튼 체크 Task
Task tPotentiometer(100, TASK_FOREVER, &readPotentiometer, &runner, true); // 가변저항 값 읽기 Task
Task tSerial(100, TASK_FOREVER, &processSerial, &runner, true); // 시리얼 입력 처리 Task


// 기본 시퀀스 상태 변수
int normalState = 0; // 일반모드 상태
// 0: RED
// 1: YELLOW
// 2: GREEN
// 3: Blinking Green
// 4: Yellow


void setAllLEDs(int r, int y, int g) {
    analogWrite(RED_PIN, r * brightness / 255);
    analogWrite(YELLOW_PIN, y * brightness / 255);
    analogWrite(GREEN_PIN, g * brightness / 255);
}

void turnOffAllLEDs() {
    setAllLEDs(0, 0, 0);
}

// 일반모드 시퀀스 함수 정의 (RED -> YELLOW -> GREEN -> Blinking Green -> YELLOW)
void normalSequence(){
    switch (normalState) {
        case 0: // RED
            setAllLEDs(255, 0, 0);
            tNormal.setInterval(redDuration);
            normalState = 1;
            Serial.println("RED");
            break;
        case 1: // YELLOW
            setAllLEDs(0, 255, 0);
            tNormal.setInterval(yellowDuration);
            normalState = 2;
            Serial.println("YELLOW");
            break;
        case 2: // GREEN
            setAllLEDs(0, 0, 255);
            tNormal.setInterval(greenDuration);
            normalState = 3;
            Serial.println("GREEN");
            break;
        case 3: // Blinking Green (3Hz)
            static int blinkCount = 0;
            static bool blinkState = false;

            if(blinkState){
                setAllLEDs(0, 0, 255);
                blinkState = false;
            } else {
                setAllLEDs(0, 0, 0);
                blinkState = true;
                blinkCount++;
            }

            if(blinkCount >= 3){
                blinkCount = 0;
                normalState = 4;
                tNormal.setInterval(166);
            } else {
                tNormal.setInterval(166);
            }
            Serial.println(blinkState ? "GREEN_BLINK_OFF" : "GREEN_BLINK_ON");
            break;
        case 4: // Yellow
            setAllLEDs(0, 255, 0);
            tNormal.setInterval(yellowDuration);
            normalState = 0;
            Serial.println("YELLOW");
            break;
    }
}

// 비상모드 시퀀스 함수 정의 (RED)
void emergencySequence(){
    setAllLEDs(255, 0, 0);
}

// 깜박이모드 시퀀스 함수 정의 (Blinking All)
void blinkingSequence(){
    static bool blinkAllState = false;

    if(blinkAllState){
        setAllLEDs(255, 255, 255);
    } else {
        turnOffAllLEDs();
    }
    blinkAllState = !blinkAllState;
}

// 모드 설정 함수
void setMode(Mode newMode){
    if (newMode == currentMode) return;

    // 이전 모드 종료
    tNormal.disable();
    tEmergency.disable();
    tBlinking.disable();

    // 새 모드 설정
    switch (newMode) {
        case NORMAL:
            normalState = 0; // 일반모드 상태 초기화
            tNormal.enable();
            Serial.println("MODE:NORMAL");
            break;
        case EMERGENCY:
            tEmergency.enable();
            Serial.println("MODE:EMERGENCY");
            break;
        case BLINKING:
            tBlinking.enable();
            Serial.println("MODE:BLINKING");
            break;
        case OFF:
            turnOffAllLEDs();
            Serial.println("MODE:OFF");
            break;
    }

    currentMode = newMode;
}

// 버튼 체크
void checkButtons(){
    // 버튼 읽기
    bool emergencyReading = digitalRead(BUTTON_EMERGENCY);
    bool blinkingReading = digitalRead(BUTTON_BLINKING);
    bool toggleReading = digitalRead(BUTTON_TOGGLE);

    // 디바운스 처리
    if(emergencyReading != emergencyButtonState ||
        blinkingReading != blinkingButtonState || 
        toggleReading != toggleButtonState){
        lastDebounceTime = millis();
    }

    if((millis() - lastDebounceTime) > debounceDelay){
        // 비상모드 버튼이 눌렸을 때
        if(emergencyReading && !emergencyButtonState){
            setMode(EMERGENCY);
        }

        // 깜박임모드 버튼이 눌렸을 때
        if (blinkingReading && !blinkingButtonState){
            setMode(BLINKING);
        }

        // ON/OFF 토글 버튼이 눌렸을 때
        if (toggleReading && !toggleButtonState){
            if(currentMode == OFF){
                setMode(NORMAL);
            } else {
                setMode(OFF);
            }
        }
    }

    // 버튼 상태 업데이트
    emergencyButtonState = emergencyReading;
    blinkingButtonState = blinkingReading;
    toggleButtonState = toggleReading;
}

// 가변저항 값 읽기
void readPotentiometer(){
    int potValue = analogRead(POTENTIOMETER_PIN);
    brightness = map(potValue, 0, 1023, 10, 255);

    // 시리얼 출력
    Serial.print("Brightness: ");
    Serial.println(brightness);
}

// 시리얼 입력 처리
void processSerial() {
    if (Serial.available() > 0) {
      String command = Serial.readStringUntil('\n');
      command.trim();
      
      // Process commands in format "PARAM:VALUE"
      int separatorPos = command.indexOf(':');
      if (separatorPos > 0) {
        String param = command.substring(0, separatorPos);
        String value = command.substring(separatorPos + 1);
        
        if (param == "RED") {
          redDuration = value.toInt();
          Serial.print("RED_DURATION:");
          Serial.println(redDuration);
        } 
        else if (param == "YELLOW") {
          yellowDuration = value.toInt();
          Serial.print("YELLOW_DURATION:");
          Serial.println(yellowDuration);
        } 
        else if (param == "GREEN") {
          greenDuration = value.toInt();
          Serial.print("GREEN_DURATION:");
          Serial.println(greenDuration);
        }
        else if (param == "MODE") {
          if (value == "NORMAL") setMode(NORMAL);
          else if (value == "EMERGENCY") setMode(EMERGENCY);
          else if (value == "BLINKING") setMode(BLINKING);
          else if (value == "OFF") setMode(OFF);
        }
      }
    }
}

// 초기 설정
void setup() {
    // 핀 모드 설정
    pinMode(RED_PIN, OUTPUT);
    pinMode(YELLOW_PIN, OUTPUT);
    pinMode(GREEN_PIN, OUTPUT);
    
    pinMode(BUTTON_EMERGENCY, INPUT_PULLUP);
    pinMode(BUTTON_BLINKING, INPUT_PULLUP);
    pinMode(BUTTON_TOGGLE, INPUT_PULLUP);
    
    pinMode(POTENTIOMETER_PIN, INPUT);
    
    // 시리얼 통신 시작
    Serial.begin(9600);
    Serial.println("Traffic Light System Started");
    
    // TaskScheduler 시작
    setMode(NORMAL);
}

void loop() {
    runner.execute(); // TaskScheduler 실행
}