#include <Arduino.h>

#define LED1 9
#define LED2 6
#define LED3 5
#define LED4 3
#define LED5 10
#define TOGGLE_LED6 16
#define RELAY 7

void setup() {
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);
  pinMode(LED4, OUTPUT);
  pinMode(LED5, OUTPUT);
  pinMode(TOGGLE_LED6, OUTPUT);
  pinMode(RELAY, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    int separatorIndex = command.indexOf(':');
    String key = command.substring(0, separatorIndex);
    String value = command.substring(separatorIndex + 1);

    if (key.startsWith("LED")) {
      int ledNumber = key.charAt(3) - '0';
      int ledValue = map(value.toInt(), 0, 255, 0, 100);
      switch(ledNumber) {
        case 1:
          analogWrite(LED1, ledValue);
          break;
        case 2:
          analogWrite(LED2, ledValue);
          break;
        case 3:
          analogWrite(LED3, ledValue);
          break;
        case 4:
          analogWrite(LED4, ledValue);
          break;
        case 5:
          analogWrite(LED5, ledValue);
          break;
      }
    } else if (key == "TOGGLERELAY") {
      if (value == "ON") {
        digitalWrite(RELAY, HIGH);
      } else {
        digitalWrite(RELAY, LOW);
      }
    }
  }
}