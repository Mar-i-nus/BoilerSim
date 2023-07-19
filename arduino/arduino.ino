#include <Arduino.h>

#define ntc1 9
#define ntc2 6
#define ntc3 5
#define ntc4 3
#define ntc5 10
#define TOGGLE_ntc6 16
#define RELAY 7
#define RELAY1 15

void setup() {
  pinMode(ntc1, OUTPUT);
  pinMode(ntc2, OUTPUT);
  pinMode(ntc3, OUTPUT);
  pinMode(ntc4, OUTPUT);
  pinMode(ntc5, OUTPUT);
  pinMode(TOGGLE_ntc6, OUTPUT);
  pinMode(RELAY, OUTPUT);
  pinMode(RELAY1, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    int separatorIndex = command.indexOf(':');
    String key = command.substring(0, separatorIndex);
    String value = command.substring(separatorIndex + 1);

    if (key.startsWith("ntc")) {
      int ntcNumber = key.charAt(3) - '0';
      int ntcValue = map(value.toInt(), 0, 255, 0, 100);
      switch(ntcNumber) {
        case 1:
          analogWrite(ntc1, ntcValue);
          break;
        case 2:
          analogWrite(ntc2, ntcValue);
          break;
        case 3:
          analogWrite(ntc3, ntcValue);
          break;
        case 4:
          analogWrite(ntc4, ntcValue);
          break;
        case 5:
          analogWrite(ntc5, ntcValue);
          break;
      }
    } else if (key == "TOGGLERELAY") {
      if (value == "ON") {
        digitalWrite(RELAY, HIGH);
      } else {
        digitalWrite(RELAY, LOW);
      }
    }
    else if (key == "NTC1_select") {
      if (value == "Open Leads") {
        digitalWrite(RELAY1, HIGH);
      } else {
        digitalWrite(RELAY1, LOW);
      }
    }
  }
}