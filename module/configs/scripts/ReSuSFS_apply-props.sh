#!/system/bin/sh
#title=Spoof props
#author=ahmed-alnassif
#desc=Spoofs root indicators and removes custom ROM fingerprints

PATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:$PATH

set_prop_if_present() {
	current=$(resetprop "$1" 2>/dev/null)
	[ -z "$current" ] && return
	[ "$current" = "$2" ] && return
	resetprop -n "$1" "$2"
}

ROM_NAMES="lineage|infinity|evolution|crdroid|mistos|axion|pixelos|rising|lunaris|halcyon|havoc|alphadroid|bliss|calyx|derpfest|graphene|lmodroid|lumine|matrixx|clover|yaap|aospa"

resetprop | grep -iE "$ROM_NAMES" | awk -F'[][]' '{print $2}' | while read -r prop; do
	resetprop -d "$prop" 2>/dev/null
done

resetprop | grep -iE "pihook|pixelprops|spoof" | awk -F'[][]' '{print $2}' | while read -r prop; do
	resetprop -d -p "$prop" 2>/dev/null
done

set_prop_if_present ro.secure 1
set_prop_if_present ro.debuggable 0
set_prop_if_present ro.adb.secure 1
set_prop_if_present ro.boot.verifiedbootstate green
set_prop_if_present ro.boot.flash.locked 1
set_prop_if_present ro.boot.veritymode enforcing
set_prop_if_present ro.build.type user
set_prop_if_present ro.build.tags release-keys
set_prop_if_present ro.crypto.state encrypted
set_prop_if_present ro.allow.mock.location 0
set_prop_if_present ro.warranty_bit 0
set_prop_if_present ro.secureboot.lockstate locked
set_prop_if_present ro.bootmode normal

resetprop -d ro.boot.verifiedbooterror 2>/dev/null
resetprop -d crashrecovery.rescue_boot_count 2>/dev/null

fingerprint=$(resetprop ro.build.fingerprint)
spoofed=$(printf '%s' "$fingerprint" | sed -e 's/userdebug/user/' -e 's/lineage//' -e 's/crdroid//')
set_prop_if_present ro.build.fingerprint "$spoofed"

resetprop -c --force 2>/dev/null

echo "[+] props spoofed successfully"
echo "[*] reboot recommended for a clean boot with the spoofed properties"