/* Tiny Tummy — Scan a supplier invoice when the goods arrive.
   Inventory → "Scan supplier invoice" (also on Suppliers · Payables and in
   the Receive-stock window). Take a photo of the paper invoice or pick the
   PDF / image the supplier sent; the text is read in the browser (PDF text
   layer, or OCR with Tesseract for photos and scanned PDFs) and the Post
   invoice form opens already filled: supplier, invoice no., invoice date,
   due date, and one line per item with quantity, unit cost, lot and expiry,
   matched to the item master. The person checks it and posts: goods lines
   go straight into stock as lots (ledger "Received", cost refreshed,
   requisitions closed) and the invoice lands in payables, with the scan
   kept on it. Each correction is remembered per supplier, so the next
   invoice from the same supplier fills better.
   Loaded after js/dash-ui.js. */
(function () {
  'use strict';
  if (typeof store !== 'function' || typeof invoiceDlg !== 'function') return;

  // Libraries load on first use from public CDNs; window.TT_SCAN_LIBS can point them at self-hosted copies.
  var LIBS = Object.assign({
    tess: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
    tessOpts: {}, // e.g. { workerPath, corePath, langPath }
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  }, window.TT_SCAN_LIBS || {});
  var TESS_URL = LIBS.tess, PDF_URL = LIBS.pdf, PDF_WORKER = LIBS.pdfWorker;
  var SCANS_KEY = 'ttops_inv_scans';      // invoice id → {img, text, name, at}
  var ALIAS_KEY = 'ttops_scan_aliases';   // provider|item text → ingredient id

  /* State of the scan being turned into an invoice (null when the form was opened by hand). */
  var SCAN = null;

  /* ── helpers ── */
  function loadScript(src) {
    return new Promise(function (ok, ko) {
      if (document.querySelector('script[src="' + src + '"]')) { ok(); return; }
      var s = document.createElement('script'); s.src = src; s.onload = function () { ok(); };
      s.onerror = function () { ko(new Error('Could not load ' + src + ' — check the internet connection.')); };
      document.head.appendChild(s);
    });
  }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe');
  }
  function words(s) { return norm(s).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 2; }); }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var p = [], i, j;
    for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      var c = [i];
      for (j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      p = c;
    }
    return p[b.length];
  }
  function sing(w) { return w.replace(/(ies)$/, 'y').replace(/(oes|ses|xes)$/, function (m) { return m.slice(0, -2); }).replace(/s$/, ''); }
  function wordHit(w, list) { // typo- and OCR-tolerant word match: plurals, one or two wrong letters (carot = carrots)
    var ws = sing(w);
    for (var i = 0; i < list.length; i++) {
      var x = list[i], xs = sing(x);
      if (x === w || xs === ws) return true;
      var L = Math.min(ws.length, xs.length);
      if (L >= 4 && lev(ws, xs) <= (L >= 8 ? 2 : 1)) return true;
    }
    return false;
  }
  function jget(k, d) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function r2(n) { return Math.round(n * 100) / 100; }
  function r3(n) { return Math.round(n * 1000) / 1000; }

  /* ── numbers & dates as printed on invoices (1,15 · 1.234,50 · 1,234.50 · 12/11/2026 · 12 Nov 2026) ── */
  function parseNum(t) {
    t = String(t).replace(/[^\d.,\-]/g, '');
    if (!/\d/.test(t)) return NaN;
    var lc = t.lastIndexOf(','), ld = t.lastIndexOf('.');
    if (lc >= 0 && ld >= 0) {
      if (lc > ld) t = t.replace(/\./g, '').replace(',', '.'); else t = t.replace(/,/g, '');
    } else if (lc >= 0) {
      t = /^\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
    } else if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
    return parseFloat(t);
  }
  var MONTHS = { jan: 1, janv: 1, feb: 2, fev: 2, fevr: 2, mar: 3, mars: 3, apr: 4, avr: 4, avril: 4, may: 5, mai: 5, jun: 6, juin: 6,
    jul: 7, juil: 7, aug: 8, aou: 8, aout: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
  var DATE_RES = [
    /\b(\d{4})[\-\/.](\d{1,2})[\-\/.](\d{1,2})\b/g,                         // 2026-11-18
    /\b(\d{1,2})[\-\/.](\d{1,2})[\-\/.](\d{2,4})\b/g,                       // 18/11/2026 (day first)
    /\b(\d{1,2})(?:st|nd|rd|th|er)?[\s\-]+([a-z]{3,9})\.?[\s\-,]+(\d{2,4})\b/g, // 18 Nov 2026
    /\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g          // Nov 18, 2026
  ];
  function iso(y, m, d) {
    y = Number(y); m = Number(m); d = Number(d);
    if (y < 100) y += 2000;
    if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100)) return null;
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }
  function findDates(line) { // → [{iso, raw}]
    var s = norm(line), out = [];
    DATE_RES.forEach(function (re, k) {
      re.lastIndex = 0; var m;
      while ((m = re.exec(s))) {
        var v = null;
        if (k === 0) v = iso(m[1], m[2], m[3]);
        else if (k === 1) v = Number(m[2]) > 12 ? iso(m[3], m[1], m[2]) : iso(m[3], m[2], m[1]);
        else if (k === 2) v = MONTHS[m[2].slice(0, 4)] || MONTHS[m[2].slice(0, 3)] ? iso(m[3], MONTHS[m[2].slice(0, 4)] || MONTHS[m[2].slice(0, 3)], m[1]) : null;
        else v = MONTHS[m[1].slice(0, 4)] || MONTHS[m[1].slice(0, 3)] ? iso(m[3], MONTHS[m[1].slice(0, 4)] || MONTHS[m[1].slice(0, 3)], m[2]) : null;
        if (v && !out.some(function (o) { return o.raw === m[0]; })) out.push({ iso: v, raw: m[0], at: m.index });
      }
    });
    return out.sort(function (a, b) { return a.at - b.at; });
  }

  /* ── what the invoice says → matched to the dashboard's own data ── */
  // Common supplier words for items (English / French / Lebanese names), matched on any item whose name holds the key.
  var SYN = {
    carrot: ['carotte', 'jazar'], zucchini: ['courgette', 'kousa', 'koussa', 'squash'], cauliflower: ['chou-fleur', 'choufleur', 'arnabit', 'karnabit'],
    beetroot: ['betterave', 'beet', 'beets', 'shmandar'], mango: ['mangue'], milk: ['lait', 'halib'], walnut: ['noix', 'jawz'],
    cocoa: ['cacao'], carob: ['caroube', 'kharroub'], molasses: ['melasse', 'dibs'], biscuit: ['cookie', 'cookies'],
    flour: ['farine', 'tahin'], egg: ['oeuf', 'oeufs', 'bayd'], millet: ['mil'], quinoa: ['kinoa'], potato: ['pomme de terre', 'batata'],
    apple: ['pomme', 'tefeh'], banana: ['banane', 'mouz'], pear: ['poire'], spinach: ['epinard', 'sabanekh'], lentil: ['lentille', 'adas'],
    rice: ['riz', 'rouz'], oat: ['avoine'], chicken: ['poulet', 'djej'], butter: ['beurre'], yogurt: ['yaourt', 'laban'], pumpkin: ['potiron', 'citrouille'],
    sweet: ['patate douce'], avocado: ['avocat'], broccoli: ['brocoli'], pea: ['petit pois'], jar: ['bocal', 'pot'], lid: ['couvercle']
  };
  var NOISE = ['fresh', 'full', 'fat', 'baby', 'safe', 'cow', 'organic', 'bio', 'the', 'and', 'with', 'of', 'kg', 'pcs'];
  function ingKeys(g) {
    var ws = words(g.name).filter(function (w) { return w.length >= 3 && NOISE.indexOf(w) < 0; });
    var syn = [];
    Object.keys(SYN).forEach(function (k) {
      if (norm(g.name).indexOf(k) >= 0) SYN[k].forEach(function (s) { syn.push(s); });
    });
    return { ws: ws, syn: syn };
  }
  function matchIng(text, ings, provId) {
    var t = norm(text).replace(/\s+/g, ' ').trim();
    var al = jget(ALIAS_KEY, {});
    var key = aliasKey(provId, text);
    if (al[key] && byId(ings, al[key])) return { ing: al[key], how: 'learned' };
    var tw = words(t), best = null;
    ings.forEach(function (g) {
      var k = ingKeys(g), hit = 0, score;
      k.ws.forEach(function (w) { if (wordHit(w, tw)) hit++; });
      score = k.ws.length ? hit / k.ws.length : 0;
      if (!hit) k.syn.forEach(function (s) { if (t.indexOf(norm(s)) >= 0 || (s.indexOf(' ') < 0 && wordHit(norm(s), tw))) score = Math.max(score, 0.75); });
      if (score >= 0.5 && (!best || score > best.score || (score === best.score && k.ws.join('').length > best.len)))
        best = { ing: g.id, score: score, len: k.ws.join('').length };
    });
    return best ? { ing: best.ing, how: 'name' } : null;
  }
  function aliasKey(provId, text) {
    return (provId || '') + '|' + words(text).filter(function (w) { return !/\d/.test(w); }).join(' ');
  }
  function matchProvider(text, provs) {
    var t = norm(text), tw = words(text), digits = text.replace(/\D/g, ''), best = null;
    provs.forEach(function (p) {
      var score = 0;
      var pd = String(p.phone || '').replace(/\D/g, '');
      if (pd.length >= 6 && digits.indexOf(pd.slice(-6)) >= 0) score += 3;
      var pw = words(p.name).filter(function (w) { return w.length >= 3 && ['the', 'sal', 'sarl', 'ltd', 'inc', 'co', 'company', 'and'].indexOf(w) < 0; });
      var hit = pw.filter(function (w) { return wordHit(w, tw); }).length;
      if (pw.length && hit) score += 2 * hit / pw.length + (t.indexOf(norm(p.name)) >= 0 ? 1 : 0);
      if (p.type === 'employee') score -= 0.5;
      if (score >= 1 && (!best || score > best.score)) best = { id: p.id, score: score };
    });
    return best ? best.id : null;
  }

  var SKIP = /\b(sub-?total|sous[\s-]?total|total|t\.?v\.?a|vat|tax|taxe|discount|remise|balance|amount due|montant|net a payer|grand|paid|paye|iban|swift|bank|tel|phone|fax|email|www|page|signature|thank|merci|terms|conditions)\b/;
  var UNIT_RE = /(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilo|kilos|g|gr|grs|gram|grams|l|lt|ltr|litre|liter|litres|liters|ml|cl|pcs|pc|pce|pces|piece|pieces|units?|u|dz|dozen|douzaine|box|boxes|carton|ctn|tray|trays|plateau)\b/i;

  function unitFactor(u, gUnit) { // printed unit → the item's stocked unit
    u = norm(u); gUnit = norm(gUnit);
    if (gUnit === 'kg') { if (/^(g|gr|grs|gram|grams)$/.test(u)) return 0.001; return 1; }
    if (gUnit === 'l') { if (u === 'ml') return 0.001; if (u === 'cl') return 0.01; return 1; }
    if (gUnit === 'pc') { if (/^(dz|dozen|douzaine)$/.test(u)) return 12; if (/^(tray|trays|plateau)$/.test(u)) return 30; return 1; }
    return 1;
  }

  function parseLine(raw, ings, provId) {
    var s = raw.replace(/\s+/g, ' ').trim();
    if (s.length < 3) return null;
    var n = norm(s);
    var lot = null, expiry = null, m;
    m = s.match(/\b(?:lot|batch|lote|lotto|n°\s*lot)\s*(?:no\.?|n°|#)?\s*[:#.]?\s*([A-Z0-9][A-Z0-9\-\/]{2,})/i);
    if (m && /\d/.test(m[1])) { lot = m[1].toUpperCase(); s = s.replace(m[0], ' '); }
    var ds = findDates(s);
    var em = norm(s).match(/(exp(?:iry|\.|ires)?|best before|bb|use by|dlc|ddm|peremption|a consommer)/);
    if (ds.length) {
      if (em) { var after = ds.filter(function (d) { return d.at > norm(s).indexOf(em[0]); })[0] || ds[ds.length - 1]; expiry = after.iso; }
      else expiry = ds[ds.length - 1].iso; // a date on an item line is its expiry
      ds.forEach(function (d) { s = norm(s) === s ? s.replace(d.raw, ' ') : s.replace(new RegExp(d.raw.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'i'), ' '); });
    }
    if (em) s = s.replace(new RegExp(em[0].replace(/\./g, '\\.'), 'i'), ' ');
    var text = s.replace(/[\d.,]+\s*%/g, ' ');
    var qtyU = null, um = text.match(UNIT_RE);
    if (um) { qtyU = { v: parseNum(um[1]), u: um[2] }; text = text.replace(um[0], ' '); }
    var nums = (text.match(/-?\d[\d.,]*/g) || []).map(parseNum).filter(function (x) { return !isNaN(x) && x > 0; });
    var label = text.replace(/[$€£]|usd|lbp|l\.l\.?|\b[xX×]\b|-?\d[\d.,]*/gi, ' ').replace(/[|:;*_=]+/g, ' ').replace(/\s+/g, ' ').trim();
    var skip = SKIP.test(n);
    var hit = (!skip && label.length >= 3) ? matchIng(label, ings, provId) : null;
    return { raw: raw.trim(), label: label, lot: lot, expiry: expiry, qtyU: qtyU, nums: nums, ing: hit ? hit.ing : null, how: hit ? hit.how : null, skip: skip };
  }

  function solveQtyCost(p, g) { // → {qty, cost, total, note}
    var ref = g ? Number(g.cost) || 0 : 0;
    function closer(a, b) { if (!ref) return a; return Math.abs(Math.log(a / ref)) <= Math.abs(Math.log(b / ref)) ? a : b; }
    var nums = p.nums.slice(), qty = null, cost = null, i, j, k;
    var f = p.qtyU && g ? unitFactor(p.qtyU.u, g.unit) : 1;
    if (p.qtyU) {
      qty = p.qtyU.v;
      var refU = ref * f; // the item's cost per printed unit (per dozen, per gram…)
      closer = function (a, b) { if (!refU) return a; return Math.abs(Math.log(a / refU)) <= Math.abs(Math.log(b / refU)) ? a : b; };
      // unit price × qty = line total, the total printed after the price
      for (i = 0; i < nums.length && cost == null; i++) for (j = i + 1; j < nums.length; j++) {
        if (Math.abs(qty * nums[i] - nums[j]) <= Math.max(0.02, nums[j] * 0.015)) { cost = nums[i]; break; }
      }
      if (cost == null && nums.length) { // only a total, or a price whose decimal point was lost: the line total decides
        var last = nums[nums.length - 1];
        cost = nums.length === 1 ? closer(last, last / qty) : last / qty;
      }
      return { qty: r3(qty * f), cost: cost != null ? r2(cost / f) : (ref || 0), total: null, note: cost == null ? 'price not read — item cost used' : '' };
    }
    // no unit printed: find quantity × price = line total among the numbers, the last such triple wins
    var best = null;
    for (k = nums.length - 1; k >= 0 && !best; k--) for (i = 0; i < k && !best; i++) for (j = 0; j < k; j++) {
      if (i === j) continue;
      if (Math.abs(nums[i] * nums[j] - nums[k]) <= Math.max(0.02, nums[k] * 0.015)) {
        var a = nums[i], b = nums[j];
        var c1 = closer(b, a); // the price is the one nearest the item's last cost
        best = { qty: c1 === b ? a : b, cost: c1, total: nums[k] };
        break;
      }
    }
    if (best) return { qty: r3(best.qty), cost: r2(best.cost), total: best.total, note: '' };
    if (nums.length >= 2) {
      var q = nums[nums.length - 2], v = nums[nums.length - 1];
      var c = closer(v, v / q);
      return { qty: r3(q), cost: r2(c), total: null, note: 'check quantity and price' };
    }
    if (nums.length === 1) return { qty: r3(nums[0]), cost: ref, total: null, note: 'price not read — item cost used' };
    return { qty: null, cost: ref, total: null, note: 'quantity not read' };
  }

  function parseInvoice(text) {
    var provs = store('providers').all(), ings = store('ingredients').all();
    var lines = text.split(/\r?\n/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    var res = { provider: matchProvider(text, provs), code: '', date: '', due: '', kind: 'goods', lines: [], total: null, warn: [] };

    // invoice number
    for (var i = 0; i < lines.length && !res.code; i++) {
      var m = lines[i].match(/(?:invoice|facture|inv|bill|receipt|recu|reçu|fact)\.?\s*(?:no\.?|nº|n°|n\.|num(?:ber|ero|éro)?|#)?\s*[:#.]?\s*([A-Z0-9][A-Z0-9\-\/_.]{2,})/i)
        || (/(?:^|\s)(?:no|n°|nº|#)\s*[:.]?\s*([A-Z]{0,5}[\-\/]?\d[A-Z0-9\-\/]{2,})/i.test(lines[i]) && lines[i].match(/(?:^|\s)(?:no|n°|nº|#)\s*[:.]?\s*([A-Z]{0,5}[\-\/]?\d[A-Z0-9\-\/]{2,})/i));
      if (m && /\d/.test(m[1]) && !findDates(m[1]).length) res.code = m[1].replace(/[.,]$/, '').toUpperCase();
    }
    // dates
    lines.forEach(function (l) {
      var n = norm(l), ds = findDates(l);
      if (!ds.length) return;
      if (/(due|echeance|payable|pay by|payment date|date limite|to be paid)/.test(n)) { if (!res.due) res.due = ds[ds.length - 1].iso; }
      else if (/(date|dated|du |le )/.test(n) && !/(exp|best before|dlc|ddm|use by|deliver|livraison)/.test(n)) { if (!res.date) res.date = ds[0].iso; }
    });
    if (!res.date) { // first date in the header (before any item line)
      for (i = 0; i < Math.min(lines.length, 12) && !res.date; i++) { var d0 = findDates(lines[i]); if (d0.length && !/(exp|due|echeance)/.test(norm(lines[i]))) res.date = d0[0].iso; }
    }
    // total
    lines.forEach(function (l) {
      var n = norm(l);
      if (/\btotal\b/.test(n) && !/(sub-?total|sous[\s-]?total|total qty|total quantity|items)/.test(n)) {
        var nm = (l.match(/\d[\d.,]*/g) || []).map(parseNum).filter(function (x) { return !isNaN(x); });
        if (nm.length) res.total = nm[nm.length - 1];
      }
    });
    if (/\b(lbp|l\.l\.?)\b|ل\.ل/i.test(text)) res.warn.push('The invoice mentions LBP — enter the amounts in dollars.');

    // item lines; a lot / expiry printed on the next line belongs to the item above
    var parsed = lines.map(function (l) { return parseLine(l, ings, res.provider); });
    var goods = [];
    parsed.forEach(function (p) {
      if (!p) return;
      var prev = goods[goods.length - 1];
      if (!p.ing && !p.nums.length && !p.qtyU && prev && (p.lot || p.expiry)) {
        if (p.lot && !prev.lot) prev.lot = p.lot;
        if (p.expiry && !prev.expiry) prev.expiry = p.expiry;
        return;
      }
      if (p.ing && (p.nums.length || p.qtyU)) {
        var g = byId(ings, p.ing), q = solveQtyCost(p, g);
        goods.push({ ing: p.ing, qty: q.qty, cost: q.cost, lot: p.lot, expiry: p.expiry, raw: p.raw, label: p.label, how: p.how, note: q.note });
      } else if (!p.skip && !p.ing && p.label.length >= 3 && (p.qtyU || p.nums.length >= 2) && /[a-z]{3}/i.test(p.label) && !/(date|invoice|facture|client|customer|address|adresse|qty|quantity|price|prix|description|designation|article)/i.test(p.label)) {
        var q2 = solveQtyCost(p, null);
        if (q2.qty && q2.cost) goods.push({ ing: '', qty: q2.qty, cost: q2.cost, lot: p.lot, expiry: p.expiry, raw: p.raw, label: p.label, note: 'item not recognised — choose it' });
      }
    });

    if (goods.some(function (x) { return x.ing; })) {
      res.lines = goods.map(function (x) {
        var g = byId(ings, x.ing);
        return { ing: x.ing, qty: x.qty != null ? String(x.qty) : '', cost: x.cost ? String(x.cost) : '', lot: x.lot || '', expiry: x.expiry || defaultExpiry(g),
          _raw: x.raw, _label: x.label, _how: x.how, _note: x.note, _scan: 1 };
      });
    } else {
      // nothing from the item master: a service / expense invoice
      res.kind = 'service';
      parsed.forEach(function (p) {
        if (!p || p.skip || p.label.length < 3 || !p.nums.length || /(date|invoice|facture|client|customer|qty|price|description)/i.test(p.label)) return;
        res.lines.push({ desc: p.label, amount: String(p.nums[p.nums.length - 1]), _raw: p.raw, _scan: 1 });
      });
      if (!res.lines.length && res.total) res.lines.push({ desc: 'Invoice ' + (res.code || ''), amount: String(res.total), _scan: 1 });
    }
    if (!res.lines.length) res.lines = [{}];
    return res;
  }
  function defaultExpiry(g) {
    var days = g && /veg|fruit|dairy/i.test(g.cat || '') ? 7 : g && /dry|bakery/i.test(g.cat || '') ? 90 : 7;
    return today(days);
  }

  /* ── reading the file: PDF text layer first, OCR for photos and scanned PDFs ── */
  function imgFromFile(file) {
    return new Promise(function (ok, ko) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { ok(im); }; im.onerror = function () { ko(new Error('This image could not be opened.')); };
      im.src = url;
    });
  }
  function toCanvas(src, maxSide, gray) {
    var w = src.naturalWidth || src.width, h = src.naturalHeight || src.height, k = Math.min(1, maxSide / Math.max(w, h));
    var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0, c.width, c.height);
    if (gray) {
      var d = x.getImageData(0, 0, c.width, c.height), p = d.data;
      for (var i = 0; i < p.length; i += 4) { var v = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; v = v > 200 ? 255 : v < 60 ? 0 : (v - 60) * 255 / 140; p[i] = p[i + 1] = p[i + 2] = v; }
      x.putImageData(d, 0, 0);
    }
    return c;
  }
  var worker = null;
  function ocr(canvas, progress) {
    var fail;
    var failed = new Promise(function (ok, ko) { fail = ko; });
    var job = loadScript(TESS_URL).then(function () {
      if (!worker) {
        worker = window.Tesseract.createWorker(['eng', 'fra'], 1, Object.assign({ logger: function (m) {
          if (m.status === 'recognizing text') progress('Reading the text… ' + Math.round(m.progress * 100) + ' %');
          else if (/load|initializ/.test(m.status)) progress('Preparing the reader (first time only)…');
        }, errorHandler: function (e) { worker = null; fail(new Error('The text reader could not start (' + (e && e.message || e) + '). Check the internet connection, or type the invoice in by hand.')); } }, LIBS.tessOpts))
          .then(function (w) { return w.setParameters({ tessedit_pageseg_mode: '3', preserve_interword_spaces: '1' }).then(function () { return w; }); });
        worker.catch(function () { worker = null; });
      }
      return worker;
    }).then(function (w) { return w.recognize(canvas); }).then(function (r) { return r.data.text || ''; });
    var slow = new Promise(function (ok, ko) { setTimeout(function () { ko(new Error('Reading took too long — try a sharper photo, or type the invoice in by hand.')); }, 180000); });
    return Promise.race([job, failed, slow]);
  }
  function pdfText(page) {
    return page.getTextContent().then(function (tc) {
      var rows = [];
      tc.items.forEach(function (it) {
        if (!it.str || !it.str.trim()) return;
        var y = it.transform[5], x = it.transform[4];
        var row = rows.filter(function (r) { return Math.abs(r.y - y) < 3; })[0];
        if (!row) { row = { y: y, items: [] }; rows.push(row); }
        row.items.push({ x: x, s: it.str, w: it.width || 0 });
      });
      return rows.sort(function (a, b) { return b.y - a.y; }).map(function (r) {
        return r.items.sort(function (a, b) { return a.x - b.x; }).map(function (i) { return i.s; }).join('  ');
      }).join('\n');
    });
  }
  function readFile(file, progress) { // → {text, img (data URL thumbnail)}
    var isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      return imgFromFile(file).then(function (im) {
        var thumb = toCanvas(im, 1200, false).toDataURL('image/jpeg', 0.62);
        progress('Reading the text…');
        return ocr(toCanvas(im, 2400, false), progress).then(function (t) { return { text: t, img: thumb }; });
      });
    }
    progress('Opening the PDF…');
    return loadScript(PDF_URL).then(function () {
      var lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      lib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
      return file.arrayBuffer().then(function (buf) { return lib.getDocument({ data: buf }).promise; });
    }).then(function (pdf) {
      var n = Math.min(pdf.numPages, 4), texts = [], thumb = '', firstCanvas = null;
      var chain = Promise.resolve();
      for (var i = 1; i <= n; i++) (function (i) {
        chain = chain.then(function () { return pdf.getPage(i); }).then(function (page) {
          return pdfText(page).then(function (t) {
            texts.push(t);
            if (i > 1 && t.trim().length > 40) return;
            var vp = page.getViewport({ scale: 2 }), c = document.createElement('canvas');
            c.width = vp.width; c.height = vp.height;
            return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () {
              if (i === 1) { firstCanvas = c; thumb = toCanvas(c, 1200, false).toDataURL('image/jpeg', 0.62); }
              if (t.trim().length < 40) { progress('Scanned PDF — reading page ' + i + '…'); return ocr(toCanvas(c, 2400, false), progress).then(function (o) { texts[texts.length - 1] = o; }); }
            });
          });
        });
      })(i);
      return chain.then(function () { return { text: texts.join('\n'), img: thumb }; });
    });
  }

  /* ── the scan window ── */
  window.invScan = function (from) {
    if (!(can('inventory_manage') || can('suppliers_manage'))) { alert('Your role cannot receive stock or post invoices.'); return; }
    SCAN = { from: from || 'inventory' };
    showDlg('<h3>' + ic('camera') + ' Scan supplier invoice</h3>' +
      '<p class="muted" style="margin:6px 0 12px">The goods have arrived? Take a photo of the supplier\'s invoice (or pick the PDF they sent). The invoice form opens filled in — check it, then post: the items go straight into stock and the invoice into payables.</p>' +
      '<div id="isc-drop" style="border:2px dashed var(--line,#e7e1d2);border-radius:14px;padding:22px;text-align:center">' +
      '<div class="pill-row" style="justify-content:center;flex-wrap:wrap;gap:8px">' +
      '<label class="btn p" style="cursor:pointer">' + ic('camera') + ' Take a photo<input type="file" accept="image/*" capture="environment" hidden onchange="invScanFile(this.files[0])"></label>' +
      '<label class="btn o" style="cursor:pointer">' + ic('inbox') + ' Choose a file (photo or PDF)<input type="file" accept="image/*,application/pdf,.pdf" hidden onchange="invScanFile(this.files[0])"></label></div>' +
      '<p class="muted" style="margin:10px 0 0;font-size:.82rem">or drop the file here · flat, well lit, the whole page in the picture</p></div>' +
      '<div id="isc-msg" style="margin-top:12px"></div>' +
      '<p style="margin-top:12px"><a href="#" onclick="invScanManual();return false">Type the invoice in by hand instead</a></p>');
    var dz = document.getElementById('isc-drop');
    dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.style.background = '#f6f1e6'; });
    dz.addEventListener('dragleave', function () { dz.style.background = ''; });
    dz.addEventListener('drop', function (e) { e.preventDefault(); dz.style.background = ''; if (e.dataTransfer.files[0]) window.invScanFile(e.dataTransfer.files[0]); });
    logAct('Inventory', 'scan invoice opened', SCAN.from, 'click');
  };
  window.invScanManual = function () { SCAN = null; newInvoice(); };
  window.invScanFile = function (file) {
    if (!file) return;
    var msg = document.getElementById('isc-msg');
    function progress(t) { if (msg) msg.innerHTML = '<div class="panel" style="padding:10px 12px;margin:0">' + ic('hourglass') + ' ' + esc(t) + '</div>'; }
    progress('Reading ' + file.name + '…');
    readFile(file, progress).then(function (r) {
      var res = parseInvoice(r.text);
      SCAN = { from: SCAN ? SCAN.from : 'inventory', name: file.name, img: r.img, text: r.text, res: res };
      logAct('Inventory', 'invoice scanned', file.name + ' · ' + res.lines.filter(function (l) { return l.ing || l.amount; }).length + ' line(s) read');
      openFilled();
    }).catch(function (e) {
      if (msg) msg.innerHTML = '<div class="panel" style="padding:10px 12px;margin:0;border-color:#b23a48">' + ic('alert') + ' ' + esc(e.message || String(e)) +
        ' <a href="#" onclick="invScanManual();return false">Type it in by hand</a></div>';
    });
  };

  function openFilled() {
    var res = SCAN.res, provs = store('providers').all();
    var ings = store('ingredients').all();
    invDraftLines = res.lines.map(function (l) {
      var c = Object.assign({}, l);
      if (res.kind === 'goods') { c.unit = ''; c.loc = ''; if (!l.ing) { c.ing = '__new'; c.name = l._label || ''; } }
      return c;
    });
    var d = document.getElementById('dlg'); d.innerHTML = ''; // the form reads the kind from its own select
    invoiceDlg();
    if (res.kind === 'service') { document.getElementById('iv-kind').value = 'service'; invoiceDlg(); }
    var p = byId(provs, res.provider);
    if (p) document.getElementById('iv-prov').value = p.id;
    if (res.code) document.getElementById('iv-code').value = res.code;
    var due = res.due || (res.date && p ? addDays(res.date, p.terms || 0) : '') || (p ? today(p.terms || 0) : '');
    if (due) document.getElementById('iv-due').value = due;
  }
  function addDays(isoDate, n) { var d = new Date(isoDate + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

  /* The form itself: banner with the scan + per-line hints, without changing how it posts. */
  var baseDlg = invoiceDlg;
  window.invoiceDlg = invoiceDlg = function () {
    baseDlg();
    var dlg = document.getElementById('dlg');
    var frm = dlg.querySelector('.frm');
    if (!SCAN || !SCAN.res) {
      if (frm && (can('inventory_manage') || can('suppliers_manage'))) frm.insertAdjacentHTML('afterbegin', '<div class="pill-row" style="margin-bottom:4px"><button class="btn o s" onclick="invScan(\'form\')">' + ic('camera') + ' Fill from a scan</button></div>');
      return;
    }
    var res = SCAN.res, invs = store('sup_invoices').all();
    var h3 = dlg.querySelector('h3'); if (h3) h3.innerHTML = ic('camera') + ' Check the scanned invoice, then post';
    var notes = [];
    if (!res.provider) notes.push('Supplier not recognised — choose it (or add it in Suppliers first).');
    if (!res.code) notes.push('Invoice number not read — type it.');
    var dup = invs.filter(function (v) { return res.code && v.code === res.code && v.provider === res.provider; })[0];
    if (dup) notes.push('<b>Invoice ' + esc(res.code) + ' is already posted</b> (' + esc(dup.date) + ') — posting again would receive the goods twice.');
    var miss = invDraftLines.filter(function (l) { return l._scan && res.kind === 'goods' && l.ing === '__new'; }).length;
    if (miss) notes.push(miss + ' line(s) not found in the inventory — pick the item in the list, or keep “New item” and it is created when you post.');
    var sum = 0; invDraftLines.forEach(function (l) { sum += res.kind === 'goods' ? (Number(l.qty) || 0) * (Number(l.cost) || 0) : Number(l.amount) || 0; });
    var totalTxt = res.total != null ? (Math.abs(sum - res.total) <= Math.max(0.05, res.total * 0.01)
      ? ' · lines add up to the invoice total ' + money(res.total) + ' ✓'
      : ' · lines add up to ' + money(sum) + ', invoice total reads ' + money(res.total) + ' — check (tax or a missed line?)') : ' · lines add up to ' + money(sum);
    res.warn.forEach(function (w) { notes.push(esc(w)); });
    var banner = '<div class="panel" style="display:flex;gap:12px;align-items:flex-start;padding:10px;margin:0 0 6px">' +
      (SCAN.img ? '<a href="#" onclick="invScanZoom();return false" title="Open the scan"><img src="' + SCAN.img + '" alt="Scanned invoice" style="width:84px;max-height:120px;object-fit:cover;object-position:top;border-radius:8px;border:1px solid var(--line,#e7e1d2)"></a>' : '') +
      '<div style="flex:1;min-width:0"><b>Read from ' + esc(SCAN.name || 'the scan') + '</b><span class="muted">' + (res.date ? ' · dated ' + esc(res.date) : '') + totalTxt + '</span>' +
      (notes.length ? '<ul style="margin:6px 0 0 16px;padding:0;color:#a3720d">' + notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>' : '<div class="muted" style="margin-top:4px">Everything was read — check the lines and post.</div>') +
      '<details style="margin-top:6px"><summary class="muted" style="cursor:pointer">Text read from the invoice</summary><pre style="white-space:pre-wrap;font-size:.75rem;max-height:180px;overflow:auto;margin:6px 0 0">' + esc(SCAN.text || '') + '</pre></details>' +
      '<div class="pill-row" style="margin-top:6px"><button class="btn o s" onclick="invScan(SCAN_FROM())">' + ic('refresh') + ' Scan again</button></div></div></div>';
    if (frm) frm.insertAdjacentHTML('afterbegin', banner);
    invDraftLines.forEach(function (l, i) { // what was read, under each line
      var h = document.getElementById('iv-h' + i), row = dlg.querySelector('[data-row="' + i + '"]');
      var txt = l._raw ? '<div class="muted" style="font-size:.74rem">' + ic('receipt') + ' read: “' + esc(l._raw) + '”' + (l._how === 'learned' ? ' · matched as last time' : '') +
        (l._note ? ' · <b style="color:#a3720d">' + esc(l._note) + '</b>' : '') + '</div>' : '';
      if (!txt) return;
      if (h) h.insertAdjacentHTML('afterend', txt); else if (row) row.insertAdjacentHTML('beforebegin', txt);
    });
  };
  window.SCAN_FROM = function () { return SCAN ? SCAN.from : 'inventory'; };
  window.invScanZoom = function () {
    if (!SCAN || !SCAN.img) return;
    var w = window.open(); if (w) w.document.write('<title>Scanned invoice</title><img src="' + SCAN.img + '" style="max-width:100%">');
  };

  // a fresh form opened by hand is not a scan
  var baseNew = newInvoice;
  window.newInvoice = newInvoice = function () { SCAN = null; baseNew(); };

  /* Posting: same as before (stock, ledger, requisitions, payables) + the scan kept on the invoice and the matches learned. */
  var baseSave = saveInvoice;
  window.saveInvoice = saveInvoice = function () {
    var scan = SCAN && SCAN.res ? SCAN : null;
    var provId = document.getElementById('iv-prov').value;
    var before = (store('sup_invoices').all()[0] || {}).id;
    baseSave();
    var draft = invDraftLines; // the form wrote the resolved item ids back
    var invs = store('sup_invoices').all(), inv = invs[0];
    if (!inv || inv.id === before) return; // not posted (validation message shown)
    if (scan) {
      inv.source = 'scan';
      if (scan.res.date && scan.res.date <= today(0) && scan.res.date >= today(-120)) inv.date = scan.res.date;
      inv.scanned_by = currentUser().name;
      store('sup_invoices').save(invs);
      keepScan(inv.id, { img: scan.img, text: scan.text, name: scan.name, at: nowTs(), by: currentUser().name });
      var al = jget(ALIAS_KEY, {});
      draft.forEach(function (l) { if (l._label && l.ing && l.ing !== '__new' && words(l._label).length) al[aliasKey(provId, l._label)] = l.ing; });
      jset(ALIAS_KEY, al);
      logAct('Inventory', 'scanned invoice posted', inv.code + ' · ' + money(invTotal(inv)) + (inv.kind === 'goods' ? ' · stock updated' : ''));
      uToast(inv.kind === 'goods' ? 'Stock updated from invoice ' + inv.code : 'Invoice ' + inv.code + ' posted');
      SCAN = null;
      render();
    }
  };
  function keepScan(id, doc) {
    var all = jget(SCANS_KEY, {});
    all[id] = doc;
    while (!jset(SCANS_KEY, all)) { // browser storage full: drop the oldest scans, keep the invoice
      var ks = Object.keys(all); if (ks.length <= 1) { delete all[id].img; jset(SCANS_KEY, all); break; }
      delete all[ks[0]];
    }
  }
  window.invScanView = function (id) {
    var inv = byId(store('sup_invoices').all(), id), doc = jget(SCANS_KEY, {})[id];
    if (!inv || !doc) { alert('No scan kept for this invoice.'); return; }
    showDlg('<h3>' + ic('camera') + ' Scanned invoice — ' + esc(inv.code) + '</h3><p class="muted">' + esc(doc.name || '') + ' · scanned ' + esc(doc.at || '') + ' by ' + esc(doc.by || '') + '</p>' +
      (doc.img ? '<img src="' + doc.img + '" alt="Scanned invoice" style="max-width:100%;border:1px solid var(--line,#e7e1d2);border-radius:10px">' : '<p class="muted">The picture was not kept (browser storage full).</p>') +
      '<details style="margin-top:8px"><summary class="muted" style="cursor:pointer">Text read</summary><pre style="white-space:pre-wrap;font-size:.75rem">' + esc(doc.text || '') + '</pre></details>');
    logAct('Payables', 'scan viewed', inv.code, 'click');
  };
  window.invHasScan = function (id) { return !!jget(SCANS_KEY, {})[id]; };

  /* ── buttons where the goods arrive ── */
  var scanBtn = function (from, cls) { return '<button class="btn ' + cls + '" onclick="invScan(\'' + from + '\')">' + ic('camera') + ' Scan supplier invoice</button>'; };
  var baseInv = RENDER.inventory;
  RENDER.inventory = function () {
    var h = baseInv.apply(this, arguments);
    if (!can('inventory_manage') && !can('suppliers_manage')) return h;
    return h.replace('<button class="btn p" onclick="receivePick()">', scanBtn('inventory', 'p') + '<button class="btn o" onclick="receivePick()">');
  };
  var baseSup = RENDER.suppliers;
  RENDER.suppliers = function () {
    return baseSup.apply(this, arguments).replace('<button class="btn p" onclick="newInvoice()">', scanBtn('suppliers', 'p') + '<button class="btn o" onclick="newInvoice()">');
  };
  var baseRecv = receivePick;
  window.receivePick = receivePick = function () {
    baseRecv();
    var frm = document.querySelector('#dlg .frm');
    if (frm) frm.insertAdjacentHTML('afterbegin', '<div class="panel" style="padding:10px 12px;margin:0 0 8px">Came with an invoice? ' +
      '<button class="btn p s" onclick="invScan(\'receive\')">' + ic('camera') + ' Scan it</button> — every line is received at once.</div>');
  };

  window.ttInvScanParse = parseInvoice; // for checks from the console
  window.ttMatchIng = matchIng;          // the invoice form resolves typed names with it (no Carot next to Carrots)

  /* Paste many lines: Excel / Sheets columns (item, qty, unit, unit cost, lot, expiry, location) or free text, one item per line. */
  window.ttInvPasteRows = function (txt, provId) {
    var ings = store('ingredients').all();
    return String(txt || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (line) {
      if (line.indexOf('\t') >= 0 || /;/.test(line) && line.split(';').length >= 3) {
        var c = line.split(line.indexOf('\t') >= 0 ? '\t' : ';').map(function (x) { return x.trim(); });
        if (!/\d/.test(c[1] || '') && !/\d/.test(c[3] || '')) return null; // header row
        var ex = c[5] ? findDates(c[5]) : [];
        return { name: c[0], qty: c[1] ? String(parseNum(c[1])) : '', unit: (c[2] || '').toLowerCase(), cost: c[3] ? String(parseNum(c[3])) : '', lot: c[4] || '', expiry: ex.length ? ex[0].iso : '', loc: c[6] || '' };
      }
      var p = parseLine(line, ings, provId);
      if (!p || p.skip || !p.label) return null;
      var row = { name: p.label, lot: p.lot || '', expiry: p.expiry || '', _label: p.label };
      var g = p.ing ? byId(ings, p.ing) : null, q = solveQtyCost(p, g);
      row.qty = q.qty != null ? String(q.qty) : ''; row.cost = q.cost ? String(q.cost) : '';
      if (g) { row.ing = g.id; row.name = g.name; } // already converted to the item's own unit
      else if (p.qtyU) row.unit = norm(p.qtyU.u).replace(/^(kgs|kilos?)$/, 'kg').replace(/^(gr|grs|grams?)$/, 'g').replace(/^(l|lt|ltr|litres?|liters?)$/, 'L')
        .replace(/^(pcs|pce|pces|pieces?|units?|u)$/, 'pc').replace(/^(dz|douzaine)$/, 'dozen');
      return row;
    }).filter(Boolean);
  };
})();
