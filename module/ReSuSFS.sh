#!/bin/sh
PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH
MODDIR="/data/adb/modules/ReSuSFS"
PERSISTENT_DIR="/data/adb/ReSuSFS"
USER_SCRIPTS_DIR="$PERSISTENT_DIR/scripts"
POSTFS_SCRIPTS_FILE="$PERSISTENT_DIR/scripts_postfs.txt"
BOOTCOMPLETED_SCRIPTS_FILE="$PERSISTENT_DIR/scripts_bootcompleted.txt"
SUSFS_BIN=/data/adb/ksu/bin/ksu_susfs
SUSFS_MIN_VERSION="v2.2.0"

. "$MODDIR/utils.sh"

versionCode=$(grep versionCode $MODDIR/module.prop | sed 's/versionCode=//g' )

[ -n "$WEBUI_QUIET" ] && [ "${NO_BANNER:-0}" = "0" ] && banner

[ -f $MODDIR/disable ] && {
	echo "[*] not running since module has been disabled"
	string="description=status: disabled ❌ | $(date)"
	sed -i "s/^description=.*/$string/g" $MODDIR/module.prop
	return
}

if [ ! -x "$SUSFS_BIN" ]; then
	echo "[x] ksu_susfs binary not found at $SUSFS_BIN 😭"
	echo "[x] this kernel does not expose susfs, or susfs userspace tool is missing"
	string="description=status: susfs binary not found 😭 needs correction 💢"
	sed -i "s/^description=.*/$string/g" $MODDIR/module.prop
	: > "$MODDIR/disable"
	return
fi

susfs() { "$SUSFS_BIN" "$@"; }

version_ge() {
	ver1="${1#v}"
	ver2="${2#v}"

	major1=$(echo "$ver1" | cut -d. -f1); major1=${major1:-0}
	minor1=$(echo "$ver1" | cut -d. -f2); minor1=${minor1:-0}
	patch1=$(echo "$ver1" | cut -d. -f3); patch1=${patch1:-0}

	major2=$(echo "$ver2" | cut -d. -f1); major2=${major2:-0}
	minor2=$(echo "$ver2" | cut -d. -f2); minor2=${minor2:-0}
	patch2=$(echo "$ver2" | cut -d. -f3); patch2=${patch2:-0}

	[ "$major1" -gt "$major2" ] && return 0
	[ "$major1" -lt "$major2" ] && return 1
	[ "$minor1" -gt "$minor2" ] && return 0
	[ "$minor1" -lt "$minor2" ] && return 1
	[ "$patch1" -ge "$patch2" ]
}

susfs_version=$(susfs show version 2>/dev/null)
if [ -z "$susfs_version" ] || ! version_ge "$susfs_version" "$SUSFS_MIN_VERSION"; then
	echo "[x] unsupported susfs version: '$susfs_version' 😭"
	echo "[x] need $SUSFS_MIN_VERSION or higher"
	string="description=status: unsupported susfs $susfs_version ❌ | need $SUSFS_MIN_VERSION+"
	sed -i "s/^description=.*/$string/g" $MODDIR/module.prop
	: > "$MODDIR/disable"
	return
fi

[ ! -d "$PERSISTENT_DIR" ] && mkdir -p "$PERSISTENT_DIR"

get_conf() {
	file="${3:-$PERSISTENT_DIR/config.txt}"
	val=$(grep "^$1=" "$file" 2>/dev/null | tail -n1 | cut -d'=' -f2-)
	[ -z "$val" ] && val="$2"
	echo "$val"
}

read_list() {
	[ -f "$1" ] || return
	sed 's/#.*//' "$1" | grep -v '^[[:space:]]*$'
}

[ ! -d "$USER_SCRIPTS_DIR" ] && mkdir -p "$USER_SCRIPTS_DIR"
[ ! -f "$POSTFS_SCRIPTS_FILE" ] && : > "$POSTFS_SCRIPTS_FILE"
[ ! -f "$BOOTCOMPLETED_SCRIPTS_FILE" ] && : > "$BOOTCOMPLETED_SCRIPTS_FILE"

