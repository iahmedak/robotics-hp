#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <time.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include "ArduinoJson.h"

// ============================================================
// CROC OS v0.5.3 - UI Layout & Buffer Fixes
// ============================================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define I2C_ADDRESS 0x3C
Adafruit_SH1106G display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

const int TOUCH_1_PIN = 27;
const int TOUCH_2_PIN = 14;
const int BUZZER_PIN  = 26;

// ---------------- WIFI & WEATHER ----------------
const char* ssid     = "[REDACTED_SSID]";
// L26: [REDACTED: WiFi password - see secrets.example.h]
String openWeatherApiKey = "[REDACTED_API_KEY]";
String lat = "13.9853";
String lon = "74.5553";

const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800; // IST
const int daylightOffset_sec = 0;

// ---------------- STATE VARIABLES ----------------
int petHappiness = 80;
int petHunger = 80;
unsigned long lastStatDecay = 0;
int pcCPU = 0, pcRAM = 0, pcGPU = 0;

bool pomodoroRunning = false;
bool pomodoroDone = false;
unsigned long pomodoroStart = 0;
unsigned long pomodoroElapsed = 0;
const unsigned long POMODORO_DURATION = 1500000UL; // 25 Min

enum CrocExpression {
  EX_IDLE, EX_HAPPY, EX_SURPRISED, EX_CURIOUS, EX_SLEEPY, EX_ANGRY, 
  EX_TRICK, EX_LOVE, EX_EXCITED, EX_SHY, EX_HUNGRY, EX_CONFUSED, 
  EX_SUSPICIOUS, EX_DIZZY, EX_PROUD, EX_YAWN
};
CrocExpression expression = EX_IDLE;
enum ScreenMode { FACE_MODE, INFO_MODE };
ScreenMode screenMode = FACE_MODE;
int infoPage = 1;

struct WordEntry { const char* word; const char* phonetic; const char* meaning; };
WordEntry wordList[] = {
  {"Petrichor", "/pet-ri-kor/", "The earthy scent produced when rain falls on dry soil."},
  {"Vellichor", "/vel-i-kor/", "The strange, wistful atmosphere of used bookshops."},
  {"Sonder", "/son-der/", "Realizing every random passerby has a complex life."},
  {"Lullaby", "/lul-uh-by/", "A quiet, gentle song used to induce sleep."},
  {"Solitude", "/sol-i-tood/", "The state of peaceful and voluntary seclusion."},
  {"Euphoria", "/yoo-for-ee-uh/", "A profound feeling of intense happiness."},
  {"Elysian", "/ih-lizh-uhn/", "Beautiful, divinely inspired, and perfectly peaceful."}
};
int totalWords = 7;
unsigned long pageEnterTime = 0;

// ---------------- ENGINE TIMERS ----------------
unsigned long expressionUntil = 0;
unsigned long lastFrame = 0;
unsigned long nextBlink = 4000;
unsigned long lastInteraction = 0;
bool blinking = false;
unsigned long blinkStart = 0;
float eyeX = 0, eyeY = 0;
int eyeTargetX = 0, eyeTargetY = 0;
unsigned long nextLook = 0;
String weatherString = "Fetching...";

// ---------------- GESTURE ENGINE ----------------
unsigned long t1Start = 0, t2Start = 0;
unsigned long dualStart = 0;
bool t1WasPressed = false, t2WasPressed = false;
bool dualHandled = false;

