#!/system/bin/sh
#title=Set features
#author=ahmed-alnassif
#desc=Sets KernelSU features for hiding and compatibility

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

ksud feature set su_compat 1
ksud feature set kernel_umount 1
ksud feature set selinux_hide 1

echo "[+] features set successfully"
echo "[*] no reboot required"
