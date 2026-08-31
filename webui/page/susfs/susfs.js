import { exec } from 'kernelsu-alt';
import { showPrompt, basePath, filePaths, applyFlags, runReSuSFS, fetchText, updateUIVisibility } from '../../utils/util.js';
import { getString } from '../../utils/language.js';
import { Compartment, EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { EditorView, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { FileSelector } from '../../utils/file_selector.js';

/**
 * One organized box per config file ReSuSFS.sh reads. Each box is fully
 * self-contained: edit the default file, apply it, or apply a custom file
 * picked from storage without touching the default at all.
 */
const CONFIG_BOXES = [
    {
        key: 'sus_paths',
        title: 'susfs_sus_paths_title',
        description: 'susfs_sus_paths_desc',
        applyLabel: 'box_apply',
    },
    {
        key: 'sus_paths_loop',
        title: 'susfs_sus_paths_loop_title',
        description: 'susfs_sus_paths_loop_desc',
        applyLabel: 'box_apply',
    },
    {
        key: 'sus_maps',
        title: 'susfs_sus_maps_title',
        description: 'susfs_sus_maps_desc',
        applyLabel: 'box_apply',
    },
    {
        key: 'kstat_paths',
        title: 'susfs_kstat_paths_title',
        description: 'susfs_kstat_paths_desc',
        applyLabel: 'box_stage',
    },
    {
        key: 'open_redirect',
        title: 'susfs_open_redirect_title',
        description: 'susfs_open_redirect_desc',
        applyLabel: 'box_apply',
    },
    {
        key: 'uname',
        title: 'susfs_uname_title',
        description: 'susfs_uname_desc',
        applyLabel: 'box_apply',
    },
    {
        key: 'cmdline_bootconfig',
        title: 'susfs_cmdline_title',
        description: 'susfs_cmdline_desc',
        applyLabel: 'box_apply',
    },
];

const pencilIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Z"/></svg>`;
const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M320-200v-560l440 280-440 280Z"/></svg>`;
const folderIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480l96-320h684L837-217q-8 26-29.5 41.5T760-160H160Z"/></svg>`;

/**
 * Count non-comment, non-blank lines in a config file under PERSISTENT_DIR.
 * @param {string} fileName
 * @returns {Promise<number>}
 */
async function countEntries(fileName) {
    const result = await exec(`sed 's/#.*//' "${basePath}/${fileName}" 2>/dev/null | grep -c '[^[:space:]]'`);
    if (result.errno !== 0) return 0;
    const n = parseInt(result.stdout.trim(), 10);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Build the DOM for a single config box.
 * @param {object} box entry from CONFIG_BOXES
 * @returns {HTMLElement}
 */
function buildBox(box) {
    const el = document.createElement('div');
    el.className = 'box translucent config-box';
    el.id = `box-${box.key}`;
    el.innerHTML = `
        <div class="box-header">
            <h2>${getString(box.title)}</h2>
            <span class="entry-badge" id="badge-${box.key}">-</span>
        </div>
        <p class="box-description">${getString(box.description)}</p>
        <div class="box-actions">
            <md-outlined-icon-button class="box-edit-btn" id="edit-${box.key}" title="${getString('box_edit')}">
                <md-icon>${pencilIcon}</md-icon>
            </md-outlined-icon-button>
            <md-outlined-icon-button class="box-custom-btn" id="custom-${box.key}" title="${getString('box_custom_file')}">
                <md-icon>${folderIcon}</md-icon>
            </md-outlined-icon-button>
            <md-filled-button class="box-apply-btn" id="apply-${box.key}">
                <md-icon slot="icon">${playIcon}</md-icon>
                ${getString(box.applyLabel)}
            </md-filled-button>
        </div>
    `;
    return el;
}

/**
 * Refresh the entry-count badge for every box.
 * @returns {Promise<void>}
 */
async function refreshBadges() {
    for (const box of CONFIG_BOXES) {
        const count = await countEntries(filePaths[box.key]);
        const badge = document.getElementById(`badge-${box.key}`);
        if (badge) badge.textContent = getString('box_entry_count', count);
    }
}

/**
 * Wire up the three buttons of every box.
 * @returns {void}
 */
function setupBoxActions() {
    CONFIG_BOXES.forEach(box => {
        document.getElementById(`edit-${box.key}`).onclick = () => openConfigEditor(box.key);
        document.getElementById(`apply-${box.key}`).onclick = () => runReSuSFS(applyFlags[box.key]);
        document.getElementById(`custom-${box.key}`).onclick = () => applyCustomFile(box.key);
    });
}

/**
 * Let the user pick an arbitrary file and apply it directly, without
 * touching the box's default persistent file.
 * @param {string} key
 * @returns {Promise<void>}
 */
async function applyCustomFile(key) {
    const path = await FileSelector.getFilePath('txt');
    if (!path) return;
    runReSuSFS(applyFlags[key], path);
}

// Toggles box

const TOGGLE_ROWS = [
    { id: 'toggle-hide-mnts', key: 'HIDE_SUS_MNTS_NON_SU' },
    { id: 'toggle-enable-log', key: 'ENABLE_LOG' },
    { id: 'toggle-avc-spoof', key: 'ENABLE_AVC_LOG_SPOOFING' },
];

async function loadToggles() {
    const result = await exec(`cat "${basePath}/${filePaths.config}" 2>/dev/null`);
    const content = result.errno === 0 ? result.stdout : '';
    TOGGLE_ROWS.forEach(({ id, key }) => {
        const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
        const value = match ? match[1].trim() : '0';
        const row = document.getElementById(id);
        row.querySelector('md-switch').selected = value === '1';
    });
}

async function saveToggles() {
    const values = {};
    TOGGLE_ROWS.forEach(({ id, key }) => {
        const row = document.getElementById(id);
        values[key] = row.querySelector('md-switch').selected ? '1' : '0';
    });

    const command = `
        f="${basePath}/${filePaths.config}"
        for kv in ${Object.entries(values).map(([k, v]) => `${k}=${v}`).join(' ')}; do
            key=\${kv%%=*}
            val=\${kv#*=}
            if grep -q "^\${key}=" "$f" 2>/dev/null; then
                sed -i "s/^\${key}=.*/\${key}=\${val}/" "$f"
            else
                echo "\${key}=\${val}" >> "$f"
            fi
        done
    `;
    const result = await exec(command);
    if (result.errno !== 0) {
        showPrompt(getString('global_save_fail'), false);
        console.error('Failed to save toggles:', result.stderr);
    }
}

function setupToggles() {
    TOGGLE_ROWS.forEach(({ id }) => {
        document.getElementById(id).querySelector('md-switch').addEventListener('change', saveToggles);
    });
    document.getElementById('apply-toggles').onclick = async () => {
        await saveToggles();
        runReSuSFS('--apply-toggles', 'early');
    };
}

// Full-file CodeMirror editor

let setupEditor = false;
let codeEditor;
let lineWrappingEnabled = false;
let currentEditKey = null;
const lineWrapping = new Compartment();

const editorTheme = EditorView.theme({
    '&': {
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        direction: 'ltr',
        color: 'var(--md-sys-color-on-surface)',
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
    },
    '.cm-gutters': {
        color: 'var(--md-sys-color-outline)',
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderRight: '1px solid var(--md-sys-color-outline-variant)',
    },
    '.cm-activeLineGutter': {
        color: 'var(--md-sys-color-on-surface)',
        backgroundColor: 'var(--md-sys-color-surface-container)',
    },
    '.cm-scroller': { width: '100%', minWidth: '0' },
    '.cm-content': { flex: '1 1 auto', minWidth: '0', caretColor: 'var(--md-sys-color-primary)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--md-sys-color-primary)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
        backgroundColor: 'var(--md-sys-color-secondary-container) !important',
    },
});

function setEditorValue(content) {
    if (codeEditor) {
        codeEditor.dispatch({ changes: { from: 0, to: codeEditor.state.doc.length, insert: content } });
        return;
    }
    document.getElementById('edit-input').textContent = content;
}

function setLineWrapping(enabled) {
    lineWrappingEnabled = enabled;
    codeEditor.dispatch({ effects: lineWrapping.reconfigure(enabled ? EditorView.lineWrapping : []) });
    const lineWrapButton = document.getElementById('line-wrap-btn');
    lineWrapButton.selected = enabled;
    codeEditor.requestMeasure();
}

async function openConfigEditor(key) {
    const fileName = filePaths[key];
    const fileNameInput = document.getElementById('file-name-input');
    const fileNameEditor = document.querySelector('.file-name-editor');

    fileNameEditor.querySelectorAll('span').forEach(span => span.style.display = 'none');
    fileNameInput.readOnly = true;
    fileNameInput.value = fileName;
    fileNameInput.style.width = 'auto';

    const content = await fetchText('link/PERSISTENT_DIR/' + fileName, `${basePath}/${fileName}`).catch(() => '');
    currentEditKey = key;
    setEditorValue(content);
    openEditorPanel();
}

/**
 * Force the editor's layout with inline styles, bypassing any stylesheet
 * entirely. Inline styles always win, so this can't be defeated by
 * cascade layers, specificity, or CSS load order.
 * @returns {void}
 */
function forceEditorLayout() {
    const editContent = document.getElementById('edit-content');
    const editInput = document.getElementById('edit-input');

    editContent.style.display = 'flex';
    editContent.style.flexDirection = 'column';
    editContent.style.alignItems = 'stretch';

    editInput.style.display = 'flex';
    editInput.style.flexDirection = 'column';
    editInput.style.width = '100%';
    editInput.style.height = '100%';
    editInput.style.minWidth = '0';
    editInput.style.minHeight = '0';
    editInput.style.overflow = 'hidden';

    const cmEditor = editInput.querySelector('.cm-editor');
    if (cmEditor) {
        cmEditor.style.width = '100%';
        cmEditor.style.height = '100%';
        cmEditor.style.flex = '1 1 auto';
        cmEditor.style.minWidth = '0';
        cmEditor.style.minHeight = '0';
    }

    const cmScroller = editInput.querySelector('.cm-scroller');
    if (cmScroller) {
        cmScroller.style.overflow = 'auto';
        cmScroller.style.minWidth = '0';
    }
}

function openEditorPanel() {
    const backButton = document.querySelector('.back-button');
    const saveButton = document.getElementById('save-btn');
    const lineWrapButton = document.getElementById('line-wrap-btn');
    const editor = document.getElementById('edit-content');
    const bodyContent = document.getElementById('page-susfs');
    const editorInput = document.getElementById('edit-input');

    if (!setupEditor) {
        setupEditor = true;
        saveButton.onclick = saveConfigFile;
        lineWrapButton.onclick = () => setLineWrapping(!lineWrappingEnabled);
        const initialContent = editorInput.textContent;
        editorInput.replaceChildren();
        codeEditor = new EditorView({
            state: EditorState.create({
                doc: initialContent,
                extensions: [
                    lineNumbers(),
                    highlightActiveLineGutter(),
                    history(),
                    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
                    lineWrapping.of([]),
                    editorTheme,
                ],
            }),
            parent: editorInput,
        });
    }

    document.body.classList.add('editor-active');
    bodyContent.style.overflowY = 'hidden';
    editor.open();
    requestAnimationFrame(() => {
        codeEditor.requestMeasure();
        forceEditorLayout();
    });
    backButton.onclick = () => closeEditorPanel();

    function closeEditorPanel() {
        if (!editor.classList.contains('open') && !document.body.classList.contains('editor-active')) return;
        editor.close();
        document.body.classList.remove('editor-active');
        bodyContent.style.overflowY = 'auto';
        codeEditor.scrollTo(0, 0);
    }
    window.__closeSusfsEditor = closeEditorPanel;
}

async function saveConfigFile() {
    if (!currentEditKey) return;
    const fileName = filePaths[currentEditKey];
    const content = codeEditor.state.doc.toString().trim();
    const command = `
        cat << 'ReSuSFSEditorEOF' > ${basePath}/${fileName}
${content}
ReSuSFSEditorEOF
        chmod 644 ${basePath}/${fileName}`;
    const result = await exec(command);
    if (result.errno === 0) {
        showPrompt(getString('global_saved', `${basePath}/${fileName}`));
    } else {
        showPrompt(getString('global_save_fail'), false);
        console.error('Failed to save file:', result.stderr);
    }
    refreshBadges();
    window.__closeSusfsEditor?.();
}

export function mount() {
    const container = document.getElementById('susfs-boxes');
    const togglesBox = document.getElementById('toggles-box');
    CONFIG_BOXES.forEach(box => container.insertBefore(buildBox(box), togglesBox));

    setupBoxActions();
    setupToggles();

    const actionBtn = document.getElementById('action-btn');
    const forceUpdateButton = document.getElementById('force-update-btn');
    actionBtn.onclick = () => runReSuSFS('--action');
    forceUpdateButton.onclick = () => runReSuSFS('--force-update');
}

export function onShow() {
    updateUIVisibility();
    refreshBadges();
    loadToggles();
}

export function onHide() {
    document.querySelectorAll('.fab-container').forEach(c => c.classList.remove('show', 'inTerminal'));
    document.getElementById('save-btn')?.classList.remove('show');
    document.getElementById('line-wrap-btn')?.classList.remove('show');
}
