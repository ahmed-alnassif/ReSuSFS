#!/bin/sh
PATH=/data/adb/ksu/bin:$PATH
MODDIR="/data/adb/modules/ReSuSFS"
PERSISTENT_DIR="/data/adb/ReSuSFS"

# apply early-stage susfs config now that mounts have settled
sh $MODDIR/ReSuSFS.sh --stage-early

sh $MODDIR/ReSuSFS.sh --run-postfs-scripts

# EOF
