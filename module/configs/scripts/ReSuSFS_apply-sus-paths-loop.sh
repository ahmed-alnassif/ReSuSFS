#!/system/bin/sh
#title=Hide paths loop
#author=ahmed-alnassif
#desc=Hides recovery traces, root tools, and suspicious pty nodes

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

LIST_FILE="/data/adb/ReSuSFS/tmp_sus_paths_loop.txt"

: > "$LIST_FILE"

for path in \
	/storage/emulated/0/Fox \
	/storage/emulated/0/TWRP \
	/data/recovery \
	/vendor/bin/install-recovery.sh \
	/system/bin/install-recovery.sh \
	/sdcard/TWRP \
	/sdcard/MT2 \
	/sdcard/APKTool \
	/sdcard/Apktool_M \
	/sdcard/AppManager \
	/sdcard/Android/data/io.github.muntashirakon.AppManager \
	/sdcard/Android/media/io.github.muntashirakon.AppManager \
	/data/media/0/TWRP \
	/data/media/0/MT2 \
	/data/media/0/AppManager \
	/data/media/0/Android/data/io.github.muntashirakon.AppManager \
	/data/media/0/Android/media/io.github.muntashirakon.AppManager \
	/data/media/0/Android/data/com.termux \
	/data/media/0/Android/media/com.termux \
	/data/media/0/Android/data/ru.maximoff.apktool \
	/data/media/0/Android/media/ru.maximoff.apktool \
	/data/media/0/Android/data/top.hookvip.pro \
	/data/media/0/Android/media/top.hookvip.pro \
	/data/local/tmp/main.jar; do
	echo "$path" >> "$LIST_FILE"
done

for pty in /dev/pts/*; do
	[ -e "$pty" ] && echo "$pty" >> "$LIST_FILE"
done

if [ -s "$LIST_FILE" ]; then
	if ReSuSFS --apply-sus-paths-loop "$LIST_FILE"; then
		echo "[+] path hiding applied successfully
[*] reboot recommended for persistent hiding across boot"
	else
		echo "[-] path hiding apply failed
[*] no reboot required"
	fi
else
	echo "[*] no paths found to hide
[*] nothing applied"
fi

rm -f "$LIST_FILE"