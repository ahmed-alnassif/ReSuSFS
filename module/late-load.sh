#!/bin/sh
PATH=/data/adb/ksu/bin:$PATH
MODDIR="/data/adb/modules/ReSuSFS"
PERSISTENT_DIR="/data/adb/ReSuSFS"

sh "$MODDIR/post-fs-data.sh" > /dev/null 2>&1

echo "ReSuSFS: late-load.sh done" >> /dev/kmsg

# EOF
