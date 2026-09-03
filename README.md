# ReSuSFS

[![Build Status](https://github.com/ahmed-alnassif/ReSuSFS/actions/workflows/release.yml/badge.svg)](https://github.com/ahmed-alnassif/ReSuSFS/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/ahmed-alnassif/ReSuSFS?label=Latest%20Release&color=00aa00)](https://github.com/ahmed-alnassif/ReSuSFS/releases)
[![Downloads](https://img.shields.io/github/downloads/ahmed-alnassif/ReSuSFS/total?label=Downloads&color=00aa00)](https://github.com/ahmed-alnassif/ReSuSFS/releases)
[![Group](https://img.shields.io/badge/Telegram-Group-blue.svg?logo=telegram)](https://t.me/ahmed_alnassif_tg)
[![GitHub License](https://img.shields.io/github/license/ahmed-alnassif/ReSuSFS?logo=gnu)](/LICENSE)
[![SuSFS](https://img.shields.io/badge/SuSFS-4CAF50?&logo=gitlab&logoColor=white)](https://gitlab.com/simonpunk/susfs4ksu)
[![KernelSU](https://img.shields.io/badge/KernelSU-000000?&logo=github&logoColor=white)](https://github.com/tiann/KernelSU)
[![KernelSU Next](https://img.shields.io/badge/KernelSU--Next-1976D2?&logo=github&logoColor=white)](https://github.com/KernelSU-Next/KernelSU-Next)
[![ReSukiSU](https://img.shields.io/badge/ReSukiSU-E91E63?&logo=github&logoColor=white)](https://github.com/ReSukiSU/ReSukiSU)

Root hiding made simple, powerful when you need it. A [KernelSU](https://kernelsu.org) module and WebUI that turns SuSFS into clean config files and toggle switches for everyday use, with a built-in script editor for power users who want more, all without leaving the WebUI.

> [!Important]
> **Future Direction**
>
> ReSuSFS will gradually move beyond SuSFS management. SuSFS will become optional, while development will focus more on UserHub, giving users greater freedom and control to create, manage, and automate their own scripts and configurations.

## Requirements

- [KernelSU](https://kernelsu.org) with kernel-level SuSFS support
- arm64 device

## Install

1. Download the [latest release](https://github.com/ahmed-alnassif/ReSuSFS/releases/latest)
2. Flash the zip in KernelSU Manager
3. Reboot
4. Edit config files, or use the WebUI

## Config files

All optional, all live under `/data/adb/ReSuSFS/`. Missing or empty files mean "nothing to apply" for that feature, no errors. Entries are appended in the order they appear, top line first.

| File | What it does |
|---|---|
| `sus_paths.txt` | hide static/read-only paths |
| `sus_paths_loop.txt` | hide frequently changing paths |
| `sus_maps.txt` | hide mapped library files |
| `kstat_paths.txt` | spoof file stat for bind mounted paths |
| `open_redirect.txt` | redirect a path to another path |
| `uname.txt` | spoof kernel release/version |
| `cmdline_or_bootconfig.txt` | spoof `/proc/cmdline` or `/proc/bootconfig` |
| `config.txt` | toggle kernel flags (mount hiding, logging, avc spoofing) |

## WebUI Features

- **Status dashboard**, see if SuSFS is active at a glance, tap for the full enabled-features breakdown straight from the kernel
- **Configuration summary**, live entry counts per feature and enabled script count, right on the home page
- **Built-in code editor**, full-screen editor for every config file and user script, no terminal needed
- **File manager**, browse storage and load a custom file straight into any feature, without overwriting your default
- **User-friendly SuSFS configs**, every feature exposed as its own clean box: edit, apply, or load custom
- **Toggle switches**, flip kernel flags (mount hiding, logging, avc spoofing) without touching raw text
- **UserHub**, create, edit, run, and delete your own shell scripts, with per-script toggles to run automatically at post-fs-data and/or boot-completed
- **Backup and restore**, export your whole config (and any UserHub scripts) into one archive, restore it on any device
- **Reboot button**, with confirmation, right in the header
- **Multi-language support**

## UserHub

A tab for managing your own shell scripts without a terminal:

- Create a new script from a blank template, or import an existing `.sh` file from storage
- Edit any script in the same full-screen code editor used for config files
- Run a script on demand, output streams live in the WebUI
- Toggle a script to run automatically at `post-fs-data` and/or `boot-completed`

Scripts live under `/data/adb/ReSuSFS/scripts/`. Which scripts run at which stage is tracked in `scripts_postfs.txt` and `scripts_bootcompleted.txt` under the same directory.

## CLI

Every command can be run manually via `ReSuSFS <flag>`. Useful for scripting, debugging, or if you just prefer terminal over WebUI.

```
 _____       _____        _____ ______ _____ 
|  __ \     / ____|      / ____|  ____/ ____|
| |__) |___| (___  _   _| (___ | |__ | (___  
|  _  // _ \\___ \| | | |\___ \|  __| \___ \ 
| | \ \  __/____) | |_| |____) | |    ____) |
|_|  \_\___|_____/ \__,_|_____/|_|   |_____/ 

Authors:  ahmed-alnassif, simonpunk@gitlab.com
Version: v2.3.0

[%] status: active ✅ | susfs v2.3.0 (GKI) | features: 9 🧩
usage:
 --action 				full apply (early+late stage)
 --stage-early 				post-fs-data stage only
 --stage-late 				boot-completed stage only
 --status 				show susfs version / variant / enabled features
 --status-report 			silently refresh module.prop's live status line

if [file] is given it is appended (deduped) into the default list, then applied:
 --apply-sus-paths [file] 		add_sus_path from list
 --apply-sus-paths-loop [file] 		add_sus_path_loop from list
 --apply-sus-maps [file] 		add_sus_map from list
 --apply-kstat-add [file] 		stage add_sus_kstat from list
 --apply-kstat-update [file] 		commit update_sus_kstat from list
 --apply-open-redirect [file] 		add_open_redirect from list
 --apply-uname [file] 			set_uname from config
 --apply-cmdline-bootconfig [file] 	set_cmdline_or_bootconfig from file
 --apply-toggles <early|late> [file] 	apply hide_sus_mnts/enable_log/avc_log_spoofing from config
 --run-script <file> 			run a user script from UserHub
 --run-postfs-scripts 			run all UserHub scripts flagged for post-fs-data
 --run-bootcompleted-scripts 		run all UserHub scripts flagged for boot-completed

 --help 				displays this message

```

Every `--apply-*` flag accepts an optional file path. Passing one appends that file's contents into the default config file (deduplicated, comments preserved), then applies the merged default. It does not run standalone or get discarded after, it becomes a permanent part of your saved config:

```sh
ReSuSFS --apply-sus-paths /sdcard/my_paths.txt
```

Check status any time to confirm SuSFS is active and see which kernel features are enabled:

```sh
ReSuSFS --status
```

## Backup and share your config

The WebUI can export all your config files and UserHub scripts into a single archive, and restore from one. This makes it easy to share a working setup with the community, hand someone your config, or back it up before flashing something risky.

Export creates an archive in `/storage/emulated/0/Download/`. Send that file to anyone, they load it with Restore, done.

## Donate

If ReSuSFS is useful to you, consider supporting development.

**USDT (TRC20):** `TCyghELuquAtoUFdY65iuJSMqJXbYhWidA`

## Community

Join the discussion, get support, and stay up to date on ReSuSFS and other projects:

- **Telegram Group:** [ahmed_alnassif_tg](https://t.me/ahmed_alnassif_tg)

## Credits

- [SuSFS](https://gitlab.com/simonpunk/susfs4ksu) by simonpunk
- WebUI built on top of [bindhosts](https://github.com/bindhosts/bindhosts) by the bindhosts team

## Author

[Ahmed Al-Nassif](https://github.com/ahmed-alnassif) (@ahmed-alnassif)

## License

[GPLv3](https://www.gnu.org/licenses/gpl-3.0.html)