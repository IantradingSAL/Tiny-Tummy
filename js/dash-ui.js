/* Tiny Tummy — dashboard UI layer (loaded after the dashboard script)
   1. Every click, field change and page opening is written to the Activity Log.
   2. ttList(): the shared list engine — search, filters, sortable columns,
      row count, CSV export and saved views — used by every list page.
   3. Saved views: name the filters of any page, re-apply them in one click,
      mark one as the page's default (applied when the page opens).
   4. Start page: each person chooses the page the dashboard opens on.
   5. Menu: grouped, foldable, favourites per person, Find a page (Ctrl K),
      only the pages the person may open.
   6. List views for Age Programs, Recipes, Requisitions, Suppliers,
      ISO 22000, Notifications, Activity Log and Team. */
(function () {
  'use strict';
  if (typeof RENDER === 'undefined' || typeof store !== 'function') return;

  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function me() { return localStorage.getItem('ttops_whoami') || 'u1'; }
  function clone(o) { return JSON.parse(JSON.stringify(o == null ? null : o)); }
  function csvCell(c) { c = String(c == null ? '' : c); return /[",;\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }
  function download(name, lines) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + lines.map(function (r) { return r.map(csvCell).join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = name; a.click();
  }
  function textOf(html) { var d = document.createElement('div'); d.innerHTML = html == null ? '' : String(html); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }

  ICONS.camera = '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>';
  ICONS.star = '<path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95z"/>';
  function star(on) { return '<span class="tt-star' + (on ? ' on' : '') + '">' + ic('star') + '</span>'; }
  var PAGE_LABEL = {};
  document.querySelectorAll('#sidenav a[data-m]').forEach(function (a) {
    PAGE_LABEL[a.dataset.m] = { e: (a.querySelector('span') || {}).innerHTML || '', l: (a.querySelector('em') || {}).textContent || a.dataset.m };
  });
  function pageName(m) { return (PAGE_LABEL[m] || {}).l || m; }

  /* ── 1. Activity log: actions, clicks, field changes, page openings ── */
  var AUDIT_MAX = 5000;
  window.logAct = logAct = function (module, action, detail, kind) {
    try {
      var rows = store('audit').all(), u = currentUser();
      rows.unshift({ id: uid(), ts: Date.now(), at: nowTs(), user: u.name, role: u.role, module: module, action: action, detail: detail || '', kind: kind || 'action' });
      if (rows.length > AUDIT_MAX) rows.length = AUDIT_MAX;
      store('audit').save(rows);
    } catch (e) {}
  };
  function describe(el) {
    var t = el.getAttribute('aria-label') || el.getAttribute('title') || '';
    var txt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
      var lab = el.closest('label'); txt = (lab && lab.getAttribute('title')) || (lab && lab.textContent.trim()) || el.name || 'switch';
      txt += el.checked ? ' → on' : ' → off';
    }
    var s = (txt && txt.length <= 60 ? txt : '') || t || txt.slice(0, 60) || el.tagName.toLowerCase();
    if (t && txt && t !== txt && txt.length <= 40) s = txt + ' (' + t + ')';
    var row = el.closest('tr'), ctx = '';
    if (row && row !== el) { var c = row.querySelector('td'); if (c) ctx = (c.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40); }
    var card = !ctx && el.closest('.ocard,.dcard,.icard,.u-card,.cah-card,.panel');
    if (card && !ctx) { var b = card.querySelector('b,h3'); if (b && b !== el) ctx = (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40); }
    return s + (ctx && s.indexOf(ctx) < 0 ? ' · ' + ctx : '');
  }
  function where(el) {
    if (el.closest('#sidenav')) return 'Menu';
    if (el.closest('.tth-panel,.tth-btn')) return 'Ask me';
    if (el.closest('#dlg')) return pageName(current) + ' (dialog)';
    return pageName(current);
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('button, a, summary, label.sw, input[type=checkbox], input[type=radio], [onclick], tr.rowlink');
    if (!el || el.tagName === 'SELECT' || el.tagName === 'OPTION' || (el.tagName === 'INPUT' && el.type !== 'checkbox' && el.type !== 'radio')) return;
    if (el.matches('label.sw') && e.target.tagName !== 'INPUT') return; // the inner checkbox click is logged
    logAct(where(el), 'click', describe(el), 'click');
  }, true);
  document.addEventListener('change', function (e) {
    var el = e.target; if (!el || !el.matches || !el.matches('select, input, textarea')) return;
    if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'password' || el.type === 'file') return;
    var lab = el.getAttribute('aria-label') || el.getAttribute('placeholder') || (el.closest('label') && el.closest('label').childNodes[0] ? String(el.closest('label').childNodes[0].textContent || '').trim() : '') || el.id || el.tagName.toLowerCase();
    var val = el.tagName === 'SELECT' ? (el.options[el.selectedIndex] || {}).text : el.value;
    logAct(where(el), 'set', lab.slice(0, 40) + ' = ' + String(val || '(empty)').slice(0, 60), 'click');
  }, true);

  /* ── 2. Saved views ── */
  var SV_VARS = {};   // page → { get, set } for page-level variables
  var TL_PAGE = {};   // list id → page
  var SV_CUR = {}, SV_DONE = {};
  function svStore() { return lsGet('ttops_views_' + me(), {}); }
  function svSaveStore(v) { lsSet('ttops_views_' + me(), v); }
  function svState(page) {
    var s = { tls: {}, v: SV_VARS[page] ? clone(SV_VARS[page].get()) : null };
    Object.keys(TL_PAGE).forEach(function (id) { if (TL_PAGE[id] === page && TLS[id]) s.tls[id] = clone(TLS[id]); });
    return s;
  }
  function svPut(page, s) {
    if (s.v && SV_VARS[page]) SV_VARS[page].set(clone(s.v));
    Object.keys(s.tls || {}).forEach(function (id) { TLS[id] = clone(s.tls[id]); });
  }
  window.svApply = function (page, name) {
    if (!name) { SV_CUR[page] = ''; render(); return; }
    var v = (svStore()[page] || []).filter(function (x) { return x.name === name; })[0]; if (!v) return;
    svPut(page, v.state); SV_CUR[page] = name; render(); uToast('View “' + name + '” applied');
  };
  window.svSave = function (page) {
    var name = prompt('Name this view (the filters, search and layout as they are now):', SV_CUR[page] || '');
    if (!name) return; name = name.trim().slice(0, 40); if (!name) return;
    var all = svStore(), list = all[page] || [], ex = list.filter(function (x) { return x.name === name; })[0];
    if (ex) ex.state = svState(page); else list.push({ name: name, state: svState(page), def: false });
    all[page] = list; svSaveStore(all); SV_CUR[page] = name;
    logAct(pageName(page), 'view saved', name); render(); uToast('View “' + name + '” saved');
  };
  window.svDelete = function (page) {
    var name = SV_CUR[page]; if (!name || !confirm('Delete the view “' + name + '”?')) return;
    var all = svStore(); all[page] = (all[page] || []).filter(function (x) { return x.name !== name; }); svSaveStore(all);
    SV_CUR[page] = ''; logAct(pageName(page), 'view deleted', name); render();
  };
  window.svDefault = function (page) {
    var name = SV_CUR[page]; if (!name) return;
    var all = svStore(), on = false;
    (all[page] || []).forEach(function (x) { if (x.name === name) { x.def = !x.def; on = x.def; } else x.def = false; });
    svSaveStore(all); render(); uToast(on ? '“' + name + '” opens by default on this page' : 'No default view on this page');
  };
  function svBar(page) {
    var list = svStore()[page] || [], cur = SV_CUR[page] || '', def = list.filter(function (x) { return x.def; })[0];
    return '<span class="sv" data-sv="' + page + '"><span class="sv-i">' + ic('save') + '</span>' +
      '<select aria-label="Saved views" onchange="svApply(\'' + page + '\',this.value)"><option value="">' + (list.length ? 'Saved views (' + list.length + ')' : 'No saved view') + '</option>' +
      list.map(function (x) { return '<option value="' + esc(x.name) + '"' + (x.name === cur ? ' selected' : '') + '>' + esc(x.name) + (x.def ? ' (default)' : '') + '</option>'; }).join('') + '</select>' +
      '<button class="btn o s" title="Save the current filters as a view" onclick="svSave(\'' + page + '\')">' + ic('plus') + ' Save view</button>' +
      (cur ? '<button class="u-ib" title="' + (def && def.name === cur ? 'Default view — click to remove' : 'Open this page with this view') + '" onclick="svDefault(\'' + page + '\')">' + star(def && def.name === cur) + '</button>' +
             '<button class="u-ib del" title="Delete this view" onclick="svDelete(\'' + page + '\')">' + ic('trash') + '</button>' : '') + '</span>';
  }
  function svDefaultOnOpen(page) {
    if (SV_DONE[page]) return; SV_DONE[page] = 1;
    var d = (svStore()[page] || []).filter(function (x) { return x.def; })[0];
    if (d) { svPut(page, d.state); SV_CUR[page] = d.name; }
  }

  /* ── 3. The shared list engine ── */
  var TLS = window.TLS = {};
  function tlSt(id, page) { TL_PAGE[id] = page; return TLS[id] || (TLS[id] = { q: '', f: {}, sort: '', dir: 1 }); }
  window.tlSet = function (id, k, v) { var s = TLS[id]; if (k === 'q') s.q = v; else s.f[k] = v; render(); };
  window.tlSort = function (id, k) { var s = TLS[id]; if (s.sort === k) s.dir = -s.dir; else { s.sort = k; s.dir = 1; } render(); };
  window.tlClear = function (id) { TLS[id] = { q: '', f: {}, sort: TLS[id].sort, dir: TLS[id].dir }; render(); };
  var TL_CFG = {};
  function tlFilter(cfg) {
    var s = TLS[cfg.id], q = s.q.trim().toLowerCase();
    var rows = cfg.rows.filter(function (r) {
      for (var i = 0; i < (cfg.filters || []).length; i++) {
        var f = cfg.filters[i], v = s.f[f.k];
        if (v && v !== 'all' && !f.test(r, v)) return false;
      }
      return !q || String(cfg.search(r)).toLowerCase().indexOf(q) >= 0;
    });
    var col = (cfg.cols || []).filter(function (c) { return c.k === s.sort; })[0];
    if (col) {
      var key = col.sort || col.text || function (r) { return textOf(col.html(r)); };
      rows = rows.slice().sort(function (a, b) { var x = key(a), y = key(b); if (typeof x === 'string') { x = x.toLowerCase(); y = String(y).toLowerCase(); } return (x < y ? -1 : x > y ? 1 : 0) * s.dir; });
    }
    return rows;
  }
  window.tlCsv = function (id) {
    var cfg = TL_CFG[id]; if (!cfg) return;
    var cols = cfg.cols.filter(function (c) { return c.csv !== false && c.l; });
    download('tinytummy-' + id + '-' + today(0) + '.csv', [cols.map(function (c) { return c.l; })].concat(tlFilter(cfg).map(function (r) {
      return cols.map(function (c) { return c.text ? c.text(r) : textOf(c.html(r)); });
    })));
    logAct(pageName(TL_PAGE[id]), 'export CSV', id);
  };
  window.ttList = function (cfg) {
    var page = cfg.page || current, s = tlSt(cfg.id, page); TL_CFG[cfg.id] = cfg;
    var rows = tlFilter(cfg), max = cfg.max || 400;
    var filters = (cfg.filters || []).map(function (f) {
      var v = s.f[f.k] || 'all';
      return '<select aria-label="' + esc(f.l) + '" onchange="tlSet(\'' + cfg.id + '\',\'' + f.k + '\',this.value)"' + (v !== 'all' ? ' class="on"' : '') + '><option value="all">' + esc(f.all || 'Any ' + f.l.toLowerCase()) + '</option>' +
        f.opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    }).join('');
    var active = s.q || Object.keys(s.f).some(function (k) { return s.f[k] && s.f[k] !== 'all'; });
    var bar = '<div class="lg-f tl-bar">' + (cfg.search ? '<div class="u-search" style="margin:0"><span>' + ic('search') + '</span><input placeholder="' + esc(cfg.ph || 'Search…') + '" value="' + esc(s.q) + '" onchange="tlSet(\'' + cfg.id + '\',\'q\',this.value)"></div>' : '') +
      filters + (cfg.extra || '') +
      (active ? '<button class="btn o s" onclick="tlClear(\'' + cfg.id + '\')">' + ic('x') + ' Clear</button>' : '') +
      '<span class="tl-n">' + rows.length + (rows.length !== cfg.rows.length ? ' of ' + cfg.rows.length : '') + '</span>' +
      '<button class="btn o s" onclick="tlCsv(\'' + cfg.id + '\')">' + ic('save') + ' CSV</button>' + (cfg.noViews ? '' : svBar(page)) + '</div>';
    var head = cfg.cols.map(function (c) {
      var on = s.sort === c.k;
      return '<th' + (c.num ? ' class="num"' : '') + (c.l && c.sortable !== false ? ' class="tl-s' + (c.num ? ' num' : '') + (on ? ' on' : '') + '" onclick="tlSort(\'' + cfg.id + '\',\'' + c.k + '\')" title="Sort"' : '') + '>' +
        esc(c.l || '') + (on ? (s.dir > 0 ? ' ▲' : ' ▼') : '') + '</th>';
    }).join('');
    var body = rows.slice(0, max).map(function (r) {
      var click = cfg.onRow ? cfg.onRow(r) : '';
      return '<tr' + (click ? ' class="rowlink" onclick="' + click + '"' : '') + (cfg.rowClass ? ' data-c="' + cfg.rowClass(r) + '"' : '') + '>' +
        cfg.cols.map(function (c) { return '<td' + (c.num ? ' class="num"' : c.wrap ? ' class="wrap"' : '') + '>' + c.html(r) + '</td>'; }).join('') + '</tr>';
    }).join('');
    var foot = cfg.foot ? '<tfoot>' + cfg.foot(rows) + '</tfoot>' : '';
    return bar + '<div class="panel" style="padding:0;overflow:hidden"><div class="tbl-scroll"><table class="t reg il tl">' +
      '<thead><tr>' + head + '</tr></thead><tbody>' + (body || '<tr><td colspan="' + cfg.cols.length + '" class="muted" style="text-align:center;padding:26px">' + (cfg.empty || 'Nothing matches these filters.') + '</td></tr>') + '</tbody>' + foot + '</table></div></div>' +
      (rows.length > max ? '<p class="muted">Showing ' + max + ' of ' + rows.length + ' — narrow the filters or export CSV for all of them.</p>' : '');
  };
  function uniqOpts(rows, f) { var o = {}; rows.forEach(function (r) { var v = f(r); if (v) o[v] = 1; }); return Object.keys(o).sort().map(function (v) { return [v, v]; }); }

  /* view switch for pages that have cards */
  var VIEWS_OF = lsGet('ttops_views_layout', {});
  function layout(page, def) { return VIEWS_OF[page] || def || 'cards'; }
  window.ttLayout = function (page, v) { VIEWS_OF[page] = v; lsSet('ttops_views_layout', VIEWS_OF); render(); };
  function layoutBar(page, cardsLabel) {
    var v = layout(page);
    return '<div class="u-bar"><div class="u-tabs" style="margin:0"><button class="' + (v === 'cards' ? 'on' : '') + '" onclick="ttLayout(\'' + page + '\',\'cards\')">' + ic('grid') + ' ' + (cardsLabel || 'Cards') + '</button>' +
      '<button class="' + (v === 'list' ? 'on' : '') + '" onclick="ttLayout(\'' + page + '\',\'list\')">' + ic('clipboard') + ' List</button></div></div>';
  }
  function frag(html) { var t = document.createElement('template'); t.innerHTML = html; return t; }
  function afterHead(html, add) { var t = frag(html), h = t.content.querySelector('.pagehead'); if (h) h.insertAdjacentHTML('afterend', add); else t.content.prepend(frag(add).content); return t.innerHTML; }
  function replacePanel(html, h3text, add, keepTitle) {
    var t = frag(html), done = false;
    t.content.querySelectorAll('.panel').forEach(function (p) {
      if (done) return; var h = p.querySelector('h3'); if (!h || h.textContent.indexOf(h3text) < 0) return;
      var title = keepTitle ? '<h3 class="tl-h">' + h.innerHTML + '</h3>' : '';
      var w = document.createElement('div'); w.className = 'tl-wrap'; w.innerHTML = title + add; p.replaceWith(w); done = true;
    });
    return t.innerHTML;
  }
  function chipS(txt, c) { return '<span class="ostat" style="--sc:' + c + '">' + txt + '</span>'; }

  /* ── 6. Pages ── */
  // Age programs
  var origPrograms = RENDER.programs;
  RENDER.programs = function () {
    var html = afterHead(origPrograms(), layoutBar('programs'));
    if (layout('programs') !== 'list') return html;
    var progs = store('programs').all();
    var list = ttList({ id: 'programs', page: 'programs', rows: progs, ph: 'Search program, age, menu…',
      search: function (p) { return [p.name, p.band, p.desc, p.menu].join(' '); },
      filters: [{ k: 'band', l: 'Age band', opts: uniqOpts(progs, function (p) { return p.band; }), test: function (p, v) { return p.band === v; } },
                { k: 'enr', l: 'Enrolment', all: 'Any enrolment', opts: [['yes', 'With families'], ['no', 'No family yet']], test: function (p, v) { return v === 'yes' ? p.enrolled > 0 : !p.enrolled; } }],
      cols: [
        { k: 'name', l: 'Program', html: function (p) { return '<b>' + esc(p.name) + '</b><div class="il-sub muted">' + esc(p.desc) + '</div>'; }, text: function (p) { return p.name; } },
        { k: 'band', l: 'Age', html: function (p) { return '<span class="chip fefo">' + esc(p.band) + '</span>'; }, text: function (p) { return p.band; } },
        { k: 'menu', l: 'Weekly plan', wrap: true, html: function (p) { return esc(p.menu); }, text: function (p) { return p.menu; } },
        { k: 'price', l: 'Price / month', num: true, html: function (p) { return money(p.price); }, text: function (p) { return p.price; }, sort: function (p) { return p.price; } },
        { k: 'enr', l: 'Enrolled', num: true, html: function (p) { return '<b>' + p.enrolled + '</b>'; }, text: function (p) { return p.enrolled; }, sort: function (p) { return p.enrolled; } },
        { k: 'mrr', l: 'Revenue / month', num: true, html: function (p) { return '<b>' + money(p.price * p.enrolled) + '</b>'; }, text: function (p) { return p.price * p.enrolled; }, sort: function (p) { return p.price * p.enrolled; } },
        { k: 'act', l: '', csv: false, sortable: false, html: function (p) { return '<div class="il-acts"><button class="btn o s" onclick="progEnroll(\'' + p.id + '\',1)">' + ic('plus') + ' Enroll</button><button class="btn o s" title="Remove one" onclick="progEnroll(\'' + p.id + '\',-1)">−</button></div>'; } }],
      foot: function (rows) { var n = 0, m = 0; rows.forEach(function (p) { n += p.enrolled; m += p.price * p.enrolled; }); return '<tr><td><b>' + rows.length + ' programs</b></td><td colspan="3"></td><td class="num"><b>' + n + '</b></td><td class="num"><b>' + money(m) + '</b></td><td></td></tr>'; } });
    var t = frag(html), g = t.content.querySelector('.grid2'); if (g) g.outerHTML = list; return t.innerHTML;
  };

  // Recipes · BOM
  var origBom = RENDER.bom;
  RENDER.bom = function () {
    if (layout('bom') !== 'list') return afterHead(origBom(), layoutBar('bom', 'Recipe cards'));
    var products = store('products').all().map(normProd), bom = store('bom').all(), ings = store('ingredients').all();
    var rows = products.map(function (p) {
      var lines = bom.filter(function (b) { return b.product === p.id; });
      var mat = productCost(p.id, bom, ings), lab = timeCostPerPortion(p), full = mat + lab;
      var mins = (p.steps || []).reduce(function (s, d) { return s + (Number(d.min) || 0); }, 0);
      return { p: p, lines: lines.length, steps: (p.steps || []).length, mins: mins, mat: mat, lab: lab, full: full, margin: p.price - full, pct: p.price ? Math.round((p.price - full) / p.price * 100) : 0, fc: p.price ? Math.round(mat / p.price * 100) : 0 };
    });
    var cats = uniqOpts(products, function (p) { return p.category; });
    var list = ttList({ id: 'bom', page: 'bom', rows: rows, ph: 'Search recipe…',
      search: function (r) { return [r.p.name, r.p.category, r.p.age].join(' '); },
      filters: [{ k: 'cat', l: 'Category', opts: cats, test: function (r, v) { return r.p.category === v; } },
                { k: 'm', l: 'Margin', all: 'Any margin', opts: [['low', 'Below 40 %'], ['ok', '40 % and more']], test: function (r, v) { return v === 'low' ? r.pct < 40 : r.pct >= 40; } }],
      onRow: function (r) { return "BOM_OPEN['" + r.p.id + "']=true;ttLayout('bom','cards')"; },
      cols: [
        { k: 'name', l: 'Recipe', html: function (r) { return '<b>' + esc(r.p.name) + '</b><div class="il-sub muted">' + esc(r.p.category || '') + ' · ' + esc(r.p.age || '') + ' · ' + (r.p.portion_g || '—') + ' g · batch ' + (r.p.batch_portions || 1) + '</div>'; }, text: function (r) { return r.p.name; } },
        { k: 'lines', l: 'Ingredients', num: true, html: function (r) { return r.lines; }, sort: function (r) { return r.lines; } },
        { k: 'steps', l: 'Steps', num: true, html: function (r) { return r.steps + ' <span class="muted">· ' + r.mins + ' min</span>'; }, text: function (r) { return r.steps + ' steps / ' + r.mins + ' min'; }, sort: function (r) { return r.mins; } },
        { k: 'price', l: 'Price', num: true, html: function (r) { return money(r.p.price); }, text: function (r) { return r.p.price; }, sort: function (r) { return r.p.price; } },
        { k: 'mat', l: 'Materials', num: true, html: function (r) { return money(r.mat); }, text: function (r) { return r.mat.toFixed(2); }, sort: function (r) { return r.mat; } },
        { k: 'lab', l: 'Labour', num: true, html: function (r) { return money(r.lab); }, text: function (r) { return r.lab.toFixed(2); }, sort: function (r) { return r.lab; } },
        { k: 'full', l: 'Full cost', num: true, html: function (r) { return '<b>' + money(r.full) + '</b>'; }, text: function (r) { return r.full.toFixed(2); }, sort: function (r) { return r.full; } },
        { k: 'fc', l: 'Food cost', num: true, html: function (r) { return r.fc + '%'; }, text: function (r) { return r.fc; }, sort: function (r) { return r.fc; } },
        { k: 'pct', l: 'Margin', num: true, html: function (r) { return money(r.margin) + ' ' + chipS(r.pct + '%', r.pct >= 50 ? '#2e8770' : r.pct >= 40 ? '#c98a1b' : '#b23a48'); }, text: function (r) { return r.pct; }, sort: function (r) { return r.pct; } }] });
    return '<div class="pagehead"><div><h1>Recipes · BOM</h1><div class="sub">Every recipe with its materials, labour and full cost per portion, food-cost % and margin. Click a recipe to open its card.</div></div></div>' + layoutBar('bom', 'Recipe cards') + list;
  };

  // Requisitions
  var origReq = RENDER.requisitions;
  RENDER.requisitions = function () {
    var reqs = store('requisitions').all().map(normReq), ings = store('ingredients').all().map(normIng);
    var list = ttList({ id: 'requisitions', page: 'requisitions', rows: reqs.slice().reverse(), ph: 'Search item, note…',
      search: function (r) { var g = byId(ings, r.ing); return [g ? g.name : '', r.note, r.status].join(' '); },
      filters: [{ k: 'st', l: 'Status', opts: [['pending', 'Pending'], ['approved', 'Approved'], ['received', 'Received'], ['cancelled', 'Cancelled']], test: function (r, v) { return r.status === v; } },
                { k: 'why', l: 'Origin', all: 'Any origin', opts: [['auto', 'Automatic (below minimum)'], ['order', 'For an order (stock short)'], ['manual', 'Manual']], test: function (r, v) { return v === 'manual' ? (r.reason !== 'auto' && r.reason !== 'order') : r.reason === v; } },
                { k: 'ing', l: 'Item', opts: ings.map(function (g) { return [g.id, g.name]; }), test: function (r, v) { return r.ing === v; } }],
      cols: [
        { k: 'date', l: 'Date', html: function (r) { return esc(r.created); }, text: function (r) { return r.created; } },
        { k: 'item', l: 'Item', html: function (r) { var g = byId(ings, r.ing); return '<b>' + esc(g ? g.name : '?') + '</b>'; }, text: function (r) { var g = byId(ings, r.ing); return g ? g.name : '?'; } },
        { k: 'qty', l: 'Quantity', num: true, html: function (r) { var g = byId(ings, r.ing); return r.qty + ' ' + (g ? g.unit : ''); }, sort: function (r) { return r.qty; } },
        { k: 'lead', l: 'Lead', num: true, html: function (r) { var g = byId(ings, r.ing); return g ? g.lead + ' d' : '—'; } },
        { k: 'why', l: 'Origin', html: function (r) { return r.reason === 'auto' ? chipS(ic('zap') + ' Auto', '#7a4aa8') : r.reason === 'order' ? chipS(ic('cart') + ' For ' + esc((r.orders || []).join(', ')), '#b23a48') : chipS('Manual', '#64808e'); },
          text: function (r) { return r.reason === 'auto' ? 'Auto' : r.reason === 'order' ? 'For ' + (r.orders || []).join(' ') : 'Manual'; } },
        { k: 'note', l: 'Why', wrap: true, html: function (r) { return '<span class="muted">' + esc(r.note || '') + '</span>'; }, text: function (r) { return r.note || ''; } },
        { k: 'st', l: 'Status', html: function (r) { return chipS(r.status, { pending: '#c98a1b', approved: '#2f6fb0', received: '#2e8770' }[r.status] || '#8a979e'); }, text: function (r) { return r.status; } },
        { k: 'act', l: '', csv: false, sortable: false, html: function (r) { var g = byId(ings, r.ing);
            return '<div class="il-acts">' + (r.status === 'pending' ? '<button class="btn p s" onclick="reqAct(\'' + r.id + '\',\'approve\')">' + ic('check') + ' Approve</button><button class="u-ib" title="Cancel" onclick="reqAct(\'' + r.id + '\',\'cancel\')">' + ic('x') + '</button>'
              : r.status === 'approved' && g ? '<button class="btn g s" onclick="receiveLot(\'' + g.id + '\')">' + ic('inbox') + ' Receive</button>' : '') + '</div>'; } }] });
    var t = frag(origReq()), p = t.content.querySelector('.panel'); if (p) p.outerHTML = list; return t.innerHTML;
  };

  // Suppliers · Payables: invoices + providers
  var origSup = RENDER.suppliers;
  RENDER.suppliers = function () {
    var provs = store('providers').all(), invs = store('sup_invoices').all(), ings = store('ingredients').all();
    var inv = ttList({ id: 'sup-invoices', page: 'suppliers', rows: invs.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }), ph: 'Search invoice, provider, line…',
      search: function (v) { var p = byId(provs, v.provider); return [v.code, p ? p.name : '', textOf(invSummary(v, ings))].join(' '); },
      filters: [{ k: 'st', l: 'Status', opts: [['unpaid', 'Unpaid'], ['overdue', 'Overdue'], ['paid', 'Paid']], test: function (v, x) { return x === 'overdue' ? invOverdue(v) : v.status === x; } },
                { k: 'kind', l: 'Kind', opts: [['goods', 'Goods (stock)'], ['service', 'Services']], test: function (v, x) { return x === 'goods' ? v.kind === 'goods' : v.kind !== 'goods'; } },
                { k: 'prov', l: 'Provider', opts: provs.map(function (p) { return [p.id, p.name]; }), test: function (v, x) { return v.provider === x; } },
                { k: 'type', l: 'Type', all: 'Suppliers + employees', opts: [['supplier', 'Suppliers'], ['employee', 'Employees']], test: function (v, x) { var p = byId(provs, v.provider); return p && (x === 'employee' ? p.type === 'employee' : p.type !== 'employee'); } }],
      rowClass: function (v) { return invOverdue(v) ? 'late' : ''; },
      cols: [
        { k: 'code', l: 'Invoice', html: function (v) { return '<b>' + esc(v.code) + '</b><div class="il-sub muted">' + esc(v.date) + ' · due ' + esc(v.due) + '</div>'; }, text: function (v) { return v.code; } },
        { k: 'date', l: 'Date', html: function (v) { return esc(v.date); } },
        { k: 'prov', l: 'Provider', html: function (v) { var p = byId(provs, v.provider); return (p ? '<a href="#" onclick="supOpen(\'' + p.id + '\');return false">' + esc(p.name) + '</a>' : '?') + '<div class="il-sub muted">' + (p && p.type === 'employee' ? 'employee' : 'supplier') + '</div>'; }, text: function (v) { var p = byId(provs, v.provider); return p ? p.name : '?'; } },
        { k: 'lines', l: 'Lines', wrap: true, html: function (v) { return invSummary(v, ings) + (v.kind === 'goods' ? ' ' + chipS(ic('box') + ' stock received', '#2e8770') : ''); }, text: function (v) { return textOf(invSummary(v, ings)); } },
        { k: 'total', l: 'Total', num: true, html: function (v) { return '<b>' + money(invTotal(v)) + '</b>'; }, text: function (v) { return invTotal(v).toFixed(2); }, sort: function (v) { return invTotal(v); } },
        { k: 'st', l: 'Status', html: function (v) { return v.status === 'paid' ? chipS('Paid ' + esc(v.paid_at || ''), '#2e8770') : invOverdue(v) ? chipS('Overdue', '#b23a48') : chipS('Unpaid', '#c98a1b'); }, text: function (v) { return v.status === 'paid' ? 'paid' : invOverdue(v) ? 'overdue' : 'unpaid'; } },
        { k: 'act', l: '', csv: false, sortable: false, html: function (v) { return '<div class="il-acts">' + (window.invHasScan && invHasScan(v.id) ? '<button class="u-ib" title="See the scanned invoice" onclick="invScanView(\'' + v.id + '\')">' + ic('camera') + '</button>' : '') +
          '<button class="btn ' + (v.status === 'paid' ? 'o' : 'g') + ' s" onclick="invPay(\'' + v.id + '\')">' + (v.status === 'paid' ? ic('undo') + ' Unpay' : ic('check') + ' Mark paid') + '</button></div>'; } }],
      foot: function (rows) { var t = 0, u = 0; rows.forEach(function (v) { var x = invTotal(v); t += x; if (v.status !== 'paid') u += x; });
        return '<tr><td><b>' + rows.length + ' invoices</b></td><td colspan="3"></td><td class="num"><b>' + money(t) + '</b><div class="il-sub muted">' + money(u) + ' outstanding</div></td><td colspan="2"></td></tr>'; } });
    var prov = ttList({ id: 'sup-providers', page: 'suppliers', noViews: true, rows: provs, ph: 'Search provider, category, phone…',
      search: function (p) { return [p.name, p.category, p.phone].join(' '); },
      filters: [{ k: 'type', l: 'Type', all: 'Suppliers + employees', opts: [['supplier', 'Suppliers'], ['employee', 'Employees']], test: function (p, x) { return x === 'employee' ? p.type === 'employee' : p.type !== 'employee'; } },
                { k: 'due', l: 'Balance', all: 'Any balance', opts: [['owed', 'Money owed'], ['clear', 'Nothing owed']], test: function (p, x) { var u = invs.filter(function (v) { return v.provider === p.id && v.status !== 'paid'; }).length; return x === 'owed' ? u > 0 : !u; } }],
      cols: [
        { k: 'name', l: 'Provider', html: function (p) { return '<b><a href="#" onclick="supOpen(\'' + p.id + '\');return false">' + esc(p.name) + '</a></b><div class="il-sub muted">' + (p.type === 'employee' ? 'employee' : 'supplier') + '</div>'; }, text: function (p) { return p.name; } },
        { k: 'cat', l: 'Category', wrap: true, html: function (p) { return esc(p.category || ''); } },
        { k: 'phone', l: 'Phone', html: function (p) { return esc(p.phone || ''); } },
        { k: 'terms', l: 'Terms', num: true, html: function (p) { return p.terms ? p.terms + ' days' : 'on receipt'; }, sort: function (p) { return p.terms || 0; } },
        { k: 'tot', l: 'Invoiced', num: true, html: function (p) { var t = 0; invs.forEach(function (v) { if (v.provider === p.id) t += invTotal(v); }); return money(t); }, sort: function (p) { var t = 0; invs.forEach(function (v) { if (v.provider === p.id) t += invTotal(v); }); return t; } },
        { k: 'out', l: 'Outstanding', num: true, html: function (p) { var u = 0; invs.forEach(function (v) { if (v.provider === p.id && v.status !== 'paid') u += invTotal(v); }); return u ? '<b style="color:#b23a48">' + money(u) + '</b>' : '<span class="muted">—</span>'; },
          sort: function (p) { var u = 0; invs.forEach(function (v) { if (v.provider === p.id && v.status !== 'paid') u += invTotal(v); }); return u; } },
        { k: 'act', l: '', csv: false, sortable: false, html: function (p) { return '<div class="il-acts"><button class="btn o s" title="Open the supplier file: statement, invoices, payments, items" onclick="supOpen(\'' + p.id + '\')">' + ic('idcard') + ' File</button><button class="u-ib" title="Show this provider\'s invoices" onclick="TLS[\'sup-invoices\'].f.prov=\'' + p.id + '\';render()">' + ic('receipt') + '</button></div>'; } }] });
    var html = replacePanel(origSup(), 'Invoices', inv, true);
    return replacePanel(html, 'Provider registry', prov, true);
  };

  window.supGo = supGo = function (f) {
    var s = tlSt('sup-invoices', 'suppliers'); s.f = {};
    if (f === 'unpaid' || f === 'overdue' || f === 'paid') s.f.st = f;
    else if (f === 'goods') s.f.kind = 'goods';
    else if (f === 'employees') s.f.type = 'employee';
    render();
  };

  // ISO 22000
  var origIso = RENDER.iso;
  RENDER.iso = function () {
    var html = afterHead(origIso(), layoutBar('iso', 'By clause'));
    if (layout('iso') !== 'list') return html;
    var iso = store('iso').all();
    var flag = function (i) {
      return '<select class="flag f-' + i.status + '" onclick="event.stopPropagation()" onchange="isoSet(\'' + i.id + '\',\'status\',this.value)">' +
        [['done', 'Done'], ['progress', 'In progress'], ['todo', 'Not done']].map(function (s) { return '<option value="' + s[0] + '"' + (i.status === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>';
    };
    var list = ttList({ id: 'iso', page: 'iso', rows: iso, ph: 'Search requirement, owner, evidence…',
      search: function (i) { return [i.clause, i.item, i.owner, i.evidence].join(' '); },
      filters: [{ k: 'cl', l: 'Clause', opts: uniqOpts(iso, function (i) { return i.clause; }), test: function (i, v) { return i.clause === v; } },
                { k: 'st', l: 'Flag', all: 'Any flag', opts: [['done', 'Done'], ['progress', 'In progress'], ['todo', 'Not done']], test: function (i, v) { return i.status === v; } },
                { k: 'own', l: 'Owner', all: 'Any owner', opts: [['__none__', 'No owner yet']].concat(uniqOpts(iso, function (i) { return i.owner; })), test: function (i, v) { return v === '__none__' ? !i.owner : i.owner === v; } }],
      cols: [
        { k: 'cl', l: 'Clause', html: function (i) { return '<span class="muted">' + esc(i.clause) + '</span>'; }, text: function (i) { return i.clause; } },
        { k: 'item', l: 'Requirement', wrap: true, html: function (i) { return '<b>' + esc(i.item) + '</b>'; }, text: function (i) { return i.item; } },
        { k: 'st', l: 'Flag', html: flag, text: function (i) { return i.status; } },
        { k: 'own', l: 'Owner', html: function (i) { return '<input value="' + esc(i.owner || '') + '" placeholder="owner" style="width:110px" onchange="isoSet(\'' + i.id + '\',\'owner\',this.value)">'; }, text: function (i) { return i.owner || ''; } },
        { k: 'ev', l: 'Evidence', html: function (i) { return '<input value="' + esc(i.evidence || '') + '" placeholder="evidence / doc ref" style="width:160px" onchange="isoSet(\'' + i.id + '\',\'evidence\',this.value)">'; }, text: function (i) { return i.evidence || ''; } }] });
    var t = frag(html);
    t.content.querySelectorAll('.panel').forEach(function (p, k) { if (k > 0) p.remove(); }); // keep the readiness panel
    t.content.querySelector('.u-bar').insertAdjacentHTML('afterend', list);
    return t.innerHTML;
  };

  // Notifications: push log
  var origNotify = RENDER.notify;
  RENDER.notify = function () {
    var log = store('pushlog').all();
    var list = ttList({ id: 'pushlog', page: 'notify', rows: log, ph: 'Search title, message…',
      search: function (n) { return [n.title, n.body, n.audience].join(' '); },
      filters: [{ k: 'aud', l: 'Audience', opts: uniqOpts(log, function (n) { return n.audience; }), test: function (n, v) { return n.audience === v; } },
                { k: 'op', l: 'Opened', all: 'Opened or not', opts: [['yes', 'Opened'], ['no', 'Not opened']], test: function (n, v) { return v === 'yes' ? !!n.opened : !n.opened; } },
                { k: 'dl', l: 'Delivered', all: 'Delivered or not', opts: [['yes', 'Delivered'], ['no', 'Not delivered']], test: function (n, v) { return v === 'yes' ? !!n.delivered : !n.delivered; } }],
      cols: [
        { k: 'title', l: 'Notification', wrap: true, html: function (n) { return '<b>' + esc(n.title) + '</b><div class="il-sub muted">' + esc(n.body) + '</div>'; }, text: function (n) { return n.title + ' — ' + n.body; } },
        { k: 'aud', l: 'Audience', html: function (n) { return esc(n.audience); } },
        { k: 'sent', l: 'Sent', html: function (n) { return n.sent ? esc(n.sent) : '—'; } },
        { k: 'del', l: 'Delivered', html: function (n) { return n.delivered ? chipS(ic('check') + ' ' + esc(n.delivered), '#2e8770') : '<span class="muted">…</span>'; }, text: function (n) { return n.delivered || ''; } },
        { k: 'op', l: 'Opened', html: function (n) { return n.opened ? chipS(ic('eye') + ' ' + esc(n.opened), '#2f6fb0') : '<span class="muted">—</span>'; }, text: function (n) { return n.opened || ''; } }] });
    return replacePanel(origNotify(), 'Push log', list, true);
  };

  // Activity log
  RENDER.audit = function () {
    var rows = store('audit').all().map(function (r) { if (!r.kind) r.kind = r.action === 'open page' ? 'page' : 'action'; return r; });
    var todayN = rows.filter(function (r) { return r.ts >= dayStart(); }).length;
    var users = uniqOpts(rows, function (r) { return r.user; }), mods = uniqOpts(rows, function (r) { return r.module; });
    var kindLbl = { action: ['Action', '#17455e'], click: ['Click', '#2f6fb0'], page: ['Page opened', '#7a4aa8'] };
    var list = ttList({ id: 'audit', page: 'audit', rows: rows, max: 300, ph: 'Search action, order, case, detail…',
      search: function (r) { return [r.user, r.module, r.action, r.detail].join(' '); },
      filters: [{ k: 'user', l: 'User', opts: users, test: function (r, v) { return r.user === v; } },
                { k: 'mod', l: 'Page', all: 'All pages', opts: mods, test: function (r, v) { return r.module === v; } },
                { k: 'kind', l: 'Type', all: 'Every type', opts: [['action', 'Actions'], ['click', 'Clicks & field changes'], ['page', 'Pages opened']], test: function (r, v) { return r.kind === v; } },
                { k: 'per', l: 'Period', all: 'Any date', opts: [['0', 'Today'], ['1', 'Since yesterday'], ['7', 'Last 7 days'], ['30', 'Last 30 days']], test: function (r, v) { return r.ts >= new Date(today(-Number(v)) + 'T00:00:00').getTime(); } }],
      cols: [
        { k: 'ts', l: 'Date · time', html: function (r) { var d = new Date(r.ts); return '<span style="font-variant-numeric:tabular-nums;white-space:nowrap">' + d.toLocaleDateString() + ' <b>' + d.toLocaleTimeString() + '</b></span>'; },
          text: function (r) { return new Date(r.ts).toISOString().replace('T', ' ').slice(0, 19); }, sort: function (r) { return -r.ts; } },
        { k: 'user', l: 'User', html: function (r) { return '<b>' + esc(r.user) + '</b><div class="il-sub muted">' + esc(r.role) + '</div>'; }, text: function (r) { return r.user; } },
        { k: 'mod', l: 'Page', html: function (r) { return '<span class="chip fefo">' + esc(r.module) + '</span>'; }, text: function (r) { return r.module; } },
        { k: 'kind', l: 'Type', html: function (r) { var k = kindLbl[r.kind] || kindLbl.action; return chipS(k[0], k[1]); }, text: function (r) { return (kindLbl[r.kind] || kindLbl.action)[0]; } },
        { k: 'act', l: 'Action', html: function (r) { return '<b>' + esc(r.action) + '</b>'; }, text: function (r) { return r.action; } },
        { k: 'det', l: 'Detail', wrap: true, html: function (r) { return esc(r.detail); }, text: function (r) { return r.detail; } }] });
    return '<div class="pagehead"><div><h1>📜 Activity Log</h1><div class="sub">Every action, every click, every field changed and every page opened — per user, with date and time. The flight recorder for tracing any error back to who did what, when.</div></div></div>' +
      '<div class="kpis"><div class="kpi b-navy"><div class="v">' + rows.length + '</div><div class="l">Entries kept (latest ' + AUDIT_MAX + ')</div></div>' +
      '<div class="kpi b-blue"><div class="v">' + todayN + '</div><div class="l">Today</div></div>' +
      '<div class="kpi b-gold"><div class="v">' + rows.filter(function (r) { return r.kind === 'click'; }).length + '</div><div class="l">Clicks & changes</div></div>' +
      '<div class="kpi b-green"><div class="v">' + users.length + '</div><div class="l">Users</div></div></div>' + list;
  };

  // Team · Access: list view of the team
  var origUsers = RENDER.users;
  RENDER.users = function () {
    var html = origUsers();
    if (UV.tab !== 'team') return html;
    var t = frag(html), bar = t.content.querySelector('.u-bar');
    if (bar) bar.insertAdjacentHTML('beforebegin', layoutBar('users'));
    if (layout('users') !== 'list') return t.innerHTML;
    var staff = store('staff').all().map(normStaff), admin = can('users_manage');
    var list = ttList({ id: 'team', page: 'users', rows: staff, ph: 'Search name, email, role…',
      search: function (u) { return [u.name, u.email, roleMeta(u.role).l].join(' '); },
      filters: [{ k: 'role', l: 'Role', opts: ROLES.map(function (r) { return [r, roleMeta(r).l]; }), test: function (u, v) { return u.role === v; } },
                { k: 'st', l: 'Station', all: 'Any station', opts: STATIONS.map(function (s) { return [s[0], stLabel(s[0])]; }), test: function (u, v) { return u.role === 'super_admin' || u.role === 'manager' || (u.stations || []).indexOf(v) >= 0; } }],
      cols: [
        { k: 'name', l: 'Name', html: function (u) { var m = roleMeta(u.role); return '<span class="stp-av" style="margin-right:8px;background:' + m.bg + ';color:' + m.c + '">' + initials(u.name) + '</span><b>' + esc(u.name) + '</b>'; }, text: function (u) { return u.name; } },
        { k: 'email', l: 'Email', html: function (u) { return '<span class="muted">' + esc(u.email || '') + '</span>'; }, text: function (u) { return u.email || ''; } },
        { k: 'role', l: 'Role', html: function (u) { return admin && u.id !== 'u1' ? '<select onchange="setRole(\'' + u.id + '\',this.value)">' + ROLES.map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + roleMeta(r).l + '</option>'; }).join('') + '</select>' : esc(roleMeta(u.role).l); }, text: function (u) { return roleMeta(u.role).l; } },
        { k: 'st', l: 'Kitchen stations', wrap: true, html: function (u) { return u.role === 'super_admin' || u.role === 'manager' ? '<span class="muted">All stations</span>' : (u.stations || []).map(function (s) { return '<span class="chip fefo">' + esc(stLabel(s)) + '</span>'; }).join(' ') || '<span class="muted">—</span>'; },
          text: function (u) { return u.role === 'super_admin' || u.role === 'manager' ? 'All' : (u.stations || []).map(stLabel).join(' / '); } },
        { k: 'act', l: '', csv: false, sortable: false, html: function (u) { return '<div class="il-acts">' + (u.id !== me() ? '<button class="u-ib" title="View as ' + esc(u.name) + '" onclick="actAs(\'' + u.id + '\')">' + ic('eye') + '</button>' : '') +
            (admin ? '<button class="u-ib" title="Edit" onclick="editEmployee(\'' + u.id + '\')">' + ic('pencil') + '</button>' + (u.id !== 'u1' ? '<button class="u-ib del" title="Remove" onclick="removeEmployee(\'' + u.id + '\')">' + ic('trash') + '</button>' : '') : '') + '</div>'; } }] });
    if (bar) bar.remove();
    var g = t.content.querySelector('.u-grid'); if (g) g.outerHTML = list;
    var none = t.content.querySelector('#u-none'); if (none) none.remove();
    return t.innerHTML;
  };

  /* page-level variables kept by saved views */
  function vars(page, get, set) { SV_VARS[page] = { get: get, set: set }; }
  vars('orders', function () { return { view: OV.view, stage: OV.stage, OL: OL }; }, function (s) { OV.view = s.view; OV.stage = s.stage; OL = s.OL; });
  vars('kitchen', function () { return KV; }, function (s) { KV = s; });
  vars('delivery', function () { return DV; }, function (s) { DV = s; });
  vars('inventory', function () { return { tab: invTab, f: invFilter, q: invSearch, IF: window.IF || null, LG: LG, RPG: RPG }; },
    function (s) { invTab = s.tab; invFilter = s.f; invSearch = s.q; if (s.IF && window.IF) { for (var k in s.IF) window.IF[k] = s.IF[k]; } LG = s.LG; RPG = s.RPG; });
  vars('complaints', function () { return { f: caseFilter, c: caseCat, q: caseSearch }; }, function (s) { caseFilter = s.f; caseCat = s.c; caseSearch = s.q; });
  vars('cahier', function () { return { v: CAH_VIEW }; }, function (s) { CAH_VIEW = s.v; });
  ['programs', 'bom', 'iso', 'users'].forEach(function (p) { vars(p, function () { return { layout: layout(p) }; }, function (s) { if (s.layout) { VIEWS_OF[p] = s.layout; lsSet('ttops_views_layout', VIEWS_OF); } }); });

  /* ── 4. Start page ── */
  function startKey() { return 'ttops_start_' + me(); }
  window.ttStart = function (m) {
    var cur = lsGet(startKey(), '');
    if (cur === m) { lsSet(startKey(), ''); uToast('Start page reset to Overview'); }
    else { lsSet(startKey(), m); uToast(pageName(m) + ' is now your start page'); }
    logAct(pageName(m), 'start page', cur === m ? 'reset' : 'set'); render();
  };

  /* ── 5. Menu ── */
  var NAV = [
    { g: '', items: ['overview'] },
    { g: 'Sales', items: ['orders', 'programs'] },
    { g: 'Kitchen & stock', items: ['kitchen', 'bom', 'inventory', 'requisitions'] },
    { g: 'Delivery', items: ['delivery'] },
    { g: 'Money', items: ['suppliers'] },
    { g: 'Quality', items: ['iso', 'complaints'] },
    { g: 'Team', items: ['chat', 'notify', 'users'] },
    { g: 'System', items: ['audit', 'cahier', 'settings'] }
  ];
  var FAV_DEFAULT = { super_admin: ['overview', 'orders', 'kitchen', 'inventory'], manager: ['overview', 'orders', 'kitchen', 'inventory'],
    kitchen: ['kitchen', 'inventory'], delivery: ['delivery'], support: ['orders', 'complaints'] };
  var navQ = '';
  function favs() { var f = lsGet('ttops_fav_' + me(), null); return f || FAV_DEFAULT[currentUser().role] || []; }
  window.navFav = function (m, ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    var f = favs().slice(), i = f.indexOf(m); if (i >= 0) f.splice(i, 1); else f.push(m);
    lsSet('ttops_fav_' + me(), f); buildNav();
  };
  var openG = lsGet('ttops_nav_open', null);
  window.navGroup = function (g) { openG = openG || {}; openG[g] = !isOpen(g); lsSet('ttops_nav_open', openG); buildNav(); };
  function groupOf(m) { for (var i = 0; i < NAV.length; i++) if (NAV[i].items.indexOf(m) >= 0) return NAV[i].g; return ''; }
  function isOpen(g) { if (!g || navQ) return true; if (g === groupOf(current)) return true; return openG ? !!openG[g] : false; }
  function allowed(m) { return window.pageAllowed(m); }
  function navLink(m, inFav) {
    var L = PAGE_LABEL[m] || { e: '', l: m }, f = favs().indexOf(m) >= 0;
    return '<a data-m="' + m + '"' + (m === current ? ' class="active"' : '') + '><span>' + L.e + '</span><em>' + esc(L.l) + '</em>' +
      '<i class="nv-star' + (f ? ' on' : '') + '" title="' + (f ? 'Remove from favourites' : 'Add to favourites') + '" onclick="navFav(\'' + m + '\',event)">' + star(f) + '</i></a>';
  }
  function buildNav() {
    var nav = document.getElementById('sidenav'); if (!nav) return;
    var q = navQ.trim().toLowerCase(), fav = favs().filter(allowed), html = '';
    var KW = { delivery: 'delivery dispatch drivers agents', bom: 'recipes bom costs', inventory: 'inventory stock lots ledger', suppliers: 'suppliers payables invoices',
      users: 'team access users roles permissions', audit: 'activity log clicks history', notify: 'notifications push', cahier: 'cahier des charges specification',
      programs: 'age programs subscriptions', iso: 'iso 22000 haccp quality', complaints: 'complaints feedback cases', kitchen: 'kitchen production steps' };
    var match = function (m) { return !q || (pageName(m) + ' ' + m + ' ' + (KW[m] || '') + ' ' + groupOf(m)).toLowerCase().indexOf(q) >= 0; };
    html += '<div class="nv-find"><span>' + ic('search') + '</span><input id="nv-q" placeholder="Find a page  (Ctrl K)" value="' + esc(navQ) + '" autocomplete="off"></div>';
    if (!q && fav.length) html += '<div class="nv-sec">' + star(true) + ' Favourites</div>' + fav.map(function (m) { return navLink(m, true); }).join('');
    NAV.forEach(function (G) {
      var items = G.items.filter(function (m) { return allowed(m) && match(m) && PAGE_LABEL[m]; });
      if (!items.length) return;
      if (!G.g) { html += items.filter(function (m) { return q || fav.indexOf(m) < 0; }).map(function (m) { return navLink(m); }).join(''); return; }
      var open = isOpen(G.g), hasCur = items.indexOf(current) >= 0;
      html += '<button type="button" class="nv-g' + (open ? ' open' : '') + (hasCur ? ' cur' : '') + '" onclick="navGroup(\'' + G.g + '\')">' + esc(G.g) + '<span class="nv-ch">' + (open ? '▾' : '▸') + '</span></button>' +
        (open ? '<div class="nv-items">' + items.map(function (m) { return navLink(m); }).join('') + '</div>' : '');
    });
    if (q && !NAV.some(function (G) { return G.items.some(function (m) { return allowed(m) && match(m); }); })) html += '<p class="nv-none">No page matches.</p>';
    nav.innerHTML = html;
    nav.querySelectorAll('a[data-m]').forEach(function (a) { a.addEventListener('click', function () { navQ = ''; nav_(a.dataset.m); }); });
    var inp = nav.querySelector('#nv-q');
    inp.addEventListener('input', function () { navQ = inp.value; var pos = inp.selectionStart; buildNav(); var i2 = document.getElementById('nv-q'); i2.focus(); try { i2.setSelectionRange(pos, pos); } catch (e) {} });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var a = nav.querySelector('a[data-m]'); if (a) { navQ = ''; nav_(a.dataset.m); } }
      if (e.key === 'Escape') { navQ = ''; buildNav(); }
    });
    if (typeof iconize === 'function') iconize(nav);
  }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); var i = document.getElementById('nv-q'); if (i) { i.focus(); i.select(); } }
  });

  /* ── wrap nav() and render() ── */
  var nav0 = nav;
  function nav_(m) {
    if (!RENDER[m]) m = 'overview';
    svDefaultOnOpen(m);
    nav0(m);
    logAct(pageName(m), 'open page', '', 'page');
  }
  window.nav = nav = nav_;
  var render0 = render;
  window.render = render = function () {
    render0();
    var host = document.getElementById('views');
    var head = host && host.querySelector('.pagehead');
    if (head && !head.querySelector('.st-pin')) {
      var on = lsGet(startKey(), '') === current;
      head.insertAdjacentHTML('beforeend', '<button class="st-pin' + (on ? ' on' : '') + '" title="' + (on ? 'This is your start page — click to go back to Overview' : 'Open the dashboard on this page') + '" onclick="ttStart(\'' + current + '\')">' + star(on) + (on ? ' Start page' : ' Set as start page') + '</button>');
    }
    // saved views on pages with their own filter bars
    if (host && SV_VARS[current] && !host.querySelector('.sv')) {
      var bar = host.querySelector('.lg-f') || host.querySelector('.u-bar') || host.querySelector('.toolbar');
      if (bar) bar.insertAdjacentHTML('beforeend', svBar(current));
    }
    if (host && typeof iconize === 'function') iconize(host);
    buildNav();
  };

  var css = document.createElement('style');
  css.textContent = [
    '.nv-find{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);border-radius:9px;padding:6px 10px;margin:0 2px 8px}',
    '.nv-find input{background:none;border:none;color:#fff;font:inherit;font-size:.8rem;width:100%;outline:none}.nv-find input::placeholder{color:#8fa8b4}.nv-find .i{color:#8fa8b4}',
    '.nv-sec{font-size:.64rem;letter-spacing:.12em;color:#f0b64b;padding:8px 12px 4px;text-transform:uppercase;font-weight:800}',
    '.nv-g{display:flex;align-items:center;width:100%;background:none;border:none;color:#9fb6c1;font:inherit;font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;font-weight:800;padding:10px 12px 5px;cursor:pointer;border-radius:8px}',
    '.nv-g:hover{color:#fff}.nv-g.cur{color:#f0b64b}.nv-c{margin-left:6px;background:rgba(255,255,255,.1);border-radius:999px;padding:0 6px;font-size:.62rem;letter-spacing:0}.nv-ch{margin-left:auto;font-size:.8rem}',
    'aside nav a{position:relative;padding:7px 12px;margin-bottom:1px}aside nav a .nv-star{margin-left:auto;font-style:normal;font-size:.85rem;color:#7d99a6;opacity:0;transition:opacity .15s}',
    'aside nav a:hover .nv-star,aside nav a .nv-star.on{opacity:1}aside nav a .nv-star.on{color:#f0b64b}aside nav a.active .nv-star{color:#12394e}',
    '.nv-none{color:#8fa8b4;font-size:.8rem;padding:6px 12px}',
    '.tt-star{display:inline-flex}.tt-star .i{width:1em;height:1em}.tt-star.on .i{fill:currentColor}.nv-sec .tt-star{vertical-align:-2px}',
    '@media (max-width:900px){.nv-find,.nv-sec,.nv-g,aside nav a .nv-star{display:none}.nv-items{display:block}}',
    '.st-pin{margin-left:auto;align-self:flex-start;border:1px solid #e7e1d2;background:#fff;color:#64808e;border-radius:999px;padding:5px 12px;font:inherit;font-size:.76rem;font-weight:700;cursor:pointer;white-space:nowrap}',
    '.st-pin.on{background:#fff7e6;border-color:#f0b64b;color:#a3720d}.st-pin:hover{border-color:#17455e;color:#17455e}',
    '.pagehead{flex-wrap:wrap;gap:10px}',
    '.sv{display:inline-flex;align-items:center;gap:6px;margin-left:auto;background:#fff;border:1px solid #e7e1d2;border-radius:12px;padding:3px 4px 3px 10px}',
    '.sv .sv-i{color:#64808e;display:inline-flex}.sv select{border:none;background:none;font:inherit;font-size:.82rem;font-weight:700;color:#17455e;max-width:170px;padding:4px 2px}',
    '.tl-bar select.on{border-color:#17455e;background:#eef4f7;font-weight:700}.tl-n{font-size:.78rem;font-weight:800;color:#64808e;background:#efe9dc;border-radius:999px;padding:4px 10px}',
    '.t.tl th.tl-s{cursor:pointer;user-select:none}.t.tl th.tl-s:hover{color:#f0b64b}.t.tl th.on{color:#f0b64b}',
    '.t.tl tr[data-c="late"] td{background:#fdf3e3}.tl-wrap{margin-bottom:18px}.tl-h{margin:6px 2px 10px;font-size:1.05rem;color:#17455e}',
    '@media (max-width:700px){.sv{margin-left:0;flex-wrap:wrap}}'
  ].join('\n');
  document.head.appendChild(css);

  /* first paint: start page (when the address names no page), default view, menu */
  var startHash = (window.TT_START_HASH || '').replace('#', '');
  var start = lsGet(startKey(), '');
  if (!startHash && start && RENDER[start] && allowed(start)) nav_(start);
  else { svDefaultOnOpen(current); render(); logAct(pageName(current), 'open page', 'dashboard opened', 'page'); }
  var who = document.getElementById('whoami');
  if (who) who.addEventListener('change', function () { setTimeout(buildNav, 0); });
})();
