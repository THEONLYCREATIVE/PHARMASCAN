const APP_VERSION = '1.0.0';
const DB_NAME = 'gs1_vault_db';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products';
const STORE_SCANS = 'scans';
const FALLBACK_KEY = 'gs1_vault_fallback';

const els = {};
let db = null;
let products = [];
let scans = [];
let latestEntry = null;
let qrScanner = null;
let deferredInstallPrompt = null;
let currentEditId = null;

function $(id) { return document.getElementById(id); }
function uid(prefix='id') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function digitsOnly(v='') { return String(v).replace(/\D+/g, ''); }
function cleanText(v='') { return String(v ?? '').trim(); }
function escapeHtml(str='') { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
function downloadBlob(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function parseDateFromYYMMDD(value) {
  const v = digitsOnly(value);
  if (v.length !== 6) return null;
  const yy = Number(v.slice(0,2));
  const mm = Number(v.slice(2,4));
  const dd = Number(v.slice(4,6));
  if (!mm || mm > 12 || !dd || dd > 31) return null;
  const fullYear = yy >= 70 ? 1900 + yy : 2000 + yy;
  const d = new Date(Date.UTC(fullYear, mm - 1, dd));
  return Number.isNaN(d.getTime()) ? null : d;
}
function formatDate(d) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short', day:'2-digit' }).format(date);
}
function formatDateTime(d) {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' }).format(date);
}
function expiryStatus(expiryIso) {
  if (!expiryIso) return 'none';
  const now = new Date();
  const exp = new Date(expiryIso + 'T23:59:59');
  const diffDays = Math.ceil((exp - now) / 86400000);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 90) return 'soon';
  return 'ok';
}
function statusBadge(status) {
  const map = { expired: 'Expired', soon: 'Soon', ok: 'OK', none: 'No expiry' };
  return `<span class="badge ${status}">${map[status] || status}</span>`;
}
function serializeRows(rows, sep='\t') {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v) => String(v ?? '').replaceAll('"', '""');
  return [headers.join(sep), ...rows.map(row => headers.map(h => {
    const val = esc(row[h]);
    return sep === ',' && /[",\n]/.test(val) ? `"${val}"` : val;
  }).join(sep))].join('\n');
}
function normalizeProduct(row) {
  const gtin = digitsOnly(row.GTIN || row.gtin || row.barcode || row.BARCODE || '');
  const description = cleanText(row.DESCRIPTION || row.description || row.name || row.PRODUCT || row.Product || '');
  const brand = cleanText(row.BRAND || row.brand || '');
  const itemRef = digitsOnly(row.ITEM_REF || row.item_ref || row.last8 || row.LAST8 || row.itemref || (gtin ? gtin.slice(-8) : ''));
  const seq6 = digitsOnly(row.SEQ6 || row.seq6 || row.sequence || row.SEQUENCE || (gtin ? gtin.slice(-6) : ''));
  const notes = cleanText(row.NOTES || row.notes || row.pack || row.PACK || '');
  return { id: row.id || uid('prd'), gtin, description, brand, itemRef, seq6, notes, createdAt: row.createdAt || new Date().toISOString() };
}
function parseDelimited(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (!lines.length) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = delimiter === '\t' ? line.split('\t') : splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = (cols[i] ?? '').trim());
    return obj;
  }).filter(row => Object.values(row).some(Boolean));
}
function splitCsvLine(line) {
  const out = []; let cur = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur); cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
