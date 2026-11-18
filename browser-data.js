(function (root, factory) {
  'use strict';
  const exported = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = exported;
  } else {
    const adapter = exported.createAdapter();
    root.SkillAtlasData = adapter;
    const bind = () => adapter.bindImportControls(root.document);
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', bind, {once: true});
    else bind();
  }
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const MAX_CATALOG_BYTES = 8 * 1024 * 1024;
  const MAX_TEXT_BYTES = 1024 * 1024;
  const AGENTS = Object.freeze({google_antigravity: 'Antigravity', openai_codex: 'Codex', claude_code: 'Claude Code', gemini_cli: 'Gemini CLI', cursor: 'Cursor', github_copilot: 'GitHub Copilot', opencode: 'OpenCode'});
  const RISK = Object.freeze({LOW: 1, MODERATE: 2, ELEVATED: 3, UNKNOWN: 4});
  const AXES = ['domain', 'use_case_intent', 'workflow_stage', 'target_software', 'languages_frameworks', 'required_resources', 'compatible_agents', 'capabilities_security', 'inputs_outputs', 'operational_characteristics', 'quality_lifecycle'];
  const VALIDATIONS = ['file_exists', 'yaml_parsed', 'spec_compliant', 'resource_integrity', 'dependency_readiness', 'runtime_discovery', 'successful_activation', 'functional_execution'];
  const SECURITY_FIELDS = ['risk_level', 'trust_tier', 'py_file_count', 'sh_file_count', 'md_file_count', 'network_access', 'network_modules', 'credential_access', 'env_vars_read', 'destructive_filesystem', 'destructive_patterns', 'subprocess_execution', 'subprocess_patterns', 'dynamic_imports', 'markdown_findings'];
  const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const own = (source, key, fallback) => has(source, key) ? source[key] : fallback;
  function fail(message) { throw new Error('Invalid catalog: ' + message); }
  function record(value, label) {
    if (!object(value)) fail(label + ' must be an object.');
    return value;
  }
  function text(value, label, max = 12000) {
    if (typeof value !== 'string' || value.length > max) fail(label + ' must be text of at most ' + max + ' characters.');
    return value;
  }
  function identifier(value, label) {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) fail(label + ' has an invalid identifier.');
    return value;
  }
  function list(value, label, max = 256) {
    if (!Array.isArray(value) || value.length > max) fail(label + ' must be a bounded list.');
    return value.map(item => text(item, label + ' item', 4096));
  }
  function boolean(value, label) {
    if (typeof value !== 'boolean') fail(label + ' must be true or false.');
    return value;
  }
  function enumeration(value, allowed, label) {
    if (typeof value !== 'string' || !allowed.includes(value)) fail(label + ' has an unsupported value.');
    return value;
  }
  function count(value, label, max = 1000000000) {
    if (!Number.isSafeInteger(value) || value < 0 || value > max) fail(label + ' must be a non-negative integer.');
    return value;
  }

  // Copy only JSON values into fresh dictionaries. Inherited properties and
  // object-prototype keys never become application state.
  function safeJSON(value, budget, depth = 0) {
    if (--budget.left < 0 || depth > 14) fail('audit data is too complex.');
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) fail('audit data contains an invalid number.');
      return value;
    }
    if (typeof value === 'string') return text(value, 'audit text', 100000);
    if (Array.isArray(value)) {
      if (value.length > 20000) fail('audit list is too large.');
      return value.map(item => safeJSON(item, budget, depth + 1));
    }
    if (!object(value)) fail('audit data contains an unsupported value.');
    const output = Object.create(null);
    for (const key of Object.keys(value)) {
      if (BLOCKED_KEYS.has(key)) continue;
      if (key.length > 256) fail('audit key is too long.');
      output[key] = safeJSON(value[key], budget, depth + 1);
    }
    return output;
  }

  function normalizeCatalog(input) {
    const root = record(input, 'root');
    if (!Array.isArray(root.skills) || root.skills.length > 5000) fail('skills must be a list of at most 5,000 entries.');
    const budget = {left: 300000};
    const skillIds = new Set();
    const instanceIds = new Set();
    const skills = root.skills.map((value, skillNumber) => {
      const source = record(value, 'skill ' + (skillNumber + 1));
      const id = identifier(source.id, 'skill');
      if (skillIds.has(id)) fail('skill identifiers must be unique.');
      skillIds.add(id);
      if (!Array.isArray(source.instances) || !source.instances.length || source.instances.length > 100) fail('each skill needs 1–100 instances.');
      const instances = source.instances.map(raw => {
        record(raw, 'instance');
        const instanceId = identifier(raw.id, 'instance');
        if (instanceIds.has(instanceId)) fail('instance identifiers must be unique.');
        instanceIds.add(instanceId);
        if (instanceIds.size > 20000) fail('there are more than 20,000 instances.');
        const metadataSource = record(own(raw, 'metadata', {}), 'metadata');
        const metadata = Object.create(null);
        for (const key of ['name', 'description']) if (has(metadataSource, key)) metadata[key] = text(metadataSource[key], 'metadata ' + key);
        const validationSource = record(own(raw, 'validation', {}), 'validation');
        const validation = Object.create(null);
        for (const key of VALIDATIONS) if (has(validationSource, key)) validation[key] = text(validationSource[key], 'validation state', 80);
        const securitySource = record(own(raw, 'security', {}), 'security');
        const security = Object.create(null);
        for (const key of SECURITY_FIELDS) if (has(securitySource, key)) security[key] = safeJSON(securitySource[key], budget);
        security.risk_level = enumeration(own(securitySource, 'risk_level', 'UNKNOWN'), Object.keys(RISK), 'instance risk');
        const taxonomySource = record(own(raw, 'taxonomy', {}), 'instance taxonomy');
        const taxonomy = Object.create(null);
        for (const key of AXES) {
          if (!has(taxonomySource, key)) continue;
          const axis = record(taxonomySource[key], 'taxonomy axis');
          taxonomy[key] = {
            labels: list(own(axis, 'labels', []), 'taxonomy labels'),
            evidence: list(own(axis, 'evidence', []), 'taxonomy evidence', 512)
          };
        }
        return {
          id: instanceId,
          name: text(own(raw, 'name', source.name), 'instance name', 512),
          path: text(own(raw, 'path', ''), 'instance path', 32768),
          provenance: text(own(raw, 'provenance', 'Imported source'), 'provenance', 2048),
          source: text(own(raw, 'source', 'imported'), 'source', 512),
          host: text(own(raw, 'host', 'unknown'), 'host', 512),
          metadata, validation, security, taxonomy,
          recorded_package_hash: own(raw, 'recorded_package_hash', null) === null ? null : text(raw.recorded_package_hash, 'recorded hash', 256),
          live_md_sha256: own(raw, 'live_md_sha256', null) === null ? null : text(raw.live_md_sha256, 'instruction hash', 256),
          available: boolean(own(raw, 'available', false), 'snapshot availability'),
          evidence_date: text(own(raw, 'evidence_date', 'Not audited'), 'evidence date', 256),
          observed_state: text(own(raw, 'observed_state', 'Not runtime verified'), 'observed state', 512),
          package_verification: enumeration(own(raw, 'package_verification', 'NOT_CHECKED'), ['MATCH', 'CHANGED', 'UNAVAILABLE', 'NOT_CHECKED'], 'package verification'),
          package_verified_at: own(raw, 'package_verified_at', null) === null ? null : text(raw.package_verified_at, 'package audit date', 256)
        };
      });
      const declaredRisk = enumeration(own(source, 'risk', 'UNKNOWN'), Object.keys(RISK), 'skill risk');
      const risk = instances.reduce((result, instance) => {
        const candidate = instance.package_verification === 'CHANGED' ? 'UNKNOWN' : instance.security.risk_level;
        return RISK[candidate] > RISK[result] ? candidate : result;
      }, declaredRisk);
      const agents = list(own(source, 'agents', []), 'compatible agents').filter(agent => has(AGENTS, agent));
      const taxonomySource = record(own(source, 'taxonomy', {}), 'skill taxonomy');
      const taxonomy = Object.create(null);
      for (const key of AXES) if (has(taxonomySource, key)) taxonomy[key] = list(taxonomySource[key], 'skill taxonomy labels');
      return {
        id, name: text(source.name, 'skill name', 512), description: text(own(source, 'description', ''), 'description'),
        aliases: list(own(source, 'aliases', []), 'aliases'), domains: list(own(source, 'domains', []), 'domains'),
        dependencies: list(own(source, 'dependencies', []), 'dependencies'), software: list(own(source, 'software', []), 'software'),
        agents, risk, taxonomy,
        status: enumeration(own(source, 'status', instances.length > 1 ? 'Unverified copies' : 'Single'), ['Single', 'Duplicate', 'Variant', 'Unverified copies'], 'copy status'),
        indexed: boolean(own(source, 'indexed', false), 'index flag'), instances
      };
    });
    const scanSource = own(root, 'scan', []);
    if (!Array.isArray(scanSource) || scanSource.length > 256) fail('scan roots must be a bounded list.');
    const scan = scanSource.map(raw => {
      record(raw, 'scan root');
      return {path: text(own(raw, 'path', ''), 'scan path', 32768), exists: boolean(own(raw, 'exists', false), 'scan availability'), skills_found: count(own(raw, 'skills_found', 0), 'scan count')};
    });
    return {
      skills, agents: {...AGENTS}, scan,
      errors: list(own(root, 'errors', []), 'catalog warnings', 1000),
      evidence: safeJSON(record(own(root, 'evidence', {}), 'evidence'), budget),
      live_audit: safeJSON(record(own(root, 'live_audit', {}), 'package audit'), budget),
      loaded_at: text(own(root, 'loaded_at', 'Date not supplied'), 'catalog date', 256),
      library: text(own(root, 'library', 'Imported catalog'), 'library label', 32768),
      router_available: false,
      is_sample: boolean(own(root, 'is_sample', false), 'sample flag'),
      index_documents: count(own(root, 'index_documents', 0), 'index document count'),
      browser_edition: true
    };
  }

  function abortError() {
    const error = new Error('The request was cancelled.');
    error.name = 'AbortError';
    return error;
  }
  function checkAbort(signal) { if (signal?.aborted) throw abortError(); }
  const STOPWORDS = new Set(['a', 'an', 'the', 'to', 'for', 'with', 'and', 'of', 'in', 'on', 'is', 'i', 'want', 'please', 'use', 'build', 'create', 'my', 'help', 'me']);
  const tokens = value => [...new Set((value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(word => !STOPWORDS.has(word)))];

  function recommend(catalog, parameters) {
    const query = parameters.get('q') || '';
    const agent = parameters.get('agent') || 'all';
    const maxRisk = parameters.get('risk') || 'ELEVATED';
    const domain = parameters.get('domain') || '';
    if (query.length > 500 || domain.length > 256 || (agent !== 'all' && !has(AGENTS, agent)) || !['LOW', 'MODERATE', 'ELEVATED'].includes(maxRisk)) throw new Error('Choose valid search constraints.');
    const terms = tokens(query);
    const results = [];
    if (terms.length) for (const skill of catalog.skills) {
      if (RISK[skill.risk] > RISK[maxRisk] || !skill.agents.length || (agent !== 'all' && !skill.agents.includes(agent)) || (domain && !skill.domains.includes(domain)) || !skill.instances.some(instance => instance.available) || skill.instances.some(instance => instance.package_verification === 'CHANGED')) continue;
      const fields = [
        [new Set(tokens(skill.name)), 4], [new Set(tokens(skill.aliases.join(' '))), 3],
        [new Set(tokens(skill.software.join(' '))), 2.5], [new Set(tokens(skill.description)), 1.5],
        [new Set(tokens(skill.domains.join(' '))), 1.2], [new Set(tokens(skill.dependencies.join(' '))), .5]
      ];
      const hits = terms.filter(term => fields.some(([words]) => words.has(term)));
      const exact = query.trim().toLowerCase() === skill.name.toLowerCase();
      if (!exact && (!hits.length || hits.length < Math.min(2, terms.length) || hits.length / terms.length < .5)) continue;
      const score = (exact ? 40 : 0) + hits.reduce((sum, term) => sum + Math.max(...fields.map(([words, weight]) => words.has(term) ? weight : 0)), 0);
      results.push({id: skill.id, score: Math.round(score * 100) / 100, engine: 'Browser lexical matching', reasons: ['Matched words: ' + hits.join(', '), ...(exact ? ['Exact skill-name match'] : []), 'Agent, domain and recorded-risk constraints applied']});
    }
    results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    const threshold = results.length ? results[0].score * .2 : 0;
    const top = results.filter(item => item.score >= threshold).slice(0, 8);
    return {
      outcome: top.length ? 'MATCH' : 'NO_MATCH', results: top, engine: 'Browser lexical matching',
      notice: 'Matched locally in this browser. Scores are word-match ranking signals, not confidence or safety certification. The laptop Python router is not running here. Unknown risk, unknown compatibility and changed packages are excluded.'
    };
  }

  function browserPickTextFile() {
    if (typeof document === 'undefined') return Promise.reject(new Error('Source preview needs a browser file picker.'));
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,text/markdown';
      input.hidden = true;
      const finish = (file, error) => { input.remove(); error ? reject(error) : resolve(file); };
      input.addEventListener('change', () => input.files?.[0] ? finish(input.files[0]) : finish(null, new Error('No file selected. Choose the local SKILL.md to preview it.')), {once: true});
      input.addEventListener('cancel', () => finish(null, new Error('Source preview cancelled. No local file was read.')), {once: true});
      document.body.append(input);
      input.click();
    });
  }

  function createAdapter(options = {}) {
    let catalog = null;
    let importing = false;
    let instanceIds = new Set();
    const waiting = new Set();
    function status() {
      return {loaded: catalog !== null, skills: catalog?.skills.length || 0, instances: instanceIds.size, is_sample: catalog?.is_sample || false, processing: 'browser memory only'};
    }
    function waitForCatalog(signal) {
      checkAbort(signal);
      if (catalog) return Promise.resolve(catalog);
      return new Promise((resolve, reject) => {
        const waiter = {resolve: value => { cleanup(); resolve(value); }};
        const aborted = () => { cleanup(); reject(abortError()); };
        const cleanup = () => { waiting.delete(waiter); signal?.removeEventListener('abort', aborted); };
        waiting.add(waiter);
        signal?.addEventListener('abort', aborted, {once: true});
        if (signal?.aborted) aborted();
      });
    }
    async function importFile(file) {
      if (catalog) throw new Error('Reload this page before importing a different catalog.');
      if (importing) throw new Error('A catalog is already being read. Wait for it to finish.');
      importing = true;
      try {
        if (!file || typeof file.text !== 'function' || !Number.isFinite(file.size) || file.size < 0 || file.size > MAX_CATALOG_BYTES) throw new Error('Choose a catalog JSON file no larger than 8 MB.');
        const raw = await file.text();
        if (typeof raw !== 'string' || new TextEncoder().encode(raw).byteLength > MAX_CATALOG_BYTES) throw new Error('The catalog exceeds the 8 MB limit.');
        let parsed;
        try { parsed = JSON.parse(raw.replace(/^\uFEFF/, '')); }
        catch { throw new Error('Choose a valid Skill Atlas catalog JSON file.'); }
        const normalized = normalizeCatalog(parsed);
        catalog = normalized;
        instanceIds = new Set(catalog.skills.flatMap(skill => skill.instances.map(instance => instance.id)));
        for (const waiter of [...waiting]) waiter.resolve(catalog);
        const summary = status();
        options.onCatalogReady?.(summary);
        if (typeof globalThis.dispatchEvent === 'function' && typeof CustomEvent === 'function') globalThis.dispatchEvent(new CustomEvent('catalog-ready', {detail: summary}));
        return summary;
      } finally { importing = false; }
    }
    async function request(path, {signal} = {}) {
      checkAbort(signal);
      if (typeof path !== 'string' || !path.startsWith('/api/') || path.length > 4096) throw new Error('Unsupported browser catalog request.');
      const url = new URL(path, 'https://skill-atlas.invalid');
      if (!['/api/catalog', '/api/recommend', '/api/text'].includes(url.pathname)) throw new Error('Unsupported browser catalog request.');
      const current = await waitForCatalog(signal);
      checkAbort(signal);
      if (url.pathname === '/api/catalog') return current;
      if (url.pathname === '/api/recommend') {
        const result = recommend(current, url.searchParams);
        checkAbort(signal);
        return result;
      }
      if (!instanceIds.has(url.searchParams.get('id'))) throw new Error('Unknown imported skill instance.');
      const pick = options.pickTextFile || browserPickTextFile;
      const file = await pick();
      checkAbort(signal);
      if (!file || typeof file.text !== 'function' || typeof file.name !== 'string' || !/\.md$/i.test(file.name) || !Number.isFinite(file.size) || file.size > MAX_TEXT_BYTES) throw new Error('Choose a local Markdown (.md) file no larger than 1 MB.');
      const contents = await file.text();
      checkAbort(signal);
      if (typeof contents !== 'string' || new TextEncoder().encode(contents).byteLength > MAX_TEXT_BYTES) throw new Error('The source preview exceeds the 1 MB limit.');
      return {text: 'User-selected file: ' + file.name + '\nNot verified against the imported Windows path. Displayed as untrusted plain text; nothing is executed.\n\n' + contents};
    }
    function bindImportControls(document) {
      const input = document.getElementById('catalogFile');
      if (!input || input.dataset.catalogBound) return;
      input.dataset.catalogBound = 'true';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        const error = document.getElementById('importError');
        const progress = document.getElementById('importStatus');
        if (error) { error.textContent = ''; error.hidden = true; }
        if (progress) progress.textContent = 'Reading the catalog on this device…';
        input.disabled = true;
        const buttons = ['importOpen', 'demoOpen'].map(id => document.getElementById(id)).filter(Boolean);
        for (const button of buttons) button.disabled = true;
        try {
          const summary = await importFile(file);
          if (progress) progress.textContent = summary.skills + ' skill names and ' + summary.instances + ' source records loaded. Your file stays in this browser tab.';
        } catch (failure) {
          if (error) { error.textContent = failure.message.startsWith('Invalid catalog:') ? 'This file is not a supported Skill Atlas catalog. Choose the JSON export from your laptop, or explore the sample.' : failure.message; error.hidden = false; }
          if (progress) progress.textContent = 'Nothing was imported. Choose another catalog file.';
          input.value = '';
        } finally {
          input.disabled = false;
          for (const button of buttons) button.disabled = false;
        }
      });
    }
    return Object.freeze({request, importFile, status, bindImportControls});
  }

  return {createAdapter, normalizeCatalog, recommend, MAX_CATALOG_BYTES, MAX_TEXT_BYTES};
});
