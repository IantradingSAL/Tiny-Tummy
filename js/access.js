/* Tiny Tummy — access by role, by page and by person (Team & Access).
   · Roles: the built-in roles plus roles you create (name, description, colour, permissions
     copied from an existing role). A created role behaves like any other: permissions,
     page access, people.
   · Page access: one row per dashboard page, read from the dashboard's own page list (VIEWS),
     so a page added later appears here automatically. Per role: Default (follows the page's
     permission) / Allowed / Blocked. Per person the same, overriding the role.
   · Person access ("Access" on each person): their role, every permission as Role default /
     Allowed / Blocked — including "Children's names & health data (GDPR)", which still needs
     the signed agreement — and their own page access.
   Effective rule: super admin → everything. Otherwise person override, else role, else default.
   Loaded after js/gdpr.js. Server side: supabase/schema4_access_gdpr.sql (tt_page_access, tt_user_perms). */
(function () {
  'use strict';
  if (typeof store !== 'function') return;

  var COLORS = ['#3a5ba8', '#b5531f', '#1d6e5b', '#7a4aa8', '#a3720d', '#b23a48', '#2f6fb0', '#55606b'];

  /* ── custom roles join the built-in ones ── */
  function customRoles() { return store('roles_custom').all(); }
  function loadRoles() {
    customRoles().forEach(function (r) {
      if (ROLES.indexOf(r.id) < 0) ROLES.push(r.id);
      ROLE_META[r.id] = { e: 'users', l: r.label, d: r.desc || 'Custom role', c: r.color || '#55606b', bg: '#eef0f2', custom: true };
    });
  }
  loadRoles();

  /* ── page list: every page the dashboard has, automatically ── */
  function pages() {
    var lab = {};
    document.querySelectorAll('#sidenav a[data-m]').forEach(function (a) { lab[a.dataset.m] = (a.querySelector('em') || {}).textContent || a.dataset.m; });
    var fall = { bom: 'Recipes · BOM', iso: 'ISO 22000', notify: 'Notifications', audit: 'Activity log', users: 'Team · Access', cahier: 'Cahier des charges' };
    return VIEWS.filter(function (m) { return RENDER[m]; }).map(function (m) { return { m: m, l: lab[m] || fall[m] || m.charAt(0).toUpperCase() + m.slice(1), k: MODULE_PERMS[m] || null }; });
  }
  function permLabel(k) { var x = PERM_KEYS.filter(function (p) { return p[0] === k; })[0]; return x ? x[1] : k; }

  /* ── rules ── */
  function rule(list, scope, who, key) {
    var r = list.filter(function (x) { return x.scope === scope && x.who === who && x.key === key; })[0];
    return r ? r.allowed : null;
  }
  function userPerm(uid, key) { var r = store('user_perms').all().filter(function (x) { return x.user === uid && x.key === key; })[0]; return r ? r.allowed : null; }
  function rolePerm(role, key) {
    if (role === 'super_admin') return true;
    var rp = store('role_perms').all().filter(function (x) { return x.role === role && x.key === key; })[0];
    return rp ? rp.allowed : roleDefault(role, key);
  }
  var baseCan = can;
  window.can = can = function (key) {
    var u = currentUser(); if (!u) return false;
    if (u.role === 'super_admin') return true;
    var o = userPerm(u.id, key);
    return o != null ? o : baseCan(key);
  };
  function pageRule(m, u) {
    var pa = store('page_access').all();
    var o = rule(pa, 'user', u.id, m); if (o != null) return { v: o, from: 'person' };
    o = rule(pa, 'role', u.role, m); if (o != null) return { v: o, from: 'role' };
    return null;
  }
  function pageDefault(m, role, uid) { // what the page's permission alone gives
    var k = MODULE_PERMS[m]; if (!k) return true;
    if (role === 'super_admin') return true;
    if (uid) { var o = userPerm(uid, k); if (o != null) return o; }
    return rolePerm(role, k);
  }
  window.pageAllowed = function (m) {
    var u = currentUser(); if (!u) return false;
    if (u.role === 'super_admin') return true;
    var r = pageRule(m, u);
    return r ? r.v : pageDefault(m, u.role, u.id);
  };
  // a page opened explicitly works even when its permission is off for the role
  var baseGuard = guard;
  window.guard = guard = function (m) { return window.pageAllowed(m) ? null : baseGuard(m); };

  function setRule(storeName, match, allowed) {
    var rows = store(storeName).all().filter(function (x) { return !Object.keys(match).every(function (k) { return x[k] === match[k]; }); });
    if (allowed != null) rows.push(Object.assign({}, match, { allowed: allowed }));
    store(storeName).save(rows);
  }
  function admin() { if (!can('users_manage')) { alert('Only a person who manages users can change access.'); return false; } return true; }

  /* ── Team & Access: new tabs "Page access" and "Roles" ── */
  var baseUsers = RENDER.users;
  RENDER.users = function () {
    var html = baseUsers.apply(this, arguments);
    var tabs = '<button class="' + (UV.tab === 'pages' ? 'on' : '') + '" onclick="uTab(\'pages\')">' + ic('grid') + ' Page access <span class="n">' + pages().length + '</span></button>' +
      '<button class="' + (UV.tab === 'roles' ? 'on' : '') + '" onclick="uTab(\'roles\')">' + ic('users') + ' Roles <span class="n">' + ROLES.length + '</span></button>';
    html = html.replace(/(<div class="u-tabs">[\s\S]*?Role permissions[\s\S]*?<\/button>)/, '$1' + tabs);
    if (UV.tab === 'team') html = html.replace(/onclick="editEmployee\('([^']+)'\)"/g, function (m0, id) { return 'onclick="editEmployee(\'' + id + '\')" data-acc="' + id + '"'; });
    if (UV.tab !== 'pages' && UV.tab !== 'roles') return addAccessButtons(html);
    var cut = html.indexOf('<div class="u-tabs">'), end = html.indexOf('</div>', html.indexOf('</button>', html.lastIndexOf('Roles <span class="n">'))) + 6;
    var head = html.slice(0, end);
    return head + (UV.tab === 'pages' ? pagesTab() : rolesTab());
  };
  function addAccessButtons(html) {
    if (!can('users_manage')) return html;
    return html.replace(/<button class="u-ib"([^>]*) data-acc="([^"]+)"/g, function (m0, attrs, id) {
      return '<button class="btn o s" onclick="accPerson(\'' + id + '\')" title="Permissions, page access, children\'s names">' + ic('lock') + ' Access</button><button class="u-ib"' + attrs;
    });
  }

  function cell(state, def, onclick) { // state: true / false / null (default)
    var v = state == null ? def : state;
    var lab = state == null ? (v ? 'default ✓' : 'default ✗') : (v ? 'Allowed' : 'Blocked');
    var col = state == null ? '#8a979e' : v ? '#2e8770' : '#b23a48';
    return '<button class="acc-c" style="--ac:' + col + ';' + (state == null ? '' : 'font-weight:800') + '" onclick="' + onclick + '" title="Click: Default → Allowed → Blocked">' + lab + '</button>';
  }
  function next(state) { return state == null ? true : state === true ? false : null; }

  function pagesTab() {
    var pa = store('page_access').all(), ps = pages();
    var roles = ROLES.filter(function (r) { return r !== 'super_admin'; });
    var headRow = roles.map(function (r) { var m = roleMeta(r); return '<th style="color:' + m.c + '">' + ic(m.e) + '<br>' + esc(m.l) + '</th>'; }).join('');
    var body = ps.map(function (p) {
      return '<tr><td><b>' + esc(p.l) + '</b><div class="il-sub muted">' + (p.k ? 'default: ' + esc(permLabel(p.k)) : 'open to everyone by default') + '</div></td>' +
        '<td style="text-align:center"><span class="muted">always</span></td>' +
        roles.map(function (r) { var st = rule(pa, 'role', r, p.m); return '<td style="text-align:center">' + cell(st, pageDefault(p.m, r), 'accPageRole(\'' + r + '\',\'' + p.m + '\')') + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<div class="panel"><h3>' + ic('grid') + ' Who can open which page</h3><p class="muted" style="margin:4px 0 10px">Every page of the dashboard is listed here automatically — a new page appears the day it is added. <b>Default</b> follows the page\'s permission (Role permissions tab); <b>Allowed</b> or <b>Blocked</b> overrides it for the whole role. Per person: <b>Access</b> on the person in the Team tab. The menu shows each person only the pages they may open.</p>' +
      '<div class="pm-wrap"><table class="pm acc-t"><thead><tr><th>Page</th><th style="color:#a36b00">' + ic('crown') + '<br>Super admin</th>' + headRow + '</tr></thead><tbody>' + body + '</tbody></table></div></div>';
  }
  window.accPageRole = function (role, m) {
    if (!admin()) return;
    var st = next(rule(store('page_access').all(), 'role', role, m));
    setRule('page_access', { scope: 'role', who: role, key: m }, st);
    logAct('Users', 'page access (role)', roleMeta(role).l + ' · ' + m + ' → ' + (st == null ? 'default' : st ? 'allowed' : 'blocked'));
    render();
  };

  function rolesTab() {
    var staff = store('staff').all();
    var cards = ROLES.map(function (r) {
      var m = roleMeta(r), n = staff.filter(function (u) { return u.role === r; }).length;
      return '<div class="panel" style="border-top:4px solid ' + m.c + ';margin:0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><b style="color:' + m.c + '">' + ic(m.e) + ' ' + esc(m.l) + '</b>' + (m.custom ? ' <span class="muted" style="font-size:.75rem">custom</span>' : '') +
        '<div class="muted" style="font-size:.84rem">' + esc(m.d) + '</div></div>' +
        (m.custom && can('users_manage') ? '<div class="il-acts"><button class="u-ib" title="Edit" onclick="accRoleDlg(\'' + r + '\')">' + ic('pencil') + '</button><button class="u-ib del" title="Delete" onclick="accRoleDel(\'' + r + '\')">' + ic('trash') + '</button></div>' : '') + '</div>' +
        '<div class="pill-row" style="margin-top:8px;font-size:.82rem"><span><b>' + n + '</b> people</span><span><b>' + rolePermCount(r) + '</b> / ' + PERM_KEYS.length + ' permissions</span></div></div>';
    }).join('');
    return '<div class="pagehead" style="margin-top:6px"><div><div class="sub">Built-in roles and the roles you create. A new role starts with the permissions of the role you copy, then you adjust it in <b>Role permissions</b> and <b>Page access</b>.</div></div>' +
      (can('users_manage') ? '<span class="pill-row"><button class="btn p" onclick="accRoleDlg()">' + ic('plus') + ' New role</button></span>' : '') + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">' + cards + '</div>';
  }
  window.accRoleDlg = function (id) {
    if (!admin()) return;
    var r = id ? byId(customRoles(), id) : null;
    showDlg('<h3>' + ic('users') + ' ' + (r ? 'Edit role' : 'New role') + '</h3><div class="frm" style="margin-top:10px">' +
      '<div class="row"><label>Role name<input id="ar-l" value="' + esc(r ? r.label : '') + '" placeholder="e.g. Quality officer"></label>' +
      '<label>Colour<select id="ar-c">' + COLORS.map(function (c) { return '<option value="' + c + '"' + (r && r.color === c ? ' selected' : '') + ' style="color:' + c + '">■ ' + c + '</option>'; }).join('') + '</select></label></div>' +
      '<label>What this role does<input id="ar-d" value="' + esc(r ? r.desc : '') + '" placeholder="e.g. Runs ISO 22000 checks and QC"></label>' +
      (r ? '' : '<label>Start with the permissions and page access of<select id="ar-b"><option value="">Nothing (all off)</option>' + ROLES.filter(function (x) { return x !== 'super_admin'; }).map(function (x) { return '<option value="' + x + '">' + esc(roleMeta(x).l) + '</option>'; }).join('') + '</select></label>') +
      '<button class="btn p" onclick="accRoleSave(\'' + (id || '') + '\')">' + ic('save') + ' ' + (r ? 'Save' : 'Create role') + '</button></div>');
  };
  window.accRoleSave = function (id) {
    var label = document.getElementById('ar-l').value.trim(); if (!label) { alert('Name the role'); return; }
    var roles = customRoles();
    if (!id && ROLES.some(function (x) { return roleMeta(x).l.toLowerCase() === label.toLowerCase(); })) { alert('A role with this name already exists.'); return; }
    var color = document.getElementById('ar-c').value, desc = document.getElementById('ar-d').value.trim();
    if (id) { var r = byId(roles, id); r.label = label; r.color = color; r.desc = desc; }
    else {
      id = 'r_' + uid(); roles.push({ id: id, label: label, color: color, desc: desc, created: nowTs(), by: currentUser().name });
      var base = document.getElementById('ar-b').value;
      var rp = store('role_perms').all();
      PERM_KEYS.forEach(function (pk) { rp.push({ role: id, key: pk[0], allowed: base ? rolePerm(base, pk[0]) : false }); });
      store('role_perms').save(rp);
      if (base) { var pa = store('page_access').all(); pa.filter(function (x) { return x.scope === 'role' && x.who === base; }).forEach(function (x) { pa.push({ scope: 'role', who: id, key: x.key, allowed: x.allowed }); }); store('page_access').save(pa); }
    }
    store('roles_custom').save(roles); loadRoles();
    logAct('Users', 'role saved', label);
    closeDlg(); rebuildWhoami(); render(); uToast('Role ' + label + ' saved');
  };
  window.accRoleDel = function (id) {
    if (!admin()) return;
    var r = byId(customRoles(), id); if (!r) return;
    if (store('staff').all().some(function (u) { return u.role === id; })) { alert('People still have the role ' + r.label + '. Give them another role first.'); return; }
    if (!confirm('Delete the role ' + r.label + '?')) return;
    store('roles_custom').save(customRoles().filter(function (x) { return x.id !== id; }));
    store('role_perms').save(store('role_perms').all().filter(function (x) { return x.role !== id; }));
    store('page_access').save(store('page_access').all().filter(function (x) { return !(x.scope === 'role' && x.who === id); }));
    ROLES.splice(ROLES.indexOf(id), 1); delete ROLE_META[id];
    logAct('Users', 'role deleted', r.label); render();
  };

  /* ── one person's access ── */
  window.accPerson = function (id) {
    if (!admin()) return;
    var u = byId(store('staff').all(), id); if (!u) return;
    var sa = u.role === 'super_admin';
    var up = store('user_perms').all(), pa = store('page_access').all();
    var signed = store('gdpr_signed').all().filter(function (r) { return r.user === u.id && !r.revoked; })[0];
    var kidState = up.filter(function (x) { return x.user === id && x.key === 'children_view'; })[0];
    var kid = '<div class="panel" style="border-color:#c9dcf0;background:#f3f8fd;margin:8px 0"><b>' + ic('lock') + ' Children\'s names &amp; health data (GDPR)</b>' +
      '<div class="muted" style="font-size:.84rem;margin:2px 0 6px">Role default: ' + (rolePerm(u.role, 'children_view') ? 'granted' : 'not granted') + ' · agreement: ' + (signed ? 'signed ' + esc(signed.at) : 'not signed — names stay hidden until ' + esc(u.name) + ' signs it') + '</div>' +
      (sa ? '<span class="muted">Super admin — always granted (agreement still required).</span>' :
      '<div class="u-tabs" style="margin:0">' + [[null, 'Role default'], [true, 'Grant'], [false, 'Refuse']].map(function (o) {
        var on = (kidState ? kidState.allowed : null) === o[0];
        return '<button class="' + (on ? 'on' : '') + '" onclick="accUserPerm(\'' + id + '\',\'children_view\',' + o[0] + ')">' + o[1] + '</button>'; }).join('') + '</div>') + '</div>';
    var perms = PERM_KEYS.filter(function (pk) { return pk[0] !== 'children_view'; }).map(function (pk) {
      var st = rule(up.map(function (x) { return { scope: 'u', who: x.user, key: x.key, allowed: x.allowed }; }), 'u', id, pk[0]);
      return '<tr><td>' + ic(PERM_ICON[pk[0]] || 'check') + ' ' + esc(pk[1]) + '</td><td style="text-align:center">' + (sa ? '<span class="muted">always</span>' : cell(st, rolePerm(u.role, pk[0]), 'accUserPerm(\'' + id + '\',\'' + pk[0] + '\',' + JSON.stringify(next(st)) + ')')) + '</td></tr>';
    }).join('');
    var pg = pages().map(function (p) {
      var st = rule(pa, 'user', id, p.m), roleSt = rule(pa, 'role', u.role, p.m);
      var def = roleSt != null ? roleSt : pageDefault(p.m, u.role, id);
      return '<tr><td>' + esc(p.l) + '</td><td style="text-align:center">' + (sa ? '<span class="muted">always</span>' : cell(st, def, 'accUserPage(\'' + id + '\',\'' + p.m + '\')')) + '</td></tr>';
    }).join('');
    var rm = roleMeta(u.role);
    showDlg('<h3>' + ic('lock') + ' Access — ' + esc(u.name) + '</h3>' +
      '<div class="frm" style="margin-top:8px"><label>Role<select onchange="setRole(\'' + id + '\',this.value);accPerson(\'' + id + '\')"' + (u.id === 'u1' ? ' disabled' : '') + '>' +
      ROLES.map(function (r) { return '<option value="' + r + '"' + (r === u.role ? ' selected' : '') + '>' + esc(roleMeta(r).l) + '</option>'; }).join('') + '</select></label></div>' +
      kid +
      '<p class="muted" style="font-size:.82rem;margin:6px 0">Each line follows the role (<b>' + esc(rm.l) + '</b>) unless set for this person. Click to cycle Default → Allowed → Blocked.</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="acc-2">' +
      '<div><h4 style="margin:4px 0">Permissions</h4><table class="t reg acc-t"><tbody>' + perms + '</tbody></table></div>' +
      '<div><h4 style="margin:4px 0">Pages</h4><table class="t reg acc-t"><tbody>' + pg + '</tbody></table></div></div>');
  };
  window.accUserPerm = function (id, key, val) {
    if (!admin()) return;
    setRule('user_perms', { user: id, key: key }, val);
    var u = byId(store('staff').all(), id);
    logAct('Users', 'person permission', (u ? u.name : id) + ' · ' + permLabel(key) + ' → ' + (val == null ? 'role default' : val ? 'granted' : 'refused'));
    accPerson(id); render();
  };
  window.accUserPage = function (id, m) {
    if (!admin()) return;
    var st = next(rule(store('page_access').all(), 'user', id, m));
    setRule('page_access', { scope: 'user', who: id, key: m }, st);
    var u = byId(store('staff').all(), id);
    logAct('Users', 'page access (person)', (u ? u.name : id) + ' · ' + m + ' → ' + (st == null ? 'default' : st ? 'allowed' : 'blocked'));
    accPerson(id); render();
  };

  var css = document.createElement('style');
  css.textContent = '.acc-c{border:1px solid var(--ac);color:var(--ac);background:#fff;border-radius:999px;padding:3px 10px;font-size:.76rem;cursor:pointer;white-space:nowrap}' +
    '.acc-t td{padding:5px 8px;vertical-align:middle}dialog:has(.acc-2){max-width:900px;width:96vw}@media (max-width:700px){.acc-2{grid-template-columns:1fr!important}}';
  document.head.appendChild(css);
})();
