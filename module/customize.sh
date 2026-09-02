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

CONFIG_DIR="$MODPATH/configs"

if [ ! -d "$CONFIG_DIR" ] || [ -z "$(ls -A "$CONFIG_DIR" 2>/dev/null)" ]; then
    ui_print "[!] No config files found in module"
else
    CONFIG_FILES=$(get_all_files "$CONFIG_DIR")

    if [ -z "$CONFIG_FILES" ]; then
        ui_print "[!] No config files found in module"
    else
        IDENTICAL_FILES=""
        MISSING_FILES=""
        DIFFERENT_FILES=""

        for file in $CONFIG_FILES; do
            src_file="$CONFIG_DIR/$file"
            dst_file="$PERSISTENT_DIR/$file"

            if [ ! -f "$dst_file" ]; then

                MISSING_FILES="$MISSING_FILES $file"
                mkdir -p "$PERSISTENT_DIR/$(dirname "$file")"
                cp "$src_file" "$dst_file"
                ui_print "[+] $file copied (was missing)"
            elif cmp -s "$src_file" "$dst_file"; then
                IDENTICAL_FILES="$IDENTICAL_FILES $file"
                ui_print "[+] $file already exists (identical, skipped)"
            else
                DIFFERENT_FILES="$DIFFERENT_FILES $file"
            fi
        done

        if [ -n "$DIFFERENT_FILES" ]; then
            ui_print "[*] Different config files found:"
            for file in $DIFFERENT_FILES; do
                ui_print "    - $file"
            done
            ui_print "[*] press VOLUME UP within 6 seconds to reset these configs to defaults"
            ui_print "[*] press VOLUME DOWN, or wait, to keep your existing configs"

            if detect_key_press; then
                for file in $DIFFERENT_FILES; do
                    mkdir -p "$PERSISTENT_DIR/$(dirname "$file")"
                    cp "$CONFIG_DIR/$file" "$PERSISTENT_DIR/$file"
                    ui_print "[+] $file reset to default"
                done
                ui_print "[+] configs reset successful"
            else
                ui_print "[+] existing configs kept"
            fi
        fi
    fi
fi

rm -rf $CONFIG_DIR

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
