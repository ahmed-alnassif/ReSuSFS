#!/system/bin/sh
#title=Hide kstat
#author=ahmed-alnassif
#desc=Hides file stats for framework-managed paths

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

LIST_FILE="/data/adb/ReSuSFS/tmp_kstat.txt"

cat > "$LIST_FILE" << EOF
/system/etc/hosts 100 default default 64 default default default default default default 1 4096
/data/local/tmp 100 default default 4096 default default default default default default 8 4096
/data/adb/ReSuSFS default default default default default default default default default default default default
EOF

if ReSuSFS --apply-kstat-add "$LIST_FILE"; then
	echo "[+] kstat spoof applied successfully"
	echo "[*] reboot recommended for the spoofed stats to take effect"
else
	echo "[-] kstat spoof apply failed"
	echo "[*] reboot not required"
fi

rm -f "$LIST_FILE"
