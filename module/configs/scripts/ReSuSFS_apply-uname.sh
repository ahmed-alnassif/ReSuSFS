#!/system/bin/sh
#title=Spoof uname
#author=ahmed-alnassif
#desc=Spoofs kernel version and build info from uname

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

CONF_FILE="/data/adb/ReSuSFS/tmp_uname.txt"

base_ver=$(cat /proc/version | awk '{print $3}' | grep -oE '^[0-9]+\.[0-9]+\.[0-9]+')
build_info="#1 SMP PREEMPT $(getprop ro.build.date | tr -s ' ')"

if ksu boot-info current-kmi >/dev/null 2>&1; then
	kmi_tag=$(ksu boot-info current-kmi | cut -d'-' -f1)
	android_tag=$(ksu boot-info current-kmi | cut -d'-' -f2)
	final_release="${base_ver}-${android_tag}-9-g$(cat /proc/sys/kernel/random/boot_id | tr -d '-' | cut -c1-8)-ab$(cat /proc/sys/kernel/random/boot_id | tr -d '-' | cut -c9-16)"
else
	final_release="${base_ver}-g$(cat /proc/sys/kernel/random/boot_id | tr -d '-' | cut -c1-8)"
fi

cat > "$CONF_FILE" << EOF
release=${final_release}
version=${build_info}
EOF

if ReSuSFS --apply-uname "$CONF_FILE"; then
	echo "[+] uname spoofed successfully"
	echo "[*] reboot recommended for processes started after boot to consistently observe the spoofed values"
else
	echo "[-] uname spoof apply failed"
	echo "[*] reboot not required"
fi

rm -f "$CONF_FILE"