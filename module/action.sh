#!/bin/sh

PATH=/data/adb/ksu/bin:$PATH
MODDIR="/data/adb/modules/ReSuSFS"
PERSISTENT_DIR="/data/adb/ReSuSFS"

. "$MODDIR/utils.sh"

banner

update_susfs

export NO_BANNER=1
sh $MODDIR/ReSuSFS.sh --status

# EOF
