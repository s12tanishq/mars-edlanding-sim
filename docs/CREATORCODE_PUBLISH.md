# CreatorCode compatibility and publishing

This guide was checked against the locally installed CreatorCode VS Code extension version 1.0.0.

## Compatibility status

AREION is prepared as a managed CreatorCode React project:

- `.creatorcode.json` identifies **AREION**, **React**, **None** for database, and **Team Indentation**.
- `package.json` provides the required `build` command.
- `src/`, `public/`, `tests/`, `docs/`, `deployment.yaml`, and lowercase `submission.md` are present.
- Vite reads CreatorCode's `BASE_PATH`, which is generated as `/projects/{userId}/{projectId}/{version}` during publishing.
- The worker, Draco decoder, rover models, panorama and terrain textures use the resulting base path instead of assuming deployment at `/`.
- A simulated CreatorCode subpath build and the normal production build both complete successfully. The automated project suite passes 26 tests.

CreatorCode 1.0.0's deploy path currently skips its validation gate and directly runs the build. Its dormant dependency validator does not list Three.js even though CreatorCode's own React scaffold installs Three.js and React Three Fiber. If a later extension version re-enables that validator and reports Three.js as disallowed, use **Raise Bug Report** with the publish logs; do not remove the renderer merely to silence the inconsistent rule.

## Open the correct folder

The VS Code workspace must be the project root:

```text
/Users/tanishqpachghare/Documents/Codex/2026-09-26/3-3d-scene-rendering-takes-physics/outputs/mars-edl-perseverance
```

Do not open only `src/`. If the dashboard says **Project Name: src**, **Target Framework: Unknown**, or **Unmanaged**, VS Code has the wrong folder open.

1. In VS Code, choose **File → Open Folder…**.
2. Select the `mars-edl-perseverance` folder shown above, not its `src` child.
3. Allow VS Code to reopen or reload the window.
4. Open the CreatorCode sidebar again. It should show **AREION**, **React**, and **None**, rather than `src` and `Unknown`.

CreatorCode uses the first workspace folder when several folders are open. For the least ambiguous submission, use a single-folder VS Code window containing only AREION.

## Pre-publish check

In VS Code's terminal, from the project root, run:

```bash
npm test
npm run build
```

The Three.js chunk-size message is an advisory, not a failed build. A successful build ends with `built in ...` and produces `dist/index.html`.

The existing local workspace has dependencies available through a symlink to an earlier installation. If this project is copied to another location or computer, run `npm ci` before the checks. Do not upload or share `node_modules`.

## Publish through CreatorCode

1. Confirm the CreatorCode dashboard shows the correct signed-in account and **AREION / React**.
2. Click **Publish Project**.
3. Review the pre-filled values:
   - Title: `AREION — Mars EDL Simulator`
   - Version: `1.0.0`
   - Author/team: `Team Indentation` is stored in `.creatorcode.json` and stated in `submission.md`.
   - Tags: `mars, edl, simulation, react, threejs, guidance`
4. Submit the publish form and keep VS Code open while the Publish Logs progress through project registration, build, archive creation, upload and deployment finalization.
5. On success, choose **Open Link** and save the returned live URL.
6. Verify the live site: load the briefing, inspect the rover, launch a nominal mission, check that terrain and sky textures load, and open the secondary station.
7. Keep the live URL and any deployment/version identifier shown under **Published Projects** for the event submission form.

The extension builds locally, creates a ZIP of `dist/` under an `out/` archive root, adds `submission.md`, uploads that archive to its storage middleware, and records the deployment for the signed-in user. It uploads the built application, not the complete source tree. If the event separately requires a source repository, video, screenshots, or team-member list, submit those through the organizer's requested channel as an additional step.

## Privacy and submission notes

During Publish, CreatorCode 1.0.0 scans supported local AI-client histories, records recently detected prompts in `.creatorcode_prompts.json`, and saves the prompt list with the project record in Firestore. This appears to be part of the hackathon's tracking workflow. Review the extension's terms and make sure neither project files nor AI prompts contain passwords, API keys, personal tokens, private keys, or other confidential data before publishing.

Publishing changes external state and may create `.creatorcode_builds/`, `.creatorcode_prompts.json`, `.creatorcode_prompts_meta.json`, and cloud identifiers in `.creatorcode.json`. Do not manually upload `.creatorcode_builds`; the extension handles its own archive.

If publishing fails, copy the last relevant Publish Logs, open **Extension Logs**, and use **Raise Bug Report**. Common diagnosis:

- `Project Name: src` or `Unknown`: reopen the project root.
- `No package.json found`: the wrong folder is open.
- Missing `submission.md` or `deployment.yaml`: confirm exact lowercase names at project root.
- Build succeeds but published models/textures return 404: ensure the current `vite.config.js` and base-aware Scene asset URLs are present, then republish as a new version.
- Middleware/authentication failure: refresh the CreatorCode login session and retry with the same project folder; do not create a second local project unless instructed by the organizer.
