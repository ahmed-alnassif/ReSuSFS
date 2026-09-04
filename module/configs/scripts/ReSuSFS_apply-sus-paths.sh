#!/system/bin/sh
#title=Hide paths
#author=ahmed-alnassif
#desc=Hides custom ROM traces and addon.d paths

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

LIST_FILE="/data/adb/ReSuSFS/tmp_sus_paths.txt"
ROM_NAMES="lineage infinity evolution crdroid mistos axion pixelos rising lunaris halcyon havoc alphadroid bliss calyx derpfest graphene lmodroid lumine matrixx clover yaap aospa"

: > "$LIST_FILE"

echo "/system/addon.d" >> "$LIST_FILE"

for rom in $ROM_NAMES; do
	find /system /vendor /product /system_ext -iname "*${rom}*" 2>/dev/null >> "$LIST_FILE"
done

find /data -maxdepth 1 -iname "*${rom}*" 2>/dev/null >> "$LIST_FILE"

if [ -s "$LIST_FILE" ]; then
	if ReSuSFS --apply-sus-paths "$LIST_FILE"; then
		echo "[+] path hiding applied successfully
[*] reboot recommended for changes to take full effect"
	else
		echo "[-] path hiding apply failed
[*] no reboot required"
	fi
else
	echo "[*] no paths found to hide
[*] nothing applied"
fi

rm -f "$LIST_FILE"