import { exec } from 'kernelsu-alt';
import { showPrompt, basePath, linkRedirect, filePaths, updateUIVisibility } from '../../utils/util.js';
import { getString } from '../../utils/language.js';
import { FileSelector } from '../../utils/file_selector.js';
import { addCopyToClipboardListeners, setupDocsMenu } from '../../utils/docs.js';
import { formatCapturedLogs, capturedLogs } from '../../utils/log_catcher.js';

let languageMenuListener = false;
/**
 * Open language menu overlay
 * @returns {void}
 * @see controlPanelEventlistener
 */
function openLanguageMenu() {
    const languageOverlay = document.getElementById('language-overlay');

    // Open menu
    languageOverlay.show();

    if (!languageMenuListener) {
        languageMenuListener = true;
        const closeBtn = languageOverlay.querySelector('.close-btn');
        closeBtn.onclick = () => languageOverlay.close();
    }
}

let aboutDialogListener = false;
/**
 * Open the About dialog (author, license, repo, version)
 * @returns {void}
 * @see controlPanelEventlistener
 */
function openAboutDialog() {
    const aboutDialog = document.getElementById('about-dialog');
    aboutDialog.show();

    if (!aboutDialogListener) {
        aboutDialogListener = true;
        const closeBtn = aboutDialog.querySelector('.close-btn');
        closeBtn.onclick = () => aboutDialog.close();
    }

    exec(`grep -m1 '^version=' ${moduleDirectory}/module.prop | cut -d= -f2-`)
        .then(({ errno, stdout }) => {
            const versionEl = document.getElementById('about-version-text');
            if (versionEl) versionEl.textContent = errno === 0 ? stdout.trim() : '';
        });

    const authorLink = document.getElementById('about-author-link');
    const licenseLink = document.getElementById('about-license-link');
    const repoLink = document.getElementById('about-repo-link');
    if (authorLink) authorLink.onclick = (e) => { e.preventDefault(); linkRedirect('https://github.com/ahmed-alnassif'); };
    if (licenseLink) licenseLink.onclick = (e) => { e.preventDefault(); linkRedirect('https://www.gnu.org/licenses/gpl-3.0.html'); };
    if (repoLink) repoLink.onclick = (e) => { e.preventDefault(); linkRedirect('https://github.com/ahmed-alnassif/ReSuSFS'); };
}

async function exportConfig() {
    const configFiles = Object.entries(filePaths)
        .filter(([key]) => key !== 'customCSS')
        .map(([, path]) => path);

    const command = `
cd "${basePath}" || { echo "ERROR_CD"; exit 1; }

existing=""
for f in ${configFiles.map(f => `"${f}"`).join(' ')}; do
    [ -f "$f" ] && existing="$existing $f"
done
[ -d scripts ] && [ -n "$(ls -A scripts 2>/dev/null)" ] && existing="$existing scripts"

if [ -z "$existing" ]; then
    echo "NOTHING_TO_EXPORT"
    exit 1
fi

OUT="/storage/emulated/0/Download/ReSuSFS_config_$(date +%Y%m%d_%H%M%S).tar.gz"
busybox tar czf "$OUT" $existing 2>/tmp/resusfs_tar.log

if [ -f "$OUT" ]; then
    echo "$OUT"
else
    echo "ERROR_TAR_FAILED"
    cat /tmp/resusfs_tar.log 2>/dev/null
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

async function restoreConfig() {
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

/**
 * Open the log viewer terminal.
 * @returns {void}
 */
function openLogViewer() {
    const terminal = document.getElementById('logs-terminal');
    const backButton = document.querySelector('.back-button');
    const saveButton = document.getElementById('save-btn');

    refreshLogTerminal();

    terminal.open();
    saveButton.onclick = () => saveLogsToFile();

    const closeLogViewer = () => {
        terminal.close();
    };

    backButton.onclick = closeLogViewer;
}

/**
 * Save captured logs to Download folder.
 * @returns {Promise<void>}
 */
async function saveLogsToFile() {
    const logs = formatCapturedLogs();
    const fileName = `/storage/emulated/0/Download/ReSuSFS_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    const result = await exec(`
cat << 'LOG_EOF' > "${fileName}"
${logs}
LOG_EOF
`);

    if (result.errno === 0) {
        showPrompt(getString('global_saved', fileName));
    } else {
        showPrompt(getString('global_save_fail'), false);
        console.error("Failed to save logs:", result.stderr);
    }
}

/**
 * Refresh the log terminal UI.
 * @returns {void}
 */
function refreshLogTerminal() {
    const terminalContent = document.getElementById('logs-terminal-content');
    if (!terminalContent) return;

    terminalContent.innerHTML = '';
    capturedLogs.forEach(entry => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        const p = document.createElement('p');
        p.className = 'action-terminal-output';
        p.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-level level-${entry.level.toLowerCase()}">[${entry.level}]</span> <span class="log-message">${entry.message}</span>${entry.detail ? ' <span class="log-detail">| ' + entry.detail + '</span>' : ''}`;
        terminalContent.appendChild(p);
    });

    const terminal = document.getElementById('logs-terminal');
    if (terminal) {
        terminal.scrollTo({ top: terminal.scrollHeight, behavior: 'smooth' });
    }
}

/**
 * Attach event listeners to control panel items
 * @returns {void}
 */
function controlPanelEventlistener() {
    const controlPanel = {
        "language-container": openLanguageMenu,
        "github-issues": () => linkRedirect('https://github.com/ahmed-alnassif/ReSuSFS/issues/new'),
        "export": exportConfig,
        "restore": restoreConfig,
        "view-webui-log": openLogViewer,
        "about-container": openAboutDialog,
        "credits-susfs": () => linkRedirect('https://gitlab.com/simonpunk/susfs4ksu'),
        "credits-bindhosts": () => linkRedirect('https://github.com/bindhosts/bindhosts'),
    };

    Object.entries(controlPanel).forEach(([element, functionName]) => {
        const el = document.getElementById(element);
        if (el) {
            el.onclick = () => functionName();
        }
    });
}

export function mount() {
    controlPanelEventlistener();
    setupDocsMenu();
    setupDonateCopy();
}

function setupDonateCopy() {
    addCopyToClipboardListeners();
    const copyBtn = document.getElementById('donate-copy-btn');
    const addressText = document.getElementById('donate-address-text');
    if (copyBtn && addressText) {
        copyBtn.onclick = () => addressText.click();
    }
}

export function onShow() {
    updateUIVisibility();
}

export function onHide() {
    document.querySelectorAll('.fab-container').forEach(c => c.classList.remove('show', 'inTerminal'));
    document.getElementById('save-btn')?.classList.remove('show');
}
