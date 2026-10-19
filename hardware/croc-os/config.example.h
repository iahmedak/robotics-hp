// ============================================================================
//  config.example.h  --  TEMPLATE ONLY. DO NOT COMMIT THE REAL config.h
// ============================================================================
//  Non-secret hardware + behaviour configuration for Croc OS.
//  Pin map below matches the board the firmware was written against.
// ============================================================================

#pragma once

#include <Arduino.h>

// ---------------------------------------------------------------------------
// Display  --  SH1106, 128x64, I2C
// ---------------------------------------------------------------------------
constexpr uint8_t  OLED_I2C_ADDRESS = 0x3C;
constexpr int      OLED_SDA_PIN     = 21;
constexpr int      OLED_SCL_PIN     = 22;
constexpr uint16_t OLED_WIDTH       = 128;
constexpr uint16_t OLED_HEIGHT      = 64;

// ---------------------------------------------------------------------------
// Capacitive touch inputs
// ---------------------------------------------------------------------------
constexpr int TOUCH_PIN_1 = 27;
constexpr int TOUCH_PIN_2 = 14;

// ---------------------------------------------------------------------------
// Buzzer
// ---------------------------------------------------------------------------
constexpr int BUZZER_PIN = 26;

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------
constexpr uint16_t FRAME_INTERVAL_MS     = 33;   // ~30 FPS
constexpr uint32_t POMODORO_DURATION_MS  = 1500000UL;  // 25 minutes

// ---------------------------------------------------------------------------
// Gesture tuning
// ---------------------------------------------------------------------------
constexpr uint16_t TOUCH_DEBOUNCE_MS      = 40;
constexpr uint16_t TAP_MAX_DURATION_MS    = 250;   // longer than this = hold
constexpr uint16_t HOLD_DURATION_MS       = 600;   // hold action fires here

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------
constexpr uint16_t WEATHER_FETCH_INTERVAL_MS = 15 * 60 * 1000;  // 15 minutes

// ---------------------------------------------------------------------------
// Persistence keys  --  see docs/SECURITY.md
// ---------------------------------------------------------------------------
// NOTE: v0.5.3 shipped WITHOUT NVS. NVS-backed settings landed in a later
// release. Only claim NVS on your resume if the code you publish actually
// contains it.
constexpr const char* NVS_NAMESPACE = "croc";
constexpr const char* NVS_KEY_LAST_BRIGHTNESS = "brightness";
constexpr const char* NVS_KEY_POMO_COUNT     = "pomo_count";