run_stage_scripts() {
	stage_file="$1"
	[ -f "$stage_file" ] || return
	list=$(read_list "$stage_file") || return
	[ -z "$list" ] && return
	echo "$list" | while IFS= read -r name; do
		case "$name" in
			"!"*) continue ;;
		esac
		script="$USER_SCRIPTS_DIR/$name"
		if [ -f "$script" ]; then
			echo "[>] running $script"
			sh "$script"
		else
			echo "[!] script not found, skipping: $name"
		fi
	done
}

run_script() {
	script="$1"
	[ -z "$script" ] && { echo "[x] no script specified"; echo "[!] syntax: --run-script <path>"; exit 1; }
	case "$script" in
		*.sh) : ;;
		*) echo "[x] only .sh files allowed: $script"; exit 1 ;;
	esac
	[ -f "$script" ] || { echo "[x] script not found: $script"; exit 1; }
	[ -r "$script" ] || { echo "[x] script not readable: $script"; exit 1; }
	echo "[>] running $script"
	sh "$script"
	echo "[+] exit code: $?"
}

apply_list() {
	default="$1"; cmd="$2"; mode="$3"; file="${4:-$default}"

	if [ -f "$file" ]; then
		tmp="${file}.tmp.$$"
		busybox awk '
			/^[[:space:]]*#/ { print; next }
			/^[[:space:]]*$/ { next }
			!seen[$0]++
		' "$file" > "$tmp" && cat "$tmp" > "$file"
		rm -f "$tmp"
	fi

	list=$(read_list "$file") || return
	[ -z "$list" ] && return
	echo "$list" | while IFS= read -r p; do
		if [ "$mode" = "1" ] && [ ! -e "$p" ]; then echo "[!] skip missing path: $p"; continue; fi
		if [ "$mode" = "2" ] && [ ! -e "$p" ]; then continue; fi
		echo "[>] $cmd $p"
		susfs "$cmd" "$p"
	done
}

append_to_default() {
	default="$1"
	src="${2:-$default}"
	[ "$src" = "$default" ] && return 0
	case "$src" in
		*.txt) : ;;
		*) echo "[x] only .txt files allowed: $src"; return 1 ;;
	esac
	[ -f "$src" ] || { echo "[x] file not found: $src"; return 1; }
	[ -r "$src" ] || { echo "[x] file not readable: $src"; return 1; }
	[ -s "$src" ] || { echo "[x] file empty: $src"; return 1; }

	cat "$src" >> "$default"

	tmp="${default}.tmp.$$"
	busybox awk '
		/^[[:space:]]*#/ { print; next }
		!seen[$0]++
	' "$default" > "$tmp" && {
		cat "$tmp" > "$default"
		rm -f "$tmp"
	}

	echo "[>] appended $src -> $default"
}

apply_sus_paths() { [ -n "$1" ] && { append_to_default "$PERSISTENT_DIR/sus_paths.txt" "$1" || return 1; }; apply_list "$PERSISTENT_DIR/sus_paths.txt" add_sus_path 1; }
apply_sus_paths_loop() { [ -n "$1" ] && { append_to_default "$PERSISTENT_DIR/sus_paths_loop.txt" "$1" || return 1; }; apply_list "$PERSISTENT_DIR/sus_paths_loop.txt" add_sus_path_loop 0; }
apply_sus_maps() { [ -n "$1" ] && { append_to_default "$PERSISTENT_DIR/sus_maps.txt" "$1" || return 1; }; apply_list "$PERSISTENT_DIR/sus_maps.txt" add_sus_map 1; }
apply_kstat_add() { [ -n "$1" ] && { append_to_default "$PERSISTENT_DIR/kstat_paths.txt" "$1" || return 1; }; apply_list "$PERSISTENT_DIR/kstat_paths.txt" add_sus_kstat 1; }
apply_kstat_update() { [ -n "$1" ] && { append_to_default "$PERSISTENT_DIR/kstat_paths.txt" "$1" || return 1; }; apply_list "$PERSISTENT_DIR/kstat_paths.txt" update_sus_kstat 2; }

