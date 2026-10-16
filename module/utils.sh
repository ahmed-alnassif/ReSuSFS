#!/bin/sh
PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH
MODDIR="/data/adb/modules/ReSuSFS"
export SUSFS_LKM="/data/adb/ReSuSFS_LKM"

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
		return 1
	fi

	if [ "$ARCH" != "arm64-v8a" ]; then
		echo "[!] Only arm64 is supported!"
		return 1
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
		return 1
	fi
}

check_susfs_support() {
	local BB
	BB=$(command -v busybox) || { echo "[!] No BusyBox found!"; return 1; }

	[ -f /proc/config.gz ] || return 1

	if $BB zcat /proc/config.gz 2>/dev/null | grep -q "^CONFIG_KSU_SUSFS=y"; then
		return 0
	fi

	return 1
}

get_susfs_guard_lkm() {
	local kmi
	kmi="$(uname -r | sed -E 's/^([0-9]+\.[0-9]+)\.[0-9]+-(android[0-9]+)-.*/\2-\1/')"

	case "$kmi" in
		android12-5.10) echo "susfs_guard_lkm-android12-5.10.ko" ;;
		android13-5.10) echo "susfs_guard_lkm-android13-5.10.ko" ;;
		android13-5.15) echo "susfs_guard_lkm-android13-5.15.ko" ;;
		android14-5.15) echo "susfs_guard_lkm-android14-5.15.ko" ;;
		android14-6.1)  echo "susfs_guard_lkm-android14-6.1.ko"  ;;
		android15-6.6)  echo "susfs_guard_lkm-android15-6.6.ko"  ;;
		android16-6.12) echo "susfs_guard_lkm-android16-6.12.ko" ;;
		android17-6.18) echo "susfs_guard_lkm-android17-6.18.ko" ;;
		*)
			echo "[!] You're using a custom kernel (KMI: ${kmi:-unknown}), no matching LKM found."
			return 1
			;;
	esac
	return 0
}

download_susfs_guard_lkm() {
	local BB kmi base_url dest_dir dest_file

	if check_susfs_support; then
		echo "[+] Built-in SuSFS support, skipping LKM download"
		return 0
	fi

	kmi="$(get_susfs_guard_lkm)" || {
		echo "[!] Cannot determine KMI, skipping LKM download."
		return 1
	}

	BB="$(command -v busybox)" || {
		echo "[!] No BusyBox found!"
		return 1
	}

	base_url="https://github.com/inforcqb/susfs4ksu-lkm/releases/latest/download"
	dest_dir="/data/local/tmp"
	echo "[+] Downloading ${kmi} its size about 5MB+"
	mkdir -p "$dest_dir" "$SUSFS_LKM" 2>/dev/null

	dest_file="$dest_dir/${kmi}"
	download_file "$base_url/${kmi}" "$dest_file" || {
		echo "[!] Failed to download ${kmi}"
		return 1
	}
	$BB mv -f "$dest_file" "$SUSFS_LKM/${kmi}" || {
		echo "[!] Failed to move ${kmi} to $SUSFS_LKM"
		return 1
	}
	$BB chmod 644 "$SUSFS_LKM/${kmi}"

	echo "[+] Downloading susfs_insmod its size about 32KB+"
	dest_file="$dest_dir/susfs_insmod"
	download_file "$base_url/susfs_insmod" "$dest_file" || {
		echo "[!] Failed to download susfs_insmod"
		return 1
	}
	$BB mv -f "$dest_file" "$SUSFS_LKM/susfs_insmod" || {
		echo "[!] Failed to move susfs_insmod to $SUSFS_LKM"
		return 1
	}
	$BB chmod 755 "$SUSFS_LKM/susfs_insmod"

	printf '%s\n' "$SUSFS_LKM"
	return 0
}

load_susfs_lkm() {
	local BB kmi lkm_file module_name insmod_bin loaded

	module_name="susfs_guard_lkm"

	if check_susfs_support; then
		echo "[+] Built-in SuSFS support detected, skipping LKM load"
		return 0
	fi

	BB="$(command -v busybox)" || {
		echo "[!] No BusyBox found!"
		return 1
	}

	kmi="$(get_susfs_guard_lkm)" || {
		echo "[!] Cannot determine KMI."
		return 1
	}

	lkm_file="$SUSFS_LKM/${kmi}"
	insmod_bin="$SUSFS_LKM/susfs_insmod"

	if [ ! -f "$lkm_file" ] || [ ! -x "$insmod_bin" ]; then
		echo "[*] LKM or susfs_insmod missing, downloading..."
		download_susfs_guard_lkm || {
			echo "[!] Failed to download LKM"
			return 1
		}
	fi

	if [ ! -f "$lkm_file" ]; then
		echo "[!] LKM not found: $lkm_file"
		return 1
	fi

	$BB rmmod $module_name
	echo "[*] Loading ${kmi}..."

	loaded=0

	if command -v ksud >/dev/null 2>&1; then
		if ksud insmod "$lkm_file" 2>/dev/null && \
		   $BB lsmod 2>/dev/null | $BB grep -q $module_name; then
			echo "[+] LKM loaded successfully (ksud)"
			loaded=1
		fi
	fi

	if [ "$loaded" -eq 0 ] && [ -x "$insmod_bin" ]; then
		echo "[*] Trying susfs_insmod fallback..."
		if "$insmod_bin" "$lkm_file" && \
		   $BB lsmod 2>/dev/null | $BB grep -q $module_name; then
			echo "[+] LKM loaded successfully (susfs_insmod)"
			loaded=1
		fi
	fi

	if [ "$loaded" -eq 0 ]; then
		echo "[!] Failed to load LKM (no working loader or module not visible)"
		return 1
	fi

	return 0
}

# EOF
