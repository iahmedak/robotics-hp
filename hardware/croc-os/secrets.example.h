// ============================================================================
//  secrets.example.h  --  TEMPLATE ONLY. DO NOT COMMIT THE REAL secrets.h
// ============================================================================
//
//  WHY THIS FILE EXISTS
//  --------------------
//  An earlier version of this firmware had the WiFi password and the
//  OpenWeather API key hardcoded directly in the .ino file. Anything that
//  hardcoded is now considered leaked and must be rotated.
//
//  SETUP
//  -----
//  1. cp include/secrets.example.h include/secrets.h
//  2. Fill in your own values in include/secrets.h
//  3. Never commit include/secrets.h  (it is already in .gitignore)
//
//  Verify it is actually ignored before you ever push:
//      git check-ignore -v include/secrets.h
//
// ============================================================================

#pragma once

// ---- WiFi -------------------------------------------------------------------
constexpr char WIFI_SSID[]     = "CHANGE_ME";
constexpr char WIFI_PASSWORD[] = "CHANGE_ME";

// ---- OpenWeather ------------------------------------------------------------
// Rotate your key at https://home.openweathermap.org/api_keys
constexpr char OPENWEATHER_API_KEY[] = "CHANGE_ME";

// ---- Installation site ------------------------------------------------------
constexpr char SITE_LATITUDE[]  = "13.9853";
constexpr char SITE_LONGITUDE[] = "74.5553";
constexpr char SITE_CITY[]      = "Bhatkal";

// ---- NTP --------------------------------------------------------------------
constexpr char NTP_SERVER[] = "pool.ntp.org";