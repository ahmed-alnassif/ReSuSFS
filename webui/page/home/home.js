import { exec } from 'kernelsu-alt';
import { basePath, moduleDirectory, filePaths, runReSuSFS, updateUIVisibility } from '../../utils/util.js';
import { getString } from '../../utils/language.js';
import { addCopyToClipboardListeners } from '../../utils/docs.js';
import { exportConfig, restoreConfig } from '../../utils/backup.js';

/**
 * Config files shown as tiles in the summary box, in display order.
 * `key` maps to filePaths / util.js, `label` is an i18n string key.
 */
const SUMMARY_FILES = [
    { key: 'sus_paths', label: 'susfs_sus_paths_title' },
    { key: 'sus_paths_loop', label: 'susfs_sus_paths_loop_title' },
    { key: 'sus_maps', label: 'susfs_sus_maps_title' },
    { key: 'kstat_paths', label: 'susfs_kstat_paths_title' },
    { key: 'open_redirect', label: 'susfs_open_redirect_title' },
];
const SCRIPTS_POSTFS = 'scripts_postfs.txt';
const SCRIPTS_BOOTCOMPLETED = 'scripts_bootcompleted.txt';

/**
 * Count non-comment, non-blank lines in a config file.
 * @param {string} fileName
 * @returns {Promise<number>}
 */
async function countEntries(fileName) {
    const result = await exec(`sed 's/#.*//' "${basePath}/${fileName}" 2>/dev/null | grep -c '[^[:space:]]'`);
    if (result.errno !== 0) return 0;
    const n = parseInt(result.stdout.trim(), 10);
    return Number.isFinite(n) ? n : 0;
}

async function countEnabledScripts() {
    const command = `
        cat "${basePath}/${SCRIPTS_POSTFS}" "${basePath}/${SCRIPTS_BOOTCOMPLETED}" 2>/dev/null \
        | sed 's/#.*//' | grep -v '^[[:space:]]*$' | sort -u | wc -l
    `;
    const result = await exec(command);
    if (result.errno !== 0) return 0;
    const n = parseInt(result.stdout.trim(), 10);
    return Number.isFinite(n) ? n : 0;
}

async function updateSummary() {
    const grid = document.getElementById('summary-grid');
    grid.innerHTML = '';

    for (const { key, label } of SUMMARY_FILES) {
        const count = await countEntries(filePaths[key]);
        const tile = document.createElement('div');
        tile.className = 'summary-tile';
        tile.innerHTML = `
            <span class="summary-tile-count">${count}</span>
            <span class="summary-tile-label">${getString(label)}</span>
        `;
        tile.onclick = () => document.querySelector('.bottom-bar-item[page="susfs"]')?.click();
        grid.appendChild(tile);
    }

    const scriptCount = await countEnabledScripts();
    const scriptTile = document.createElement('div');
    scriptTile.className = 'summary-tile';
    scriptTile.innerHTML = `
        <span class="summary-tile-count">${scriptCount}</span>
        <span class="summary-tile-label">${getString('summary_enabled_scripts')}</span>
    `;
    scriptTile.onclick = () => document.querySelector('.bottom-bar-item[page="userhub"]')?.click();
    grid.appendChild(scriptTile);
}

async function updateStatus() {
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    const kernelVersionEl = document.getElementById('status-kernel-version');
    const featureCountEl = document.getElementById('status-feature-count');

    const susfsBin = await getSusfsBin();
    const [binCheck, versionResult, variantResult, featuresResult] = await Promise.all([
        exec(`[ -x "${susfsBin}" ]`),
        exec(`"${susfsBin}" show version 2>/dev/null`),
        exec(`"${susfsBin}" show variant 2>/dev/null`),
        exec(`"${susfsBin}" show enabled_features 2>/dev/null`),
    ]);

    const version = versionResult.errno === 0 ? versionResult.stdout.trim() : '';
    const variant = variantResult.errno === 0 ? variantResult.stdout.trim() : '';
    const features = featuresResult.errno === 0
        ? featuresResult.stdout.split('\n').map(l => l.trim()).filter(Boolean)
        : [];

    document.getElementById('features-version').textContent = version || getString('status_unknown');
    document.getElementById('features-variant').textContent = variant || getString('status_unknown');
    const featuresList = document.getElementById('features-list');
    featuresList.innerHTML = '';
    if (features.length === 0) {
        featuresList.innerHTML = `<p class="features-empty">${getString('features_none')}</p>`;
    } else {
        features.forEach(feature => {
            const row = document.createElement('div');
            row.className = 'feature-row';
            row.innerHTML = `
                <md-icon class="feature-check">
                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                </md-icon>
                <span>${feature}</span>
            `;
            featuresList.appendChild(row);
        });
    }

    if (version) {
        statusDot.className = 'status-dot active';
        statusText.textContent = getString('status_active');
        kernelVersionEl.textContent = getString('status_kernel_version', version);
        featureCountEl.textContent = getString('status_feature_count', features.length);
        featureCountEl.style.display = 'inline';
    } else {
        statusDot.className = 'status-dot inactive';
        kernelVersionEl.textContent = '';
        featureCountEl.style.display = 'none';
        const binExists = binCheck.errno === 0;
        statusText.textContent = binExists ? getString('status_unsupported_version') : getString('status_binary_missing');
    }
}

async function getSusfsBin() {
    const result = await exec(`grep '^SUSFS_BIN=' "${moduleDirectory}/ReSuSFS.sh" | head -n1 | cut -d= -f2`);
    const path = result.errno === 0 ? result.stdout.trim() : '';
    return path || '/data/adb/ksu/bin/ksu_susfs';
}

/**
 * Open the enabled-features dialog when the status box is tapped.
 * @returns {void}
 */
function setupStatusBox() {
    const statusBox = document.getElementById('status-box');
    statusBox.onclick = () => {
        document.getElementById('features-dialog')?.show();
    };

    // Handle close button
    const closeBtn = document.querySelector('#features-dialog .close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById('features-dialog')?.close();
        };
    }
}

function setupSupportCard() {
    const card = document.getElementById('support-card');
    const closeBtn = document.getElementById('support-card-close');
    if (!card) return;

    if (localStorage.getItem('resusfs_support_dismissed') === '1') {
        card.style.display = 'none';
        return;
    }

    addCopyToClipboardListeners();
    closeBtn.onclick = () => {
        card.style.display = 'none';
        localStorage.setItem('resusfs_support_dismissed', '1');
    };
}

function setupBackupCard() {
    const exportBtn = document.getElementById('home-export-btn');
    const restoreBtn = document.getElementById('home-restore-btn');
    if (exportBtn) exportBtn.onclick = () => exportConfig();
    if (restoreBtn) restoreBtn.onclick = () => restoreConfig();
}

export function mount() {
    setupStatusBox();
    setupSupportCard();
    setupBackupCard();

    const actionBtn = document.getElementById('action-btn');
    const forceUpdateButton = document.getElementById('force-update-btn');
    actionBtn.onclick = () => runReSuSFS('--action');
    forceUpdateButton.onclick = () => runReSuSFS('--force-update');
}

export function onShow() {
    updateUIVisibility();
    updateStatus();
    updateSummary();
}

export function onHide() {
    document.querySelectorAll('.fab-container').forEach(c => c.classList.remove('show', 'inTerminal'));
}
