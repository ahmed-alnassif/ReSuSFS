import { exec } from 'kernelsu-alt';
import { showPrompt, basePath, runReSuSFS, updateUIVisibility } from '../../utils/util.js';
import { getString } from '../../utils/language.js';
import { openEditor } from '../../utils/editor.js';
import { FileSelector } from '../../utils/file_selector.js';

const scriptsDir = `${basePath}/scripts`;

const pencilIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Z"/></svg>`;
const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M320-200v-560l440 280-440 280Z"/></svg>`;
const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;

let scriptCache = [];
let postfsStateCache = {};
let bootcompletedStateCache = {};
let scriptObserver = null;
let scriptsDirty = true;

const SORT_KEY = 'resusfs_userhub_sort';

/**
 * Read the persisted sort preference, defaulting to name ascending.
 * @returns {'name_asc'|'name_desc'|'enabled_first'|'modified_desc'|'modified_asc'}
 */
function getSortMode() {
    return localStorage.getItem(SORT_KEY) || 'name_asc';
}

/**
 * Map a sort mode to the ls flags that produce that file order natively.
 * "enabled_first" has no ls equivalent (ls can't know toggle state), so
 * it fetches in default alpha order and gets partitioned in JS instead.
 * @param {string} mode
 * @returns {string} ls flags, e.g. "-1t"
 */
function lsFlagsForMode(mode) {
    switch (mode) {
        case 'name_desc': return '-1r';
        case 'modified_desc': return '-1t';
        case 'modified_asc': return '-1tr';
        case 'name_asc':
        case 'enabled_first':
        default: return '-1';
    }
}

/**
 * Apply the "enabled first" partition on top of whatever order the
 * scripts already arrived in (ls already handled name/time ordering
 * server-side; this only reorders by toggle state, which ls can't see).
 * @param {object[]} scripts
 * @param {string} mode
 * @param {Record<string,string>} postfsStates
 * @param {Record<string,string>} bootcompletedStates
 * @returns {object[]}
 */
function sortScripts(scripts, mode, postfsStates, bootcompletedStates) {
    if (mode !== 'enabled_first') return scripts;

    const isEnabled = (s) => (postfsStates[s.name] === 'on') || (bootcompletedStates[s.name] === 'on');
    const enabled = scripts.filter(isEnabled);
    const disabled = scripts.filter(s => !isEnabled(s));
    return [...enabled, ...disabled];
}

/**
 * List every .sh file under the scripts directory, already ordered by
 * ls itself according to the given sort mode (migrating any script
 * missing the #title=/#author=/#desc= header along the way), and in the
 * same shell call, read both stage files once so per-script toggle
 * state can be computed in JS without extra exec() round-trips.
 * @param {string} mode
 * @returns {Promise<{scripts: object[], postfsStates: object, bootcompletedStates: object}>}
 */
async function listScripts(mode) {
    const lsFlags = lsFlagsForMode(mode);
    const command = `
cd "${scriptsDir}" 2>/dev/null || exit 0
for f in $(ls ${lsFlags} *.sh 2>/dev/null); do
    [ -f "$f" ] || continue
    if ! grep -q '^#title=' "$f" 2>/dev/null; then
        first_line=$(head -n1 "$f")
        case "$first_line" in
            '#!'*)
                { echo "$first_line"; echo "#title="; echo "#author="; echo "#desc="; tail -n +2 "$f"; } > "$f.tmp" && mv "$f.tmp" "$f"
                ;;
            *)
                { echo "#!/system/bin/sh"; echo "#title="; echo "#author="; echo "#desc="; cat "$f"; } > "$f.tmp" && mv "$f.tmp" "$f"
                ;;
        esac
        chmod 755 "$f"
    fi
    title=$(grep -m1 '^#title=' "$f" | cut -d= -f2-)
    author=$(grep -m1 '^#author=' "$f" | cut -d= -f2-)
    desc=$(grep -m1 '^#desc=' "$f" | cut -d= -f2-)
    echo "RECORD_START"
    echo "$f"
    echo "$title"
    echo "$author"
    echo "$desc"
    echo "RECORD_END"
done
echo "STAGES_START"
cat "${postfsFile}" 2>/dev/null
echo "STAGES_SEP"
cat "${bootcompletedFile}" 2>/dev/null
echo "STAGES_END"
    `;

    const result = await exec(command);
    if (result.errno !== 0 || !result.stdout.trim()) return { scripts: [], postfsStates: {}, bootcompletedStates: {} };

    const [scriptsPart, stagesPart] = result.stdout.split('STAGES_START');

    const scripts = [];
    const records = scriptsPart.split('RECORD_START').slice(1);
    for (const record of records) {
        const lines = record.split('RECORD_END')[0].split('\n');
        const [, name, title, author, desc] = lines;
        if (!name || !name.trim()) continue;
        scripts.push({
            name: name.trim(),
            title: (title || '').trim(),
            author: (author || '').trim(),
            desc: (desc || '').trim(),
        });
    }

    const [postfsRaw, bootcompletedRaw] = (stagesPart || '').split('STAGES_SEP');
    const parseStageLines = (raw) => {
        const states = {};
        (raw || '').split('STAGES_END')[0].split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (trimmed.startsWith('!')) states[trimmed.slice(1)] = 'disabled';
            else states[trimmed] = 'on';
        });
        return states;
    };

    return {
        scripts,
        postfsStates: parseStageLines(postfsRaw),
        bootcompletedStates: parseStageLines(bootcompletedRaw),
    };
}

