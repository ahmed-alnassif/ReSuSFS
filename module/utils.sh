#!/bin/sh
PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH
MODDIR="/data/adb/modules/ReSuSFS"

banner() {
	local dir="${1:-$MODDIR}"
	local module_prop="$dir/module.prop"
	local banner_file="$dir/banner"
	local author=$(sed -n 's/^author=//p' "$module_prop" 2>/dev/null)
	local version=$(sed -n 's/^version=//p' "$module_prop" 2>/dev/null)

	[ -f "$banner_file" ] && cat "$banner_file"

	echo "Authors:  ${author:-Unknown}"
	echo "Version: ${version:-Unknown}"
	echo
}

get_all_files() {
    local dir="$1"
    find "$dir" -type f 2>/dev/null | sed "s|^$dir/||"
}

download_file() {
	local BB url="$1" out="$2" attempt=1
	BB=$(command -v busybox) || { echo "[!] No BusyBox found!"; return 1; }
	while [ $attempt -le 3 ]; do
		echo "[*] Download attempt $attempt/3..."
		rm -f "$out"
		$BB wget -q --no-check-certificate "$url" -O "$out" && [ -s "$out" ] && { echo "[+] Download successful"; return 0; }
		rm -f "$out"
		echo "[-] Download failed"
		[ $attempt -lt 3 ] && $BB sleep 3
		attempt=$((attempt + 1))
	done
	echo "[!] All download attempts failed"
	return 1
}

update_susfs() {
	local BB url="https://gitlab.com/simonpunk/susfs4ksu/-/raw/gki-android14-6.1/ksu_module_susfs/tools/ksu_susfs_arm64?ref_type=heads"
	local tmp="/data/local/tmp/ksu_susfs_arm64"
	local DEST_BIN_DIR="/data/adb/ksu/bin"
	local ARCH="$(getprop ro.product.cpu.abi)"

	if [ ! -d "$DEST_BIN_DIR" ]; then
		echo "[!] '$DEST_BIN_DIR' not existed, installation aborted."
		exit 1
	fi

	if [ "$ARCH" != "arm64-v8a" ]; then
		echo "[!] Only arm64 is supported!"
		exit 1
	fi

	BB=$(command -v busybox) || { echo "[!] No BusyBox found!"; return 1; }
	echo "[+] BusyBox found: $BB"

	echo "[*] Downloading SUSFS binary..."
	download_file "$url" "$tmp" || return 1

	echo "[+] Installing ksu_susfs binary for arm64"
	if $BB mv -f "$tmp" "$DEST_BIN_DIR/ksu_susfs" && $BB chmod 755 "$DEST_BIN_DIR/ksu_susfs"; then
		echo "[+] SUSFS updated successfully!"
		return 0
	else
		rm -f "$tmp"
		echo "[!] Installation failed!"
		exit 1
	fi
}

# EOF
