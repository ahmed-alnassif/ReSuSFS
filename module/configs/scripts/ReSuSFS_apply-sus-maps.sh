#!/system/bin/sh
#title=Hide maps
#author=ahmed-alnassif
#desc=Hides zygisk libraries and module font files from memory maps

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

LIST_FILE="/data/adb/ReSuSFS/tmp_sus_maps.txt"

: > "$LIST_FILE"

find /data/adb/modules -name "*.so" 2>/dev/null >> "$LIST_FILE"

find /data/adb/modules -type f \( -name "*.ttf" -o -name "*.otf" -o -name "*.ttc" \) 2>/dev/null >> "$LIST_FILE"

sort -u "$LIST_FILE" -o "$LIST_FILE"

if [ -s "$LIST_FILE" ]; then
	if ReSuSFS --apply-sus-maps "$LIST_FILE"; then
		echo "[+] map hiding applied successfully"
		echo "[*] reboot recommended for changes to take full effect"
	else
		echo "[-] map hiding apply failed"
		echo "[*] no reboot required"
	fi
else
	echo "[*] no paths found to hide"
	echo "[*] nothing applied"
fi

rm -f "$LIST_FILE"