void setup() {
  Serial.begin(115200);
  pinMode(TOUCH_1_PIN, INPUT);
  pinMode(TOUCH_2_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin(21, 22);
  if (!display.begin(I2C_ADDRESS, true)) { while (true) delay(100); }

  display.setTextColor(SH110X_WHITE);
  display.clearDisplay(); display.setTextSize(2); display.setCursor(5, 20); 
  display.print("CROC v0.5.3"); display.display();
  delay(1000);

  connectWiFi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  fetchWeather();
  lastInteraction = millis();
}

void loop() {
  unsigned long now = millis();
  readSerialTelemetry();
  handleTouches(now);
  
  if (now - lastStatDecay >= 30000UL) {
    lastStatDecay = now;
    petHappiness = max(0, petHappiness - 1);
    petHunger = max(0, petHunger - 2);
  }
  updateExpression(now);

  if (now - lastFrame >= 33) {
    lastFrame = now;
    if (screenMode == FACE_MODE) updateFace(now);
    else drawInfoScreen(now);
  }
}

// ============================================================
// GESTURE ENGINE
// ============================================================
void handleTouches(unsigned long now) {
  bool t1 = digitalRead(TOUCH_1_PIN);
  bool t2 = digitalRead(TOUCH_2_PIN);
  if (t1 || t2) lastInteraction = now;

  // Dual Hold Check
  if (t1 && t2) {
    if (dualStart == 0) dualStart = now;
    if (now - dualStart > 800 && !dualHandled) {
      dualHandled = true;
      screenMode = (screenMode == FACE_MODE) ? INFO_MODE : FACE_MODE;
      pageEnterTime = now;
      beepCurious();
    }
  } else {
    dualStart = 0;
  }

  // T1 Gestures
  if (t1 && !t1WasPressed) t1Start = now;
  if (!t1 && t1WasPressed) {
    if (!dualHandled && (now - t2Start > 500 || !t2)) { 
      unsigned long dur = now - t1Start;
      if (dur > 800) { 
        if (screenMode == FACE_MODE) { setExpression(EX_YAWN, 2000); beepPurr(); }
      } else {
        if (screenMode == FACE_MODE) {
          petHappiness = min(100, petHappiness + 15); setExpression(EX_LOVE, 1500); beepPurr();
        } else {
          infoPage = (infoPage % 7) + 1; pageEnterTime = now; beepPageFlip();
        }
      }
    }
  }

  // T2 Gestures
  if (t2 && !t2WasPressed) t2Start = now;
  if (!t2 && t2WasPressed) {
    if (!dualHandled && (now - t1Start > 500 || !t1)) {
      unsigned long dur = now - t2Start;
      if (dur > 800) {
        if (screenMode == FACE_MODE) { 
          setExpression(EX_ANGRY, 1500); beepAngry(); 
        } else if (screenMode == INFO_MODE && infoPage == 5) {
          // POMODORO RESET ON HOLD
          pomodoroRunning = false; pomodoroDone = false; pomodoroElapsed = 0; beepTrick();
        }
      } else {
        if (screenMode == FACE_MODE) {
          petHunger = min(100, petHunger + 20); doTrick();
        } else {
          if (infoPage == 5) {
            if (pomodoroDone) { pomodoroDone = false; pomodoroElapsed = 0; }
            else { pomodoroRunning = !pomodoroRunning; if(pomodoroRunning) pomodoroStart = now - pomodoroElapsed; }
            beepHappy();
          } else {
            infoPage = (infoPage == 1) ? 7 : infoPage - 1; pageEnterTime = now; beepPageFlip();
          }
        }
      }
    }
  }

  if (!t1 && !t2) dualHandled = false;
  t1WasPressed = t1; t2WasPressed = t2;
}

// ============================================================
// FACE ENGINE
// ============================================================
void updateFace(unsigned long now) {
  if (expression == EX_IDLE || expression == EX_HUNGRY) {
    if (!blinking && now >= nextBlink) { blinking = true; blinkStart = now; }
    if (blinking && now - blinkStart > 160) { blinking = false; nextBlink = now + random(2500, 6000); }
    if (now >= nextLook) { eyeTargetX = random(-4, 5); eyeTargetY = random(-2, 3); nextLook = now + random(1500, 3500); }
  } else {
    blinking = false; eyeTargetX = 0; eyeTargetY = 0;
  }
  eyeX += (eyeTargetX - eyeX) * 0.15; eyeY += (eyeTargetY - eyeY) * 0.15;
  drawFace((int)eyeX, (int)eyeY, now);
}

void drawFace(int lookX, int lookY, unsigned long now) {
  display.clearDisplay();
  if (expression == EX_SLEEPY) { drawAnimatedSleep(now); display.display(); return; }

  int eyeW = 28, eyeH = 22, leftX = 20, rightX = 80, eyeYPos = 16;
  bool drawPupils = true;
  
  if (expression == EX_IDLE) { eyeH = 20 + (sin(now / 500.0) * 2); eyeW = 26; }
  if (expression == EX_HAPPY) { eyeH = 14; eyeYPos = 20; }
  else if (expression == EX_LOVE) { eyeW = 32; eyeH = 32; eyeYPos = 10; leftX = 16; rightX = 80; }
  else if (expression == EX_PROUD) { eyeH = 14; eyeYPos = 20; }
  else if (expression == EX_EXCITED || expression == EX_SURPRISED) { eyeW = 28; eyeH = 28; eyeYPos = 12; }
  else if (expression == EX_SUSPICIOUS) { eyeH = 8; eyeYPos = 20; }
  else if (expression == EX_YAWN) { eyeH = 4; eyeYPos = 22; drawPupils = false; }
  else if (expression == EX_DIZZY) { drawPupils = false; }
  else if (expression == EX_SHY) { eyeYPos = 20; eyeH = 18; lookY = 4; lookX = (now%2000 > 1000) ? -2 : 2; }
  else if (expression == EX_CONFUSED) { drawPupils = false; }

  if (blinking) {
    display.fillRoundRect(leftX, 26, eyeW, 4, 2, SH110X_WHITE);
    display.fillRoundRect(rightX, 26, eyeW, 4, 2, SH110X_WHITE);
  } else if (expression == EX_DIZZY) {
    display.drawCircle(leftX+14, 24, 10, SH110X_WHITE); display.drawCircle(leftX+14, 24, 4, SH110X_WHITE);
    display.drawCircle(rightX+14, 24, 10, SH110X_WHITE); display.drawCircle(rightX+14, 24, 4, SH110X_WHITE);
  } else if (expression == EX_CONFUSED) {
    display.fillRoundRect(leftX, 16, 20, 20, 6, SH110X_WHITE); 
    display.fillRoundRect(rightX, 12, 30, 30, 8, SH110X_WHITE); 
    display.fillCircle(leftX+10+lookX, 26+lookY, 4, SH110X_BLACK);
    display.fillCircle(rightX+15+lookX, 27+lookY, 6, SH110X_BLACK);
  } else {
    display.fillRoundRect(leftX, eyeYPos, eyeW, eyeH, 8, SH110X_WHITE);
    display.fillRoundRect(rightX, eyeYPos, eyeW, eyeH, 8, SH110X_WHITE);
    if (drawPupils) {
      int pupilSize = (expression == EX_SURPRISED) ? 4 : 6;
      if (expression == EX_LOVE) pupilSize = 10;
      display.fillCircle(leftX + eyeW/2 + lookX, eyeYPos + eyeH/2 + lookY, pupilSize, SH110X_BLACK);
      display.fillCircle(rightX + eyeW/2 + lookX, eyeYPos + eyeH/2 + lookY, pupilSize, SH110X_BLACK);
      if (expression == EX_LOVE) {
        display.fillCircle(leftX + eyeW/2 + lookX - 3, eyeYPos + eyeH/2 + lookY - 3, 3, SH110X_WHITE);
        display.fillCircle(rightX + eyeW/2 + lookX - 3, eyeYPos + eyeH/2 + lookY - 3, 3, SH110X_WHITE);
      }
    }
  }

  if (expression == EX_ANGRY) {
    display.drawLine(leftX, 10, leftX + 22, 18, SH110X_WHITE); display.drawLine(rightX + 6, 18, rightX + 28, 10, SH110X_WHITE);
  } else if (expression == EX_PROUD) {
    display.drawLine(leftX, 16, leftX + 22, 10, SH110X_WHITE); display.drawLine(rightX + 6, 10, rightX + 28, 16, SH110X_WHITE);
  } else if (expression == EX_CURIOUS) {
    display.drawLine(leftX, 10, leftX + 20, 8, SH110X_WHITE);
  } else if (expression == EX_SHY) {
    display.drawPixel(leftX-4, 30, SH110X_WHITE); display.drawPixel(leftX-6, 32, SH110X_WHITE);
    display.drawPixel(rightX+eyeW+4, 30, SH110X_WHITE); display.drawPixel(rightX+eyeW+6, 32, SH110X_WHITE);
  }

  int cx = 64;
  if (expression == EX_HAPPY || expression == EX_PROUD) {
    display.drawLine(56, 50, 60, 54, SH110X_WHITE); display.drawLine(60, 54, 68, 54, SH110X_WHITE); display.drawLine(68, 54, 72, 50, SH110X_WHITE);
  } else if (expression == EX_LOVE || expression == EX_EXCITED) {
    display.fillTriangle(58, 50, 70, 50, 64, 56, SH110X_WHITE);
  } else if (expression == EX_YAWN) {
    display.fillCircle(cx, 50, 8, SH110X_WHITE);
  } else if (expression == EX_SURPRISED) {
    display.drawCircle(cx, 52, 5, SH110X_WHITE);
  } else if (expression == EX_ANGRY || expression == EX_SUSPICIOUS) {
    display.drawLine(54, 53, 64, 49, SH110X_WHITE); display.drawLine(64, 49, 74, 53, SH110X_WHITE);
  } else if (expression == EX_CONFUSED) {
    display.drawLine(56, 52, 60, 50, SH110X_WHITE); display.drawLine(60, 50, 64, 54, SH110X_WHITE); display.drawLine(64, 54, 68, 52, SH110X_WHITE);
  } else if (expression == EX_HUNGRY) {
    display.drawCircle(cx, 53, 3, SH110X_WHITE);
  } else {
    display.drawLine(58, 52, 64, 53, SH110X_WHITE); display.drawLine(64, 53, 70, 52, SH110X_WHITE);
  }
  display.display();
}

void drawAnimatedSleep(unsigned long now) {
  int eyeY = 28 + (sin(now / 800.0) * 2);
  display.fillRoundRect(20, eyeY, 28, 4, 2, SH110X_WHITE);
  display.fillRoundRect(80, eyeY, 28, 4, 2, SH110X_WHITE);
  
  float z1 = fmod((now / 1500.0), 1.0); float z2 = fmod(((now+750) / 1500.0), 1.0);
  display.setTextSize(1);
  if(z1 > 0.1) { display.setCursor(95 + sin(z1*5)*3, 25 - (z1 * 15)); display.print("z"); }
  display.setTextSize(2);
  if(z2 > 0.1) { display.setCursor(105 + cos(z2*5)*3, 15 - (z2 * 20)); display.print("Z"); }
}

void updateExpression(unsigned long now) {
  if (expression != EX_IDLE && now > expressionUntil) expression = (petHunger < 30) ? EX_HUNGRY : EX_IDLE;
  if (now - lastInteraction > 180000UL) expression = EX_SLEEPY;
}

// ============================================================
// MINI-OS INFO SCREENS
// ============================================================
void drawWrappedText(String text, int x, int y, int maxWidth) {
  int curX = x, curY = y; display.setCursor(curX, curY);
  int start = 0;
  while(start < text.length()) {
    int spaceIdx = text.indexOf(' ', start);
    if (spaceIdx == -1) spaceIdx = text.length();
    String word = text.substring(start, spaceIdx);
    if (curX + (word.length() * 6) > maxWidth) { 
      curX = x; curY += 9; // Tighter line spacing
      display.setCursor(curX, curY); 
    }
    display.print(word + " "); curX += (word.length() + 1) * 6; start = spaceIdx + 1;
  }
}

void drawInfoScreen(unsigned long now) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0); display.print("< ["); display.print(infoPage); display.print("/7] >");
  display.drawLine(0, 10, 128, 10, SH110X_WHITE);

  if (infoPage == 1) {
    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 10)) {
      char timeBuff[9], dateBuff[24]; // FIX: Increased buffer size so 2026 won't get cut off!
      strftime(timeBuff, sizeof(timeBuff), "%H:%M:%S", &timeinfo); 
      strftime(dateBuff, sizeof(dateBuff), "%a, %d %b %Y", &timeinfo);
      display.setTextSize(2); display.setCursor(15, 20); display.print(timeBuff);
      display.setTextSize(1); display.setCursor(15, 45); display.print(dateBuff);
    } else {
      display.setCursor(15, 30); display.print("Syncing Time...");
    }
  } else if (infoPage == 2) {
    display.setCursor(5, 20); display.print("JALI, KA"); 
    display.setCursor(5, 35); display.print(weatherString);
  } else if (infoPage == 3) {
    display.setCursor(5, 15); display.print("HAPPINESS: "); display.print(petHappiness); display.print("%");
    display.drawRect(5, 25, 118, 8, SH110X_WHITE);
    display.fillRect(5, 25, map(petHappiness, 0, 100, 0, 118), 8, SH110X_WHITE);
    
    display.setCursor(5, 42); display.print("HUNGER: "); display.print(petHunger); display.print("%");
    display.drawRect(5, 52, 118, 8, SH110X_WHITE);
    display.fillRect(5, 52, map(petHunger, 0, 100, 0, 118), 8, SH110X_WHITE);
  } else if (infoPage == 4) {
    struct tm timeinfo; int wIdx = 0;
    if (getLocalTime(&timeinfo, 10)) wIdx = (timeinfo.tm_yday + timeinfo.tm_year) % totalWords;
    String w = String(wordList[wIdx].word);
    int charsToShow = min((int)w.length(), (int)((now - pageEnterTime) / 120));
    
    // FIX: Shifted layout upwards so meaning doesn't fall off the screen
    display.setTextSize(1); display.setCursor(5, 13); display.print(w.substring(0, charsToShow));
    if (charsToShow == w.length()) {
      display.setCursor(5, 23); display.print(wordList[wIdx].phonetic);
      drawWrappedText(String(wordList[wIdx].meaning), 5, 34, 125);
    }
  } else if (infoPage == 5) {
    if (pomodoroRunning) pomodoroElapsed = now - pomodoroStart;
    if (pomodoroElapsed >= POMODORO_DURATION && !pomodoroDone) { 
      pomodoroRunning = false; pomodoroDone = true; beepTrick(); 
    }
    if (pomodoroDone) {
      display.setTextSize(2); display.setCursor(35, 22);
      if ((now / 300) % 2 == 0) display.print("DONE!");
      display.setTextSize(1); display.setCursor(15, 50); display.print("Tap T2 to Reset");
    } else {
      unsigned long remaining = (POMODORO_DURATION - pomodoroElapsed) / 1000;
      display.setTextSize(2); display.setCursor(30, 16);
      int m = remaining / 60, s = remaining % 60;
      if(m<10) display.print("0"); display.print(m); display.print(":");
      if(s<10) display.print("0"); display.print(s);
      display.drawRect(14, 38, 100, 6, SH110X_WHITE); display.fillRect(14, 38, map(pomodoroElapsed, 0, POMODORO_DURATION, 0, 100), 6, SH110X_WHITE);
      
      // FIX: Added clear instructions on how to reset
      display.setTextSize(1); display.setCursor(5, 52); display.print("T2: Tap=Play Hold=Rst");
    }
  } else if (infoPage == 6) {
    display.setCursor(5, 18); display.print("OS: v0.5.3");
    display.setCursor(5, 32); display.print("Net: "); display.print(WiFi.status() == WL_CONNECTED ? "ONLINE" : "OFFLINE");
    unsigned long upSec = millis() / 1000;
    display.setCursor(5, 46); display.print("Up: "); display.print(upSec/3600); display.print("h "); display.print((upSec/60)%60); display.print("m");
  } else if (infoPage == 7) {
    display.setCursor(5, 20); display.print("CPU "); display.print(pcCPU); display.print("%");
    display.drawRect(45, 20, 75, 6, SH110X_WHITE); display.fillRect(45, 20, map(pcCPU,0,100,0,75), 6, SH110X_WHITE);
    display.setCursor(5, 35); display.print("RAM "); display.print(pcRAM); display.print("%");
    display.drawRect(45, 35, 75, 6, SH110X_WHITE); display.fillRect(45, 35, map(pcRAM,0,100,0,75), 6, SH110X_WHITE);
    display.setCursor(5, 50); display.print("GPU "); display.print(pcGPU); display.print("C");
  }
  display.display();
}

