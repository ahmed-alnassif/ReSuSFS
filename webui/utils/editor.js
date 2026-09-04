import { Compartment, EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { EditorView, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { tags as t } from '@lezer/highlight';

let setupEditor = false;
let codeEditor;
let lineWrappingEnabled = false;
let onSaveCallback = null;
const lineWrapping = new Compartment();
const language = new Compartment();

const shellLanguage = StreamLanguage.define(shell);

const materialHighlightStyle = HighlightStyle.define([
    { tag: t.comment, color: 'var(--md-sys-color-outline)', fontStyle: 'italic' },
    { tag: t.string, color: 'var(--md-sys-color-tertiary)' },
    { tag: t.keyword, color: 'var(--md-sys-color-primary)', fontWeight: '600' },
    { tag: t.variableName, color: 'var(--md-sys-color-secondary)' },
    { tag: t.number, color: 'var(--md-sys-color-tertiary)' },
    { tag: t.operator, color: 'var(--md-sys-color-on-surface-variant)' },
    { tag: t.punctuation, color: 'var(--md-sys-color-on-surface-variant)' },
    { tag: t.meta, color: 'var(--md-sys-color-outline)' },
]);

/**
 * Pick a language extension based on the file being edited. Shell mode
 * works well for both real .sh scripts and our config files, since they
 * both use "#" comments and quoted paths.
 * @param {string} displayName
 * @returns {import('@codemirror/state').Extension}
 */
function languageForFile(displayName) {
    return shellLanguage;
}

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
    }
}

function setLineWrapping(enabled) {
    lineWrappingEnabled = enabled;
    codeEditor.dispatch({ effects: lineWrapping.reconfigure(enabled ? EditorView.lineWrapping : []) });
    const lineWrapButton = document.getElementById('line-wrap-btn');
    lineWrapButton.selected = enabled;
    codeEditor.requestMeasure();
}

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

export function closeEditor() {
    const editor = document.getElementById('edit-content');
    const activePage = document.querySelector('.body-content[data-active="true"]');
    if (!editor.classList.contains('open') && !document.body.classList.contains('editor-active')) return;

    editor.close();
    document.body.classList.remove('editor-active');
    if (activePage) activePage.style.overflowY = 'auto';
    codeEditor?.scrollTo(0, 0);
    onSaveCallback = null;
}

export function openEditor(displayName, content, onSave) {
    const backButton = document.querySelector('.back-button');
    const saveButton = document.getElementById('save-btn');
    const lineWrapButton = document.getElementById('line-wrap-btn');
    const editor = document.getElementById('edit-content');
    const activePage = document.querySelector('.body-content[data-active="true"]');
    const editorInput = document.getElementById('edit-input');
    const fileNameInput = document.getElementById('file-name-input');
    const fileNameEditor = document.querySelector('.file-name-editor');

    fileNameEditor.querySelectorAll('span').forEach(span => span.style.display = 'none');
    fileNameInput.readOnly = true;
    fileNameInput.value = displayName;
    fileNameInput.style.width = 'auto';

    onSaveCallback = onSave;
    const langExtension = languageForFile(displayName);

    if (!setupEditor) {
        setupEditor = true;
        editorInput.replaceChildren();
        codeEditor = new EditorView({
            state: EditorState.create({
                doc: content,
                extensions: [
                    lineNumbers(),
                    highlightActiveLineGutter(),
                    history(),
                    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
                    lineWrapping.of([]),
                    language.of(langExtension),
                    syntaxHighlighting(materialHighlightStyle),
                    editorTheme,
                ],
            }),
            parent: editorInput,
        });
    } else {
        codeEditor.dispatch({ effects: language.reconfigure(langExtension) });
        setEditorValue(content);
    }

    saveButton.onclick = async () => {
        if (onSaveCallback) await onSaveCallback(codeEditor.state.doc.toString());
        closeEditor();
    };
    lineWrapButton.onclick = () => setLineWrapping(!lineWrappingEnabled);

    document.body.classList.add('editor-active');
    if (activePage) activePage.style.overflowY = 'hidden';

    editor.open();
    requestAnimationFrame(() => {
        codeEditor.requestMeasure();
        forceEditorLayout();
    });
    backButton.onclick = () => closeEditor();
}
