#!/system/bin/sh
#title=Spoof cmdline
#author=ahmed-alnassif
#desc=Hides bootloader unlock state from kernel cmdline/bootconfig

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

if [ -e "/proc/bootconfig" ]; then
	SOURCE_PATH="/proc/bootconfig"
else
	SOURCE_PATH="/proc/cmdline"
fi

OUTPUT_FILE="/data/adb/ReSuSFS/tmp_cmdline_or_bootconfig.txt"

cat "$SOURCE_PATH" > "$OUTPUT_FILE"

if [ -e "/proc/bootconfig" ]; then
	sed -i 's/androidboot.warranty_bit = "1"/androidboot.warranty_bit = "0"/' "$OUTPUT_FILE"
	sed -i 's/androidboot.verifiedbootstate = "orange"/androidboot.verifiedbootstate = "green"/' "$OUTPUT_FILE"
	sed -i 's/androidboot.vbmeta.device_state = "unlocked"/androidboot.vbmeta.device_state = "locked"/' "$OUTPUT_FILE"
else
	sed -i 's/androidboot.warranty_bit=1/androidboot.warranty_bit=0/' "$OUTPUT_FILE"
	sed -i 's/androidboot.verifiedbootstate=orange/androidboot.verifiedbootstate=green/' "$OUTPUT_FILE"
	sed -i 's/androidboot.vbmeta.device_state=unlocked/androidboot.vbmeta.device_state=locked/' "$OUTPUT_FILE"
fi

if ReSuSFS --apply-cmdline-bootconfig "$OUTPUT_FILE"; then
	echo "[+] cmdline/bootconfig spoof applied successfully
[*] reboot required/recommended for the spoofed source to be used consistently after boot"
else
	echo "[-] cmdline/bootconfig spoof apply failed
[*] reboot not required"
fi

rm -f "$OUTPUT_FILE"