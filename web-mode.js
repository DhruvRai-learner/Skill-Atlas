'use strict';

// Authored examples, not copied packages or evidence from a real laptop.
function sampleCatalog() {
    const examples = [
        ['interface-review', 'Interface review', 'Check UI for clarity, usability, and consistency.', 'design', 'LOW', ['accessibility', 'ui review']],
        ['api-design', 'API design', 'Plan clear, consistent APIs and useful error responses.', 'engineering', 'LOW', ['backend', 'API']],
        ['test-planning', 'Test planning', 'Create a focused test plan for key scenarios and edge cases.', 'quality', 'LOW', ['testing', 'QA']],
        ['research-notes', 'Research notes', 'Turn source material into clear, traceable research notes.', 'research', 'LOW', ['sources', 'summary']],
        ['release-review', 'Release review', 'Review deployment readiness, dependencies, and rollback plans.', 'engineering', 'MODERATE', ['deployment', 'release']],
        ['content-editing', 'Content editing', 'Edit writing for structure, plain language, and readability.', 'writing', 'LOW', ['copy', 'editing']]
    ];
    return {
        is_sample: true, library: 'Illustrative sample library', loaded_at: 'Sample data',
        skills: examples.map(([id, name, description, domain, risk, aliases]) => ({
            id: 'sample-' + id, name, description, aliases, domains: [domain], risk,
            agents: ['openai_codex', 'claude_code', 'gemini_cli'], status: 'Single',
            instances: [{
                id: 'sample-source-' + id, name, path: 'Sample only; no local path',
                provenance: 'Illustrative sample; not installed', source: 'Sample data', host: 'sample',
                available: true, observed_state: 'Illustrative record; not a real package',
                security: {risk_level: risk}, validation: {}, taxonomy: {},
                package_verification: 'NOT_CHECKED', evidence_date: 'Not assessed - sample data'
            }]
        }))
    };
}

window.addEventListener('catalog-ready', event => {
    const sample = event.detail?.is_sample === true;
    document.getElementById('importGate').hidden = true;
    document.getElementById('webWorkspace').hidden = false;
    document.getElementById('evidenceBtn').disabled = false;
    document.getElementById('evidenceBtn').hidden = false;
    document.getElementById('startOver').hidden = false;
    const banner = document.getElementById('snapshotNotice');
    banner.textContent = sample
        ? 'Sample library. All skills, agent labels, and risk levels below are illustrative. Nothing is installed.'
        : 'Private catalog loaded. Evidence describes your imported snapshot; this website cannot check your laptop.';
    banner.hidden = false;
    const label = document.getElementById('snapshotLabel');
    if (label) label.textContent = sample ? 'Sample data · not installed' : 'About this catalog';
    const title = document.getElementById('workspaceTitle');
    if (title) {
        title.textContent = sample ? 'Sample library' : 'Your skill library';
        title.focus({preventScroll: true});
        window.scrollTo?.(0, 0);
    }
});

document.getElementById('startOver').addEventListener('click', () => location.reload());
document.getElementById('importOpen')?.addEventListener('click', () => document.getElementById('catalogFile').click());
document.getElementById('demoOpen')?.addEventListener('click', async () => {
    const buttons = ['demoOpen', 'importOpen', 'catalogFile'].map(id => document.getElementById(id)).filter(Boolean);
    for (const button of buttons) button.disabled = true;
    const error = document.getElementById('importError');
    error.hidden = true;
    const progress = document.getElementById('importStatus');
    progress.textContent = 'Opening the sample library...';
    try {
        const raw = JSON.stringify(sampleCatalog());
        await SkillAtlasData.importFile({name: 'sample.json', size: new TextEncoder().encode(raw).byteLength, text: async () => raw});
    } catch {
        error.textContent = 'The sample could not open. Try again or choose your own catalog.';
        error.hidden = false;
        progress.textContent = '';
    } finally {
        for (const button of buttons) button.disabled = false;
    }
});

// The router explanation follows mode changes in the shared viewer.
document.getElementById('routeMode').addEventListener('click', () => {
    queueMicrotask(() => {
        document.getElementById('searchHelp').textContent = 'Word matching in this browser. Unknown risk, changed packages, and unknown agent compatibility are excluded.';
    });
});
