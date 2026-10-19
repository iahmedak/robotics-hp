# Croc OS

ESP32 desk companion firmware. A small animated character with expressive eyes, a
gesture-driven interface, and real sensor telemetry.

Written in C++ for the Arduino ESP32 framework.

---

## What it does

- **Animated expression engine** — 16 states with eased eye tracking, redrawn at
  ~30 FPS on a 128x64 OLED.
- **Gesture engine** — two capacitive touch inputs resolved into tap, hold and
  dual-touch, with debounce and a tap/hold duration threshold.
- **Info pages** — seven pages of system information, including a pomodoro timer.
- **Time sync** — NTP on boot.
- **Weather** — current conditions for the configured site, polled every 15
  minutes over a certificate-verified HTTPS connection.
- **Telemetry ingest** — PC CPU, RAM and GPU statistics received as ArduinoJson.

---

## Hardware

| Part | Detail |
|---|---|
| MCU | ESP32 |
| Display | SH1106, 128x64, I2C, address `0x3C` |
| I2C pins | SDA `GPIO21`, SCL `GPIO22` |
| Touch inputs | Capacitive, `GPIO27` and `GPIO14` |
| Buzzer | `GPIO26` |

Pin map lives in `include/config.example.h`.

---

## Building

1. Copy the config and secrets templates:

   ```sh
   cp include/config.example.h  include/config.h
   cp include/secrets.example.h include/secrets.h
   ```

2. Fill in `include/secrets.h` with your WiFi credentials and your own
   [OpenWeather](https://home.openweathermap.org/api_keys) API key.

3. Paste the OpenWeather root CA into `src/weather_tls.cpp`.

4. Open the sketch in Arduino IDE, select your ESP32 board, and upload.

`config.h` and `secrets.h` are in `.gitignore` and must never be committed.
Verify before you push:

```sh
git check-ignore -v include/secrets.h
```

---

## Project layout

```
include/
  config.example.h      pin map and timing constants
  secrets.example.h     credentials template
src/
  weather_tls.cpp       certificate-verified weather fetch
sketches/
  <your .ino here>
docs/
  SECURITY.md           credential handling notes
```

---

## Notes on the implementation

**TLS.** The weather fetch pins a root CA and verifies the server certificate.
An earlier revision called `setInsecure()`, which disabled verification entirely
and allowed interception on an untrusted network. Do not reintroduce it.

**Credentials.** Nothing sensitive is in the repository. If you fork this, rotate
any key you have ever committed and treat it as public.

**Porting.** The NVS keys in `config.example.h` correspond to settings that
persisted in a later release. If your firmware does not call `Preferences`, drop
that section rather than claiming persistence you have not implemented.

---

## License

MIT — see `LICENSE`.