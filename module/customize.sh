#!/bin/sh

DEST_BIN_DIR=/data/adb/ksu/bin
PERSISTENT_DIR=/data/adb/ReSuSFS

. "$MODPATH/utils.sh"

export MODULE_HOT_INSTALL_REQUEST="true"
export MODULE_HOT_RUN_SCRIPT="hotinstall.sh"

banner "$MODPATH"

ui_print "[%] customize.sh "

detect_key_press() {
	timeout_seconds=6
	timeout 0.5 getevent -c 0 >/dev/null 2>&1
	read -r -t $timeout_seconds line < <(getevent -ql | awk '/KEY_VOLUME/ {print; exit}')
	if [ $? -eq 142 ]; then
		ui_print "[!] No key pressed within $timeout_seconds seconds. Skipping installation..."
		return 1
	fi
	if echo "$line" | grep -q "KEY_VOLUMEUP"; then
		return 0
	else
		ui_print "[+] Skipping reset..."
		return 1
	fi
}

ui_print "[*] Have you backed up your configuration?"
ui_print "[*] VOLUME UP for YES, DOWN for NO"
if ! detect_key_press; then
	ui_print "[!] Please back up your configuration first"
	exit 1
fi

CONFIG_DIR="$MODPATH/configs"

[ ! -d "$CONFIG_DIR" ] || [ -z "$(ls -A "$CONFIG_DIR" 2>/dev/null)" ] && ui_print "[!] No config files found" && exit 0

handle_files() {
	src_dir="$1"
	dst_dir="$2"
	files="$3"
	action="$4"
	DIFFERENT=""
	for file in $files; do
		src="$src_dir/$file"
		dst="$dst_dir/$file"
		if [ ! -f "$dst" ]; then
			mkdir -p "$dst_dir/$(dirname "$file")"
			cp "$src" "$dst"
			ui_print "[+] $file copied"
		elif ! cmp -s "$src" "$dst"; then
			DIFFERENT="$DIFFERENT $file"
		fi
	done
	if [ -n "$DIFFERENT" ]; then
		ui_print "[*] Changed files:"
		for file in $DIFFERENT; do
			ui_print "    - $file"
		done
		ui_print "[*] VOLUME UP to $action, DOWN to keep"
		if detect_key_press; then
			for file in $DIFFERENT; do
				mkdir -p "$dst_dir/$(dirname "$file")"
				cp "$src_dir/$file" "$dst_dir/$file"
				ui_print "[+] $file $action"
			done
		else
			ui_print "[+] Kept existing files"
		fi
	fi
}

handle_files "$CONFIG_DIR" "$PERSISTENT_DIR" "scripts_bootcompleted.txt scripts_postfs.txt" "updated"
if [ -d "$CONFIG_DIR/scripts" ]; then
	handle_files "$CONFIG_DIR/scripts" "$PERSISTENT_DIR/scripts" "$(get_all_files "$CONFIG_DIR/scripts")" "updated"
fi

CONFIG_FILES=$(get_all_files "$CONFIG_DIR" | grep -v '^scripts/')
[ -n "$CONFIG_FILES" ] && handle_files "$CONFIG_DIR" "$PERSISTENT_DIR" "$CONFIG_FILES" "reset"

rm -rf "$CONFIG_DIR"

update_susfs || exit 1

chmod 755 "$MODPATH/ReSuSFS.sh"
chmod 644 "$MODPATH/post-fs-data.sh" "$MODPATH/service.sh" "$MODPATH/uninstall.sh" 2>/dev/null

if [ -d "$DEST_BIN_DIR" ]; then
	ui_print "[+] creating symlink in $DEST_BIN_DIR"
	ln -sf "/data/adb/modules/ReSuSFS/ReSuSFS.sh" "$DEST_BIN_DIR/ReSuSFS"
fi

if [ ! -d "$PERSISTENT_DIR/.webui_config" ] || [ ! -f "$PERSISTENT_DIR/.webui_config/custom.css" ]; then
	mkdir -p "$PERSISTENT_DIR/.webui_config"
	mv "$MODPATH/custom.css" "$PERSISTENT_DIR/.webui_config/custom.css"
else
	rm -f "$MODPATH/custom.css"
fi

# EOF