const postfsFile = `${basePath}/scripts_postfs.txt`;
const bootcompletedFile = `${basePath}/scripts_bootcompleted.txt`;

function escapeForRegex(str) {
    return str.replace(/[.*[\]^$\\]/g, '\\$&');
}

/**
 * Toggle a script's state for a stage. Rewrites its existing line in
 * place (bare <-> "!"-prefixed) to preserve file position; only appends
 * a new line if the script has never appeared in this stage file before.
 * @param {string} name
 * @param {string} stageFile
 * @param {boolean} enabled
 * @returns {Promise<void>}
 */
async function setScriptStage(name, stageFile, enabled) {
    const escaped = escapeForRegex(name);
    const command = `
touch "${stageFile}"
if grep -qE "^!?${escaped}$" "${stageFile}" 2>/dev/null; then
    if ${enabled}; then
        sed -i "s/^!\\{0,1\\}${escaped}$/${name}/" "${stageFile}"
    else
        sed -i "/^!\\{0,1\\}${escaped}$/d" "${stageFile}"
    fi
elif ${enabled}; then
    echo "${name}" >> "${stageFile}"
fi
    `;
    await exec(command);
}

/**
 * Apply an already-known stage state to its switch: grays out and
 * disables the switch entirely when the stage file has it "!"-prefixed,
 * otherwise wires the switch normally.
 * @param {HTMLElement} switchEl
 * @param {HTMLElement} itemEl
 * @param {string} name
 * @param {string} stageFile
 * @param {'on'|'off'|'disabled'} state
 * @returns {Promise<void>}
 */
async function applyStageState(switchEl, itemEl, name, stageFile, state) {
    if (state === 'disabled') {
        switchEl.selected = false;
        switchEl.disabled = true;
        itemEl?.classList.add('stage-disabled');
        return;
    }

    switchEl.disabled = false;
    itemEl?.classList.remove('stage-disabled');

    let suppressNext = true;

    switchEl.addEventListener('change', () => {
        if (suppressNext) {
            suppressNext = false;
            return;
        }
        setScriptStage(name, stageFile, switchEl.selected);
    });

    switchEl.selected = state === 'on';

    await Promise.resolve();
    await Promise.resolve();
    suppressNext = false;
}

/**
 * Build the DOM for a single script row.
 * @param {{name: string, title: string, author: string, desc: string}} script
 * @param {'on'|'off'|'disabled'} postfsState
 * @param {'on'|'off'|'disabled'} bootcompletedState
 * @returns {HTMLElement}
 */
