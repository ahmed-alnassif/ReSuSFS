import { exec } from 'kernelsu-alt';
import { showPrompt, basePath, filePaths } from './util.js';
import { getString } from './language.js';
import { FileSelector } from './file_selector.js';

/**
 * Export all ReSuSFS config files (and any UserHub scripts) into a
 * tar.gz archive under /storage/emulated/0/Download/.
 * @returns {Promise<void>}
 */
export async function exportConfig() {
    const configFiles = Object.entries(filePaths)
        .filter(([key]) => key !== 'customCSS')
        .map(([, path]) => path);

    const command = `
cd "${basePath}" || { echo "ERROR_CD"; exit 1; }

existing=""
for f in ${configFiles.map(f => `"${f}"`).join(' ')}; do
    [ -f "\$f" ] && existing="\$existing \$f"
done
[ -d scripts ] && [ -n "\$(ls -A scripts 2>/dev/null)" ] && existing="\$existing scripts"

if [ -z "\$existing" ]; then
    echo "NOTHING_TO_EXPORT"
    exit 1
fi

DIR="/storage/emulated/0/Download"
mkdir -p "\$DIR/ReSuSFS/log"
TAR_LOG="\$DIR/ReSuSFS/log/ReSuSFS_Export_tar.log"
OUT="\${DIR}/ReSuSFS_config_\$(date +%Y%m%d_%H%M%S).tar.gz"
busybox tar czf "\$OUT" \$existing 2> "\$TAR_LOG"

if [ -f "\$OUT" ]; then
    echo "\$OUT"
else
    echo "ERROR_TAR_FAILED"
    cat "\$TAR_LOG" 2>/dev/null
    exit 1
fi
    `;

    const result = await exec(command);
    const output = result.stdout.trim();

    if (result.errno === 0 && output && !output.startsWith('ERROR_')) {
        showPrompt(getString('backup_restore_exported', output));
    } else if (output.includes('NOTHING_TO_EXPORT')) {
        showPrompt(getString('backup_restore_nothing_to_export'), false);
    } else {
        console.error('Backup failed:', output, result.stderr);
        showPrompt(getString('backup_restore_export_fail'), false);
    }
}

/**
 * Restore config from a tar.gz archive, extracting it directly into
 * PERSISTENT_DIR, overwriting any files with the same name.
 * @returns {Promise<void>}
 */
export async function restoreConfig() {
    const path = await FileSelector.getFilePath('tar.gz');
    if (!path) return;

    const result = await exec(`busybox tar xzf "${path}" -C "${basePath}" 2>&1`);
    if (result.errno === 0) {
        showPrompt(getString('backup_restore_restored'));
    } else {
        console.error('Restore failed:', result.stdout, result.stderr);
        showPrompt(getString('backup_restore_restore_fail'), false);
    }
}
