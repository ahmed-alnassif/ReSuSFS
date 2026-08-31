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

if ls "$PERSISTENT_DIR"/*.txt >/dev/null 2>&1; then
	ui_print "[*] existing ReSuSFS configs found in $PERSISTENT_DIR"
	ui_print "[*] press VOLUME UP within 6 seconds to reset configs to defaults"
	ui_print "[*] press VOLUME DOWN, or wait, to keep your existing configs"
	if detect_key_press; then
		rm -f "$PERSISTENT_DIR"/*.txt
		cp "$MODPATH"/*.txt "$PERSISTENT_DIR"/
		ui_print "[+] configs reset successful"
	else
		ui_print "[+] existing configs kept"
	fi
else
	cp "$MODPATH"/*.txt "$PERSISTENT_DIR"/
	ui_print "[+] configs copied successfully"
fi

rm -f "$MODPATH"/*.txt

rm -f "$MODPATH"/*.txt

update_susfs

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
