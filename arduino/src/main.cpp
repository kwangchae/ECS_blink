#include <Arduino.h>
#include <TaskScheduler.h>
#include "PinChangeInterrupt.h"

// 핀 번호 정의
#define RED_PIN 9  // RED_LED를 위한 PWM 핀
#define YELLOW_PIN 10  // YRLLOW_LED를 위한 PWM 핀
#define GREEN_PIN 11  // GREEN_LED를 위한 PWM 핀

#define BUTTON_EMERGENCY 2 // 비상모드를 위한 버튼이 연결된 핀
#define BUTTON_BLINKING 3 // 깜박임모드를 위한 버튼이 연결된 핀
#define BUTTON_TOGGLE 4 // ON/OFF를 위한 버튼이 연결된 핀

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
int brightness = 0; // 밝기 초기화
unsigned long redDuration = 2000; // RED_LED가 켜져있는 시간 2초
unsigned long yellowDuration = 500; // YELLOW_LED가 켜져있는 시간 0.5초
unsigned long greenDuration = 2000; // GREEN_LED가 켜져있는 시간 2초

// LED 색상 값 저장 변수
int currentRedValue = 0; // 현재 RED_LED 색상 값
int currentYellowValue = 0; // 현재 YELLOW_LED 색상 값
int currentGreenValue = 0; // 현재 GREEN_LED 색상 값

// 버튼 눌림 여부
volatile bool emergencyButtonPressed = false; // 비상모드 버튼 눌림 여부
volatile bool blinkingButtonPressed = false; // 깜박임모드 버튼 눌림 여부
volatile bool toggleButtonPressed = false; // ON/OFF 토글 버튼 눌림 여부

// 함수 선언
void normalSequence(); // 일반모드 시퀀스 함수
void blinkingSequence(); // 깜박임모드 시퀀스 함수
void checkButtons(); // 버튼 체크 함수
void readPotentiometer(); // 가변저항 값 읽기 함수
void processSerial(); // 시리얼 입력 처리 함수
void updateLEDs(); // LED 업데이트 함수

void emergencyISR() { // 비상모드 버튼 눌림 ISR
    emergencyButtonPressed = true;
}
void blinkingISR() { // 깜박임모드 버튼 눌림 ISR
    blinkingButtonPressed = true;
}
void toggleISR() { // ON/OFF 토글 버튼 눌림 ISR
    toggleButtonPressed = true;
}

// TaskScheduler 객체 생성
Scheduler runner;

// Task 객체 생성
Task tNormal(redDuration, TASK_FOREVER, &normalSequence, &runner, false); // 일반모드 Task
Task tBlinking(500, TASK_FOREVER, &blinkingSequence, &runner, false); // 깜박임모드 Task

Task tButtons(20, TASK_FOREVER, &checkButtons, &runner, true); // 버튼 체크 Task
Task tPotentiometer(20, TASK_FOREVER, &readPotentiometer, &runner, true); // 가변저항 값 읽기 Task
Task tSerial(20, TASK_FOREVER, &processSerial, &runner, true); // 시리얼 입력 처리 Task
Task tUpdateLEDs(20, TASK_FOREVER, &updateLEDs, &runner, true); // LED 업데이트 Task

// LED 색상 설정 함수 (내부 상태만 변경)
void setLEDColors(int r, int y, int g) {
    currentRedValue = r;
    currentYellowValue = y;
    currentGreenValue = g;
}

// LED 업데이트 함수 (실제 하드웨어 제어)
void updateLEDs() {
    // 밝기 적용하여 LED 제어
    analogWrite(RED_PIN, currentRedValue * brightness / 255);
    analogWrite(YELLOW_PIN, currentYellowValue * brightness / 255);
    analogWrite(GREEN_PIN, currentGreenValue * brightness / 255);
}

// 일반모드 시퀀스 상태 변수
int normalState = 0; // 일반모드 상태
// 0: RED
// 1: YELLOW
// 2: GREEN
// 3: Blinking Green
// 4: Yellow

// 일반모드 시퀀스 함수 정의 (RED -> YELLOW -> GREEN -> Blinking Green -> YELLOW)
void normalSequence(){
    switch (normalState) {
        case 0: // RED
            setLEDColors(255, 0, 0);
            Serial.println("RED");
            tNormal.setInterval(redDuration);
            normalState = 1;
            break;
        case 1: // YELLOW
            setLEDColors(0, 255, 0);
            Serial.println("YELLOW");
            tNormal.setInterval(yellowDuration);
            normalState = 2;            
            break;
        case 2: // GREEN
            setLEDColors(0, 0, 255);
            Serial.println("GREEN");
            tNormal.setInterval(greenDuration);
            normalState = 3;            
            break;
        case 3: // Blinking Green (3Hz)
            static int blinkCount = 0;
            static bool blinkState = false;

            if(blinkState){
                setLEDColors(0, 0, 255);
                Serial.println("GREEN");
                blinkState = false;
                blinkCount++;
            } else {
                setLEDColors(0, 0, 0);
                Serial.println("ALL_LEDs_OFF");
                blinkState = true;
            }

            if(blinkCount >= 3){
                blinkCount = 0;
                normalState = 4;
            } else {
                tNormal.setInterval(166);
            }
            break;
        case 4: // Yellow
            setLEDColors(0, 255, 0);
            Serial.println("YELLOW");
            tNormal.setInterval(yellowDuration);
            normalState = 0;            
            break;
    }
}

