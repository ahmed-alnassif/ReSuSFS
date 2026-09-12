
## [v2.3.0-d348051] - 2026-09-12


### 🌐 WebUI

- **refactor:** add UserHub next to home tab (@ahmed-alnassif)
- **style:** change UserHub icon (@ahmed-alnassif)
- **feat:** add available languages to selector (@ahmed-alnassif)

### 📚 Documentation

- add GKID as the recommended kernel for full SuSFS support (@ahmed-alnassif)

### ⚙️ CI/CD

- fix Crowdin XML config to skip name attributes (@ahmed-alnassif)
- improve Crowdin workflow with official action pattern and proper branch handling (@ahmed-alnassif)
- use the correct secret variable for crowdin (@ahmed-alnassif)
- fix syntax error (@ahmed-alnassif)
- **crowdin:** don't start the workflow in every doc push (@ahmed-alnassif)
- **crowdin:** upload local translations (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-d348051 (@ahmed-alnassif)

### 🤖 Automated

- webui/locales: sync translation from Crowdin (#11)
- New Crowdin translations by GitHub Action (#12)
- webui: new Crowdin translations by GitHub Action (#14)

## [v2.3.0-47be13c] - 2026-09-11


### 🌐 WebUI

- **fix:** don't let other elements cover the editor (@ahmed-alnassif)
- **fix:** fix About version lookup and link handlers (@ahmed-alnassif)
- **refactor:** donations card in more tab (@ahmed-alnassif)
- **perf:** stop rebuilding every visible UserHub row on each search keystroke/tag click, reuse built elements via a persistent map, tighten IntersectionObserver margin (@ahmed-alnassif)
- **fix:** make UserHub load faster and feel smoother (@ahmed-alnassif)
- **fix:** stop scripts from losing their tags and the list shaking while scrolling (@ahmed-alnassif)

### 📚 Documentation

- add Crowdin badge (@ahmed-alnassif)
- add KernelSU Next warning to README (@ahmed-alnassif)
- fix formatting (@ahmed-alnassif)
- add KernelSU Next warning to changelog (@ahmed-alnassif)

### ⚙️ CI/CD

- move crowdin sync to dev, publish locales-dist branch (@ahmed-alnassif)
- simplify crowdin workflow to single branch (@ahmed-alnassif)
- drop locales.zip artifact (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-47be13c (@ahmed-alnassif)

### 📦 Other

- drop: remove KernelSU Next support (@ahmed-alnassif)

### 🤖 Automated

- webui/locales: sync translation from Crowdin (#5)
- webui/locales: sync translation from Crowdin (#6)

> [!Important]
> **KernelSU Next is not recommended.**
>
> KernelSU Next is currently **unmaintained** and has been observed engaging in anti-competitive behavior, including blacklisting the official ReSuSFS module without technical justification. This is not a security decision, it is a control decision.
>
> Using an unmaintained kernel root solution can lead to:
>
> - **Instability** and unexpected crashes.
> - **Bootloops** that can leave your device unusable.
> - **Security vulnerabilities** that will never be patched.
> - **Broken module compatibility** as the ecosystem moves forward.
>
> To protect your device and ensure you receive official support:
>
> - Use **KernelSU**: The upstream, official root solution.
> - Use **ReSukiSU**: A trusted, community-respected fork.
>
> ReSuSFS is the only official SuSFS module for KernelSU. It is fully supported on KernelSU and ReSukiSU only.
>
> Do not use KernelSU Next. Choose stability. Choose freedom. Choose official support.

---

## [v2.3.0-bc8e52b] - 2026-09-09


### 🌐 WebUI

- **fix:** replace hardcoded donation address with a link to the GitHub support page, remove now-unused clipboard-copy logic (@ahmed-alnassif)

### ✨ Features

- add custom sponsorship URL to FUNDING.yml (@ahmed-alnassif)

### 📚 Documentation

- I think it's working fine with/without SuSFS (@ahmed-alnassif)
- add ReSuSFS banner (@ahmed-alnassif)
- update donation info (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-bc8e52b (@ahmed-alnassif)

### 🤖 Automated

- webui(deps): Bump @codemirror/view in /webui in the webui-deps group (#4)
- ci(deps): Bump crowdin/github-action from 2 to 3 (#3)

## [v2.3.0-f851a6e] - 2026-09-06


### 🌐 WebUI

- **fix:** export full config directory without filtering (@ahmed-alnassif)
- **feat:** add user-friendly cron schedule field to UserHub script rows (@ahmed-alnassif)

### 🧩 Module

- **feat:** add sync_cron_scripts() via busybox crond, synced on boot-completed (@ahmed-alnassif)
- **fix:** prevent duplicate crond processes in sync_cron_scriptsci(fix): improve disk cleanup and swap to prevent build kill (@ahmed-alnassif)

### ⚙️ CI/CD

- add Dependabot (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-f851a6e (@ahmed-alnassif)

### 🤖 Automated

- webui(deps): Bump the webui-deps group in /webui with 6 updates (#2)

## [v2.3.0-4d61c95] - 2026-09-05


### 🌐 WebUI

- **feat:** add script tags, filter bar, and inline editor (@ahmed-alnassif)

### 🧩 Module

- **feat:** improve config persistence handling (@ahmed-alnassif)
- **feat:** update scripts configuration handling (@ahmed-alnassif)
- **feat:** add ksu-settings script to bootcompleted (@ahmed-alnassif)

### ✨ Features

- add backup confirmation prompt before config handling (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-4d61c95 (@ahmed-alnassif)

## [v2.3.0-5ec5ad8] - 2026-09-05


### 🌐 WebUI

- fix UserHub tab loading/refreshing lag (@ahmed-alnassif)
- **fix:** write backup tar log to Download dir and ensure it exists before export (@ahmed-alnassif)
- **fix:** escape shell vars in backup script and move tar log to ReSuSFS dir (@ahmed-alnassif)
- **perf:** only refresh UserHub's script list when scripts actually change, not on every tab switch (@ahmed-alnassif)
- **feat:** add sort options to UserHub (name A-Z/Z-A, enabled first, recently/oldest modified) via header button (@ahmed-alnassif)
- **feat:** add search button to UserHub (@ahmed-alnassif)
- **feat:** add Telegram support group link to More, and a shared-configs hint to Home's backup card (@ahmed-alnassif)

### 📚 Documentation

- highlight strong hiding by default in readme (@ahmed-alnassif)

### 🧹 Chores

- bump version to v2.3.0-5ec5ad8 (@ahmed-alnassif)

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
