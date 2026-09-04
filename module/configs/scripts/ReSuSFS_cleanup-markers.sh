#!/system/bin/sh
#title=Clean markers
#author=ahmed-alnassif
#desc=Removes susfs leftover markers from shared storage

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

MARKER_NAME="..5.u.S"
STORAGE_ROOT="/storage/emulated/0"
found=0

for sub in "" Android/data Android/media Android/obb; do
	target="$STORAGE_ROOT/$sub/$MARKER_NAME"
	if [ -e "$target" ]; then
		rm -rf "$target"
		found=1
	fi
done

if [ "$found" = "1" ]; then
	echo "[+] markers removed successfully
[*] no reboot required"
else
	echo "[*] no markers found, nothing to remove
[*] no reboot required"
fi