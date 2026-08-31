#!/bin/sh
PATH=/data/adb/ap/bin:/data/adb/ksu/bin:/data/adb/magisk:$PATH
MODDIR="/data/adb/modules/ReSuSFS"
PERSISTENT_DIR="/data/adb/ReSuSFS"

while [ "$(getprop sys.boot_completed)" != "1" ]; do
	sleep 1
done

(
	while true; do
		sh $MODDIR/ReSuSFS.sh --status-report > /dev/null 2>&1
		sleep 5
	done
) &
