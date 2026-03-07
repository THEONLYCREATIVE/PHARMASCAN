/**
 * PHARMASCAN PRO v4.0.0  ·  OFFLINE GS1 BARCODE PARSING EDITION
 * ────────────────────────────────────────────────────────────────
 * Merged: PWA format (PharmaScan Pro v3) + Offline GS1 Barcode Parsing
 *
 * MASTER COLUMNS:
 *   BARCODE · RMS ID · ALSHAYA CODE · NEW ALSHAYA CODE · DESCRIPTION
 *   BRAND · SUPPLIER · EXPIRY DATE · BATCH NO
 *
 * EXPORT COLUMNS:
 *   Scan Barcode · RMS · Alshaya Code · Description · Brand
 *   Supplier Name · QTY · Expiry Date · Batch No
 *
 * EXPIRY SOURCES (priority):
 *   1. GS1 AI(17) from barcode — instant, no prompt
 *   2. Embedded seed database — auto-loaded on first launch
 *   3. Master CSV upload — user-provided
 *   4. Manual entry / OCR
 *
 * GS1 APPLICATION IDENTIFIERS SUPPORTED:
 *   (00) SSCC  (01) GTIN  (02) CONTENT  (10) BATCH/LOT
 *   (11) PROD DATE  (13) PACK DATE  (15) BEST BEFORE
 *   (17) EXPIRY  (20) VARIANT  (21) SERIAL  (30) QTY
 *   (310n) NET WEIGHT kg  (320n) NET WEIGHT lb  (37) QTY
 *   (400) ORDER NO  (401) CONSIGNMENT  (410–416) GLN
 *   (420–422) SHIP TO  (7003) EXPIRY+TIME  (8004) CUSTOM
 *   (90)–(99) INTERNAL
 *
 * DATABASE STRING FORMAT (EMBEDDED_MASTER_DB):
 *   Tab-separated, first line = header row.
 *   Auto-seeded into IndexedDB on first launch if master is empty.
 *   Format: BARCODE\tRMS ID\tALSHAYA CODE\tNEW ALSHAYA CODE\tDESCRIPTION\tBRAND\tSUPPLIER\tEXPIRY DATE\tBATCH NO
 */

'use strict';

// ═══════════════════════════════════════════════════
// ██████  EMBEDDED MASTER DATABASE STRING
// ═══════════════════════════════════════════════════
/**
 * EMBEDDED_MASTER_DB — Tab-separated product database string.
 * This is the "database string" that seeds the app on first launch.
 * Replace or extend rows to embed your own product catalogue.
 * Column order MUST match the header row exactly.
 *
 * Auto-loaded when: IndexedDB master store is empty on init.
 * Can be refreshed via: Master tab → Upload / Replace Master.
 */
const EMBEDDED_MASTER_DB = `BARCODE\tRMS ID\tALSHAYA CODE\tNEW ALSHAYA CODE\tDESCRIPTION\tBRAND\tSUPPLIER\tEXPIRY DATE\tBATCH NO
4015630982110\t220216906\tY3BOY358100197A\tBZBTSLOACC82110\tACCUCHECK PERFORMA 50S\tACCUCHECK\tPHARMATRADE\t30/06/2026\tLOT-A1
8436009781961\t220084480\tB2BOB29781961\tB2BOB29781961\tABRIL NAT SHAMPOO MASK 200ML\tABRIL ET NATURE\tCIGALAH MEDPHARM\t12/2025\t
3282770108712\t220197250\tB2BOB20108712\tB2BOB20108712\tVADERMA BARRIER CRM 50ML\tADERMA\tNUTRIPHARM FZO\t2026-03-31\tBATCH-002
6009705530059\t220031100\tH1HOH53530059\tH1HOH53530059\tALBENDAZOLE 400MG TAB 1S\tALBENDA\tJUBAIL PHARMA\t06/2026\t
5000488101025\t220014520\tA1ANA10101025\tA1ANA10101025\tANADIN EXTRA CAP 16S\tANADIN\tPHARMATRADE\t09/2026\tAN-261
5054563105498\t220188890\tA4ATL10105498\tA4ATL10105498\tATLASK SUNSCREEN SPF50 100ML\tATLASK\tCIGALAH MEDPHARM\t12/2026\t
4056800019886\t220203410\tB6BEU19919886\tB6BEU19919886\tEUCERIN AQP LIGHT LOTION 400ML\tEUCERIN\tBEIERSDORF\t06/2027\tEU-400
3574661413952\t220019520\tC2CET41413952\tC2CET41413952\tCETAPHIL MOISTURIZING CR 250G\tCETAPHIL\tGALDERMA\t08/2026\tCE-250
8850006511016\t220177640\tD1DET51511016\tD1DET51511016\tDETTOL HANDWASH 200ML\tDETTOL\tRECKITT\t2026-10-01\t
5000347007527\t220034520\tE2EAS00507527\tE2EAS00507527\tENO FRUIT SALT LEMON 100G\tENO\tHALEON\t03/2027\t
3664798001094\t220204110\tF1FIS00101094\tF1FIS00101094\tFISSA COLD CRM 50ML\tFISSA\tNUTRIPHARM FZO\t11/2026\tF-050
6281007042716\t220061270\tG2GUL04242716\tG2GUL04242716\tGULF DRUG MULTIVIT CAPS 30S\tGULF DRUG\tGULF DRUG CO\t06/2026\t
8710428017471\t220018170\tH3HAD01717471\tH3HAD01717471\tHADENS SHOWER GEL 250ML\tHADENS\tHENKEL\t2027-01-31\tH-250
3401560369016\t220136900\tI2IBS36936016\tI2IBS36936016\tIBUPROFEN 400MG TAB 20S\tIBUPROFEN\tSANDOZ\t09/2027\tIBU-400
6281007037126\t220037120\tJ1JAH03737126\tJ1JAH03737126\tJAHAN VITAMIN C 500MG 30S\tJAHAN\tGULF DRUG CO\t12/2026\t
4046800003618\t220200360\tK2KLO00303618\tK2KLO00303618\tKLORANE DRY SHAMPOO 150ML\tKLORANE\tPIERRE FABRE\t06/2027\tKL-150
5900017011745\t220101174\tL1LAC01011745\tL1LAC01011745\tLACTOCALAMINE LOT 120ML\tLACTOCALAMINE\tPONDS\t03/2026\tLC-120
6281007028124\t220028120\tM2MEB02828124\tM2MEB02828124\tMEBEVERINE 135MG TAB 20S\tMEBEVERINE\tGULF DRUG CO\t2026-07-31\t
8712000195237\t220019520\tN1NEX01901523\tN1NEX01901523\tNEXIUM 20MG CAPS 28S\tNEXIUM\tASTRAZENECA\t11/2026\tNEX-20
3574661327977\t220032790\tO2OLA32732977\tO2OLA32732977\tOLAY TOTAL EFFECTS 50ML\tOLAY\tPROCTER GAMBLE\t08/2027\t
5000031045009\t220045000\tP1PAR04504500\tP1PAR04504500\tPARACETAMOL 500MG TAB 24S\tPANADOL\tHALEON\t06/2027\tPAR-500
3535374054404\t220054400\tQ1QUA05405440\tQ1QUA05405440\tQUATRODERM PLUS CRM 30G\tQUATRODERM\tBESINS\t09/2026\tQU-030
3664798006310\t220063100\tR2ROL00606310\tR2ROL00606310\tROC RETINOL CRM 30ML\tROC\tJOHNSON JOHNSON\t01/2027\tRO-030
3282770204599\t220020450\tS1SVR20420459\tS1SVR20420459\tSVR BIOTIC PLUMP SERUM 30ML\tSVR\tNUTRIPHARM FZO\t2026-05-31\t
6002041001456\t220014560\tT2TER00101456\tT2TER00101456\tTERAFLU COLD FLU 10S SACHETS\tTERAFLU\tHALEON\t12/2025\tTER-10
5054563100066\t220100060\tU1UNI10010006\tU1UNI10010006\tUNICEF ORS SACHETS 10S\tUNICEF ORS\tJUBAIL PHARMA\t06/2026\t
4005900180513\t220018050\tV2VAS01801851\tV2VAS01801851\tVASELINE INTENSIVE CRM 200ML\tVASELINE\tUNILEVER\t08/2027\tVA-200
6281007038253\t220038250\tW1WEL03803825\tW1WEL03803825\tWELCADE ZINC TABS 20S\tWELCADE\tGULF DRUG CO\t03/2027\t
3337875597264\t220059720\tX2XYL05905972\tX2XYL05905972\tXYLOCT NASAL SPRAY 10ML\tXYLOCT\tPIERRE FABRE\t2026-09-30\tXY-010
6281007023625\t220023620\tY1YOM02302362\tY1YOM02302362\tYOMEX ANTIFUNGAL CRM 30G\tYOMEX\tGULF DRUG CO\t06/2026\t
3401399625674\t220062560\tZ2ZIT06206256\tZ2ZIT06206256\tZITHROMAX 500MG TAB 3S\tZITHROMAX\tPFIZER\t2027-02-28\tZI-500`;

