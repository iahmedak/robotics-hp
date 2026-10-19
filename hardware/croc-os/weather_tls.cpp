// ============================================================================
//  weather_tls.cpp  --  reference implementation
// ============================================================================
//  WHY THIS FILE EXISTS
//  --------------------
//  The original firmware called
//
//      client.setInsecure();
//
//  which disables TLS certificate verification entirely. That means anyone on
//  the network path (a shared lab WiFi, a rogue AP, an ISP middlebox) can
//  transparently intercept and rewrite that "HTTPS" call. On an ESP32 talking
//  to a public API over open WiFi, that is a real, exploitable weakness.
//
//  The fix below verifies the server certificate against a pinned root CA.
//
//  HOW TO GET THE ROOT CA  (do not guess this value)
//  -------------------------------------------------
//  Run this once, on a machine that can reach the API, and copy the PEM block
//  printed at the bottom into ROOT_CA below:
//
//      openssl s_client -connect api.openweathermap.org:443 -showcerts
//
//  The chain prints leaf -> intermediate(s). You want the final self-signed
//  root. Alternatively fetch the current issuer chain from your network tooling
//  and confirm it in a browser certificate viewer before pinning it.
//
//  Certificate roots rotate over time. A pinned CA will eventually fail closed
//  (which is correct behaviour) and will need updating -- that is the trade-off
//  you are accepting versus setInsecure(), and it is worth it.
// ============================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#include "config.h"
#include "secrets.h"

// Paste the verified root CA between the markers. A copy-paste from a terminal
// sometimes carries "// " prefixes; stripPemComments() below removes them.
static const char *ROOT_CA_RAW = R"(
-----BEGIN CERTIFICATE-----
// PASTE THE VERIFIED ROOT CA PEM HERE
-----END CERTIFICATE-----
)";

// Strip any leading "// " comment markers from the PEM block.
static String stripPemComments(const String &pem) {
  String out;
  out.reserve(pem.length());
  String line;
  for (unsigned int i = 0; i <= pem.length(); i++) {
    char c = (i < pem.length()) ? pem.charAt(i) : '\n';
    if (c == '\n') {
      line.trim();
      if (line.length() && !line.startsWith("//")) {
        out += line;
        out += '\n';
      }
      line = "";
    } else {
      line += c;
    }
  }
  return out;
}

struct Weather {
  float tempC    = 0.0f;
  float humidity = 0.0f;
  float windMps  = 0.0f;
  bool  valid    = false;
};

// ---------------------------------------------------------------------------
// Fetch. Returns false and leaves out untouched on any failure.
// ---------------------------------------------------------------------------
bool fetchWeather(Weather &out) {
  if (WiFi.status() != WL_CONNECTED) return false;

  static String rootCa;
  if (rootCa.length() == 0) rootCa = stripPemComments(String(ROOT_CA_RAW));

  WiFiClientSecure client;
  client.setCACert(rootCa.c_str());
  // NO setInsecure() here. Verification is the point.

  char url[384];
  snprintf(url, sizeof(url),
           "https://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s"
           "&appid=%s&units=metric",
           SITE_LATITUDE, SITE_LONGITUDE, OPENWEATHER_API_KEY);

  HTTPClient http;
  http.setTimeout(8000);
  http.setReuse(false);

  if (!http.begin(client, url)) return false;

  int code = http.GET();
  if (code != HTTP_CODE_OK) { http.end(); return false; }

  String body = http.getString();
  http.end();

  StaticJsonDocument<1536> doc;
  if (deserializeJson(doc, body)) return false;

  Weather w;
  w.tempC    = doc["main"]["temp"]      | NAN;
  w.humidity = doc["main"]["humidity"] | NAN;
  w.windMps  = doc["wind"]["speed"]     | NAN;

  if (isnan(w.tempC)) return false;

  w.valid = true;
  out = w;
  return true;
}