function buildScriptBox(script, postfsState, bootcompletedState) {
    const { name, title, author, desc } = script;
    const displayTitle = title || name;

    const el = document.createElement('div');
    el.className = 'box translucent script-box';
    el.innerHTML = `
        <div class="box-header">
            <div class="script-heading">
                <h2>${displayTitle}</h2>
                ${title ? `<span class="script-filename">${name}</span>` : ''}
            </div>
        </div>
        ${(author || desc) ? `
        <p class="script-meta">
            ${author ? `<span class="script-author">${getString('userhub_by_author', author)}</span>` : ''}
            ${author && desc ? ' &middot; ' : ''}
            ${desc ? `<span class="script-desc">${desc}</span>` : ''}
        </p>` : ''}
        <div class="stage-toggle-row">
            <div class="stage-toggle-item">
                <span>${getString('userhub_stage_postfs')}</span>
                <md-switch icons class="toggle-postfs"></md-switch>
            </div>
            <div class="stage-toggle-item">
                <span>${getString('userhub_stage_bootcompleted')}</span>
                <md-switch icons class="toggle-bootcompleted"></md-switch>
            </div>
        </div>
        <div class="box-actions">
            <md-outlined-icon-button class="script-edit-btn" title="${getString('box_edit')}">
                <md-icon>${pencilIcon}</md-icon>
            </md-outlined-icon-button>
            <md-outlined-icon-button class="script-delete-btn" title="${getString('userhub_delete')}">
                <md-icon>${trashIcon}</md-icon>
            </md-outlined-icon-button>
            <md-filled-button class="script-run-btn">
                <md-icon slot="icon">${playIcon}</md-icon>
                ${getString('userhub_run')}
            </md-filled-button>
        </div>
    `;

    el.querySelector('.script-edit-btn').onclick = () => openScriptEditor(name);
    el.querySelector('.script-run-btn').onclick = () => runReSuSFS('--run-script', `${scriptsDir}/${name}`);
    el.querySelector('.script-delete-btn').onclick = () => deleteScript(name);

    const postfsSwitch = el.querySelector('.toggle-postfs');
    const bootcompletedSwitch = el.querySelector('.toggle-bootcompleted');
    const postfsItem = postfsSwitch.closest('.stage-toggle-item');
    const bootcompletedItem = bootcompletedSwitch.closest('.stage-toggle-item');

    applyStageState(postfsSwitch, postfsItem, name, postfsFile, postfsState);
    applyStageState(bootcompletedSwitch, bootcompletedItem, name, bootcompletedFile, bootcompletedState);

    return el;
}

/**
 * Mark the script list as needing a real refresh next time it's shown.
 * Call this after anything that actually changes scripts on disk.
 * @returns {void}
 */
function markScriptsDirty() {
    scriptsDirty = true;
}

/**
 * Refresh the list only if something has actually changed since the
 * last fetch, so switching tabs repeatedly doesn't re-run the whole
 * shell scan and DOM rebuild every time.
 * @returns {Promise<void>}
 */
async function refreshListIfDirty() {
    if (!scriptsDirty) return;
    await refreshList();
    scriptsDirty = false;
}

async function refreshList() {
    const list = document.getElementById('userhub-list');
    const empty = document.getElementById('userhub-empty');
    const mode = getSortMode();
    const { scripts, postfsStates, bootcompletedStates } = await listScripts(mode);

    scriptCache = sortScripts(scripts, mode, postfsStates, bootcompletedStates);
    postfsStateCache = postfsStates;
    bootcompletedStateCache = bootcompletedStates;

    scriptObserver?.disconnect();
    list.innerHTML = '';

    if (scriptCache.length === 0) {
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    scriptObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                mountScriptBox(entry.target);
                scriptObserver.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '400px 0px', threshold: 0 });

    scriptCache.forEach((script, index) => {
        const placeholder = document.createElement('div');
        placeholder.className = 'box translucent script-box script-placeholder';
        placeholder.dataset.scriptIndex = index;
        placeholder.innerHTML = `<h2 class="script-placeholder-title">${script.title || script.name}</h2>`;
        list.appendChild(placeholder);
        scriptObserver.observe(placeholder);
    });
}

/**
 * Replace a placeholder row with the real interactive box, using data
 * already cached from the last refreshList() batch fetch, no exec()
 * round-trip needed.
 * @param {HTMLElement} placeholder
 * @returns {void}
 */
function mountScriptBox(placeholder) {
    const index = Number(placeholder.dataset.scriptIndex);
    const script = scriptCache[index];
    if (!script) return;

    const postfsState = postfsStateCache[script.name] || 'off';
    const bootcompletedState = bootcompletedStateCache[script.name] || 'off';
    const box = buildScriptBox(script, postfsState, bootcompletedState);
    placeholder.replaceWith(box);
}