// ═══════════════════════════════════════════════════
// CONFIG & STATE
// ═══════════════════════════════════════════════════
const CFG = {
  DB: 'PharmaScanPro4',
  DB_VER: 2,
  SOON_DAYS: 90,
  VER: '4.0.0',
  SEED_KEY: 'embeddedDbSeeded_v4'
};

const S = {
  db: null,
  masterIdx: new Map(),
  filter: 'all',
  search: '',
  draft: null,
  camActive: false,
  camInst: null,
  ocrWorker: null
};

// ═══════════════════════════════════════════════════
// INDEXEDDB LAYER
// ═══════════════════════════════════════════════════
const DB = {
  async init() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(CFG.DB, CFG.DB_VER);
      req.onerror   = () => rej(req.error);
      req.onsuccess = () => { S.db = req.result; res(); };
      req.onupgradeneeded = ev => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains('history')) {
          const h = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          h.createIndex('gtin', 'gtin', { unique: false });
          h.createIndex('ts',   'ts',   { unique: false });
        }
        if (!db.objectStoreNames.contains('master'))
          db.createObjectStore('master', { keyPath: 'barcode' });
        if (!db.objectStoreNames.contains('settings'))
          db.createObjectStore('settings', { keyPath: 'key' });
      };
    });
  },

  _run(store, mode, fn) {
    return new Promise((res, rej) => {
      const tx = S.db.transaction(store, mode);
      const s  = tx.objectStore(store);
      const r  = fn(s);
      if (r && typeof r.onsuccess !== 'undefined') {
        r.onsuccess = () => res(r.result);
        r.onerror   = () => rej(r.error);
      } else {
        tx.oncomplete = () => res(r);
        tx.onerror    = () => rej(tx.error);
      }
    });
  },

  add:    (st, it) => DB._run(st, 'readwrite', s => s.add(it)),
  put:    (st, it) => DB._run(st, 'readwrite', s => s.put(it)),
  get:    (st, id) => DB._run(st, 'readonly',  s => s.get(id)),
  getAll: st       => DB._run(st, 'readonly',  s => s.getAll()),
  del:    (st, id) => DB._run(st, 'readwrite', s => s.delete(id)),
  clear:  st       => DB._run(st, 'readwrite', s => s.clear()),

  async count(store) {
    return new Promise((res, rej) => {
      const tx = S.db.transaction(store, 'readonly');
      const r  = tx.objectStore(store).count();
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
  },

  async bulkMaster(items) {
    return new Promise((res, rej) => {
      const tx = S.db.transaction('master', 'readwrite');
      const st = tx.objectStore('master');
      let n = 0;
      for (const it of items) { if (it.barcode) { st.put(it); n++; } }
      tx.oncomplete = () => res(n);
      tx.onerror    = () => rej(tx.error);
    });
  }
};

// ═══════════════════════════════════════════════════
// DATABASE STRING SEEDER
// ═══════════════════════════════════════════════════
/**
 * parseDatabaseString(str)
 * Parses the EMBEDDED_MASTER_DB tab-separated string and returns
 * an array of normalised product objects ready for IndexedDB.
 *
 * Also used by uploadMaster() to parse user-uploaded TSV/CSV files
 * via the same pipeline — ensuring consistent field mapping.
 */
function parseDatabaseString(str, delim = '\t') {
  const lines = str.trim().split(/[\r\n]+/);
  if (lines.length < 2) return [];
  const header = lines[0];
  // Auto-detect delimiter if not forced
  if (!delim) delim = header.includes('\t') ? '\t' : ',';
  const cols = header.split(delim).map(c => c.trim().replace(/^["']|["']$/g, '').toLowerCase());

  const ci = names => cols.findIndex(c => names.some(n => c.includes(n)));
  const idx = {
    barcode:        ci(['barcode','gtin','ean','upc','item code','barcode_no']),
    name:           ci(['description','name','product']),
    rmsId:          ci(['rms id','rms_id','rmsid','rms']),
    alshayaCode:    ci(['alshaya code','alshaya_code','alshayacode']),
    newAlshayaCode: ci(['new alshaya','new_alshaya','newalshaya']),
    brand:          ci(['brand']),
    supplierName:   ci(['supplier']),
    expiry:         ci(['expiry','exp date','expiry date','best before','bb','use by']),
    batch:          ci(['batch','lot'])
  };

  if (idx.barcode === -1) return [];

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delim).map(c => c.trim().replace(/^["']|["']$/g, ''));
    const bc  = normBC(row[idx.barcode] || '');
    if (!bc || bc.length < 8) continue;
    const rawExp  = idx.expiry >= 0 ? row[idx.expiry] : '';
    const isoExp  = parseExpiry(rawExp);
    items.push({
      barcode:        bc.padStart(14, '0'),
      name:           idx.name           >= 0 ? row[idx.name]           : '',
      rmsId:          idx.rmsId          >= 0 ? row[idx.rmsId]          : '',
      alshayaCode:    idx.alshayaCode    >= 0 ? row[idx.alshayaCode]    : '',
      newAlshayaCode: idx.newAlshayaCode >= 0 ? row[idx.newAlshayaCode] : '',
      brand:          idx.brand          >= 0 ? row[idx.brand]          : '',
      supplierName:   idx.supplierName   >= 0 ? row[idx.supplierName]   : '',
      expiryISO:      isoExp,
      batch:          idx.batch          >= 0 ? row[idx.batch]          : ''
    });
  }
  return items;
}

/**
 * seedEmbeddedDatabase()
 * Called once on first launch. Loads EMBEDDED_MASTER_DB into IndexedDB
 * master store if and only if the store is currently empty.
 * Marks seed as done in settings so it never runs again automatically.
 */
async function seedEmbeddedDatabase() {
  try {
    const count = await DB.count('master');
    if (count > 0) return; // already has data — skip
    const seeded = await DB.get('settings', CFG.SEED_KEY).catch(() => null);
    if (seeded) return;

    const items = parseDatabaseString(EMBEDDED_MASTER_DB, '\t');
    if (!items.length) return;
    const n = await DB.bulkMaster(items);
    await DB.put('settings', { key: CFG.SEED_KEY, value: true, date: new Date().toISOString() });
    console.log(`[PharmaScan] Seeded ${n} products from embedded database string.`);
    toast(`Loaded ${n} products from built-in database`, 'ok');
  } catch (e) {
    console.warn('[PharmaScan] Seed skipped:', e.message);
  }
}

// ═══════════════════════════════════════════════════
// GS1 BARCODE PARSER  —  OFFLINE FULL EDITION
// ═══════════════════════════════════════════════════
/**
 * Full offline GS1 parser supporting:
 *  • Human Readable Interpretation (HRI) format: (01)12345…(17)YYMMDD
 *  • Raw GS1-128 / DataBar / DataMatrix with GS (0x1D) separators
 *  • Plain EAN-8, EAN-13, UPC-A, UPC-E, ITF-14
 *  • GS1 QR Code composite component
 *  • All variable-length AIs using the official FNC1 separator table
 */
const GS1 = {
  // Fixed-length AI definitions  →  [ai_prefix, total_data_length]
  FIXED: {
    '00':18,'01':14,'02':14,'03':14,'04':18,'11':6,'12':6,'13':6,'14':6,
    '15':6,'16':6,'17':6,'18':6,'19':6,'20':2,
    '31':7,'32':7,'33':7,'34':7,'35':7,'36':7,
    '41':13
  },

  parse(raw) {
    const out = {
      raw, gtin:'', expiry:'', expiryISO:'', expiryDisplay:'',
      batch:'', serial:'', prodDate:'', bestBefore:'',
      netWeight:'', qty:'', orderNo:'', sscc:'',
      allAIs:{}, isGS1: false
    };
    if (!raw || typeof raw !== 'string') return out;

    const code = raw.trim().replace(/[\r\n\t]/g, '');
    const GS   = '\x1D';
    const hasParens = code.includes('(');
    const hasRaw    = /^0[01]\d{12,18}/.test(code);

    // Plain EAN / UPC / ITF — no GS1 application identifiers
    if (!hasParens && !hasRaw && !code.includes(GS)) {
      const d = code.replace(/\D/g, '');
      if (d.length >= 8 && d.length <= 18) out.gtin = d.padStart(14, '0');
      return out;
    }

    out.isGS1 = true;

    if (hasParens) {
      this._parseHRI(code, out);
    } else {
      this._parseRaw(code, out);
    }

    return out;
  },

  /** Parse Human Readable Interpretation: (AI)value(AI)value… */
  _parseHRI(code, out) {
    const re = /\((\d{2,4})\)([^(]*)/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      const ai  = m[1];
      const val = m[2].replace(/[^\x20-\x7E]/g, '').trim();
      this._applyAI(ai, val, out);
    }
  },

  /** Parse raw GS1 byte stream with FNC1 (GS) separators */
  _parseRaw(code, out) {
    let pos = 0;
    while (pos < code.length) {
      if (code[pos] === '\x1D') { pos++; continue; }

      // Try 4-char AI first, then 3-char, then 2-char
      let ai = null, dataStart = 0;
      for (const len of [4, 3, 2]) {
        const candidate = code.slice(pos, pos + len);
        if (this._knownAI(candidate)) { ai = candidate; dataStart = pos + len; break; }
      }
      if (!ai) { pos++; continue; }

      const fixedLen = this._fixedLen(ai);
      let val, nextPos;
      if (fixedLen !== null) {
        val     = code.slice(dataStart, dataStart + fixedLen);
        nextPos = dataStart + fixedLen;
      } else {
        // Variable length — read until GS or end
        const end = this._scanToGS(code, dataStart);
        val     = code.slice(dataStart, end);
        nextPos = end;
      }
      this._applyAI(ai, val.replace(/[^\x20-\x7E]/g, '').trim(), out);
      pos = nextPos;
    }
  },

  _knownAI(ai) {
    const n = parseInt(ai);
    if (isNaN(n)) return false;
    // Known ranges
    if (n >= 0  && n <= 99)  return true;
    if (n >= 100 && n <= 179) return true;
    if (n >= 310 && n <= 369) return true;
    if (n >= 400 && n <= 703) return true;
    if (n >= 7001 && n <= 9999) return true;
    return false;
  },

  _fixedLen(ai) {
    if (this.FIXED[ai] !== undefined) return this.FIXED[ai];
    // 31nn–36nn: 6 chars
    if (/^3[1-6]\d$/.test(ai)) return 6;
    return null;
  },

  _scanToGS(code, start) {
    for (let i = start; i < code.length; i++) {
      if (code[i] === '\x1D') return i;
    }
    return code.length;
  },

  _applyAI(ai, val, out) {
    out.allAIs[ai] = val;
    switch (ai) {
      case '00': out.sscc        = val; break;
      case '01': out.gtin        = val; break;
      case '02': out.gtin        = out.gtin || val; break;
      case '10': out.batch       = val.slice(0, 20); break;
      case '11': out.prodDate    = this._dateFromYYMMDD(val); break;
      case '15': out.bestBefore  = this._dateFromYYMMDD(val); break;
      case '17': this._exp(val, out); break;
      case '21': out.serial      = val.slice(0, 20); break;
      case '30': out.qty         = val; break;
      case '37': out.qty         = out.qty || val; break;
      case '400': out.orderNo    = val; break;
      case '7003': out.expiryISO = out.expiryISO || this._dateFromYYMMDD(val.slice(0,6)); break;
    }
    // 310n–316n: net weight kg
    if (/^31[0-6]$/.test(ai)) {
      const dec = parseInt(ai[2]);
      out.netWeight = (parseInt(val) / Math.pow(10, dec)).toFixed(dec) + ' kg';
    }
  },

  _dateFromYYMMDD(s) {
    if (!s || s.length < 6) return '';
    const yy = +s.slice(0,2), mm = +s.slice(2,4), dd = +s.slice(4,6) || new Date(2000+yy,mm,0).getDate();
    return `${2000+yy}-${p2(mm)}-${p2(dd)}`;
  },

  _exp(yymmdd, r) {
    if (!yymmdd || yymmdd.length !== 6) return;
    r.expiry = yymmdd;
    const iso = this._dateFromYYMMDD(yymmdd);
    if (iso) {
      r.expiryISO     = iso;
      const d = new Date(iso + 'T00:00:00');
      r.expiryDisplay = `${p2(d.getDate())}/${p2(d.getMonth()+1)}/${d.getFullYear()}`;
    }
  },

  status(iso) {
    if (!iso) return 'noexp';
    const t = new Date(); t.setHours(0,0,0,0);
    const e = new Date(iso); e.setHours(0,0,0,0);
    const d = Math.floor((e - t) / 86400000);
    return d < 0 ? 'expired' : d <= CFG.SOON_DAYS ? 'expiring' : 'ok';
  },

  /** Format all decoded AIs as a readable string for diagnostics */
  formatAIs(parsed) {
    const map = {
      '00':'SSCC','01':'GTIN','10':'BATCH','11':'PROD DATE','15':'BEST BEFORE',
      '17':'EXPIRY','21':'SERIAL','30':'QTY','37':'QTY VAR','400':'ORDER NO',
      '7003':'EXPIRY+TIME'
    };
    return Object.entries(parsed.allAIs)
      .map(([ai,v]) => `(${ai}) ${map[ai]||'AI'}: ${v}`)
      .join('  ·  ');
  }
};

// ═══════════════════════════════════════════════════
// EXPIRY DATE PARSER  (master CSV / manual input)
// ═══════════════════════════════════════════════════
function parseExpiry(raw) {
  if (!raw && raw !== 0) return '';
  const s = String(raw).trim();
  if (!s || s === '-') return '';

  const last = (y, m) => new Date(y, m, 0).getDate();
  const MO = {JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};

  // Excel serial (numeric 40000–80000)
  const num = parseFloat(s);
  if (!isNaN(num) && num > 40000 && num < 80000 && !/[\/\-]/.test(s)) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(d)) return `${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}-${p2(d.getUTCDate())}`;
  }

  const patterns = [
    { re:/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/,  fn:([,y,m,d])=>`${y}-${p2(+m)}-${p2(+d)}` },
    { re:/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](20\d{2})$/, fn:([,d,m,y])=>`${y}-${p2(+m)}-${p2(+d)}` },
    { re:/^(\d{1,2})[\/\-](20\d{2})$/,                     fn:([,m,y])=>`${y}-${p2(+m)}-${p2(last(+y,+m))}` },
    { re:/^(\d{1,2})[\/\-](\d{2})$/,                       fn:([,m,y])=>{ const yr=2000+(+y); return `${yr}-${p2(+m)}-${p2(last(yr,+m))}`; } },
    { re:/^(\d{4})(\d{2})(\d{2})$/,                        fn:([,y,m,d])=>`${y}-${p2(+m)}-${p2(+d)}` },
    { re:/^(\d{2})(\d{2})(\d{2})$/,                        fn:([,yy,mm,dd])=>{ const yr=2000+(+yy),mo=+mm; let d=+dd||last(yr,mo); return `${yr}-${p2(mo)}-${p2(d)}`; } },
    { re:/^([A-Za-z]{3})\s*(20\d{2})$/,                    fn:([,mon,y])=>{ const m=MO[mon.toUpperCase()]; return m?`${y}-${p2(m)}-${p2(last(+y,m))}`:''; } },
  ];

  for (const { re, fn } of patterns) {
    const m = s.match(re);
    if (m) {
      try {
        const iso = fn(m);
        const d   = new Date(iso);
        if (!isNaN(d) && d.getFullYear() >= 2000 && d.getFullYear() <= 2060) return iso;
      } catch {}
    }
  }
  return '';
}

// ═══════════════════════════════════════════════════
// OCR DATE EXTRACTION
// ═══════════════════════════════════════════════════
function extractOCRDate(text) {
  const t  = text.toUpperCase().replace(/[|Il]/g,'1').replace(/O/g,'0');
  const MO = {JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};
  const last = (y,m) => new Date(y,m,0).getDate();
  const patterns = [
    { re:/\b(20\d{2})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/, fn:m=>`${m[1]}-${p2(+m[2])}-${p2(+m[3])}` },
    { re:/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](20\d{2})\b/, fn:m=>`${m[3]}-${p2(+m[2])}-${p2(+m[1])}` },
    { re:/\b(\d{1,2})[\/\-](20\d{2})\b/,                     fn:m=>{ const yr=+m[2],mo=+m[1]; return `${yr}-${p2(mo)}-${p2(last(yr,mo))}`; } },
    { re:/\b(\d{1,2})[\/\-](\d{2})\b/,                       fn:m=>{ const yr=2000+(+m[2]),mo=+m[1]; return `${yr}-${p2(mo)}-${p2(last(yr,mo))}`; } },
    { re:/\b(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(20\d{2})\b/, fn:m=>`${m[3]}-${p2(MO[m[2]])}-${p2(+m[1])}` },
    { re:/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(20\d{2})\b/,             fn:m=>{ const yr=+m[2],mo=MO[m[1]]; return `${yr}-${p2(mo)}-${p2(last(yr,mo))}`; } },
    { re:/(?:EXP|BB|EXPIRY|BEST\s*BEFORE|USE\s*BY)[:\s]*(\d{6})/, fn:m=>{ const yy=m[1].slice(0,2),mm=m[1].slice(2,4),yr=2000+(+yy),mo=+mm; let dd=+m[1].slice(4,6)||last(yr,mo); return `${yr}-${p2(mo)}-${p2(dd)}`; } }
  ];
  for (const { re, fn } of patterns) {
    const m = t.match(re);
    if (m) {
      try {
        const iso = fn(m);
        const d   = new Date(iso);
        if (!isNaN(d) && d.getFullYear() >= 2020 && d.getFullYear() <= 2045) return iso;
      } catch {}
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════
// MASTER INDEX
// ═══════════════════════════════════════════════════
const Master = {
  build(rows) {
    S.masterIdx.clear();
    for (const r of rows) {
      const bc  = normBC(r.barcode || '');
      if (!bc || bc.length < 8) continue;
      const g14 = bc.padStart(14, '0');
      const keys = new Set([bc, g14]);
      if (g14.startsWith('0')) keys.add(g14.slice(1));
      if (g14.length > 8)       keys.add(g14.slice(-13));
      keys.add(bc.slice(-8));
      for (const k of keys) if (!S.masterIdx.has(k)) S.masterIdx.set(k, r);
    }
  },

  find(gtin) {
    if (!gtin) return null;
    const cands = [gtin];
    if (gtin.startsWith('0')) cands.push(gtin.slice(1));
    cands.push(gtin.slice(-13), gtin.slice(-8));
    for (const c of cands) {
      const r = S.masterIdx.get(c);
      if (r) return r;
    }
    return null;
  }
};

// ═══════════════════════════════════════════════════
// SCAN FLOW
// ═══════════════════════════════════════════════════
async function handleBarcode(raw) {
  if (!raw || !raw.trim()) return;
  const parsed = GS1.parse(raw.trim());
  if (!parsed.gtin) { toast('Could not read barcode — try manual entry', 'err'); return; }

  const prod   = Master.find(parsed.gtin);
  const hasGS1 = parsed.isGS1 && !!parsed.expiryISO;

  let expiryISO = '', expirySrc = 'manual';
  if (hasGS1) { expiryISO = parsed.expiryISO; expirySrc = 'gs1'; }
  else if (prod?.expiryISO) { expiryISO = prod.expiryISO; expirySrc = 'master'; }

  S.draft = {
    raw,
    gtin:           parsed.gtin,
    name:           prod?.name           || 'Unknown Product',
    rmsId:          prod?.rmsId          || '',
    alshayaCode:    prod?.alshayaCode    || '',
    newAlshayaCode: prod?.newAlshayaCode || '',
    brand:          prod?.brand          || '',
    supplierName:   prod?.supplierName   || '',
    expiryISO,
    expiryDisplay:  expiryISO ? isoDisplay(expiryISO) : '',
    expirySrc,
    batch:          parsed.batch  || prod?.batch  || '',
    serial:         parsed.serial || '',
    netWeight:      parsed.netWeight || '',
    gs1AIs:         GS1.formatAIs(parsed),
    qty:            1,
    ts:             Date.now(),
    matchHow:       prod ? 'MATCHED' : 'NONE'
  };

  showPanel();
}

function showPanel() {
  const d = S.draft;
  const rib = document.getElementById('cpRibbon');
  if (d.expirySrc === 'gs1') {
    rib.textContent = 'GS1 FULL DATA'; rib.className = 'cp-ribbon gs1';
  } else if (d.matchHow === 'MATCHED') {
    rib.textContent = 'MATCHED'; rib.className = 'cp-ribbon';
  } else {
    rib.textContent = 'UNKNOWN — ADD MANUALLY'; rib.className = 'cp-ribbon unknown';
  }

  document.getElementById('cpName').textContent      = d.name;
  document.getElementById('cpRms').textContent       = d.rmsId       ? `RMS: ${d.rmsId}`       : '';
  document.getElementById('cpBrand').textContent     = d.brand       ? d.brand                  : '';
  document.getElementById('cpSupplier').textContent  = d.supplierName ? d.supplierName          : '';
  document.getElementById('cpGtin').textContent      = d.gtin        ? `GTIN: ${d.gtin}`        : '';
  document.getElementById('cpAlshaya').textContent   = d.alshayaCode ? `AC: ${d.alshayaCode}`   : '';
  document.getElementById('cpNewAlshaya').textContent = d.newAlshayaCode ? `NAC: ${d.newAlshayaCode}` : '';

  // Show decoded AI summary if GS1 barcode
  const aiRow = document.getElementById('cpAiRow');
  if (aiRow) {
    aiRow.textContent = d.gs1AIs || '';
    aiRow.classList.toggle('hidden', !d.gs1AIs);
  }

  const src = document.getElementById('expirySrc');
  if (d.expirySrc === 'gs1')     { src.textContent = '✓ Expiry from GS1 barcode';              src.className = 'expiry-src es-gs1'; }
  else if (d.expirySrc === 'master') { src.textContent = '✓ Expiry loaded from master database'; src.className = 'expiry-src es-master'; }
  else                           { src.textContent = '⚠ No expiry — enter or scan label';       src.className = 'expiry-src es-manual'; }

  document.getElementById('cpExpiry').value = d.expiryISO || '';
  document.getElementById('cpBatch').value  = d.batch || '';
  document.getElementById('cpQty').value    = 1;

  const needOCR = !d.expiryISO;
  document.getElementById('ocrSection').classList.toggle('hidden', !needOCR);
  document.getElementById('ocrBox').classList.add('hidden');
  document.getElementById('ocrStatus').textContent = '';
  document.getElementById('ocrFile').value = '';
  document.getElementById('confirmPanel').classList.remove('hidden');
  vibrate('medium');
  setTimeout(() => document.getElementById(d.expiryISO ? 'cpBatch' : 'cpExpiry').focus(), 60);
}

async function saveItem() {
  const d = S.draft; if (!d) return;
  const iso = document.getElementById('cpExpiry').value;
  d.expiryISO     = iso;
  d.expiryDisplay = iso ? isoDisplay(iso) : '';
  d.batch         = document.getElementById('cpBatch').value.trim();
  d.qty           = parseInt(document.getElementById('cpQty').value) || 1;
  await DB.add('history', d);
  dismissPanel();
  await refreshAll();
  toast(`Saved: ${d.name}`, 'ok');
  vibrate('success');
  document.getElementById('barcodeInput').focus();
}

function dismissPanel() {
  document.getElementById('confirmPanel').classList.add('hidden');
  document.getElementById('ocrBox').classList.add('hidden');
  document.getElementById('ocrStatus').textContent = '';
  S.draft = null;
}

// ═══════════════════════════════════════════════════
// OCR
// ═══════════════════════════════════════════════════
async function runOCR(file) {
  const st = document.getElementById('ocrStatus');
  st.textContent = '⏳ Loading OCR…';
  try {
    if (!S.ocrWorker) {
      S.ocrWorker = await Tesseract.createWorker('eng', 1, {
        logger: m => { if (m.status === 'recognizing text') st.textContent = `⏳ ${Math.round(m.progress*100)}%`; }
      });
    }
    st.textContent = '⏳ Reading label…';
    const { data: { text } } = await S.ocrWorker.recognize(file);
    const iso = extractOCRDate(text);
    if (iso) {
      document.getElementById('cpExpiry').value = iso;
      st.textContent = `✅ Found: ${isoDisplay(iso)}`;
      toast('Expiry extracted from label!', 'ok');
    } else {
      st.textContent = '⚠ No date found — enter manually';
      toast('No date found in image', 'warn');
    }
  } catch {
    st.textContent = '❌ OCR error';
    toast('OCR failed', 'err');
  }
}

// ═══════════════════════════════════════════════════
// MASTER UPLOAD  (reuses parseDatabaseString)
// ═══════════════════════════════════════════════════
async function uploadMaster(file, append = false) {
  showLoad('Parsing master file…');
  try {
    const text  = await file.text();
    const delim = text.split('\n')[0].includes('\t') ? '\t' : ',';
    if (!append) await DB.clear('master');
    const items   = parseDatabaseString(text, delim);
    if (!items.length) { toast('No valid rows found', 'err'); hideLoad(); return; }
    const n = await DB.bulkMaster(items);
    await refreshMasterCount();
    toast(`${append ? 'Appended' : 'Loaded'} ${n} products`, 'ok');
  } catch (e) {
    console.error(e);
    toast('Upload failed: ' + e.message, 'err');
  }
  hideLoad();
}

async function resetMaster() {
  if (!confirm('Clear all master data? (Built-in database will re-seed on next launch)')) return;
  await DB.clear('master');
  await DB.del('settings', CFG.SEED_KEY).catch(() => {});
  await refreshMasterCount();
  toast('Master data cleared — restart to re-seed built-in database');
}

function downloadTemplate() {
  dlFile(EMBEDDED_MASTER_DB, 'pharmascan-master-template.tsv', 'text/tab-separated-values');
  toast('Template downloaded (includes embedded database)');
}

/** Export the embedded database string as a raw file for inspection */
function downloadEmbeddedDB() {
  dlFile(EMBEDDED_MASTER_DB, 'pharmascan-embedded-db.tsv', 'text/tab-separated-values');
  toast('Embedded database string exported');
}

// ═══════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════
async function exportCSV(filter = 'all') {
  let hist = await DB.getAll('history');
  if (filter === 'expired') hist = hist.filter(h => ['expired','expiring'].includes(GS1.status(h.expiryISO)));
  if (filter === 'noexp')   hist = hist.filter(h => !h.expiryISO);
  if (!hist.length) { toast('No data to export', 'warn'); return; }

  const SEP = '\t';
  const hdr = ['Scan Barcode','RMS','Alshaya Code / Part Number','Description','Brand','Supplier Name','QTY','Expiry Date','Batch No'];
  const rows = hist.map(h => [
    h.gtin           || '',
    h.rmsId          || '',
    h.newAlshayaCode || h.alshayaCode || '',
    h.name           || '',
    h.brand          || '',
    h.supplierName   || '',
    h.qty            || 1,
    h.expiryDisplay  || '',
    h.batch          || ''
  ]);
  let tsv = hdr.join(SEP) + '\n';
  for (const r of rows) tsv += r.join(SEP) + '\n';
  const tag = filter === 'expired' ? '-expired' : filter === 'noexp' ? '-noexpiry' : '';
  dlFile(tsv, `pharmascan-export${tag}-${fmtDate()}.tsv`, 'text/tab-separated-values');
  toast('Export downloaded', 'ok');
}

async function downloadBackup() {
  const [hist, mstr] = await Promise.all([DB.getAll('history'), DB.getAll('master')]);
  dlFile(
    JSON.stringify({ version: CFG.VER, date: new Date().toISOString(), history: hist, master: mstr }, null, 2),
    `pharmascan-backup-${fmtDate()}.json`, 'application/json'
  );
  toast('Backup downloaded', 'ok');
}

async function restoreBackup(file) {
  showLoad('Restoring…');
  try {
    const bk = JSON.parse(await file.text());
    if (!bk.history && !bk.master) { toast('Invalid backup', 'err'); hideLoad(); return; }
    if (bk.history?.length) { await DB.clear('history'); for (const it of bk.history) { delete it.id; await DB.add('history', it); } }
    if (bk.master?.length)  { await DB.clear('master');  await DB.bulkMaster(bk.master); }
    await refreshAll();
    toast(`Restored ${bk.history?.length || 0} items`, 'ok');
  } catch { toast('Restore failed', 'err'); }
  hideLoad();
}

async function clearHistory() {
  if (!confirm('Delete ALL scanned items?')) return;
  await DB.clear('history');
  await refreshAll();
  toast('History cleared');
}

// ═══════════════════════════════════════════════════
// UI REFRESH
// ═══════════════════════════════════════════════════
async function refreshAll() {
  await Promise.all([refreshStats(), refreshRecent(), refreshHistory(), refreshMasterCount()]);
}

async function refreshStats() {
  const h = await DB.getAll('history');
  let exp = 0, soon = 0, ok = 0;
  for (const i of h) {
    const s = GS1.status(i.expiryISO);
    if (s === 'expired') exp++; else if (s === 'expiring') soon++; else if (s === 'ok') ok++;
  }
  document.getElementById('cnExpired').textContent  = exp;
  document.getElementById('cnExpiring').textContent = soon;
  document.getElementById('cnOk').textContent       = ok;
}

async function refreshRecent() {
  const h = (await DB.getAll('history')).sort((a,b) => b.ts - a.ts).slice(0, 8);
  document.getElementById('recentList').innerHTML = h.length
    ? h.map(i => card(i)).join('')
    : empty('📦', 'No items yet', 'Scan a barcode to start');
}

async function refreshHistory() {
  let h = (await DB.getAll('history')).sort((a,b) => b.ts - a.ts);
  if (S.filter !== 'all') h = h.filter(i => GS1.status(i.expiryISO) === S.filter);
  if (S.search) {
    const q = S.search.toLowerCase();
    h = h.filter(i => [i.name,i.gtin,i.rmsId,i.alshayaCode,i.newAlshayaCode,i.batch,i.brand,i.supplierName]
      .some(v => (v||'').toLowerCase().includes(q)));
  }
  document.getElementById('historyList').innerHTML = h.length
    ? h.map(i => card(i, true)).join('')
    : empty('🔍', 'No items', 'Try a different filter or search');
}

async function refreshMasterCount() {
  const m = await DB.getAll('master');
  document.getElementById('masterCount').textContent = m.length;
  Master.build(m);
}

function card(h, actions = false) {
  const st  = GS1.status(h.expiryISO);
  const lbl = { expired:'EXPIRED', expiring:'EXPIRING SOON', ok: h.expiryDisplay || 'OK', noexp:'NO EXPIRY' }[st];
  return `<div class="item-card s-${st}">
    <div class="ic-r1">
      <span class="ic-name">${esc(h.name)}</span>
      <span class="ic-badge">${lbl}</span>
    </div>
    <div class="ic-grid">
      <div class="ic-f"><span class="ic-fl">SCAN BARCODE</span><span class="ic-fv">${h.gtin||'—'}</span></div>
      <div class="ic-f"><span class="ic-fl">RMS</span><span class="ic-fv">${h.rmsId||'—'}</span></div>
      <div class="ic-f"><span class="ic-fl">ALSHAYA CODE</span><span class="ic-fv">${h.newAlshayaCode||h.alshayaCode||'—'}</span></div>
      <div class="ic-f"><span class="ic-fl">BRAND</span><span class="ic-fv">${h.brand||'—'}</span></div>
      <div class="ic-f"><span class="ic-fl">BATCH NO</span><span class="ic-fv">${h.batch||'—'}</span></div>
      <div class="ic-f"><span class="ic-fl">QTY</span><span class="ic-fv">${h.qty||1}</span></div>
    </div>
    ${actions ? `<div class="ic-acts">
      <button class="ic-btn edit"   onclick="openEdit(${h.id})">✏ Edit</button>
      <button class="ic-btn delete" onclick="delItem(${h.id})">🗑 Delete</button>
    </div>` : ''}
  </div>`;
}

function empty(ico, title, sub) {
  return `<div class="empty-state"><div class="es-ico">${ico}</div><div class="es-ttl">${title}</div><div class="es-sub">${sub}</div></div>`;
}

// ═══════════════════════════════════════════════════
// EDIT / DELETE
// ═══════════════════════════════════════════════════
async function openEdit(id) {
  const h = await DB.get('history', id); if (!h) return;
  document.getElementById('eId').value           = id;
  document.getElementById('eName').value          = h.name || '';
  document.getElementById('eGtin').value          = h.gtin || '';
  document.getElementById('eExpiry').value        = h.expiryISO || '';
  document.getElementById('eBatch').value         = h.batch || '';
  document.getElementById('eQty').value           = h.qty || 1;
  document.getElementById('eRms').value           = h.rmsId || '';
  document.getElementById('eAlshaya').value       = h.alshayaCode || '';
  document.getElementById('eNewAlshaya').value    = h.newAlshayaCode || '';
  document.getElementById('eBrand').value         = h.brand || '';
  document.getElementById('eSupplierEdit').value  = h.supplierName || '';
  document.getElementById('editModal').classList.remove('hidden');
}

async function saveEdit() {
  const id = parseInt(document.getElementById('eId').value);
  const h  = await DB.get('history', id); if (!h) return;
  const iso = document.getElementById('eExpiry').value;
  h.name           = document.getElementById('eName').value.trim();
  h.expiryISO      = iso;
  h.expiryDisplay  = iso ? isoDisplay(iso) : '';
  h.batch          = document.getElementById('eBatch').value.trim();
  h.qty            = parseInt(document.getElementById('eQty').value) || 1;
  h.rmsId          = document.getElementById('eRms').value.trim();
  h.alshayaCode    = document.getElementById('eAlshaya').value.trim();
  h.newAlshayaCode = document.getElementById('eNewAlshaya').value.trim();
  h.brand          = document.getElementById('eBrand').value.trim();
  h.supplierName   = document.getElementById('eSupplierEdit').value.trim();
  await DB.put('history', h);
  closeEditModal();
  await refreshAll();
  toast('Saved', 'ok');
}

function closeEditModal() { document.getElementById('editModal').classList.add('hidden'); }

async function delItem(id) {
  if (!confirm('Delete this item?')) return;
  await DB.del('history', id);
  await refreshAll();
  toast('Deleted');
}

// ═══════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.toggle('active', b.dataset.page === id));
  if (id !== 'pg-scan' && S.camActive) stopCam();
}

// ═══════════════════════════════════════════════════
// CAMERA
// ═══════════════════════════════════════════════════
async function toggleCam() { S.camActive ? stopCam() : startCam(); }
async function startCam() {
  const rdr = document.getElementById('cam-reader');
  rdr.classList.remove('hidden');
  try {
    S.camInst = new Html5Qrcode('cam-reader');
    const cams = await Html5Qrcode.getCameras();
    if (!cams.length) { toast('No camera', 'err'); return; }
    const back = cams.find(c => /(back|rear|environment)/i.test(c.label)) || cams[0];
    await S.camInst.start(back.id,
      { fps:10, qrbox:{ width:250, height:250 }, formatsToSupport:[
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.ITF
      ]},
      async txt => { await stopCam(); document.getElementById('barcodeInput').value = txt; await handleBarcode(txt); },
      () => {}
    );
    S.camActive = true;
    const b = document.getElementById('btnCam');
    b.style.background = 'var(--red)'; b.style.color = '#fff';
  } catch (e) {
    toast('Camera: ' + e.message, 'err');
    document.getElementById('cam-reader').classList.add('hidden');
  }
}
async function stopCam() {
  if (S.camInst) { try { await S.camInst.stop(); S.camInst.clear(); } catch {} S.camInst = null; }
  S.camActive = false;
  document.getElementById('cam-reader').classList.add('hidden');
  const b = document.getElementById('btnCam'); b.style.background = ''; b.style.color = '';
}

// ═══════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════
function p2(n)      { return String(n).padStart(2, '0'); }
function normBC(s)  { return String(s || '').replace(/\D/g, ''); }
function esc(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDate()  { const d = new Date(); return `${d.getFullYear()}${p2(d.getMonth()+1)}${p2(d.getDate())}`; }
function isoDisplay(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return `${p2(d.getDate())}/${p2(d.getMonth()+1)}/${d.getFullYear()}`;
}
function dlFile(c, n, m) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([c], { type: m })),
    download: n
  });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function vibrate(t) {
  if (!navigator.vibrate) return;
  ({ light:[10], medium:[30], success:[30,50,30] })[t] &&
    navigator.vibrate(({ light:[10], medium:[30], success:[30,50,30] })[t]);
}
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(() => el.remove(), 300); }, 2800);
}
function showLoad(m = 'Loading…') {
  document.getElementById('loadingMsg').textContent = m;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}