apply_open_redirect() {
	[ -n "$1" ] && { append_to_default "$PERSISTENT_DIR/open_redirect.txt" "$1" || return 1; }
	file="$PERSISTENT_DIR/open_redirect.txt"
	list=$(read_list "$file") || return
	[ -z "$list" ] && return
	echo "$list" | while IFS= read -r line; do
		target=$(echo "$line" | awk '{print $1}')
		redirect=$(echo "$line" | awk '{print $2}')
		scheme=$(echo "$line" | awk '{print $3}')
		[ -z "$target" ] || [ -z "$redirect" ] || [ -z "$scheme" ] && continue
		[ -e "$target" ] && [ -e "$redirect" ] || { echo "[!] skip: $target -> $redirect (missing endpoint)"; continue; }
		echo "[>] add_open_redirect $target -> $redirect (scheme $scheme)"
		susfs add_open_redirect "$target" "$redirect" "$scheme"
	done
}

apply_uname() {
	[ -n "$1" ] && { append_to_default "$PERSISTENT_DIR/uname.txt" "$1" || return 1; }
	file="$PERSISTENT_DIR/uname.txt"
	[ -f "$file" ] || return
	release=$(grep "^release=" "$file" | cut -d'=' -f2-)
	version=$(grep "^version=" "$file" | cut -d'=' -f2-)
	[ -z "$release" ] && release="default"
	[ -z "$version" ] && version="default"
	echo "[>] set_uname '$release' '$version'"
	susfs set_uname "$release" "$version"
}

apply_cmdline_bootconfig() {
	[ -n "$1" ] && { append_to_default "$PERSISTENT_DIR/cmdline_or_bootconfig.txt" "$1" || return 1; }
	file="$PERSISTENT_DIR/cmdline_or_bootconfig.txt"
	[ -s "$file" ] || return
	echo "[>] set_cmdline_or_bootconfig $file"
	susfs set_cmdline_or_bootconfig "$file"
}

status_report() {
	feat=$(susfs show enabled_features 2>/dev/null | wc -l)
	variant=$(susfs show variant 2>/dev/null)
	string="description=status: active ✅ | susfs $susfs_version ($variant) | features: $feat 🧩"
	sed -i "s/^description=.*/$string/g" $MODDIR/module.prop
	echo "[+] $susfs_version | $variant | features: $feat"
}

apply_toggles() {
	stage="$1"
	file="${2:-$PERSISTENT_DIR/config.txt}"
	[ -f "$file" ] || return
	if [ "$stage" = "early" ]; then
		hide_mnts=$(get_conf HIDE_SUS_MNTS_NON_SU "" "$file")
		enable_log=$(get_conf ENABLE_LOG "" "$file")
		avc_spoof=$(get_conf ENABLE_AVC_LOG_SPOOFING "" "$file")

		[ -n "$hide_mnts" ] && { echo "[>] hide_sus_mnts_for_non_su_procs $hide_mnts (early)"; susfs hide_sus_mnts_for_non_su_procs "$hide_mnts"; }
		[ -n "$enable_log" ] && { echo "[>] enable_log $enable_log"; susfs enable_log "$enable_log"; }
		[ -n "$avc_spoof" ] && { echo "[>] enable_avc_log_spoofing $avc_spoof"; susfs enable_avc_log_spoofing "$avc_spoof"; }
	elif [ "$stage" = "late" ]; then
		hide_mnts=$(get_conf HIDE_SUS_MNTS_NON_SU "" "$file")
		[ -n "$hide_mnts" ] && { echo "[>] hide_sus_mnts_for_non_su_procs $hide_mnts (late)"; susfs hide_sus_mnts_for_non_su_procs "$hide_mnts"; }
	fi
}

