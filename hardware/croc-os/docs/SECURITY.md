# Security notes

## What was wrong

The first public version of this firmware hardcoded three secrets directly in
the `.ino` source:

- the WiFi network name
- the WiFi password
- an OpenWeather API key

Hardcoded credentials in a firmware repository are public credentials from the
moment the repository is pushed. They must be treated as leaked.

## What was done

1. Credentials were moved to `include/secrets.h`, which is gitignored.
2. `include/secrets.example.h` ships the shape of the file with placeholder
   values.
3. `.gitignore` blocks `secrets.h`, `config.h`, `*.pem`, `*.key` and `.env*`.
4. The weather fetch was changed from `setInsecure()` to a pinned root CA, so
   the HTTPS connection verifies the server.

## What the maintainer still has to do

- **Rotate the OpenWeather API key.** Delete the old key and create a new one at
  <https://home.openweathermap.org/api_keys>.
- **Change the WiFi password** if the machine that ran this firmware is on a
  network you do not control.
- **Check history before publishing.** If the secret-bearing file was ever
  committed, deleting it in a later commit is not enough — it stays in the git
  history and in any fork.

  ```sh
  git log --all --full-history -- '*.ino'
  ```

- If the repository has already been pushed publicly, rotate first, then consider
  rewriting history. Rotating the key is the part that actually protects you.

## Verifying before every push

```sh
git check-ignore -v include/secrets.h
git grep -nEi '(password|api[_-]?key|ssid|token)\s*=' -- ':!*.example.h'
```

Both commands should behave: the first prints the ignore rule, the second
returns no matches outside the example templates.

## Reporting

Do not open a public issue for a credential problem. Report it privately to the
maintainer.