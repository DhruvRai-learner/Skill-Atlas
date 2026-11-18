# Skill Atlas — browser edition

A skill browser with an included metadata catalog: **498 skill names across 567 catalogued copies**, from the reconciled inventory and known skill roots refreshed on 18 November 2026.

The app uses HTML, CSS and JavaScript with no build step, CDN, analytics, runtime packages or backend. The included catalog contains names, descriptions, aliases, domain/software/dependency labels, agent labels, copy/variant status, generic collection provenance and dated risk/validation states. It contains no personal Windows paths, raw audit files, package hashes, SKILL.md contents or executable skill scripts. Original skill packages stay in their existing folders.

Search and matching run on your device. Private imports and manually selected SKILL.md text stay in memory in the current tab and are not uploaded. Theme and shortlist IDs are saved in browser storage. IDs from another catalog are retained when shortlisting included skills. Reloading clears a private import; the default page opens the included catalog again.

## Use it

Open the site to browse all included skill records immediately. Search, filter, shortlist, compare, inspect sources and copy a skill discovery request. This does not install or activate a skill.

Choose **Open private catalog** for exact local paths and full evidence. The private import page also has **Browse included skills** to return to the shared metadata catalog.

1. Start the original local Skill Atlas on the laptop that contains your skills.
2. Export its catalog to a local file using PowerShell:

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:8765/api/catalog' -OutFile "$env:USERPROFILE\Downloads\skill-atlas-catalog.json"
```

3. On the deployed site, choose **Open private catalog**, then **Open my catalog** and select that JSON file. The browser reads it locally; the app does not upload it.

On another device, transfer the catalog file privately and import it there. A catalog can contain local paths and audit details, so do not commit the export to this repository or share it publicly.

## Capabilities and limits

- Search, filters, shortlist, comparison, metadata and copyable reading instructions use the imported records.
- Task suggestions use explicitly labeled browser lexical matching. This static edition does not run the original Python BM25 router.
- Availability, risk, validation and compatibility labels describe the dated catalog snapshot, not live verification or proof of safety. New discoveries can have unknown risk or compatibility. The included snapshot does not expose local paths.
- Reading a SKILL.md requires an explicit local file selection. The selected file is displayed as inert text and is not verified against the imported Windows path. No skill code is executed.
- The page's Content Security Policy disables JavaScript network connections. Initial static assets are served by GitHub Pages; GitHub's normal hosting privacy practices still apply.

## GitHub Pages setup

In the repository's **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, then **Save**. The files in this repository are already the deployable site; no custom workflow is needed.

The `.nojekyll` file disables Jekyll processing. Relative asset URLs support project sites such as `/Skill-Atlas/`.

## Public bundle

Only `index.html`, `style.css`, `app.js`, `browser-data.js`, `web-mode.js`, `bundled-catalog.js`, this README, `.gitignore` and `.nojekyll` are published. The original Python app, local audit evidence, screenshots, private catalog exports, tests and skill packages are excluded.

## Preview locally

Serve this folder with Python, then open `http://127.0.0.1:8877`:

```powershell
python -m http.server 8877 --bind 127.0.0.1
```

No install or build step is needed. This preview is separate from the laptop edition and its Python router.


## Deployment address

The GitHub Pages deployment target is https://dhruvrai-learner.github.io/Skill-Atlas/. The default page opens the included catalog. Add `?catalog=private` to open the private import screen directly.

The inventory covers the reconciled manifest plus known per-user skill roots. Arbitrary project folders and versioned plugin caches are outside this scanner's scope. Compatibility labels remain distinct from successful activation.