stage_early() {
	echo "[+] stage: early (post-fs-data)"
	apply_kstat_add
	apply_uname
	apply_open_redirect
	apply_cmdline_bootconfig
	apply_toggles early
}

stage_late() {
	echo "[+] stage: late (boot-completed)"
	apply_sus_paths
	apply_sus_paths_loop
	apply_sus_maps
	apply_kstat_update
	apply_toggles late
	status_report
}

run() {
	stage_early
	stage_late
}

action() { run; }

show_status() {
	echo "$susfs_version"
	susfs show variant
	susfs show enabled_features
}

show_help () {
	banner
	echo "[%] $( grep '^description=' $MODDIR/module.prop | sed 's/description=//' )"
	echo "usage:"
	printf " --action \t\t\t\tfull apply (early+late stage)\n"
	printf " --stage-early \t\t\t\tpost-fs-data stage only\n"
	printf " --stage-late \t\t\t\tboot-completed stage only\n"
	printf " --status \t\t\t\tshow susfs version / variant / enabled features\n"
	printf " --status-report \t\t\tsilently refresh module.prop's live status line\n"
	printf "\n"
	printf "if [file] is given it is appended (deduped) into the default list, then applied:\n"
	printf " --apply-sus-paths [file] \t\tadd_sus_path from list\n"
	printf " --apply-sus-paths-loop [file] \t\tadd_sus_path_loop from list\n"
	printf " --apply-sus-maps [file] \t\tadd_sus_map from list\n"
	printf " --apply-kstat-add [file] \t\tstage add_sus_kstat from list\n"
	printf " --apply-kstat-update [file] \t\tcommit update_sus_kstat from list\n"
	printf " --apply-open-redirect [file] \t\tadd_open_redirect from list\n"
	printf " --apply-uname [file] \t\t\tset_uname from config\n"
	printf " --apply-cmdline-bootconfig [file] \tset_cmdline_or_bootconfig from file\n"
	printf " --apply-toggles <early|late> [file] \tapply hide_sus_mnts/enable_log/avc_log_spoofing from config\n"
	printf " --run-script <file> \t\t\trun a user script from UserHub\n"
	printf " --run-postfs-scripts \t\t\trun all UserHub scripts flagged for post-fs-data\n"
	printf " --run-bootcompleted-scripts \t\trun all UserHub scripts flagged for boot-completed\n"
	printf "\n"
	printf " --help \t\t\t\tdisplays this message\n"
}

case "$1" in
	--action) action; exit ;;
	--stage-early) stage_early; exit ;;
	--stage-late) stage_late; exit ;;
	--status) show_status; exit ;;
	--status-report) status_report; exit ;;
	--apply-sus-paths) apply_sus_paths "$2"; exit ;;
	--apply-sus-paths-loop) apply_sus_paths_loop "$2"; exit ;;
	--apply-sus-maps) apply_sus_maps "$2"; exit ;;
	--apply-kstat-add) apply_kstat_add "$2"; exit ;;
	--apply-kstat-update) apply_kstat_update "$2"; exit ;;
	--apply-open-redirect) apply_open_redirect "$2"; exit ;;
	--apply-uname) apply_uname "$2"; exit ;;
	--apply-cmdline-bootconfig) apply_cmdline_bootconfig "$2"; exit ;;
	--apply-toggles) apply_toggles "$2" "$3"; exit ;;
	--run-script) shift; run_script "$1"; exit ;;
	--run-postfs-scripts) run_stage_scripts "$POSTFS_SCRIPTS_FILE"; exit ;;
	--run-bootcompleted-scripts) run_stage_scripts "$BOOTCOMPLETED_SCRIPTS_FILE"; exit ;;
	--help|*) show_help; exit ;;
esac

# EOF
