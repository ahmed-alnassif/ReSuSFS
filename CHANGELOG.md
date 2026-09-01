
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