// ============================================================
// UTILS & SILENT AUDIO
// ============================================================
void buzzerPulse(int d) { }
void beepPurr() { }
void beepHappy() { }
void beepCurious() { }
void beepAngry() { }
void beepPageFlip() { }
void beepTrick() { }

void setExpression(CrocExpression e, unsigned long d) { expression = e; expressionUntil = millis() + d; }

void doTrick() {
  setExpression(EX_TRICK, 1400); lastInteraction = millis();
  display.clearDisplay();
  display.drawCircle(34, 28, 12, SH110X_WHITE); display.drawCircle(94, 28, 12, SH110X_WHITE);
  display.drawCircle(34, 28, 6, SH110X_WHITE); display.drawCircle(94, 28, 6, SH110X_WHITE);
  display.drawCircle(64, 51, 5, SH110X_WHITE); display.display();
  beepTrick(); eyeTargetX = -6; delay(100); eyeTargetX = 6; delay(100); eyeTargetX = 0;
}

void readSerialTelemetry() {
  if (Serial.available() > 0) {
    String j = Serial.readStringUntil('\n');
    JsonDocument doc; if (!deserializeJson(doc, j)) { pcCPU=doc["cpu"]|pcCPU; pcRAM=doc["ram"]|pcRAM; pcGPU=doc["gpu"]|pcGPU; }
  }
}
void connectWiFi() { WiFi.mode(WIFI_STA); WiFi.begin(ssid, password); unsigned long s = millis(); while (WiFi.status() != WL_CONNECTED && millis() - s < 10000) delay(250); }

void fetchWeather() {
  if (WiFi.status() == WL_CONNECTED) {
    if (openWeatherApiKey == "YOUR_OPENWEATHER_API_KEY") { weatherString = "No API Key"; return; }
    HTTPClient http; WiFiClientSecure client; // L432: [NOTE: setInsecure() disables certificate verification - see SECURITY.md]
    if (http.begin(client, "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&units=metric&appid=" + openWeatherApiKey)) {
      int httpCode = http.GET();
      if (httpCode > 0) { 
        JsonDocument doc; 
        if (!deserializeJson(doc, http.getString())) { 
          const char* mainWeather = doc["weather"][0]["main"] | "Unknown";
          weatherString = String((float)doc["main"]["temp"], 1) + "C, " + String(mainWeather); 
        } else {
          weatherString = "JSON Error";
        }
      } else {
        weatherString = "HTTP Err: " + String(httpCode);
      }
      http.end();
    } else {
      weatherString = "Conn Error";
    }
  } else {
    weatherString = "Wi-Fi Offline";
  }
}

