# Publishing checklist

Work top to bottom. Do not skip to the end.

## 1. Credentials first, before anything else

- [ ] Rotate the OpenWeather API key. Delete the old one.
      <https://home.openweathermap.org/api_keys>
- [ ] Change the WiFi password if the network is not one you own.
- [ ] Confirm no credential-bearing file has ever been committed:
      `git log --all --full-history -- '*.ino'`

## 2. Copy the templates

- [ ] `cp include/config.example.h include/config.h`
- [ ] `cp include/secrets.example.h include/secrets.h`
- [ ] Paste the OpenWeather root CA into `src/weather_tls.cpp`
- [ ] Move your real `.ino` into `sketches/`

## 3. Verify nothing leaks

```sh
git check-ignore -v include/secrets.h
git grep -nEi '(password|api[_-]?key|ssid|token)\s*=' -- ':!*.example.h'
```

The first must print the ignore rule. The second must return nothing.

- [ ] First command prints a rule
- [ ] Second command returns no matches
- [ ] `git status --porcelain` does not list `secrets.h` or `config.h`

## 4. Make sure it builds

- [ ] Compiles and uploads with no errors
- [ ] Weather page shows real data, not a TLS failure
- [ ] Touch gestures respond correctly
- [ ] Boot does not hang if WiFi is unavailable

## 5. Match the README to the code

The README and your resume must describe code that actually exists.

- [ ] If you did not implement NVS persistence, remove the NVS keys from
      `config.example.h` and do not list NVS on your resume.
- [ ] If telemetry ingest is not wired up, remove that bullet.
- [ ] If the newer release changed the display, touch or buzzer pins, update the
      hardware table.

## 6. Push

```sh
git add .
git status          # read this before committing
git commit -m "Publish Croc OS firmware"
git remote add origin <your-repo-url>
git push -u origin main
```

## 7. After pushing

- [ ] Open the repo on GitHub and confirm `secrets.h` is absent
- [ ] Confirm the README renders and the license is detected
- [ ] Add the repo URL to your resume and your LinkedIn
- [ ] Check GitHub does not flag the repository or the commit in email