function hideLoad() { document.getElementById('loadingOverlay').classList.add('hidden'); }

// ═══════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════
function setupEvents() {
  const bi = document.getElementById('barcodeInput');
  bi.addEventListener('keydown', async e => { if (e.key === 'Enter') { e.preventDefault(); await handleBarcode(bi.value); bi.value = ''; } });
  bi.addEventListener('paste', () => setTimeout(async () => { await handleBarcode(bi.value); bi.value = ''; }, 80));

  document.getElementById('btnCam').addEventListener('click', toggleCam);
  document.getElementById('btnSave').addEventListener('click', saveItem);
  document.getElementById('btnSkip').addEventListener('click', dismissPanel);
  document.getElementById('cpDismiss').addEventListener('click', dismissPanel);

  document.getElementById('cpExpiry').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('cpBatch').focus(); } });
  document.getElementById('cpBatch').addEventListener('keydown',  e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btnSave').click(); } });

  document.getElementById('btnOcrToggle').addEventListener('click', () => document.getElementById('ocrBox').classList.toggle('hidden'));
  document.getElementById('ocrFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) runOCR(f); });

  document.querySelectorAll('.bnav-item').forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));
  document.querySelectorAll('.fpill').forEach(p => p.addEventListener('click', () => {
    S.filter = p.dataset.f;
    document.querySelectorAll('.fpill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    refreshHistory();
  }));
  document.getElementById('searchInput').addEventListener('input', e => { S.search = e.target.value; refreshHistory(); });

  document.getElementById('fileMasterReplace').addEventListener('change', e => { if (e.target.files[0]) { uploadMaster(e.target.files[0], false); e.target.value = ''; } });
  document.getElementById('fileMasterAppend').addEventListener('change',  e => { if (e.target.files[0]) { uploadMaster(e.target.files[0], true);  e.target.value = ''; } });
  document.getElementById('fileRestore').addEventListener('change',       e => { if (e.target.files[0]) { restoreBackup(e.target.files[0]);        e.target.value = ''; } });

  document.getElementById('editModal').addEventListener('click', e => { if (e.target.id === 'editModal') closeEditModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { dismissPanel(); closeEditModal(); } });
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
async function init() {
  console.log(`🚀 PharmaScan Pro v${CFG.VER} — Offline GS1 Edition`);
  try {
    await DB.init();
    await seedEmbeddedDatabase();   // ← loads EMBEDDED_MASTER_DB on first run
    await refreshMasterCount();
    await refreshAll();
    setupEvents();
    setTimeout(() => {
      document.getElementById('splash').classList.add('out');
      document.getElementById('app').classList.remove('app-hidden');
      setTimeout(() => document.getElementById('barcodeInput').focus(), 120);
    }, 2500);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  } catch (e) {
    console.error(e);
    document.getElementById('splash').classList.add('out');
    document.getElementById('app').classList.remove('app-hidden');
  }
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