async function openScriptEditor(name) {
    const path = `${scriptsDir}/${name}`;
    const result = await exec(`cat "${path}" 2>/dev/null`);
    const content = result.errno === 0 ? result.stdout : '';

    openEditor(name, content, async (newContent) => {
        const command = `
            cat << 'ReSuSFSScriptEOF' > ${path}
${newContent.trim()}
ReSuSFSScriptEOF
            chmod 755 ${path}`;
        const saveResult = await exec(command);
        markScriptsDirty();
        if (saveResult.errno === 0) {
            showPrompt(getString('global_saved', path));
        } else {
            showPrompt(getString('global_save_fail'), false);
            console.error('Failed to save script:', saveResult.stderr);
        }
        refreshList();
    });
}

async function deleteScript(name) {
    if (!confirm(getString('userhub_confirm_delete', name))) return;
    const result = await exec(`rm -f "${scriptsDir}/${name}"`);
    markScriptsDirty();
    if (result.errno === 0) {
        showPrompt(getString('userhub_deleted', name));
    } else {
        showPrompt(getString('global_save_fail'), false);
    }
    refreshList();
}

async function createScript() {
    const dialog = document.getElementById('new-script-dialog');
    const input = document.getElementById('new-script-name');
    input.value = '';
    input.setAttribute('label', getString('userhub_script_name'));
    dialog.show();

    const createBtn = document.getElementById('new-script-create');
    const cancelBtn = document.getElementById('new-script-cancel');

    createBtn.onclick = async () => {
        let name = input.value.trim();
        if (!name) return;
        if (!name.endsWith('.sh')) name += '.sh';
        if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
            showPrompt(getString('userhub_invalid_name'), false);
            return;
        }

        const path = `${scriptsDir}/${name}`;
        const exists = await exec(`[ -f "${path}" ]`);
        if (exists.errno === 0) {
            showPrompt(getString('userhub_already_exists', name), false);
            return;
        }

        await exec(`printf '#!/system/bin/sh\\n#title=\\n#author=\\n#desc=\\n\\nPATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:\$PATH\\n\\n\\n' > "${path}" && chmod 755 "${path}"`);
        markScriptsDirty();
        dialog.close();
        refreshList();
        openScriptEditor(name);
    };
    cancelBtn.onclick = () => dialog.close();
}

async function importScript() {
    const path = await FileSelector.getFilePath('sh');
    if (!path) return;
    const name = path.split('/').pop();
    const dest = `${scriptsDir}/${name}`;
    const result = await exec(`cp "${path}" "${dest}" && chmod 755 "${dest}"`);
    markScriptsDirty();
    if (result.errno === 0) {
        showPrompt(getString('userhub_imported', name));
    } else {
        showPrompt(getString('global_save_fail'), false);
    }
    refreshList();
}

const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>`;
const importIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-337 287-530l43-43 120 120v-307h60v307l120-120 43 43-193 193ZM220-160q-24 0-42-18t-18-42v-143h60v143h520v-143h60v143q0 24-18 42t-42 18H220Z"/></svg>`;

function setFabIcons() {
    const actionIcon = document.querySelector('#action-btn md-icon');
    const forceUpdateIcon = document.querySelector('#force-update-btn md-icon');
    if (actionIcon) actionIcon.innerHTML = plusIcon;
    if (forceUpdateIcon) forceUpdateIcon.innerHTML = importIcon;
    document.getElementById('action-btn')?.setAttribute('title', getString('userhub_new_script'));
    document.getElementById('force-update-btn')?.setAttribute('title', getString('userhub_import_script'));
}

export function mount() {
    const sortBtn = document.getElementById('sort-btn');
    const sortDialog = document.getElementById('sort-dialog');
    const closeBtn = sortDialog.querySelector('.close-btn');
    const radios = sortDialog.querySelectorAll('md-radio');

    sortBtn.onclick = () => {
        radios.forEach(r => r.checked = r.value === getSortMode());
        sortDialog.show();
    };
    closeBtn.onclick = () => sortDialog.close();

    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (!radio.checked) return;
            localStorage.setItem(SORT_KEY, radio.value);
            markScriptsDirty();
            refreshList();
        });
    });
}

export function onShow() {
    updateUIVisibility();
    setFabIcons();
    const actionBtn = document.getElementById('action-btn');
    const forceUpdateButton = document.getElementById('force-update-btn');
    actionBtn.onclick = () => createScript();
    forceUpdateButton.onclick = () => importScript();
    refreshListIfDirty();
}

export function onHide() {
    document.querySelectorAll('.fab-container').forEach(c => c.classList.remove('show', 'inTerminal'));
    document.getElementById('save-btn')?.classList.remove('show');
    document.getElementById('line-wrap-btn')?.classList.remove('show');
}
