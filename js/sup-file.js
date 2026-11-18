/* Tiny Tummy — Supplier file (one page per supplier / provider).
   Suppliers · Payables → click a provider: their own file with
     · header: balance due, overdue, invoiced, paid, average days to pay, last delivery, aging buckets
     · Statement: the ledger — opening balance, every invoice (debit) and payment (credit), running
       balance; period filter with balance brought forward; printable statement; CSV
     · Invoices: all their invoices with paid / partly paid / overdue, scan, lines
     · Payments: every payment (cash, transfer, cheque, OMT / Whish…) and the invoices it settled
     · Items supplied: quantity, spend, last and previous price, price change
     · Details: contact, address, VAT / MOF no., bank, terms, opening balance, ISO approval, notes
   Payments are stored in `sup_payments` and allocated to invoices (oldest first, or one chosen
   invoice); an invoice is paid when its allocations cover it. "Mark paid" on the invoice list
   records the matching payment, "Unpay" removes it, so the statement always balances.
   Loaded after js/dash-ui.js. */
(function () {
  'use strict';
  if (typeof store !== 'function' || !RENDER.suppliers) return;

  var SUPF = { id: null, tab: 'statement', period: 'all', keep: false };
  var METHODS = ['Bank transfer', 'Cash', 'Cheque', 'OMT / Whish', 'Card', 'Set-off / credit note', 'Other'];
  var TABS = [['statement', 'history', 'Statement'], ['invoices', 'receipt', 'Invoices'], ['payments', 'cash', 'Payments'], ['items', 'box', 'Items supplied'], ['details', 'idcard', 'Details']];

  function chip(t, c) { return '<span class="ostat" style="--sc:' + c + '">' + t + '</span>'; }
  function r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function days(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
  function fmtD(d) { if (!d) return ''; var p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function pays() { return store('sup_payments').all(); }

  /* ── what is paid on each invoice ── */
  function paidOn(inv, payments) {
    var a = 0;
    (payments || pays()).forEach(function (p) { (p.alloc || []).forEach(function (x) { if (x.inv === inv.id) a += Number(x.amt) || 0; }); });
    if (inv.status === 'paid' && a < invTotal(inv) - 0.005 && !inv.pay_tracked) a = invTotal(inv); // paid before payments were tracked
    return r2(a);
  }
  function dueOn(inv, payments) { return r2(invTotal(inv) - paidOn(inv, payments)); }
  window.supPaidOn = paidOn;

  /* ── the ledger of one provider ── */
  function ledger(provId) {
    var prov = byId(store('providers').all(), provId) || {}, invs = store('sup_invoices').all().filter(function (v) { return v.provider === provId; });
    var ps = pays().filter(function (p) { return p.provider === provId; }), rows = [];
    if (Number(prov.opening)) rows.push({ id: 'ob', date: prov.opening_date || (invs.map(function (v) { return v.date; }).sort()[0] || today(0)), type: 'Opening balance', ref: '—', desc: 'Balance carried in', debit: Number(prov.opening) > 0 ? Number(prov.opening) : 0, credit: Number(prov.opening) < 0 ? -Number(prov.opening) : 0, ord: 0 });
    invs.forEach(function (v) {
      rows.push({ id: v.id, date: v.date, type: 'Invoice', ref: v.code, desc: v.kind === 'goods' ? 'Goods received · ' + v.lines.length + ' line(s)' : (v.lines.map(function (l) { return l.desc; }).join(', ') || 'Service'), debit: invTotal(v), credit: 0, ord: 1, inv: v.id });
      var tracked = 0; ps.forEach(function (p) { (p.alloc || []).forEach(function (x) { if (x.inv === v.id) tracked += x.amt; }); });
      if (v.status === 'paid' && !v.pay_tracked && tracked < invTotal(v) - 0.005) // settled before payments were recorded
        rows.push({ id: 'pp-' + v.id, date: v.paid_at || v.date, type: 'Payment', ref: v.code, desc: 'Marked paid', debit: 0, credit: r2(invTotal(v) - tracked), ord: 2 });
    });
    ps.forEach(function (p) {
      var to = (p.alloc || []).map(function (x) { var v = byId(invs, x.inv); return v ? v.code : ''; }).filter(Boolean);
      rows.push({ id: p.id, date: p.date, type: 'Payment', ref: p.ref || p.method, desc: p.method + (to.length ? ' · settles ' + to.join(', ') : ' · on account') + (p.note ? ' · ' + p.note : ''), debit: 0, credit: Number(p.amount) || 0, ord: 2, pay: p.id });
    });
    rows.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.ord - b.ord; });
    var bal = 0; rows.forEach(function (r) { bal = r2(bal + r.debit - r.credit); r.bal = bal; });
    return rows;
  }
  function periodFrom(p) {
    var d = new Date();
    if (p === 'month') return today(0).slice(0, 8) + '01';
    if (p === '3m') { d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0, 10); }
    if (p === 'year') return today(0).slice(0, 4) + '-01-01';
    if (p === '12m') { d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10); }
    return '';
  }
  function stats(provId) {
    var invs = store('sup_invoices').all().filter(function (v) { return v.provider === provId; }), ps = pays();
    var s = { invoiced: 0, paid: 0, due: 0, overdue: 0, last: '', n: invs.length, aging: [0, 0, 0, 0, 0], dtp: [] };
    var y = periodFrom('12m');
    invs.forEach(function (v) {
      var t = invTotal(v), p = paidOn(v, ps), d = r2(t - p);
      if (v.date >= y) s.invoiced += t;
      s.paid += p; s.due += d;
      if (v.kind === 'goods' && v.date > s.last) s.last = v.date;
      if (d > 0.005) {
        var late = days(v.due, today(0));
        if (late <= 0) s.aging[0] += d; else if (late <= 30) s.aging[1] += d; else if (late <= 60) s.aging[2] += d; else if (late <= 90) s.aging[3] += d; else s.aging[4] += d;
        if (late > 0) s.overdue += d;
      } else if (v.status === 'paid' && v.paid_at) s.dtp.push(days(v.date, v.paid_at));
    });
    var prov = byId(store('providers').all(), provId) || {};
    if (Number(prov.opening)) { s.due += Number(prov.opening); s.aging[0] += Number(prov.opening); }
    pays().forEach(function (p) { if (p.provider !== provId) return; var a = 0; (p.alloc || []).forEach(function (x) { a += x.amt; }); s.due -= r2((Number(p.amount) || 0) - a); }); // on-account money
    s.due = r2(s.due);
    s.avgDays = s.dtp.length ? Math.round(s.dtp.reduce(function (a, b) { return a + b; }, 0) / s.dtp.length) : null;
    return s;
  }

  /* ── open / close ── */
  window.supOpen = function (id, tab) {
    SUPF.id = id; SUPF.tab = tab || 'statement'; SUPF.keep = true;
    var p = byId(store('providers').all(), id);
    logAct('Payables', 'supplier file opened', p ? p.name : id, 'page');
    if (current === 'suppliers') render(); else nav('suppliers');
    window.scrollTo(0, 0);
  };
  window.supClose = function () { SUPF.id = null; render(); };
  window.supTab = function (t) { SUPF.tab = t; logAct('Payables', 'supplier file tab', t, 'click'); render(); };
  window.supPeriod = function (p) { SUPF.period = p; render(); };
  var baseNav = nav;
  window.nav = nav = function () { if (!SUPF.keep) SUPF.id = null; SUPF.keep = false; return baseNav.apply(this, arguments); };

  /* ── the page ── */
  var baseSup = RENDER.suppliers;
  RENDER.suppliers = function () {
    var p = SUPF.id ? byId(store('providers').all(), SUPF.id) : null;
    if (!p) { SUPF.id = null; return baseSup.apply(this, arguments); }
    return fileHtml(p);
  };

  function kpi(v, l, cls, click) { return '<div class="kpi' + (click ? ' click' : '') + (cls ? ' ' + cls : '') + '"' + (click ? ' onclick="' + click + '"' : '') + '><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'; }
  function agingBar(a) {
    var lab = ['Not yet due', '1–30 days late', '31–60 days', '61–90 days', 'Over 90 days'], col = ['#3273b3', '#c98f1c', '#d0711f', '#b23a48', '#7d1f2e'];
    var tot = a.reduce(function (x, y) { return x + y; }, 0);
    if (tot <= 0.005) return '<p class="muted" style="margin:6px 0 0">Nothing owed — the account is settled.</p>';
    return '<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;margin:8px 0 6px;background:#eee7d8">' + a.map(function (v, i) {
      return v > 0 ? '<div title="' + lab[i] + ': ' + money(v) + '" style="width:' + (v / tot * 100) + '%;background:' + col[i] + '"></div>' : ''; }).join('') + '</div>' +
      '<div class="pill-row" style="font-size:.78rem;gap:12px;flex-wrap:wrap">' + a.map(function (v, i) {
        return '<span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:' + col[i] + ';margin-right:4px"></span>' + lab[i] + ' <b>' + money(v) + '</b></span>'; }).join('') + '</div>';
  }

  function fileHtml(p) {
    var s = stats(p.id), emp = p.type === 'employee';
    var tabs = '<div class="u-tabs" style="margin:14px 0 10px">' + TABS.map(function (t) {
      return '<button class="' + (SUPF.tab === t[0] ? 'on' : '') + '" onclick="supTab(\'' + t[0] + '\')">' + ic(t[1]) + ' ' + t[2] + '</button>'; }).join('') + '</div>';
    var body = SUPF.tab === 'invoices' ? tabInvoices(p) : SUPF.tab === 'payments' ? tabPayments(p) : SUPF.tab === 'items' ? tabItems(p) : SUPF.tab === 'details' ? tabDetails(p) : tabStatement(p);
    var appr = p.approved ? chip(ic('shield') + ' approved supplier' + (p.cert_expiry ? ' · certificate to ' + fmtD(p.cert_expiry) : ''), p.cert_expiry && p.cert_expiry < today(0) ? '#b23a48' : '#2e8770') : (emp ? '' : chip('not yet approved (ISO 22000)', '#c98a1b'));
    return '<div class="pagehead"><div><a href="#" onclick="supClose();return false" class="muted" style="font-size:.85rem">' + ic('undo') + ' All suppliers · payables</a>' +
      '<h1 style="margin-top:4px">' + esc(p.name) + '</h1><div class="sub">' + (emp ? 'Employee · service provider' : 'Supplier') + ' · ' + esc(p.category || '') +
      (p.contact ? ' · ' + esc(p.contact) : '') + (p.phone ? ' · <a href="tel:' + esc(String(p.phone).replace(/\s/g, '')) + '">' + esc(p.phone) + '</a>' : '') +
      (p.email ? ' · <a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' : '') + ' · terms ' + (p.terms ? p.terms + ' days' : 'on receipt') + ' ' + appr + '</div></div>' +
      '<span class="pill-row"><button class="btn p" onclick="supPayDlg(\'' + p.id + '\')">' + ic('cash') + ' Record payment</button>' +
      (emp ? '' : '<button class="btn o" onclick="invScan(\'supplier\')">' + ic('camera') + ' Scan invoice</button>') +
      '<button class="btn o" onclick="supNewInvoice(\'' + p.id + '\')">' + ic('plus') + ' Post invoice</button>' +
      '<button class="btn o" onclick="supPrint(\'' + p.id + '\')">' + ic('save') + ' Statement (print / PDF)</button></span></div>' +
      '<div class="kpis">' +
      kpi(money(s.due), 'Balance due', s.due > 0.005 ? 'warn' : 'good', 'supTab(\'statement\')') +
      kpi(money(s.overdue), 'Overdue', s.overdue > 0.005 ? 'bad' : 'good', 'supTab(\'invoices\')') +
      kpi(money(s.invoiced), 'Invoiced · last 12 months', '', 'supTab(\'invoices\')') +
      kpi(money(s.paid), 'Paid to date', '', 'supTab(\'payments\')') +
      kpi(s.avgDays == null ? '—' : s.avgDays + ' d', 'Average days to pay', s.avgDays != null && p.terms && s.avgDays > p.terms ? 'warn' : '', '') +
      kpi(s.last ? fmtD(s.last) : '—', 'Last delivery', '', emp ? '' : 'supTab(\'items\')') + '</div>' +
      '<div class="panel" style="margin-top:10px"><h3>' + ic('hourglass') + ' What we owe, by age</h3>' + agingBar(s.aging) + '</div>' +
      tabs + body;
  }

  function tabStatement(p) {
    var all = ledger(p.id), from = periodFrom(SUPF.period), rows = all;
    if (from) {
      var before = all.filter(function (r) { return r.date < from; });
      rows = all.filter(function (r) { return r.date >= from; });
      var bf = before.length ? before[before.length - 1].bal : 0;
      rows = [{ id: 'bf', date: from, type: 'Brought forward', ref: '—', desc: 'Balance on ' + fmtD(from), debit: 0, credit: 0, bal: bf, bf: true }].concat(rows);
    }
    var per = [['all', 'All time'], ['month', 'This month'], ['3m', 'Last 3 months'], ['year', 'This year'], ['12m', 'Last 12 months']];
    var extra = '<select aria-label="Period" onchange="supPeriod(this.value)">' + per.map(function (x) { return '<option value="' + x[0] + '"' + (SUPF.period === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>';
    var shown = rows.slice().reverse(); // newest first on screen; the balance is the running one
    return ttList({ id: 'sup-ledger', page: 'suppliers', noViews: true, rows: shown, ph: 'Search reference, description…', extra: extra,
      search: function (r) { return [r.type, r.ref, r.desc, r.date].join(' '); },
      filters: [{ k: 'type', l: 'Entry', all: 'Invoices + payments', opts: [['Invoice', 'Invoices'], ['Payment', 'Payments']], test: function (r, x) { return r.type === x || r.bf || r.type === 'Opening balance'; } }],
      rowClass: function (r) { return r.bf ? 'muted' : ''; },
      onRow: function (r) { return r.inv ? 'supInvOpen(\'' + r.inv + '\')' : ''; },
      empty: 'No entries yet — post an invoice or record a payment.',
      cols: [
        { k: 'date', l: 'Date', html: function (r) { return fmtD(r.date); }, text: function (r) { return r.date; } },
        { k: 'type', l: 'Entry', html: function (r) { return r.type === 'Invoice' ? chip(ic('receipt') + ' Invoice', '#3273b3') : r.type === 'Payment' ? chip(ic('cash') + ' Payment', '#2e8770') : '<b>' + esc(r.type) + '</b>'; }, text: function (r) { return r.type; } },
        { k: 'ref', l: 'Reference', html: function (r) { return '<b>' + esc(r.ref) + '</b>'; }, text: function (r) { return r.ref; } },
        { k: 'desc', l: 'Description', wrap: true, html: function (r) { return esc(r.desc); } },
        { k: 'debit', l: 'Invoiced (debit)', num: true, html: function (r) { return r.debit ? money(r.debit) : ''; }, text: function (r) { return r.debit ? r.debit.toFixed(2) : ''; }, sort: function (r) { return r.debit; } },
        { k: 'credit', l: 'Paid (credit)', num: true, html: function (r) { return r.credit ? money(r.credit) : ''; }, text: function (r) { return r.credit ? r.credit.toFixed(2) : ''; }, sort: function (r) { return r.credit; } },
        { k: 'bal', l: 'Balance', num: true, sortable: false, html: function (r) { return '<b' + (r.bal > 0.005 ? '' : ' style="color:#2e8770"') + '>' + money(r.bal) + '</b>'; }, text: function (r) { return r.bal.toFixed(2); } }],
      foot: function (rs) {
        var d = 0, c = 0; rs.forEach(function (r) { d += r.debit; c += r.credit; });
        var end = rows.length ? rows[rows.length - 1].bal : 0;
        return '<tr><td colspan="4"><b>Period totals · closing balance</b></td><td class="num"><b>' + money(d) + '</b></td><td class="num"><b>' + money(c) + '</b></td><td class="num"><b>' + money(end) + '</b></td></tr>';
      } });
  }
  window.supInvOpen = function (id) {
    var v = byId(store('sup_invoices').all(), id); SUPF.tab = 'invoices';
    TLS['sup-file-inv'] = { q: v ? v.code : '', f: {}, sort: '', dir: 1 }; render();
  };

  function tabInvoices(p) {
    var ings = store('ingredients').all(), ps = pays();
    var invs = store('sup_invoices').all().filter(function (v) { return v.provider === p.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    function st(v) { var d = dueOn(v, ps), pd = paidOn(v, ps); return d <= 0.005 ? 'paid' : pd > 0.005 ? (v.due < today(0) ? 'overdue' : 'partly') : v.due < today(0) ? 'overdue' : 'unpaid'; }
    return ttList({ id: 'sup-file-inv', page: 'suppliers', noViews: true, rows: invs, ph: 'Search invoice no., item…',
      search: function (v) { return [v.code, textOf2(invSummary(v, ings))].join(' '); },
      filters: [{ k: 'st', l: 'Status', opts: [['open', 'Not fully paid'], ['overdue', 'Overdue'], ['partly', 'Partly paid'], ['paid', 'Paid']], test: function (v, x) { var s = st(v); return x === 'open' ? s !== 'paid' : s === x; } },
                { k: 'kind', l: 'Kind', opts: [['goods', 'Goods (stock)'], ['service', 'Services']], test: function (v, x) { return v.kind === x; } }],
      empty: 'No invoices from ' + esc(p.name) + ' yet.',
      cols: [
        { k: 'code', l: 'Invoice', html: function (v) { return '<b>' + esc(v.code) + '</b>' + (v.source === 'scan' ? ' <span class="muted" title="Scanned">' + ic('camera') + '</span>' : ''); }, text: function (v) { return v.code; } },
        { k: 'date', l: 'Date', html: function (v) { return fmtD(v.date); }, text: function (v) { return v.date; } },
        { k: 'due', l: 'Due', html: function (v) { return fmtD(v.due); }, text: function (v) { return v.due; } },
        { k: 'lines', l: 'Lines', wrap: true, html: function (v) { return invSummary(v, ings); }, text: function (v) { return textOf2(invSummary(v, ings)); } },
        { k: 'total', l: 'Total', num: true, html: function (v) { return money(invTotal(v)); }, text: function (v) { return invTotal(v).toFixed(2); }, sort: function (v) { return invTotal(v); } },
        { k: 'paid', l: 'Paid', num: true, html: function (v) { var x = paidOn(v, ps); return x ? money(x) : '<span class="muted">—</span>'; }, text: function (v) { return paidOn(v, ps).toFixed(2); }, sort: function (v) { return paidOn(v, ps); } },
        { k: 'left', l: 'Left to pay', num: true, html: function (v) { var x = dueOn(v, ps); return x > 0.005 ? '<b style="color:#b23a48">' + money(x) + '</b>' : '<span class="muted">—</span>'; }, text: function (v) { return dueOn(v, ps).toFixed(2); }, sort: function (v) { return dueOn(v, ps); } },
        { k: 'st', l: 'Status', html: function (v) { var s = st(v); return s === 'paid' ? chip('Paid' + (v.paid_at ? ' ' + fmtD(v.paid_at) : ''), '#2e8770') : s === 'overdue' ? chip('Overdue ' + days(v.due, today(0)) + ' d', '#b23a48') : s === 'partly' ? chip('Partly paid', '#3273b3') : chip('Unpaid', '#c98a1b'); }, text: function (v) { return st(v); } },
        { k: 'act', l: '', csv: false, sortable: false, html: function (v) {
          return '<div class="il-acts">' + (window.invHasScan && invHasScan(v.id) ? '<button class="u-ib" title="See the scanned invoice" onclick="event.stopPropagation();invScanView(\'' + v.id + '\')">' + ic('camera') + '</button>' : '') +
            (dueOn(v, ps) > 0.005 ? '<button class="btn g s" onclick="event.stopPropagation();supPayDlg(\'' + p.id + '\',\'' + v.id + '\')">' + ic('cash') + ' Pay</button>' : '') + '</div>'; } }],
      foot: function (rs) { var t = 0, pd = 0; rs.forEach(function (v) { t += invTotal(v); pd += paidOn(v, ps); });
        return '<tr><td colspan="4"><b>' + rs.length + ' invoice(s)</b></td><td class="num"><b>' + money(t) + '</b></td><td class="num"><b>' + money(pd) + '</b></td><td class="num"><b>' + money(t - pd) + '</b></td><td colspan="2"></td></tr>'; } });
  }
  function textOf2(h) { var d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent.replace(/\s+/g, ' ').trim(); }

  function tabPayments(p) {
    var invs = store('sup_invoices').all();
    var ps = pays().filter(function (x) { return x.provider === p.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    // payments recorded before tracking started, shown from the invoices
    invs.forEach(function (v) {
      if (v.provider !== p.id || v.status !== 'paid' || v.pay_tracked) return;
      var t = 0; pays().forEach(function (x) { (x.alloc || []).forEach(function (a) { if (a.inv === v.id) t += a.amt; }); });
      if (t < invTotal(v) - 0.005) ps.push({ id: 'pp-' + v.id, date: v.paid_at || v.date, amount: r2(invTotal(v) - t), method: 'Marked paid', ref: '', alloc: [{ inv: v.id, amt: r2(invTotal(v) - t) }], by: '', legacy: true });
    });
    return ttList({ id: 'sup-file-pay', page: 'suppliers', noViews: true, rows: ps, ph: 'Search reference, method…',
      search: function (x) { return [x.method, x.ref, x.note, x.by].join(' '); },
      filters: [{ k: 'm', l: 'Method', opts: METHODS.concat(['Marked paid']).map(function (m) { return [m, m]; }), test: function (x, v) { return x.method === v; } }],
      empty: 'No payments recorded yet — use Record payment.',
      cols: [
        { k: 'date', l: 'Date', html: function (x) { return fmtD(x.date); }, text: function (x) { return x.date; } },
        { k: 'amt', l: 'Amount', num: true, html: function (x) { return '<b>' + money(x.amount) + '</b>'; }, text: function (x) { return Number(x.amount).toFixed(2); }, sort: function (x) { return Number(x.amount); } },
        { k: 'm', l: 'Method', html: function (x) { return esc(x.method); } },
        { k: 'ref', l: 'Reference', html: function (x) { return esc(x.ref || ''); } },
        { k: 'to', l: 'Settles', wrap: true, html: function (x) { var a = (x.alloc || []).map(function (a) { var v = byId(invs, a.inv); return (v ? esc(v.code) : '?') + ' ' + money(a.amt); }); var left = r2(x.amount - (x.alloc || []).reduce(function (s, a) { return s + a.amt; }, 0)); return (a.join(' · ') || '') + (left > 0.005 ? (a.length ? ' · ' : '') + money(left) + ' on account' : ''); } },
        { k: 'by', l: 'Recorded by', html: function (x) { return esc(x.by || '') + (x.at ? '<div class="il-sub muted">' + esc(x.at) + '</div>' : ''); } },
        { k: 'act', l: '', csv: false, sortable: false, html: function (x) { return x.legacy ? '' : '<button class="u-ib del" title="Cancel this payment" onclick="supPayDel(\'' + x.id + '\')">' + ic('trash') + '</button>'; } }],
      foot: function (rs) { var t = 0; rs.forEach(function (x) { t += Number(x.amount) || 0; }); return '<tr><td><b>' + rs.length + ' payment(s)</b></td><td class="num"><b>' + money(t) + '</b></td><td colspan="5"></td></tr>'; } });
  }

  function tabItems(p) {
    var ings = store('ingredients').all(), agg = {};
    store('sup_invoices').all().filter(function (v) { return v.provider === p.id && v.kind === 'goods'; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (v) {
        v.lines.forEach(function (l) {
          var a = agg[l.ing] || (agg[l.ing] = { ing: l.ing, qty: 0, spend: 0, n: 0, prices: [], last: '' });
          a.qty += Number(l.qty) || 0; a.spend += (Number(l.qty) || 0) * (Number(l.cost) || 0); a.n++; a.prices.push(Number(l.cost) || 0); a.last = v.date;
        });
      });
    var rows = Object.keys(agg).map(function (k) { var a = agg[k], g = byId(ings, k); a.g = g; a.lp = a.prices[a.prices.length - 1]; a.pp = a.prices.length > 1 ? a.prices[a.prices.length - 2] : null; a.ch = a.pp ? (a.lp - a.pp) / a.pp * 100 : null; return a; });
    return ttList({ id: 'sup-file-items', page: 'suppliers', noViews: true, rows: rows, ph: 'Search item…',
      search: function (a) { return a.g ? a.g.name + ' ' + a.g.cat : ''; },
      filters: [{ k: 'ch', l: 'Price', all: 'Any price change', opts: [['up', 'Price went up'], ['down', 'Price went down']], test: function (a, x) { return x === 'up' ? a.ch > 0.5 : a.ch < -0.5; } }],
      empty: p.type === 'employee' ? 'Employees supply services, not stock.' : 'No goods received from this supplier yet.',
      cols: [
        { k: 'name', l: 'Item', html: function (a) { return '<b>' + esc(a.g ? a.g.name : '?') + '</b><div class="il-sub muted">' + esc(a.g ? a.g.cat : '') + '</div>'; }, text: function (a) { return a.g ? a.g.name : '?'; } },
        { k: 'qty', l: 'Received', num: true, html: function (a) { return (Math.round(a.qty * 100) / 100) + ' ' + esc(a.g ? a.g.unit : ''); }, sort: function (a) { return a.qty; } },
        { k: 'n', l: 'Deliveries', num: true, html: function (a) { return a.n; }, sort: function (a) { return a.n; } },
        { k: 'spend', l: 'Spend', num: true, html: function (a) { return money(a.spend); }, text: function (a) { return a.spend.toFixed(2); }, sort: function (a) { return a.spend; } },
        { k: 'lp', l: 'Last price', num: true, html: function (a) { return money(a.lp) + (a.g ? ' / ' + esc(a.g.unit) : ''); }, text: function (a) { return a.lp.toFixed(2); }, sort: function (a) { return a.lp; } },
        { k: 'ch', l: 'vs previous', num: true, html: function (a) { return a.ch == null ? '<span class="muted">—</span>' : '<b style="color:' + (a.ch > 0.5 ? '#b23a48' : a.ch < -0.5 ? '#2e8770' : '#64808e') + '">' + (a.ch > 0 ? '+' : '') + a.ch.toFixed(1) + ' %</b>'; }, text: function (a) { return a.ch == null ? '' : a.ch.toFixed(1); }, sort: function (a) { return a.ch == null ? -999 : a.ch; } },
        { k: 'last', l: 'Last delivery', html: function (a) { return fmtD(a.last); }, text: function (a) { return a.last; } }],
      foot: function (rs) { var t = 0; rs.forEach(function (a) { t += a.spend; }); return '<tr><td colspan="3"><b>' + rs.length + ' item(s)</b></td><td class="num"><b>' + money(t) + '</b></td><td colspan="3"></td></tr>'; } });
  }

  var DET = [['name', 'Name'], ['category', 'Category / role'], ['contact', 'Contact person'], ['phone', 'Phone'], ['email', 'Email'], ['address', 'Address'],
    ['vat', 'VAT / MOF no.'], ['bank', 'Bank · IBAN'], ['terms', 'Payment terms (days)', 'number'], ['opening', 'Opening balance ($, owed to them)', 'number'], ['opening_date', 'Opening balance date', 'date'],
    ['cert_expiry', 'ISO / health certificate valid to', 'date']];
  function tabDetails(p) {
    return '<div class="panel"><div class="frm">' +
      '<div class="row">' + DET.map(function (d, i) {
        return (i && i % 2 === 0 ? '</div><div class="row">' : '') + '<label>' + d[1] + '<input id="sd-' + d[0] + '"' + (d[2] ? ' type="' + d[2] + '"' + (d[2] === 'number' ? ' step="any"' : '') : '') + ' value="' + esc(p[d[0]] == null ? '' : p[d[0]]) + '"></label>';
      }).join('') + '</div>' +
      (p.type === 'employee' ? '' : '<label style="display:flex;gap:8px;align-items:center;font-weight:700"><input type="checkbox" id="sd-approved"' + (p.approved ? ' checked' : '') + ' style="width:auto"> Approved supplier (ISO 22000 supplier approval list)</label>') +
      '<label>Notes<textarea id="sd-notes" rows="3">' + esc(p.notes || '') + '</textarea></label>' +
      '<button class="btn p" onclick="supSaveDetails(\'' + p.id + '\')">' + ic('save') + ' Save details</button></div></div>';
  }
  window.supSaveDetails = function (id) {
    var provs = store('providers').all(), p = byId(provs, id); if (!p) return;
    var name = document.getElementById('sd-name').value.trim(); if (!name) { alert('Name required'); return; }
    var ch = [];
    DET.forEach(function (d) { var v = document.getElementById('sd-' + d[0]).value; if (d[2] === 'number') v = v === '' ? (d[0] === 'terms' ? 0 : null) : Number(v); if (String(p[d[0]] == null ? '' : p[d[0]]) !== String(v == null ? '' : v)) ch.push(d[1]); p[d[0]] = v; });
    var ap = document.getElementById('sd-approved'); if (ap) { if (!!p.approved !== ap.checked) ch.push('Approved'); p.approved = ap.checked; }
    var nt = document.getElementById('sd-notes').value; if ((p.notes || '') !== nt) ch.push('Notes'); p.notes = nt;
    store('providers').save(provs);
    logAct('Payables', 'supplier details saved', p.name + (ch.length ? ' · ' + ch.join(', ') : ''));
    uToast('Details saved'); render();
  };

  /* ── payments ── */
  window.supPayDlg = function (provId, invId) {
    var p = byId(store('providers').all(), provId), ps = pays();
    var open = store('sup_invoices').all().filter(function (v) { return v.provider === provId && dueOn(v, ps) > 0.005; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var s = stats(provId), def = invId ? dueOn(byId(open, invId) || { lines: [] }, ps) : Math.max(0, s.due);
    showDlg('<h3>' + ic('cash') + ' Record payment — ' + esc(p.name) + '</h3><div class="frm" style="margin-top:10px">' +
      '<p class="muted" style="margin:0">Balance due ' + money(s.due) + ' · ' + open.length + ' open invoice(s)</p>' +
      '<div class="row"><label>Amount ($)<input id="sp-amt" type="number" step="0.01" value="' + (def > 0 ? def.toFixed(2) : '') + '"></label><label>Date<input id="sp-date" type="date" value="' + today(0) + '"></label></div>' +
      '<div class="row"><label>Method<select id="sp-m">' + METHODS.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></label><label>Reference (cheque no., transfer ref.)<input id="sp-ref"></label></div>' +
      '<label>Apply to<select id="sp-to"><option value="">Oldest invoices first</option>' + open.map(function (v) { return '<option value="' + v.id + '"' + (v.id === invId ? ' selected' : '') + '>' + esc(v.code) + ' · ' + fmtD(v.date) + ' · left ' + money(dueOn(v, ps)) + '</option>'; }).join('') + '<option value="__acct">On account (no invoice)</option></select></label>' +
      '<label>Note<input id="sp-note"></label>' +
      '<button class="btn p" onclick="supPaySave(\'' + provId + '\')">' + ic('check') + ' Record payment</button></div>');
  };
  function applyStatus(invIds) {
    var invs = store('sup_invoices').all(), ps = pays(), lastDate = {};
    ps.forEach(function (p) { (p.alloc || []).forEach(function (a) { if (!lastDate[a.inv] || p.date > lastDate[a.inv]) lastDate[a.inv] = p.date; }); });
    invs.forEach(function (v) {
      if (invIds.indexOf(v.id) < 0) return;
      v.pay_tracked = true;
      var d = dueOn(v, ps);
      if (d <= 0.005) { v.status = 'paid'; v.paid_at = lastDate[v.id] || v.paid_at || today(0); } else { v.status = 'unpaid'; v.paid_at = null; }
    });
    store('sup_invoices').save(invs);
  }
  function legacyToTracked(invs, provId) { // before allocating, turn "marked paid" invoices into tracked ones
    var ps = pays(), changed = false;
    invs.forEach(function (v) {
      if (v.provider !== provId || v.status !== 'paid' || v.pay_tracked) return;
      var t = 0; ps.forEach(function (x) { (x.alloc || []).forEach(function (a) { if (a.inv === v.id) t += a.amt; }); });
      if (t < invTotal(v) - 0.005) ps.push({ id: uid(), provider: provId, date: v.paid_at || v.date, amount: r2(invTotal(v) - t), method: 'Other', ref: 'Marked paid', note: '', alloc: [{ inv: v.id, amt: r2(invTotal(v) - t) }], by: '', at: '' });
      v.pay_tracked = true; changed = true;
    });
    if (changed) { store('sup_payments').save(ps); store('sup_invoices').save(invs); }
  }
  window.supPaySave = function (provId) {
    var amt = r2(document.getElementById('sp-amt').value);
    if (!(amt > 0)) { alert('Enter the amount paid'); return; }
    var to = document.getElementById('sp-to').value;
    var invsAll = store('sup_invoices').all(); legacyToTracked(invsAll, provId);
    var ps = pays();
    var open = store('sup_invoices').all().filter(function (v) { return v.provider === provId && dueOn(v, ps) > 0.005; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (to && to !== '__acct') open = open.filter(function (v) { return v.id === to; }).concat(open.filter(function (v) { return v.id !== to; }));
    var left = amt, alloc = [];
    if (to !== '__acct') open.forEach(function (v) { if (left <= 0.005) return; var d = dueOn(v, ps), a = r2(Math.min(d, left)); alloc.push({ inv: v.id, amt: a }); left = r2(left - a); });
    var pay = { id: uid(), provider: provId, date: document.getElementById('sp-date').value || today(0), amount: amt, method: document.getElementById('sp-m').value,
      ref: document.getElementById('sp-ref').value.trim(), note: document.getElementById('sp-note').value.trim(), alloc: alloc, by: currentUser().name, at: nowTs() };
    ps.push(pay); store('sup_payments').save(ps);
    applyStatus(alloc.map(function (a) { return a.inv; }));
    var p = byId(store('providers').all(), provId);
    logAct('Payables', 'payment recorded', (p ? p.name : '') + ' · ' + money(amt) + ' · ' + pay.method + (pay.ref ? ' ' + pay.ref : '') + (left > 0.005 ? ' · ' + money(left) + ' on account' : ''));
    uToast('Payment of ' + money(amt) + ' recorded');
    closeDlg(); render();
  };
  window.supPayDel = function (id) {
    var ps = pays(), x = byId(ps, id); if (!x) return;
    if (!confirm('Cancel the payment of ' + money(x.amount) + ' (' + x.method + ', ' + fmtD(x.date) + ')? The invoices it settled become unpaid again.')) return;
    store('sup_payments').save(ps.filter(function (p) { return p.id !== id; }));
    applyStatus((x.alloc || []).map(function (a) { return a.inv; }));
    logAct('Payables', 'payment cancelled', money(x.amount) + ' · ' + x.method + (x.ref ? ' ' + x.ref : ''));
    render();
  };
  /* "Mark paid" / "Unpay" on the invoice list keep the payments in step */
  var basePay = invPay;
  window.invPay = invPay = function (id) {
    var invs = store('sup_invoices').all(), v = byId(invs, id); if (!v) return;
    var ps = pays();
    if (v.status === 'paid') {
      var real = [];
      ps.forEach(function (p) {
        if (p.ref === 'Marked paid') p.alloc = (p.alloc || []).filter(function (a) { if (a.inv === id) { p.amount = r2(p.amount - a.amt); return false; } return true; });
        else if ((p.alloc || []).some(function (a) { return a.inv === id; })) real.push(p.method + ' ' + money(p.amount) + ' (' + fmtD(p.date) + ')');
      });
      if (real.length) { alert('Invoice ' + v.code + ' was settled by recorded payment(s): ' + real.join(', ') + '.\n\nCancel the payment in the supplier file → Payments to reopen it.'); return; }
      store('sup_payments').save(ps.filter(function (p) { return p.ref !== 'Marked paid' || p.amount > 0.005; }));
      basePay(id);
      invs = store('sup_invoices').all(); v = byId(invs, id); v.pay_tracked = true; store('sup_invoices').save(invs);
    } else {
      var d = dueOn(v, ps);
      if (d > 0.005) { ps.push({ id: uid(), provider: v.provider, date: today(0), amount: d, method: 'Other', ref: 'Marked paid', note: '', alloc: [{ inv: id, amt: d }], by: currentUser().name, at: nowTs() }); store('sup_payments').save(ps); }
      basePay(id);
      invs = store('sup_invoices').all(); v = byId(invs, id); v.pay_tracked = true; store('sup_invoices').save(invs);
    }
  };
  window.supNewInvoice = function (provId) {
    newInvoice(); var s = document.getElementById('iv-prov'); if (s) s.value = provId;
  };

  /* ── printable statement (print or save as PDF) ── */
  window.supPrint = function (provId) {
    var p = byId(store('providers').all(), provId), s = stats(provId), all = ledger(provId), from = periodFrom(SUPF.period), rows = all, bf = null;
    if (from) { var before = all.filter(function (r) { return r.date < from; }); bf = before.length ? before[before.length - 1].bal : 0; rows = all.filter(function (r) { return r.date >= from; }); }
    var end = rows.length ? rows[rows.length - 1].bal : (bf || 0), D = 0, C = 0;
    rows.forEach(function (r) { D += r.debit; C += r.credit; });
    var e = function (x) { return esc(x == null ? '' : x); };
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>Statement — ' + e(p.name) + '</title><style>' +
      'body{font-family:Helvetica,Arial,sans-serif;color:#17283a;margin:32px;font-size:12.5px}h1{font-size:20px;margin:0}h2{font-size:14px;margin:18px 0 6px}' +
      '.hd{display:flex;justify-content:space-between;border-bottom:2px solid #17455e;padding-bottom:12px}.muted{color:#64808e}.box{border:1px solid #d9d2c3;border-radius:8px;padding:10px 12px}' +
      'table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#f3efe6;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em}th,td{padding:6px 8px;border-bottom:1px solid #e7e1d2}' +
      '.n{text-align:right;font-variant-numeric:tabular-nums}tfoot td{font-weight:700;border-top:2px solid #17455e}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}' +
      '.ag td{text-align:center}@media print{body{margin:14mm}}</style></head><body>' +
      '<div class="hd"><div><h1>Tiny Tummy</h1><div class="muted">Supplier statement of account</div></div><div style="text-align:right"><b>Statement date</b> ' + fmtD(today(0)) + '<br><span class="muted">Period: ' + (from ? fmtD(from) + ' – ' + fmtD(today(0)) : 'all entries') + '</span></div></div>' +
      '<div class="grid"><div class="box"><b>' + e(p.name) + '</b><br>' + e(p.category) + (p.contact ? '<br>Attn: ' + e(p.contact) : '') + (p.address ? '<br>' + e(p.address) : '') + (p.phone ? '<br>' + e(p.phone) : '') + (p.email ? '<br>' + e(p.email) : '') + (p.vat ? '<br>VAT / MOF: ' + e(p.vat) : '') + '</div>' +
      '<div class="box"><table style="margin:0"><tr><td>Payment terms</td><td class="n">' + (p.terms ? p.terms + ' days' : 'on receipt') + '</td></tr><tr><td>Balance due</td><td class="n"><b>' + money(s.due) + '</b></td></tr><tr><td>Of which overdue</td><td class="n">' + money(s.overdue) + '</td></tr>' + (p.bank ? '<tr><td>Bank</td><td class="n">' + e(p.bank) + '</td></tr>' : '') + '</table></div></div>' +
      '<h2>Account entries</h2><table><thead><tr><th>Date</th><th>Entry</th><th>Reference</th><th>Description</th><th class="n">Debit</th><th class="n">Credit</th><th class="n">Balance</th></tr></thead><tbody>' +
      (bf != null ? '<tr><td>' + fmtD(from) + '</td><td colspan="5"><i>Balance brought forward</i></td><td class="n">' + money(bf) + '</td></tr>' : '') +
      rows.map(function (r) { return '<tr><td>' + fmtD(r.date) + '</td><td>' + e(r.type) + '</td><td>' + e(r.ref) + '</td><td>' + e(r.desc) + '</td><td class="n">' + (r.debit ? money(r.debit) : '') + '</td><td class="n">' + (r.credit ? money(r.credit) : '') + '</td><td class="n">' + money(r.bal) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="4">Totals · closing balance</td><td class="n">' + money(D) + '</td><td class="n">' + money(C) + '</td><td class="n">' + money(end) + '</td></tr></tfoot></table>' +
      '<h2>Ageing of the balance</h2><table class="ag"><tr><th>Not yet due</th><th>1–30 days</th><th>31–60 days</th><th>61–90 days</th><th>Over 90 days</th></tr><tr>' + s.aging.map(function (a) { return '<td>' + money(a) + '</td>'; }).join('') + '</tr></table>' +
      '<p class="muted" style="margin-top:22px">Please report any difference within 15 days. Generated ' + e(nowTs()) + ' by ' + e(currentUser().name) + '.</p>' +
      '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>';
    var w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups to print the statement.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    logAct('Payables', 'supplier statement printed', p.name + (from ? ' · from ' + from : ''));
  };
})();
