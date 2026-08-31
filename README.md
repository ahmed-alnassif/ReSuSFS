# ReSuSFS

[![Build Status](https://github.com/ahmed-alnassif/ReSuSFS/actions/workflows/release.yml/badge.svg)](https://github.com/ahmed-alnassif/ReSuSFS/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/ahmed-alnassif/ReSuSFS?label=Latest%20Release&color=00aa00)](https://github.com/ahmed-alnassif/ReSuSFS/releases)
[![Downloads](https://img.shields.io/github/downloads/ahmed-alnassif/ReSuSFS/total?label=Downloads&color=00aa00)](https://github.com/ahmed-alnassif/ReSuSFS/releases)
[![GitHub License](https://img.shields.io/github/license/ahmed-alnassif/ReSuSFS?logo=gnu)](/LICENSE)
[![SuSFS](https://img.shields.io/badge/SuSFS-4CAF50?&logo=gitlab&logoColor=white)](https://gitlab.com/simonpunk/susfs4ksu)
[![KernelSU](https://img.shields.io/badge/KernelSU-000000?&logo=github&logoColor=white)](https://github.com/tiann/KernelSU)
[![KernelSU Next](https://img.shields.io/badge/KernelSU--Next-1976D2?&logo=github&logoColor=white)](https://github.com/KernelSU-Next/KernelSU-Next)
[![ReSukiSU](https://img.shields.io/badge/ReSukiSU-E91E63?&logo=github&logoColor=white)](https://github.com/ReSukiSU/ReSukiSU)

A simple [KernelSU](https://kernelsu.org) module that turns [SuSFS](https://gitlab.com/simonpunk/susfs4ksu) into a config-file-driven frontend. No manual shell editing, just edit a text file and apply.

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
- **Built-in code editor**, full-screen editor for every config file, no terminal needed
- **File manager**, browse storage and load a custom file straight into any feature, without overwriting your default
- **User-friendly SuSFS configs**, every feature exposed as its own clean box: edit, apply, or load custom
- **Toggle switches**, flip kernel flags (mount hiding, logging, avc spoofing) without touching raw text
- **Live entry counts**, see how many paths/rules are configured per feature before you dive in
- **Backup and restore**, export your whole config to one file, restore it on any device
- **Multi-language support**

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
Version: v2.3.0-dev

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

The WebUI can export all your config files into a single JSON file, and restore from one. This makes it easy to share a working setup with the community, hand someone your config, or back it up before flashing something risky.

Export creates a file in `/storage/emulated/0/Download/`. Send that file to anyone, they load it with Restore, done.

## Donate

If ReSuSFS is useful to you, consider supporting development.

**USDT (TRC20):** `TCyghELuquAtoUFdY65iuJSMqJXbYhWidA`

## Credits

- [SuSFS](https://gitlab.com/simonpunk/susfs4ksu) by simonpunk
- WebUI built on top of [bindhosts](https://github.com/bindhosts/bindhosts) by the bindhosts team

## Author

[Ahmed Al-Nassif](https://github.com/ahmed-alnassif) (@ahmed-alnassif)

## License

[GPLv3](https://www.gnu.org/licenses/gpl-3.0.html)