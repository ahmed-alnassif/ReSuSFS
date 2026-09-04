#!/system/bin/sh
#title=Spoof settings
#author=ahmed-alnassif
#desc=Spoofs developer options, debugging states, and SELinux status

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

settings put global development_settings_enabled 0
settings put global adb_enabled 0
settings put global adb_wifi_enabled 0
settings put global package_verifier_enable 1
settings put global verifier_verify_adb_installs 1
settings put global hidden_api_policy 0
settings put global usb_mass_storage_enabled 0

[ "$(getenforce)" != "Enforcing" ] && setenforce 1

echo "[+] settings spoofed successfully"
echo "[*] no reboot required"