function parseGS1(raw) {
  const original = cleanText(raw);
  const text = original.replace(/[\u001d]/g, '|').replace(/\(\s*/g, '(').replace(/\s*\)/g, ')');
  const result = { raw: original, gtin: '', expiry: '', batch: '', serial: '', quantity: '', formatHint: 'barcode-text', fields: [] };
  if (!original) return result;

  if (/\(01\)|\]d2|\]Q3|\u001d/.test(original) || /^01\d{14}/.test(digitsOnly(original))) result.formatHint = 'gs1';

  if (/\(01\)(\d{14})/.test(text)) result.gtin = text.match(/\(01\)(\d{14})/)[1];
  if (/\(17\)(\d{6})/.test(text)) result.expiry = text.match(/\(17\)(\d{6})/)[1];
  if (/\(10\)([^()|]+)/.test(text)) result.batch = text.match(/\(10\)([^()|]+)/)[1].trim();
  if (/\(21\)([^()|]+)/.test(text)) result.serial = text.match(/\(21\)([^()|]+)/)[1].trim();
  if (/\(30\)([^()|]+)/.test(text)) result.quantity = text.match(/\(30\)([^()|]+)/)[1].trim();

  if (!result.gtin) {
    const stripped = original.replace(/^\]...[A-Za-z0-9]?/, '').replace(/\u001d/g, '');
    let i = 0;
    while (i < stripped.length) {
      const ai2 = stripped.slice(i, i + 2);
      if (ai2 === '01' && /^\d{14}/.test(stripped.slice(i + 2))) { result.gtin = stripped.slice(i + 2, i + 16); i += 16; continue; }
      if (ai2 === '17' && /^\d{6}/.test(stripped.slice(i + 2))) { result.expiry = stripped.slice(i + 2, i + 8); i += 8; continue; }
      if (ai2 === '10') {
        let j = i + 2;
        while (j < stripped.length && !/^((01\d{14})|(17\d{6})|(21)|(30))/.test(stripped.slice(j))) j++;
        result.batch = stripped.slice(i + 2, j); i = j; continue;
      }
      if (ai2 === '21') {
        let j = i + 2;
        while (j < stripped.length && !/^((01\d{14})|(17\d{6})|(10)|(30))/.test(stripped.slice(j))) j++;
        result.serial = stripped.slice(i + 2, j); i = j; continue;
      }
      if (ai2 === '30') {
        let j = i + 2;
        while (j < stripped.length && /\d/.test(stripped[j])) j++;
        result.quantity = stripped.slice(i + 2, j); i = j; continue;
      }
      i++;
    }
  }

  if (!result.gtin) {
    const digits = digitsOnly(original);
    if (digits.length >= 14) result.gtin = digits.slice(0, 14);
    else if ([12,13,14].includes(digits.length)) result.gtin = digits.padStart(14, '0');
  }
  if (!result.quantity && /(qty|quantity)[:=\s]+(\d+)/i.test(original)) result.quantity = original.match(/(qty|quantity)[:=\s]+(\d+)/i)[2];
  return result;
}
function matchProduct(parsed) {
  const gtin = parsed.gtin;
  if (!gtin) return { level: 'none', hits: [] };
  let hits = products.filter(p => p.gtin === gtin);
  if (hits.length) return { level: hits.length === 1 ? 'exact' : 'ambiguous-exact', hits };
  const last8 = gtin.slice(-8);
  hits = products.filter(p => p.itemRef && p.itemRef === last8);
  if (hits.length) return { level: hits.length === 1 ? 'last8' : 'ambiguous-last8', hits };
  const seq6 = gtin.slice(-6);
  hits = products.filter(p => p.seq6 && p.seq6 === seq6);
  if (hits.length) return { level: hits.length === 1 ? 'seq6' : 'ambiguous-seq6', hits };
  return { level: 'none', hits: [] };
}
async function openDb() {
  if (!('indexedDB' in window)) throw new Error('IndexedDB not available');
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_SCANS)) db.createObjectStore(STORE_SCANS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
  });
}
async function idbGetAll(storeName) {
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result || []);
  });
}
async function idbPut(storeName, value) {
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDeleteAll(storeName) {
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
function loadFallback() {
  const raw = localStorage.getItem(FALLBACK_KEY);
  if (!raw) return { products: [], scans: [] };
  try { return JSON.parse(raw); } catch { return { products: [], scans: [] }; }
}
function saveFallback() {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify({ products, scans }));
}
async function persistProduct(product) {
  products = [product, ...products.filter(p => p.id !== product.id)];
  if (db) await idbPut(STORE_PRODUCTS, product);
  saveFallback();
}
async function persistScan(scan) {
  scans = [scan, ...scans.filter(s => s.id !== scan.id)];
  if (db) await idbPut(STORE_SCANS, scan);
  saveFallback();
}
async function bootStorage() {
  try {
    db = await openDb();
    products = await idbGetAll(STORE_PRODUCTS);
    scans = await idbGetAll(STORE_SCANS);
    $('storageStatus').textContent = 'IndexedDB active';
  } catch (err) {
    console.warn(err);
    const fallback = loadFallback();
    products = fallback.products || [];
    scans = fallback.scans || [];
    $('storageStatus').textContent = 'Fallback storage active';
  }
}
function buildMatchHtml(match) {
  if (!match.hits.length) return `<div class="match-box match-miss"><strong>No product match</strong><p class="tiny">Load your in-house database or add products manually.</p></div>`;
  const ambiguous = match.level.startsWith('ambiguous');
  const labelMap = {
    exact: 'Exact GTIN match', last8: 'Last-8 reference match', seq6: '6-digit sequence fallback',
    'ambiguous-exact': 'Ambiguous exact GTIN', 'ambiguous-last8': 'Ambiguous last-8 match', 'ambiguous-seq6': 'Ambiguous sequence match'
  };
  return `<div class="match-box ${ambiguous ? 'match-ambiguous' : 'match-hit'}">
    <strong>${labelMap[match.level] || match.level}</strong>
    <div class="tiny" style="margin-top:8px">${match.hits.map(p => `${escapeHtml(p.description || 'Unnamed')} ${p.brand ? `· ${escapeHtml(p.brand)}` : ''} ${p.gtin ? `<br><span class="mono">${escapeHtml(p.gtin)}</span>` : ''}`).join('<hr style="border:0;border-top:1px solid var(--line);margin:8px 0">')}</div>
  </div>`;
}
function renderLatest(entry) {
  const wrap = $('latestResult');
  if (!entry) {
    wrap.className = 'result-empty';
    wrap.textContent = 'No scan yet. Feed the beast a barcode.';
    return;
  }
  const tpl = $('resultTemplate').content.cloneNode(true);
  tpl.querySelector('#rawValue').textContent = entry.raw || '—';
  tpl.querySelector('#resGtin').textContent = entry.gtin || '—';
  tpl.querySelector('#resExpiry').textContent = entry.expiryDate || (entry.expiryRaw || '—');
  tpl.querySelector('#resBatch').textContent = entry.batch || '—';
  tpl.querySelector('#resSerial').textContent = entry.serial || '—';
  tpl.querySelector('#resQty').textContent = entry.quantity || '—';
  tpl.querySelector('#resFormat').textContent = entry.format || '—';
  tpl.querySelector('#matchBox').outerHTML = buildMatchHtml(entry.match);
  wrap.className = '';
  wrap.innerHTML = '';
  wrap.appendChild(tpl);
}
function renderProducts() {
  const q = cleanText($('productSearch').value).toLowerCase();
  const rows = products
    .filter(p => !q || [p.gtin, p.description, p.brand, p.itemRef, p.seq6, p.notes].join(' ').toLowerCase().includes(q))
    .sort((a,b) => (a.description || '').localeCompare(b.description || ''));
  $('productTableBody').innerHTML = rows.map(p => `<tr>
    <td class="mono">${escapeHtml(p.gtin)}</td>
    <td>${escapeHtml(p.description)}</td>
    <td>${escapeHtml(p.brand)}</td>
    <td class="mono">${escapeHtml(p.itemRef)}</td>
    <td class="mono">${escapeHtml(p.seq6)}</td>
    <td>${escapeHtml(p.notes)}</td>
  </tr>`).join('') || `<tr><td colspan="6" class="tiny">No products loaded yet.</td></tr>`;
}
function renderHistory() {
  const q = cleanText($('historySearch').value).toLowerCase();
  const filter = $('historyStatusFilter').value;
  const sort = $('historySort').value;
  let rows = scans.filter(s => {
    const status = expiryStatus(s.expiryIso);
    const hit = !q || [s.raw, s.gtin, s.description, s.batch, s.serial, s.quantity].join(' ').toLowerCase().includes(q);
    const statusOk = filter === 'all' || status === filter;
    return hit && statusOk;
  });
  rows.sort((a,b) => {
    if (sort === 'oldest') return new Date(a.scannedAt) - new Date(b.scannedAt);
    if (sort === 'expiry') return String(a.expiryIso || '9999').localeCompare(String(b.expiryIso || '9999'));
    return new Date(b.scannedAt) - new Date(a.scannedAt);
  });
  $('historyTableBody').innerHTML = rows.map(s => {
    const status = expiryStatus(s.expiryIso);
    const matchLabel = s.match.level === 'none' ? 'No match' : s.match.level;
    return `<tr>
      <td>${formatDateTime(s.scannedAt)}</td>
      <td class="mono">${escapeHtml(s.gtin)}</td>
      <td>${escapeHtml(s.description || '—')}</td>
      <td>${escapeHtml(s.expiryDate || '—')}</td>
      <td>${statusBadge(status)}</td>
      <td class="mono">${escapeHtml(s.batch || '—')}</td>
      <td class="mono">${escapeHtml(s.serial || '—')}</td>
      <td class="mono">${escapeHtml(s.quantity || '—')}</td>
      <td>${escapeHtml(matchLabel)}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="9" class="tiny">No scan history yet.</td></tr>`;
}
function refreshMetrics() {
  $('metricScans').textContent = String(scans.length);
  $('metricProducts').textContent = String(products.length);
  $('metricExpired').textContent = String(scans.filter(s => expiryStatus(s.expiryIso) === 'expired').length);
  $('metricAmbiguous').textContent = String(scans.filter(s => s.match.level.startsWith('ambiguous')).length);
}
function refreshAll() {
  renderProducts();
  renderHistory();
  renderLatest(latestEntry || scans[0] || null);
  refreshMetrics();
}
async function handleDecodedText(raw, format='scanner') {
  const parsed = parseGS1(raw);
  const expDate = parseDateFromYYMMDD(parsed.expiry);
  const match = matchProduct(parsed);
  const primaryHit = match.hits[0] || null;
  const entry = {
    id: uid('scan'), raw: parsed.raw, gtin: parsed.gtin, expiryRaw: parsed.expiry,
    expiryIso: expDate ? expDate.toISOString().slice(0,10) : '', expiryDate: expDate ? formatDate(expDate) : '',
    batch: parsed.batch, serial: parsed.serial, quantity: parsed.quantity, format,
    description: primaryHit?.description || '', brand: primaryHit?.brand || '', match,
    scannedAt: new Date().toISOString()
  };
  latestEntry = entry;
  await persistScan(entry);
  refreshAll();
}
async function startScanner() {
  if (!window.Html5Qrcode) return alert('html5-qrcode library not loaded yet. Open once online first so the PWA can cache it.');
  if (qrScanner) return;
  qrScanner = new Html5Qrcode('reader');
  try {
    await qrScanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: (w,h) => ({ width: Math.min(w, 280), height: Math.min(h, 160) }),
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A
        ]
      },
      async (decodedText, decodedResult) => {
        await handleDecodedText(decodedText, decodedResult?.result?.format?.formatName || 'camera');
        await stopScanner();
      },
      () => {}
    );
  } catch (err) {
    console.error(err);
    alert('Camera start failed. Check permission, HTTPS, and browser support.');
    qrScanner = null;
  }
}
async function stopScanner() {
  if (!qrScanner) return;
  try { await qrScanner.stop(); await qrScanner.clear(); } catch {}
  qrScanner = null;
  $('reader').innerHTML = '';
}
async function scanImageFile(file) {
  if (!window.Html5Qrcode) return alert('html5-qrcode library not loaded yet.');
  const temp = new Html5Qrcode('reader');
  try {
    const decodedText = await temp.scanFile(file, true);
    await handleDecodedText(decodedText, 'image');
  } catch (err) {
    console.error(err);
    alert('Could not decode barcode from image.');
  } finally {
    try { await temp.clear(); } catch {}
    $('reader').innerHTML = '';
  }
}
async function importMasterFile(file) {
  const text = await file.text();
  const rows = parseDelimited(text).map(normalizeProduct).filter(p => p.gtin || p.description);
  for (const row of rows) await persistProduct(row);
  refreshAll();
  alert(`Imported ${rows.length} products.`);
}
function resetProductForm() {
  currentEditId = null;
  ['formGtin','formItemRef','formSeq6','formDesc','formBrand','formNotes'].forEach(id => $(id).value = '');
}
async function saveProductFromForm() {
  const product = normalizeProduct({
    id: currentEditId || uid('prd'),
    GTIN: $('formGtin').value,
    ITEM_REF: $('formItemRef').value,
    SEQ6: $('formSeq6').value,
    DESCRIPTION: $('formDesc').value,
    BRAND: $('formBrand').value,
    NOTES: $('formNotes').value
  });
  if (!product.gtin && !product.description) return alert('Enter at least GTIN or description.');
  await persistProduct(product);
  resetProductForm();
  refreshAll();
}
function exportHistory(sep, ext) {
  const rows = scans.map(s => ({
    scanned_at: s.scannedAt, gtin: s.gtin, description: s.description, brand: s.brand,
    expiry_raw: s.expiryRaw, expiry_date: s.expiryDate, expiry_status: expiryStatus(s.expiryIso),
    batch: s.batch, serial: s.serial, quantity: s.quantity, match_level: s.match.level, raw: s.raw
  }));
  downloadBlob(`gs1-history.${ext}`, sep === ',' ? 'text/csv' : 'text/tab-separated-values', serializeRows(rows, sep));
}
function exportMaster() {
  const rows = products.map(p => ({ GTIN: p.gtin, DESCRIPTION: p.description, BRAND: p.brand, ITEM_REF: p.itemRef, SEQ6: p.seq6, NOTES: p.notes }));
  downloadBlob('gs1-master.tsv', 'text/tab-separated-values', serializeRows(rows, '\t'));
}
function backupJson() {
  const payload = { app: 'GS1 Vault', version: APP_VERSION, exportedAt: new Date().toISOString(), products, scans };
  downloadBlob('gs1-vault-backup.json', 'application/json', JSON.stringify(payload, null, 2));
}
async function restoreJson(file) {
  const payload = JSON.parse(await file.text());
  const newProducts = (payload.products || []).map(normalizeProduct);
  const newScans = (payload.scans || []).map(s => ({ ...s, id: s.id || uid('scan') }));
  products = [];
  scans = [];
  if (db) {
    await idbDeleteAll(STORE_PRODUCTS);
    await idbDeleteAll(STORE_SCANS);
    for (const p of newProducts) await idbPut(STORE_PRODUCTS, p);
    for (const s of newScans) await idbPut(STORE_SCANS, s);
  }
  products = newProducts;
  scans = newScans;
  saveFallback();
  latestEntry = scans[0] || null;
  refreshAll();
  alert(`Restore complete: ${products.length} products, ${scans.length} scans.`);
}
function downloadTemplate() {
  const tsv = 'GTIN\tDESCRIPTION\tBRAND\tITEM_REF\tSEQ6\tNOTES\n00012345678905\tSample Product\tBrandX\t45678905\t678905\tOptional notes';
  downloadBlob('gs1-master-template.tsv', 'text/tab-separated-values', tsv);
}
function copyLatest() {
  const e = latestEntry || scans[0];
  if (!e) return;
  const text = [
    `GTIN: ${e.gtin || '—'}`,
    `Description: ${e.description || '—'}`,
    `Expiry: ${e.expiryDate || e.expiryRaw || '—'}`,
    `Batch: ${e.batch || '—'}`,
    `Serial: ${e.serial || '—'}`,
    `Quantity: ${e.quantity || '—'}`,
    `Match: ${e.match.level}`,
    `Raw: ${e.raw || '—'}`
  ].join('\n');
  navigator.clipboard.writeText(text).then(() => alert('Latest result copied.'));
}
function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    $('installBtn').hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    $('installBtn').hidden = true;
  });
  $('installBtn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    deferredInstallPrompt = null;
    $('installBtn').hidden = true;
  });
}
async function registerSw() {
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('./sw.js'); }
    catch (err) { console.warn('SW failed', err); }
  }
}
function bindUi() {
  $('startScanBtn').onclick = startScanner;
  $('stopScanBtn').onclick = stopScanner;
  $('parseManualBtn').onclick = async () => {
    const value = $('manualInput').value.trim();
    if (!value) return;
    await handleDecodedText(value, 'manual');
  };
  $('clearManualBtn').onclick = () => $('manualInput').value = '';
  $('imageScanInput').onchange = async (e) => { const file = e.target.files[0]; if (file) await scanImageFile(file); e.target.value = ''; };
  $('masterFileInput').onchange = async (e) => { const file = e.target.files[0]; if (file) await importMasterFile(file); e.target.value = ''; };
  $('saveProductBtn').onclick = saveProductFromForm;
  $('clearProductBtn').onclick = resetProductForm;
  $('productSearch').oninput = renderProducts;
  $('historySearch').oninput = renderHistory;
  $('historyStatusFilter').onchange = renderHistory;
  $('historySort').onchange = renderHistory;
  $('exportCsvBtn').onclick = () => exportHistory(',', 'csv');
  $('exportTsvBtn').onclick = () => exportHistory('\t', 'tsv');
  $('exportMasterBtn').onclick = exportMaster;
  $('backupBtn').onclick = backupJson;
  $('downloadTemplateBtn').onclick = downloadTemplate;
  $('copyLatestBtn').onclick = copyLatest;
  $('restoreInput').onchange = async (e) => { const file = e.target.files[0]; if (file) await restoreJson(file); e.target.value = ''; };
  $('wipeHistoryBtn').onclick = async () => {
    if (!confirm('Delete all scan history?')) return;
    scans = [];
    if (db) await idbDeleteAll(STORE_SCANS);
    saveFallback();
    latestEntry = null;
    refreshAll();
  };
  $('wipeMasterBtn').onclick = async () => {
    if (!confirm('Delete all master products?')) return;
    products = [];
    if (db) await idbDeleteAll(STORE_PRODUCTS);
    saveFallback();
    refreshAll();
  };
}
async function init() {
  await bootStorage();
  bindUi();
  initInstallPrompt();
  await registerSw();
  latestEntry = scans[0] || null;
  refreshAll();
}
document.addEventListener('DOMContentLoaded', init);
