import { exec } from 'kernelsu-alt';
import { showPrompt, basePath, runReSuSFS, updateUIVisibility } from '../../utils/util.js';
import { getString } from '../../utils/language.js';
import { openEditor } from '../../utils/editor.js';
import { FileSelector } from '../../utils/file_selector.js';

const scriptsDir = `${basePath}/scripts`;

const pencilIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Z"/></svg>`;
const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M320-200v-560l440 280-440 280Z"/></svg>`;
const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;

async function listScripts() {
    const result = await exec(`ls -1 "${scriptsDir}"/*.sh 2>/dev/null | xargs -n1 basename 2>/dev/null`);
    if (result.errno !== 0 || !result.stdout.trim()) return [];
    return result.stdout.split('\n').map(s => s.trim()).filter(Boolean);
}

const postfsFile = `${basePath}/scripts_postfs.txt`;
const bootcompletedFile = `${basePath}/scripts_bootcompleted.txt`;

function escapeForSed(str) {
    return str.replace(/[.*[\]^$\\]/g, '\\$&');
}

async function isScriptInStage(name, stageFile) {
    const result = await exec(`grep -qxF "${name}" "${stageFile}" 2>/dev/null`);
    return result.errno === 0;
}

function escapeForRegex(str) {
    return str.replace(/[.*[\]^$\\]/g, '\\$&');
}

async function setScriptStage(name, stageFile, enabled) {
    if (enabled) {
        await exec(`grep -qxF "${name}" "${stageFile}" 2>/dev/null || echo "${name}" >> "${stageFile}"`);
    } else {
        const escaped = escapeForRegex(name);
        await exec(`sed -i "/^${escaped}$/d" "${stageFile}" 2>/dev/null`);
    }
}

function buildScriptBox(name) {
    const el = document.createElement('div');
    el.className = 'box translucent script-box';
    el.innerHTML = `
        <div class="box-header">
            <h2>${name}</h2>
        </div>
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

    isScriptInStage(name, postfsFile).then(enabled => postfsSwitch.selected = enabled);
    isScriptInStage(name, bootcompletedFile).then(enabled => bootcompletedSwitch.selected = enabled);

    postfsSwitch.addEventListener('change', () => setScriptStage(name, postfsFile, postfsSwitch.selected));
    bootcompletedSwitch.addEventListener('change', () => setScriptStage(name, bootcompletedFile, bootcompletedSwitch.selected));

    return el;
}

async function refreshList() {
    const list = document.getElementById('userhub-list');
    const empty = document.getElementById('userhub-empty');
    const scripts = await listScripts();

    list.innerHTML = '';
    if (scripts.length === 0) {
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    scripts.forEach(name => list.appendChild(buildScriptBox(name)));
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

        await exec(`printf '#!/system/bin/sh\\nPATH=/data/adb/ksu/bin:/data/data/com.termux/files/usr/bin:\$PATH\\n\\n\\n' > "${path}" && chmod 755 "${path}"`);
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

}

export function onShow() {
    updateUIVisibility();
    setFabIcons();
    const actionBtn = document.getElementById('action-btn');
    const forceUpdateButton = document.getElementById('force-update-btn');
    actionBtn.onclick = () => createScript();
    forceUpdateButton.onclick = () => importScript();
    refreshList();
}

export function onHide() {
    document.querySelectorAll('.fab-container').forEach(c => c.classList.remove('show', 'inTerminal'));
    document.getElementById('save-btn')?.classList.remove('show');
    document.getElementById('line-wrap-btn')?.classList.remove('show');
}
