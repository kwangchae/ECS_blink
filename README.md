# 신호등 제어 시스템

이 프로젝트는 아두이노를 이용한 신호등 제어 시스템과 p5.js를 이용한 웹 기반 인터페이스로 구성되어 있습니다. TaskScheduler 라이브러리를 활용하여 다양한 기능을 동시에 실행할 수 있게 구현했습니다.

[![추후 교체](https://img.youtube.com/vi/yv-sQHCiFtg/maxresdefault.jpg)](https://www.youtube.com/watch?v=yv-sQHCiFtg)
## 주요 기능

### 아두이노 제어 시스템
- **여러 모드 지원**: 일반(NORMAL), 비상(EMERGENCY), 깜빡임(BLINKING), 꺼짐(OFF) 모드를 지원합니다.
- **하드웨어 인터페이스**: 버튼 3개와 가변저항을 통한 직접 제어가 가능합니다.
- **시리얼 통신**: 웹 인터페이스와 통신하여 원격 제어가 가능합니다.
- **멀티태스킹**: TaskScheduler 라이브러리를 사용하여 여러 작업을 동시에 처리합니다.

### 웹 인터페이스 (p5.js)
- **실시간 상태 표시**: 신호등의 현재 상태를 시각적으로 보여줍니다.
- **신호등 설정 변경**: 각 신호 지속 시간을 조절할 수 있습니다.
- **모드 변경**: 모드를 원격으로 변경할 수 있습니다.
- **시리얼 메시지 로그**: 아두이노와 주고받는 모든 메시지를 실시간으로 표시합니다.

## 하드웨어 구성
![하드웨어 구성](/image_circuit.png)
### 회로 구성 상세
- **LED**: 빨간색, 노란색, 초록색 LED (PWM 핀 9, 10, 11에 연결)
  - LED는 각 핀에서 **디지털 출력 High(5V)** 일 때 켜지도록 구성
  - LED 양극(+)을 디지털 핀에 연결, 음극(-)을 220Ω 저항을 통해 GND에 연결

- **버튼**: 
  - 깜빡임 모드 버튼 (디지털 핀 2)
  - 비상 모드 버튼 (디지털 핀 3)
  - ON/OFF 토글 버튼 (디지털 핀 4)
  - 모든 버튼은 **풀업 저항** 사용
  - 버튼의 한쪽은 GND에 연결, 다른 쪽은 디지털 핀과 양극(+)에 연결
  - 버튼이 눌리면 디지털 핀은 LOW(0V)가 되고, 눌리지 않으면 HIGH(5V) 유지
  - 인터럽트는 **RISING** 에지에 트리거 (버튼 해제 시 신호 변화)

- **가변저항**: 밝기 조절용 (아날로그 핀 A0)
  - 가변저항 양끝은 5V와 GND에 연결
  - 가변저항 중간 단자는 아날로그 핀 A0에 연결
  - 아날로그 값 0-1023을 LED 밝기 0-255로 매핑

### 신호 상태 요약
| 컴포넌트 | 기본 상태 | 액티브 상태 | 풀업/풀다운 | 핀 모드 |
|---------|----------|------------|------------|---------|
| LED (Red) | LOW (0V) | HIGH (5V) | 해당 없음 | OUTPUT |
| LED (Yellow) | LOW (0V) | HIGH (5V) | 해당 없음 | OUTPUT |
| LED (Green) | LOW (0V) | HIGH (5V) | 해당 없음 | OUTPUT |
| 비상 모드 버튼 | HIGH (5V) | LOW (0V) | 풀업 | INPUT |
| 깜빡임 모드 버튼 | HIGH (5V) | LOW (0V) | 풀업 | INPUT |
| ON/OFF 토글 버튼 | HIGH (5V) | LOW (0V) | 풀업 | INPUT |
| 가변저항 | 0~5V (가변) | 해당 없음 | 해당 없음 | INPUT |

## 소프트웨어 구성

### 아두이노 코드
- **TaskScheduler 라이브러리**: 멀티태스킹 구현
- **PinChangeInterrupt 라이브러리**: 버튼 인터럽트 처리
- **시리얼 통신**: 웹 인터페이스와 통신

### p5.js 웹 인터페이스
- **p5.js**: 그래픽 및 인터랙티브 인터페이스 구현
- **p5.webserial**: 아두이노와 시리얼 통신

## 신호등 동작 순서 (일반 모드)
1. 빨간색 점등 (설정된 시간 동안)
2. 노란색 점등 (설정된 시간 동안)
3. 초록색 점등 (설정된 시간 동안)
4. 초록색 깜빡임 (3회, 3Hz)
5. 노란색 점등 (설정된 시간 동안)
6. 1번으로 돌아가 반복

## 인터럽트 처리
- **디지털 핀 2, 3**: attachInterrupt() 함수를 사용하여 표준 외부 인터럽트로 설정
- **디지털 핀 4**: PinChangeInterrupt 라이브러리를 사용하여 PCINT로 설정
- 모든 인터럽트는 RISING 에지(LOW에서 HIGH로 변화)에서 발생
- 인터럽트가 발생하면 해당 플래그를 설정하고 메인 루프의 checkButtons() 함수에서 처리

## 사용 방법

### 하드웨어 설정
1. 회로도에 따라 브레드보드에 아두이노, LED, 버튼, 가변저항을 연결합니다.
2. 아두이노 코드를 업로드합니다.

### 웹 인터페이스 사용
![웹 인터페이스 사용](/image_web.png)
1. p5.js 웹 인터페이스를 실행합니다.
2. "Connect to Arduino" 버튼을 클릭하여 아두이노와 연결합니다.
3. 슬라이더를 사용하여 각 신호의 지속 시간을 조절하고 "Apply Durations" 버튼을 클릭합니다.
4. 모드 버튼을 클릭하여 신호등 모드를 변경합니다.

## 주의사항
- 웹 인터페이스는 WebSerial API를 지원하는 브라우저(Chrome, Edge 등)에서만 작동합니다.
- 아두이노와 연결하기 전에 올바른 포트를 선택해야 합니다.
- 가변저항을 조절하여 LED 밝기를 조절할 때는 PWM 제어를 통해 밝기가 변경되므로, 아날로그 값 변화에 따른 지연이 발생할 수 있습니다.

## 트러블슈팅
- 버튼이 제대로 동작하지 않는 경우, 풀업 저항이 제대로 설정되었는지 확인하세요.
- LED가 점등되지 않는 경우, 극성이 올바르게 연결되었는지 확인하세요.
- 인터럽트가 작동하지 않는 경우, 버튼 디바운싱이 필요할 수 있습니다.