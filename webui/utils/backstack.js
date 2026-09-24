const stack = [];
let ignoreNextPopstate = false;

window.addEventListener('popstate', () => {
    if (ignoreNextPopstate) {
        ignoreNextPopstate = false;
        stack.pop();
        return;
    }
    const onBack = stack.pop();
    if (onBack) onBack();
});

export function pushBackState(onBack) {
    stack.push(onBack);
    history.pushState({}, '');
}

export function consumeBackState() {
    if (stack.length === 0) return;
    ignoreNextPopstate = true;
    history.back();
}

export function makeDialogBackAware(dialogEl) {
    let closingFromBack = false;

    dialogEl.addEventListener('open', () => {
        pushBackState(() => {
            closingFromBack = true;
            dialogEl.close();
        });
    });

    dialogEl.addEventListener('closed', () => {
        if (closingFromBack) {
            closingFromBack = false;
            return;
        }
        consumeBackState();
    });
}