// 깜박임모드 시퀀스 함수 정의
void blinkingSequence(){
    static bool blinkAllState = false;
    if(blinkAllState){
        setLEDColors(255, 255, 255);
        Serial.println("BLINKING_ALL_ON");
    } else {
        setLEDColors(0, 0, 0);
        Serial.println("ALL_LEDs_OFF");
    }
    blinkAllState = !blinkAllState;
}

// 모드 설정 함수
void setMode(Mode newMode){
    // 이전 모드 비활성화
    tNormal.disable();
    tBlinking.disable();

    // 새 모드 설정
    switch (newMode) {
        case NORMAL:
            normalState = 0; // 일반모드 상태 초기화
            tNormal.enable();
            Serial.println("MODE:NORMAL");
            break;
        case EMERGENCY:
            setLEDColors(255, 0, 0); // 비상모드에서 RED_LED 켜기
            Serial.println("MODE:EMERGENCY");
            Serial.println("RED");
            break;
        case BLINKING:
            tBlinking.enable();
            Serial.println("MODE:BLINKING");
            break;
        case OFF:
            setLEDColors(0, 0, 0);
            Serial.println("MODE:OFF");
            Serial.println("ALL_LEDs_OFF");
            break;
    }
    currentMode = newMode;
}

// 버튼 체크 함수, 버튼 눌림 여부에 따라 모드 변경
void checkButtons() {
    if (emergencyButtonPressed) { // 비상모드 버튼 눌림
        Serial.println("Emergency button pressed"); 
        if(currentMode == EMERGENCY) { 
            setMode(NORMAL); // 비상모드에서 일반모드로 전환
        } else {
            setMode(EMERGENCY); // 비상모드로 전환
        }
      emergencyButtonPressed = false; 
    }
    if (blinkingButtonPressed) { // 깜박임모드 버튼 눌림
        Serial.println("Blinking button pressed");
        if(currentMode == BLINKING) { 
            setMode(NORMAL); // 깜박임모드에서 일반모드로 전환
        } else {
            setMode(BLINKING); // 깜박임모드로 전환
        }      
      blinkingButtonPressed = false;
    }
    if (toggleButtonPressed) { // ON/OFF 토글 버튼 눌림
        Serial.println("ON/OFF button pressed");
        if (currentMode == OFF) {
            setMode(NORMAL); // OFF 상태에서 일반모드로 전환
        } else {
            setMode(OFF); // 현재 모드에서 OFF 상태로 전환
        }        
        toggleButtonPressed = false;
    }
}

// 가변저항 값 읽기
void readPotentiometer(){ 
    int potValue = analogRead(POTENTIOMETER_PIN); // 가변저항 값 읽기
    int newBrightness = map(potValue, 0, 1023, 0, 255); // 0~1023 -> 0~255로 변환
    
    // 값이 변경된 경우에만 업데이트 및 출력
    if (abs(newBrightness - brightness) > 2) { // 작은 변화는 무시 (노이즈 방지)
        brightness = newBrightness;
        Serial.print("Brightness: ");
        Serial.println(brightness);
    }
}

// 시리얼 입력 처리
void processSerial() {
    if (Serial.available() > 0) {
      String command = Serial.readStringUntil('\n'); // 개행 문자까지 읽기
      command.trim(); // 앞뒤 공백 제거
      int separatorPos = command.indexOf(':'); // : 위치 찾기
      if (separatorPos > 0) { // : 문자가 있는 경우
        String param = command.substring(0, separatorPos); // : 앞부분
        String value = command.substring(separatorPos + 1); // : 뒷부분
        
        if (param == "RED") {
          redDuration = value.toInt(); // 문자열을 정수로 변환 후 저장
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
    pinMode(RED_PIN, OUTPUT); // RED_LED 핀을 출력으로 설정
    pinMode(YELLOW_PIN, OUTPUT); // YELLOW_LED 핀을 출력으로 설정
    pinMode(GREEN_PIN, OUTPUT); // GREEN_LED 핀을 출력으로 설정
    pinMode(BUTTON_EMERGENCY, INPUT_PULLUP); // 비상모드 버튼 핀을 입력으로 설정 (풀업 저항 사용)
    pinMode(BUTTON_BLINKING, INPUT_PULLUP); // 깜박임모드 버튼 핀을 입력으로 설정 (풀업 저항 사용)
    pinMode(BUTTON_TOGGLE, INPUT_PULLUP); // ON/OFF 토글 버튼 핀을 입력으로 설정 (풀업 저항 사용)
    pinMode(POTENTIOMETER_PIN, INPUT); // 가변저항 핀을 입력으로 설정

    // 인터럽트 설정
    attachInterrupt(digitalPinToInterrupt(BUTTON_EMERGENCY), emergencyISR, RISING); // 비상모드 버튼 인터럽트 설정
    attachInterrupt(digitalPinToInterrupt(BUTTON_BLINKING), blinkingISR, RISING); // 깜박임모드 버튼 인터럽트 설정
    
    // PinChangeInterrupt 라이브러리 사용하여 인터럽트 설정
    attachPCINT(digitalPinToPCINT(BUTTON_TOGGLE), toggleISR, RISING); // ON/OFF 토글 버튼 인터럽트 설정

    // 시리얼 통신 시작
    Serial.begin(9600);
    Serial.println("Serial started");

    // TaskScheduler 시작
    setMode(NORMAL);
}

void loop() {
    runner.execute(); // TaskScheduler 실행
}