/* Tiny Tummy — "Ask me" for staff (dashboard only)
   Answers questions about the live operation and links straight to the
   right page, order, client or item:
     "my orders" / "my tasks"          → kitchen steps, deliveries and cases assigned to me
     "delivered today"                 → orders delivered today
     "to prepare" / "kitchen"          → orders waiting or in production, with quantities per item
     "ready" / "on the road" / "late"  → dispatch and delivery status
     "new orders" / "orders today"
     an order code (TT-2026-041, "041") or case code (CF-2026-002)
     a client's name ("Rana")          → their orders, cases and phone
     a product ("Heartbeet")           → open orders containing it + its recipe
     an ingredient ("carrots")         → stock and lots, opens Inventory
   Uses the dashboard's own data and respects module permissions.
   js/help.js calls window.ttOpsAsk(question) before its page Q&A. */
(function () {
  'use strict';
  if (typeof store !== 'function') return;

  var OPEN_KITCHEN = ['confirmed', 'kitchen', 'portioning', 'qc'];
  var STAGE_TXT = { 'new': 'awaiting confirmation', confirmed: 'confirmed', kitchen: 'in the kitchen', portioning: 'portioning',
    qc: 'quality check', dispatch: 'ready to dispatch', delivering: 'on the road', delivered: 'delivered', cancelled: 'cancelled' };

  function lc(s) { return String(s || '').toLowerCase(); }
  function first(s) { return lc(String(s || '').split(/[\s—–-]+/)[0]); }
  function allowed(m) { var k = MODULE_PERMS[m]; return !k || can(k); }
  function noAccess(m) { return 'Your role doesn\'t give access to <b>' + esc(m) + '</b>. A super admin can grant it in <b>Team · Access</b>.'; }
  function deliveredAt(o) { return o.stage_times && o.stage_times.delivered; }
  function isDeliveredToday(o) {
    return o.status === 'delivered' && (deliveredAt(o) ? deliveredAt(o) >= dayStart() : o.created === today(0));
  }
  function itemsTxt(o, products) {
    return o.items.map(function (it) { var p = byId(products, it.product); return it.qty + '× ' + esc(p ? p.name : '?'); }).join(', ');
  }
  function isLate(o) {
    return (o.kitchen_due && OPEN_KITCHEN.indexOf(o.status) >= 0 && o.kitchen_due < Date.now()) ||
      (o.track && o.status === 'delivering' && (o.track.delayed || o.track.promised < Date.now()));
  }

  /* ── links (global so the help panel's HTML can call them) ── */
  window.ttGoOrder = function (id) { if (!allowed('orders')) return; OV.stage = 'all'; nav('orders'); openOrder(id); };
  window.ttGoStage = function (st) { if (!allowed('orders')) return; OV.stage = st; nav('orders'); };
  window.ttGoCase = function (id) { if (!allowed('complaints')) return; nav('complaints'); openCase(id); };
  window.ttGoClientCases = function (name) { if (!allowed('complaints')) return; caseFilter = 'all'; caseCat = 'all'; caseSearch = name; nav('complaints'); };
  window.ttGoRecipe = function (pid) {
    if (!allowed('bom')) return; BOM_OPEN[pid] = true; nav('bom');
    setTimeout(function () { var d = document.querySelector('details.bomc[open]'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  };
  window.ttGoIngredient = function (name) { if (!allowed('inventory')) return; invFilter = 'all'; invTab = 'items'; invSearch = name; nav('inventory'); };
  window.ttGoPage = function (m) { if (allowed(m)) nav(m); };

  function aOrder(o) { return '<a href="#" onclick="ttGoOrder(\'' + o.id + '\');return false">' + esc(o.code) + '</a>'; }
  function aPage(m, label) { return '<a href="#" onclick="ttGoPage(\'' + m + '\');return false">' + label + '</a>'; }
  function orderLine(o, products, extra) {
    return '<li>' + aOrder(o) + ' · <b>' + esc(o.customer) + '</b> — ' + itemsTxt(o, products) +
      ' <span style="color:#64808e">(' + (STAGE_TXT[o.status] || o.status) + (extra ? ', ' + extra : '') + ')</span></li>';
  }
  function list(title, rows, more) {
    return '<div style="margin-bottom:10px"><b>' + title + '</b>' + (rows.length ? '<ul style="margin:4px 0 0 16px;padding:0">' + rows.join('') + '</ul>' : '<br>None right now.') + (more ? '<div style="margin-top:4px">' + more.replace(/^<br>/, '') + '</div>' : '') + '</div>';
  }

  /* ── intents ── */
  function myWork() {
    var u = currentUser(), me = lc(u.name), mine = first(u.name);
    var orders = store('orders').all(), products = store('products').all(), agents = store('agents').all();
    var out = [];
    var steps = [];
    orders.forEach(function (o) {
      (o.steps || []).forEach(function (s) { if (s.assigned && !s.done && lc(s.assigned) === me) steps.push({ o: o, s: s }); });
    });
    if (steps.length || (u.stations || []).length) out.push(list('Your kitchen steps (' + steps.length + ')', steps.map(function (x) {
      return '<li>' + aOrder(x.o) + ' · ' + esc(x.s.s) + (x.s.started_at ? ' <span style="color:#64808e">(started)</span>' : '') + ' — ' + esc(x.o.customer) + '</li>';
    })));
    var myAgent = agents.filter(function (a) { return first(a.name) === mine; })[0];
    if (myAgent || u.role === 'delivery') {
      var del = orders.filter(function (o) { return myAgent && o.agent === myAgent.id && (o.status === 'dispatch' || o.status === 'delivering'); });
      out.push(list('Your deliveries (' + del.length + ')', del.map(function (o) { return orderLine(o, products, esc(o.address)); })));
    }
    var cases = store('complaints').all().filter(function (c) { return caseOpenSet(normCase(c)) && first(c.assigned) === mine; });
    if (cases.length) out.push(list('Your open cases (' + cases.length + ')', cases.map(function (c) {
      return '<li><a href="#" onclick="ttGoCase(\'' + c.id + '\');return false">' + esc(c.code) + '</a> · ' + esc(c.customer) + ' — ' + esc(c.summary) + '</li>';
    })));
    if (!steps.length && !cases.length && !(myAgent || u.role === 'delivery'))
      out.push('Nothing is assigned to <b>' + esc(u.name) + '</b> right now. ' + aPage('orders', 'See all orders') + '.');
    return out.join('');
  }
  function deliveredToday() {
    if (!allowed('orders') && !allowed('delivery')) return noAccess('orders');
    var products = store('products').all(), agents = store('agents').all();
    var rows = store('orders').all().filter(isDeliveredToday);
    return list('Delivered today (' + rows.length + ')', rows.map(function (o) {
      var a = byId(agents, o.agent);
      return orderLine(o, products, (a ? 'by ' + esc(a.name) : '') + (deliveredAt(o) ? ' at ' + new Date(deliveredAt(o)).toTimeString().slice(0, 5) : ''));
    }), '<br>' + aPage('delivery', 'Open Dispatch &amp; Delivery'));
  }
  function toPrepare() {
    if (!allowed('kitchen') && !allowed('orders')) return noAccess('kitchen');
    var orders = store('orders').all(), products = store('products').all();
    var rows = orders.filter(function (o) { return OPEN_KITCHEN.indexOf(o.status) >= 0; });
    var waiting = orders.filter(function (o) { return o.status === 'new'; });
    var qty = {};
    rows.concat(waiting).forEach(function (o) { o.items.forEach(function (it) { qty[it.product] = (qty[it.product] || 0) + it.qty; }); });
    var totals = Object.keys(qty).map(function (pid) {
      var p = byId(products, pid);
      return '<li><a href="#" onclick="ttGoRecipe(\'' + pid + '\');return false">' + esc(p ? p.name : '?') + '</a> × ' + qty[pid] + '</li>';
    });
    return list('To prepare — in production (' + rows.length + ')', rows.map(function (o) { return orderLine(o, products, isLate(o) ? '<b style="color:#b23a48">late</b>' : ''); })) +
      list('Waiting for confirmation (' + waiting.length + ')', waiting.map(function (o) { return orderLine(o, products); })) +
      (totals.length ? list('Total per item', totals) : '') +
      '<br>' + aPage('kitchen', 'Open the Kitchen');
  }
  function byStatus(st, title) {
    var products = store('products').all();
    var rows = store('orders').all().filter(function (o) { return o.status === st; });
    return list(title + ' (' + rows.length + ')', rows.map(function (o) { return orderLine(o, products, st === 'delivering' && o.track ? 'ETA ' + o.track.eta_min + ' min' : ''); }),
      '<br><a href="#" onclick="ttGoStage(\'' + st + '\');return false">Show them in Orders</a>');
  }
  function late() {
    var products = store('products').all();
    var rows = store('orders').all().filter(isLate);
    return list('Late or delayed (' + rows.length + ')', rows.map(function (o) { return orderLine(o, products); }));
  }
  function ordersToday() {
    var products = store('products').all();
    var rows = store('orders').all().filter(function (o) { return o.created === today(0); });
    return list('Orders placed today (' + rows.length + ')', rows.map(function (o) { return orderLine(o, products); }));
  }
  function client(name) {
    var n = lc(name), products = store('products').all();
    var orders = store('orders').all().filter(function (o) { return lc(o.customer) === n; });
    var cases = store('complaints').all().filter(function (c) { return lc(c.customer) === n; });
    var phone = (orders[0] || cases[0] || {}).phone;
    var out = '<b>Client: ' + esc(name) + '</b>' + (phone ? ' · <a href="tel:' + esc(phone.replace(/\s/g, '')) + '">' + esc(phone) + '</a>' : '');
    out += list('Orders (' + orders.length + ')', orders.map(function (o) { return orderLine(o, products); }));
    if (cases.length) out += list('Cases (' + cases.length + ')', cases.map(function (c) {
      return '<li><a href="#" onclick="ttGoCase(\'' + c.id + '\');return false">' + esc(c.code) + '</a> · ' + esc(c.summary) + ' <span style="color:#64808e">(' + esc(c.status) + ')</span></li>';
    }), '<br><a href="#" onclick="ttGoClientCases(\'' + esc(name).replace(/'/g, '\\\'') + '\');return false">All cases for ' + esc(name) + '</a>');
    return out;
  }
  function product(p) {
    var orders = store('orders').all(), products = store('products').all();
    var open = orders.filter(function (o) { return o.status !== 'delivered' && o.status !== 'cancelled' && o.items.some(function (it) { return it.product === p.id; }); });
    var q = 0; open.forEach(function (o) { o.items.forEach(function (it) { if (it.product === p.id) q += it.qty; }); });
    return '<b>' + esc(p.name) + '</b> · ' + esc(p.age || '') + ' · ' + money(p.price) +
      list('Open orders with it (' + open.length + ', ' + q + ' portions)', open.map(function (o) { return orderLine(o, products); })) +
      '<br><a href="#" onclick="ttGoRecipe(\'' + p.id + '\');return false">Open its recipe (BOM)</a>';
  }
  function ingredient(g) {
    if (!allowed('inventory')) return noAccess('inventory');
    var lots = store('lots').all().filter(function (l) { return l.ing === g.id && l.qty > 0; })
      .sort(function (a, b) { return a.expiry < b.expiry ? -1 : 1; });
    var total = lots.reduce(function (s, l) { return s + l.qty; }, 0);
    return '<b>' + esc(g.name) + '</b> · ' + total + ' ' + esc(g.unit) + ' in stock (min ' + g.min + ')' +
      list('Lots, next out first', lots.map(function (l, i) {
        return '<li>' + esc(l.lot) + ' · ' + l.qty + ' ' + esc(g.unit) + ' · expires ' + esc(l.expiry) + ' · ' + esc(l.loc) + (i === 0 ? ' <b>(next out)</b>' : '') + '</li>';
      })) + '<br><a href="#" onclick="ttGoIngredient(\'' + esc(g.name).replace(/'/g, '\\\'') + '\');return false">Open in Inventory</a>';
  }

  /* ── router ── */
  function has(q, words) { return words.some(function (w) { return new RegExp('(^|[^a-z])' + w).test(q); }); }
  window.ttOpsAsk = function (raw) {
    var q = lc(raw).replace(/[’']/g, '\'');
    var orders = store('orders').all();

    var code = q.match(/tt-?\s?\d{4}-?(\d{3})/) || q.match(/(?:order|commande|#)\s*(\d{3})\b/);
    if (code) {
      var o = orders.filter(function (x) { return x.code.slice(-3) === code[1]; })[0];
      if (o) { window.ttGoOrder(o.id); return 'Opening order ' + aOrder(o) + ' · ' + esc(o.customer) + ' (' + (STAGE_TXT[o.status] || o.status) + ').'; }
    }
    var cf = q.match(/cf-?\s?\d{4}-?(\d{3})/);
    if (cf) {
      var c = store('complaints').all().filter(function (x) { return x.code.slice(-3) === cf[1]; })[0];
      if (c) { window.ttGoCase(c.id); return 'Opening case <b>' + esc(c.code) + '</b> · ' + esc(c.customer).replace(/\.$/, '') + '.'; }
    }

    if (has(q, ['my ', 'mine', 'mes ', 'mon ', 'assigned to me', 'what should i', 'what do i', 'my$'])) return myWork();
    var words = q.split(/[^a-z0-9àâçéèêëîïôûùüÿœ]+/).filter(function (w) { return w.length >= 3; });
    var match = function (name) { var nw = lc(name).split(/[^a-z0-9àâçéèêëîïôûùüÿœ]+/).filter(function (w) { return w.length >= 3; });
      return nw.some(function (w) { return words.indexOf(w) >= 0 || words.indexOf(w.replace(/s$/, '')) >= 0 || words.indexOf(w + 's') >= 0; }); };

    var names = {};
    orders.concat(store('complaints').all()).forEach(function (x) { if (x.customer) names[x.customer] = 1; });
    var clients = Object.keys(names).filter(function (n) { return words.indexOf(first(n)) >= 0; });
    var prods = store('products').all().filter(function (p) { return match(p.name); });
    var ings = store('ingredients').all().filter(function (g) { return match(g.name); });
    var parts = clients.slice(0, 2).map(client).concat(prods.slice(0, 2).map(product), ings.slice(0, 2).map(ingredient));
    if (parts.length) return parts.join('<hr style="border:none;border-top:1px solid #e7e1d2;margin:10px 0">');

    if (has(q, ['deliver', 'livr'])) {
      if (has(q, ['road', 'way', 'route', 'out for'])) return byStatus('delivering', 'On the road');
      return deliveredToday();
    }
    if (has(q, ['prepar', 'prépar', 'kitchen', 'cuisine', 'cook', 'to make', 'production', 'produce', 'pending'])) return toPrepare();
    if (has(q, ['ready', 'dispatch', 'prêt', 'pret'])) return byStatus('dispatch', 'Ready to dispatch');
    if (has(q, ['road', 'on the way', 'en route', 'driving'])) return byStatus('delivering', 'On the road');
    if (has(q, ['late', 'delay', 'retard', 'overdue'])) return late();
    if (has(q, ['new order', 'unconfirmed', 'to confirm', 'nouvelle'])) return byStatus('new', 'Waiting for confirmation');
    if (has(q, ['today', 'aujourd'])) return ordersToday();

    return null;
  };
})();
