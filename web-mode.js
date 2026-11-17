'use strict';

window.addEventListener('catalog-ready', event => {
    document.getElementById('importGate').hidden = true;
    document.getElementById('webWorkspace').hidden = false;
    document.getElementById('evidenceBtn').disabled = false;
    document.getElementById('startOver').hidden = false;
    const banner = document.getElementById('snapshotNotice');
    banner.textContent = 'Imported catalog snapshot. Paths, availability, compatibility, risk and verification are recorded evidence, not live checks. Task suggestions use browser lexical matching; the Python router is available in the laptop edition.';
    banner.hidden = false;
    document.getElementById('query').focus();
});

document.getElementById('startOver').addEventListener('click', () => location.reload());

// The router explanation follows mode changes in the shared viewer.
document.getElementById('routeMode').addEventListener('click', () => {
    queueMicrotask(() => {
        document.getElementById('searchHelp').textContent = 'Browser lexical matching over your imported catalog. Unknown risk, changed packages and unknown compatibility are excluded.';
    });
});
