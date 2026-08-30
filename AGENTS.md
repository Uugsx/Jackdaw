# Instructions for AI agents (Cursor, etc.)

## Before changing desktop releases or auto-update

**Required reading:** [docs/systems/desktop-build/ota-jackdaw.md](docs/systems/desktop-build/ota-jackdaw.md)

Jackdaw OTA is **not** stock electron-builder only. It includes:

- Private GitHub Releases + `JACKDAW_GH_UPDATE_TOKEN`
- CI job `prepare` that must create the release **before** parallel Mac/Windows publish
- **Mac:** DMG download + quit-then-install script (no Apple Developer signing on prerelease)
- **Windows:** standard `electron-updater` + `latest.yml`

Do **not** revert to parallel publish without the `prepare` release shell (causes duplicate releases and broken Windows OTA).

## Other build docs

- [docs/systems/desktop-build/overview.md](docs/systems/desktop-build/overview.md)
- [docs/systems/desktop-build/electron-builder.md](docs/systems/desktop-build/electron-builder.md)
- [docs/INSTALL.md](docs/INSTALL.md)

## Repo layout (desktop)

- `app/` — Svelte UI + shared logic (including Settings → About updater UI)
- `desktop/backend/backend.ts` — Electron main-side backend, JPC, OTA
- `desktop/src/main/index.ts` — window lifecycle, updater on startup
- `.github/workflows/publish-desktop-jackdaw.yml` — OTA CI

## Secrets (never commit)

- `JACKDAW_GH_UPDATE_TOKEN` — GitHub Actions + baked into installers as `gh-update-token.txt`
