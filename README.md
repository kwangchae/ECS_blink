# 신호등 제어 시스템

이 프로젝트는 아두이노를 이용한 신호등 제어 시스템과 p5.js를 이용한 웹 기반 인터페이스로 구성되어 있습니다. TaskScheduler 라이브러리를 활용하여 다양한 기능을 동시에 실행할 수 있게 구현했습니다.

## 영상
### 회로구성 및 main.cpp 설명
[![회로구성 및 main.cpp 설명](https://img.youtube.com/vi/j9kscQCVT5I/maxresdefault.jpg)](https://www.youtube.com/watch?v=j9kscQCVT5I)
### sketch.js 및 동작 설명
[![sketch.js 및 동작 설명](https://img.youtube.com/vi/Hvd-Ws8n4vo/maxresdefault.jpg)](https://www.youtube.com/watch?v=Hvd-Ws8n4vo)

## 주요 기능

### 아두이노 제어 시스템
- **여러 모드 지원**: 일반(NORMAL), 비상(EMERGENCY), 깜빡임(BLINKING), 꺼짐(OFF) 모드를 지원합니다.
- **하드웨어 인터페이스**: 버튼 3개와 가변저항을 통한 직접 제어가 가능합니다.
- **시리얼 통신**: 웹 인터페이스와 통신하여 원격 제어가 가능합니다.
- **멀티태스킹**: TaskScheduler 라이브러리를 사용하여 여러 작업을 동시에 처리합니다.

### 웹 인터페이스 (p5.js)
- **실시간 상태 표시**: 신호등의 현재 상태를 시각적으로 보여줍니다.
- **신호등 설정 변경**: 각 신호 지속 시간을 조절할 수 있습니다.
- **시리얼 메시지 로그**: 아두이노와 주고받는 모든 메시지를 실시간으로 표시합니다.

## 하드웨어 구성
![하드웨어 구성](/image_circuit.png)
### 회로 구성 상세
- **LED**: 빨간색, 노란색, 초록색 LED (PWM 핀 9, 10, 11에 연결)
  - LED 양극(+)을 디지털 핀에 연결, 음극(-)을 220Ω 저항을 통해 GND에 연결

- **버튼**: 
  - 비상 모드 버튼 (디지털 핀 2)
  - 깜빡임 모드 버튼 (디지털 핀 3)
  - ON/OFF 토글 버튼 (디지털 핀 4)
  - 모든 버튼은 **내부 풀업 저항** 사용
  - 버튼의 한쪽은 GND에 연결, 다른 쪽은 디지털 핀과 양극(+)에 연결
  - 버튼이 눌리면 디지털 핀은 LOW(0V)가 되고, 눌리지 않으면 HIGH(5V) 유지
  - 인터럽트는 **RISING** 에지에 트리거 (버튼 해제 시 신호 변화)

- **가변저항**: 밝기 조절용 (아날로그 핀 A0)
  - 가변저항 양끝은 5V와 GND에 연결
  - 가변저항 중간 단자는 아날로그 핀 A0에 연결
  - 아날로그 값 0-1023을 LED 밝기 0-255로 매핑

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
- 모든 인터럽트는 **RISING** 에지(LOW에서 HIGH로 변화)에서 발생
- 인터럽트가 발생하면 해당 플래그를 설정하고 checkButtons() 함수에서 처리

## 사용 방법

### 하드웨어 설정
1. 회로도에 따라 브레드보드에 아두이노, LED, 버튼, 가변저항을 연결합니다.
2. 아두이노 코드를 업로드합니다.

### 웹 인터페이스 사용
![웹 인터페이스 사용](/image_web.png)
1. p5.js 웹 인터페이스를 실행합니다.
2. "Connect to Arduino" 버튼을 클릭하여 아두이노와 연결합니다.
3. 슬라이더를 사용하여 각 신호의 지속 시간을 조절합니다.

## 업데이트 사항 - 제스처 인식 기능 추가
[![제스처 인식 기능 설명](https://img.youtube.com/vi/vN0ygt1NNaM/maxresdefault.jpg)](https://www.youtube.com/watch?v=vN0ygt1NNaM)
### 핸드포즈 인식을 통한 제어
- **ml5.js 라이브러리**: 머신러닝 기반 핸드포즈 인식 기능 추가
- **웹캠 통합**: 비디오 캡처를 통한 손 제스처 인식 기능 구현
- **실시간 시각화**: 웹 인터페이스에 손 인식 결과와 키포인트 표시

### 제스처로 모드 변경
- **4개 손가락 펴기**: BLINKING 모드 활성화
![4개 손가락 펴기](/image-3.png)

- **3개 손가락 펴기**: EMERGENCY 모드 활성화
![3개 손가락 펴기](/image-2.png)

- **2개 손가락 펴기**: NORMAL 모드 활성화
![2개 손가락 펴기](/image-1.png)

- **1개 손가락 펴기**: OFF 모드 활성화
![1개 손가락 펴기](/image.png)

### 두 번째 손을 통한 지속 시간 조절
- **3개 손가락 펴기**: 초록색 신호 지속 시간 조절 (손목 위치로 조절)
![alt text](20250323-1247-24.3799031.gif)
- **2개 손가락 펴기**: 노란색 신호 지속 시간 조절 (손목 위치로 조절)
![alt text](20250323-1246-00.7593675.gif)
- **1개 손가락 펴기**: 빨간색 신호 지속 시간 조절 (손목 위치로 조절)
![alt text](20250323-1239-44.2329299.gif)
## 웹 인터페이스 업데이트
- **비디오 피드 표시**: 캔버스 하단에 실시간 웹캠 영상 표시
- **손 인식 시각화**: 인식된 손의 키포인트를 빨간색 원으로 표시
- **제스처 처리 함수**: processHandGestures()를 통한 손 제스처 인식 및 처리
- **손 키포인트 검색 함수**: findKeypoint()를 통해 특정 손 부위 위치 찾기

## 사용 방법 업데이트
1. 웹캠이 연결된 상태에서 p5.js 웹 인터페이스를 실행합니다.
2. 웹캠에 손을 보여 다양한 제스처로 시스템을 제어할 수 있습니다.
3. 한 손의 펴진 손가락 개수로 모드를 변경하고, 필요시 두 번째 손으로 타이밍을 조절합니다.

## 기술적 구현
- **ml5.handPose()**: 기계 학습 모델을 사용하여 손 포즈 인식
- **손가락 검출**: 손가락 관절(PIP)과 손가락 끝(TIP) 위치 비교로 펴진 손가락 감지
- **제스처 매핑**: 펴진 손가락 개수에 따라 각 모드 및 제어 기능 연결
- **위치 기반 매핑**: 손목 Y좌표를 사용하여 슬라이더 값으로 변환

### 주의사항
- 핸드포즈 인식을 위해 충분한 조명과 명확한 손 제스처가 필요합니다.
- 웹캠 화질과 위치에 따라 인식 정확도가 달라질 수 있습니다.