'use strict';

function catalogLocation(privateImport) {
    const url = new URL(location.href || 'https://skill-atlas.invalid/');
    if (privateImport) url.searchParams.set('catalog', 'private');
    else url.searchParams.delete('catalog');
    url.hash = '';
    return url.toString();
}

function topAction(label) {
    const action = document.getElementById('startOver');
    const text = [...action.children].find(child => child.tagName === 'SPAN');
    if (text) text.textContent = label;
    action.setAttribute('aria-label', label);
}

function importFailure(message) {
    const error = document.getElementById('importError');
    error.textContent = message;
    error.hidden = false;
    document.getElementById('importStatus').textContent = '';
}

window.addEventListener('catalog-ready', event => {
    const bundled = event.detail?.is_bundled === true;
    document.getElementById('importGate').hidden = true;
    document.getElementById('webWorkspace').hidden = false;
    document.getElementById('evidenceBtn').disabled = false;
    document.getElementById('evidenceBtn').hidden = false;
    document.getElementById('startOver').hidden = false;
    topAction(bundled ? 'Open private catalog' : 'Browse included skills');
    const privacy = document.getElementById('privacyLabel');
    if (privacy) privacy.textContent = bundled ? 'On-device search' : 'Local & private';
    const banner = document.getElementById('snapshotNotice');
    banner.textContent = bundled
        ? 'The included catalog lists '+event.detail.skills+' inventoried skill names and '+event.detail.instances+' copies. Local paths, raw audit records, instructions, and scripts stay private. Compatibility, risk and validation labels are dated records, not proof of activation or safety. Import your private catalog for exact paths and full evidence.'
        : 'Private catalog loaded in this tab. Nothing is uploaded. This website cannot check your laptop folders; evidence describes the imported snapshot.';
    banner.hidden = false;
    const label = document.getElementById('snapshotLabel');
    if (label) label.textContent = bundled ? 'Included catalog · paths kept private' : 'About this private snapshot';
    const title = document.getElementById('workspaceTitle');
    if (title) {
        title.textContent = bundled ? 'Your skill library' : 'Your private library';
        title.focus({preventScroll:true});
        window.scrollTo?.(0,0);
    }
});

document.getElementById('startOver').addEventListener('click', () => {
    const bundled = SkillAtlasData.status().is_bundled;
    location.href = catalogLocation(bundled);
});
document.getElementById('importOpen')?.addEventListener('click', () => document.getElementById('catalogFile').click());
document.getElementById('demoOpen')?.addEventListener('click', () => {
    location.href = catalogLocation(false);
});

async function openIncludedCatalog() {
    if (new URL(location.href || 'https://skill-atlas.invalid/').searchParams.get('catalog') === 'private') {
        const start = document.getElementById('startOver');
        start.hidden = false;
        topAction('Browse included skills');
        return;
    }
    if (!window.SkillAtlasBundledCatalog) {
        importFailure('The included catalog could not load. Refresh the page, or open your private catalog below.');
        return;
    }
    const controls = ['demoOpen','importOpen','catalogFile'].map(id=>document.getElementById(id)).filter(Boolean);
    for (const control of controls) control.disabled = true;
    document.getElementById('importStatus').textContent = 'Opening your skill library…';
    try {
        const raw = JSON.stringify(window.SkillAtlasBundledCatalog);
        await SkillAtlasData.importFile({name:'included-catalog.json',size:new TextEncoder().encode(raw).byteLength,text:async()=>raw});
    } catch {
        importFailure('The included catalog could not open. Refresh the page or choose a private catalog to continue.');
    } finally {
        for (const control of controls) control.disabled = false;
    }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', openIncludedCatalog, {once:true});
else queueMicrotask(openIncludedCatalog);

document.getElementById('routeMode').addEventListener('click', () => {
    queueMicrotask(() => {
        document.getElementById('searchHelp').textContent = 'Word matching in this browser. Unknown risk, changed packages, and unknown agent compatibility are excluded.';
    });
});
