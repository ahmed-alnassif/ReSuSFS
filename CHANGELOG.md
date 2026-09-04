
## [v2.3.0-5556867] - 2026-09-04


### 🧩 Module

- **fix:** correct ksud command in uname spoofing script (@ahmed-alnassif)
- **fix:** set ksu features correctly (@ahmed-alnassif)
- **fix:** use full KMI tag and correct hash length in uname spoofing (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-5556867 (@ahmed-alnassif)

## [v2.3.0-145b96d] - 2026-09-04


### 🌐 WebUI

- regenerate pnpm-lock.yaml after adding syntax highlighting dependencies (@ahmed-alnassif)
- **feat:** add shell syntax highlighting to the code editor via CodeMirror language support (@ahmed-alnassif)

### 🧩 Module

- **fix:** correct kstat backend to support static and dynamic spoofing (@ahmed-alnassif)
- **fix:** simplify uname apply to replace values while preserving user comments (@ahmed-alnassif)
- **feat:** add spoofing and hiding scripts for cmdline, uname, paths, maps, mounts, props, settings, and kstat (@ahmed-alnassif)

### 📚 Documentation

- add built-in scripts documentation and update features, userhub, backup, and description sections (@ahmed-alnassif)

### ⚙️ CI/CD

- add build category (@ahmed-alnassif)

### 🏗️ Build

- add lockfile auto-regeneration fallback to local-build.sh when frozen install fails (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-145b96d (@ahmed-alnassif)

## [v2.3.0-9244d05] - 2026-09-03


### 🧩 Module

- **fix:** don't disable the module in every reboot (@ahmed-alnassif)
- **fix:** prevent setScriptStage from adding entries when disabling (@ahmed-alnassif)
- update module.prop description (@ahmed-alnassif)

### 📚 Documentation

- fix changelog (@ahmed-alnassif)
- my plan (@ahmed-alnassif)
- fix formatting (@ahmed-alnassif)

### ⚙️ CI/CD

- **fix:** prepend changelog entries instead of appending (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-9244d05 (@ahmed-alnassif)
## [v2.3.0-4171ba3] - 2026-09-03


### 🌐 WebUI

- add backup/restore in the home page at bottom (@ahmed-alnassif)
- **userhub:** add script metadata display, disable support with ! prefix, and automatic header migration (@ahmed-alnassif)
- **fix:** stop UserHub stage toggle from misfiring on programmatic .selected assignment (@ahmed-alnassif)
- **fix:** hide reboot button while a terminal or editor is open, only show it on normal page views (@ahmed-alnassif)
- **feat:** add reboot FAB next to close-terminal, shown once a running action/script finishes (@ahmed-alnassif)
- **fix:** hide reboot-terminal-btn when the terminal is closed, not just when a new run starts (@ahmed-alnassif)
- **fix:** make reboot terminal button clickable by fixing pointer-events and z-index stacking (@ahmed-alnassif)

### 🧩 Module

- **refactor:** use one directory for configs files (@ahmed-alnassif)
- **feat:** enhance config handling to support folders and any file types (@ahmed-alnassif)
- **fix:** exit when SuSFS download failed (@ahmed-alnassif)

### 📚 Documentation

- add my official telegram group (@ahmed-alnassif)
- update CLI output (@ahmed-alnassif)

### ⚙️ CI/CD

- **fix:** update module issue in the manager (@ahmed-alnassif)
- **feat:** add Telegram upload with commit and CI links (@ahmed-alnassif)
- **fix:** Telegram upload configuration (@ahmed-alnassif)
- **fix:** Telegram MarkdownV2 escaping (@ahmed-alnassif)
- **fix:** escape repository name for Telegram MarkdownV2 (@ahmed-alnassif)
- **fix:** escape CI number in Telegram MarkdownV2 (@ahmed-alnassif)
- add clickable repo link to Telegram caption (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-4171ba3 (@ahmed-alnassif)

## [v2.3.0-f454264] - 2026-09-01


### 🌐 WebUI

- add UserHub tab for creating, editing, running, and deleting user shell scripts (@ahmed-alnassif)
- add reboot button with confirmation dialog to header (@ahmed-alnassif)
- switch backup/restore from JSON to busybox tar archives (@ahmed-alnassif)
- add enabled scripts count to home summary, tapping it jumps to UserHub (@ahmed-alnassif)

### 🧩 Module

- fix exit with 1 if the download failed (@ahmed-alnassif)
- fix: prompt once for differing configs, auto-copy missing files (@ahmed-alnassif)
- add ReSuSFS.sh/post-fs-data.sh/boot-completed.sh support for running UserHub scripts at post-fs-data and boot-completed stages (@ahmed-alnassif)

### 📚 Documentation

- correct uname file format (@ahmed-alnassif)
- update README intro to cover UserHub, backup/restore, and reboot button (@ahmed-alnassif)

### ⚙️ CI/CD

- add detailed changelog using python (@ahmed-alnassif)
- add automated CHANGELOG.md update on release (@ahmed-alnassif)
- fetch full git history in release workflow to fix broken version-change detection (@ahmed-alnassif)
- **release:** fix PREVIOUS_VERSION being written to GITHUB_ENV before it was assigned (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-f454264 (@ahmed-alnassif)
