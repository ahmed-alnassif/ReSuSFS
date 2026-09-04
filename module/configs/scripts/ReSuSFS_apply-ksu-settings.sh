#!/system/bin/sh
#title=Set features
#author=ahmed-alnassif
#desc=Sets KernelSU features for hiding and compatibility

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

ksud feature set 1 0
ksud feature set 4 1

echo "[+] features set successfully"
echo "[*] no reboot required"
