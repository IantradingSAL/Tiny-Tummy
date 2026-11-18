/* Tiny Tummy — children's personal data: need-to-know access + signed confidentiality agreement.
   A child's name (and anything that identifies the child) is shown in the dashboard only to a
   person who
     1. holds the permission "Children's names & health data (GDPR)" (Team & Access), and
     2. has signed the current confidentiality agreement (read it, tick, type the full name, sign).
   Everyone else sees a stable code ("Child #K7Q2"). Allergies stay visible to everyone because they
   are a food-safety control (STOP alert, QC, labels). Signed agreements are kept (who, version,
   date, typed name, signature), can be printed, and can be revoked — revoking hides the names again.
   Team & Access → "GDPR agreements" lists every person, their permission and signature.
   Loaded after js/dash-ui.js. Server side: supabase/schema4_gdpr.sql. */
(function () {
  'use strict';
  if (typeof store !== 'function') return;

  var VERSION = 'GDPR-CONF-1.0';
  var VERSION_DATE = '18/11/2026';
  PERM_KEYS.push(['children_view', 'Children\'s names & health data (GDPR — agreement required)']);
  PERM_ICON.children_view = 'lock';

  function signedRow(userId) {
    return store('gdpr_signed').all().filter(function (r) { return r.user === userId && r.version === VERSION && !r.revoked; })[0] || null;
  }
  window.gdprCanSee = function () {
    var u = currentUser();
    return !!u && can('children_view') && !!signedRow(u.id);
  };

  /* ── the agreement ── */
  var TEXT = [
    ['Who this binds', 'I work for Tiny Tummy (the "Company") as an employee, contractor or volunteer. To do my job I may see personal data of the families the Company serves — in particular <b>children\'s names, dates of birth, allergies, diet and health notes, growth records, photos</b> and the parents\' contact details. Data about a child\'s health is a special category of personal data and gets the highest protection.'],
    ['Need to know only', 'I will open and use this data only when my work requires it (preparing, checking, labelling or delivering an order, answering the family, food safety). I will not look up a child or a family out of curiosity, for anyone else, or for any purpose other than the service the family asked for.'],
    ['No copying, no sharing', 'I will not copy, photograph, screenshot, print, download, forward or post this data — on paper, on my phone, in WhatsApp or social media, or to anyone inside or outside the Company who does not need it for their work. Printed labels and documents stay in the kitchen and are destroyed when no longer needed.'],
    ['Security', 'I keep my login private, lock or close the dashboard when I leave the screen, and never let anyone use my account. I use only the devices and channels the Company approves.'],
    ['Report at once', 'If I see, cause or suspect any loss, leak, wrong access or misuse of this data, I tell the manager <b>immediately and at the latest within 24 hours</b>, so the Company can act and, where required, notify the authority and the families within the legal deadline.'],
    ['After I leave', 'This duty of confidentiality continues after my work with the Company ends. On leaving I return or delete any data I hold and my access is removed.'],
    ['Monitoring', 'I understand that my access to the dashboard is logged (who, what, when) and may be reviewed, and that the Company may withdraw my access at any time.'],
    ['Consequences', 'I understand that a breach of this agreement may lead to disciplinary action up to dismissal, and may engage my personal liability under the applicable law.'],
    ['Legal basis', 'This agreement implements the Company\'s obligations under the EU General Data Protection Regulation (GDPR) — in particular Articles 5 (data minimisation, integrity and confidentiality), 9 (health data), 28(3)(b) and 29 (persons authorised to process are bound to confidentiality) and 32(4) — and under Lebanese Law No. 81 of 10 October 2018 on Electronic Transactions and Personal Data.']
  ];
  function agreementHtml(forPrint) {
    return '<div class="' + (forPrint ? '' : 'gd-text') + '"><p><b>Confidentiality agreement — children\'s and families\' personal data</b><br><span class="muted">Version ' + VERSION + ' of ' + VERSION_DATE + '</span></p>' +
      TEXT.map(function (t, i) { return '<p><b>' + (i + 1) + '. ' + t[0] + '.</b> ' + t[1] + '</p>'; }).join('') + '</div>';
  }

  window.gdprExplain = function () {
    var u = currentUser();
    logAct('Team', 'GDPR hidden name clicked', u.name, 'click');
    if (!can('children_view')) {
      showDlg('<h3>' + ic('lock') + ' Child\'s name hidden</h3><p>Children\'s names and health data are shown only to the people who need them, and only after they sign the confidentiality agreement (GDPR).</p>' +
        '<p>Your role does not include the permission <b>Children\'s names &amp; health data</b>. The allergies stay visible to you — they are a food-safety check.</p>' +
        '<p class="muted">If your work needs the names, ask a super admin to grant it in <b>Team · Access</b>; you will then sign the agreement.</p>');
      return;
    }
    gdprSign();
  };

  var SIG = { drawn: false };
  window.gdprSign = function () {
    var u = currentUser();
    SIG.drawn = false;
    showDlg('<h3>' + ic('lock') + ' Sign the confidentiality agreement</h3>' +
      '<p class="muted" style="margin:4px 0 8px">You have been given access to children\'s names and health data. Read the agreement, then sign it to see them.</p>' +
      '<div style="max-height:300px;overflow:auto;border:1px solid var(--line,#e7e1d2);border-radius:10px;padding:10px 12px;background:#fffdf9;font-size:.86rem">' + agreementHtml(false) + '</div>' +
      '<div class="frm" style="margin-top:10px">' +
      '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:600"><input type="checkbox" id="gd-read" style="width:auto;margin-top:3px"> I have read this agreement and I understand it.</label>' +
      '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:600"><input type="checkbox" id="gd-agree" style="width:auto;margin-top:3px"> I agree to keep children\'s and families\' data confidential as described, during and after my work with Tiny Tummy.</label>' +
      '<div class="row"><label>Full name (as on your ID)<input id="gd-name" value="' + esc(String(u.name || '').replace(/\s*[—(].*$/, '')) + '"></label><label>Role<input value="' + esc(u.role) + '" disabled></label></div>' +
      '<label>Signature<canvas id="gd-sig" width="560" height="140" style="width:100%;height:140px;border:1px dashed #c9bfa9;border-radius:10px;background:#fff;touch-action:none"></canvas></label>' +
      '<div class="pill-row"><button class="btn o s" onclick="gdprSigClear()">' + ic('refresh') + ' Clear signature</button></div>' +
      '<button class="btn p" onclick="gdprSave()">' + ic('pen') + ' Sign agreement</button></div>');
    pad(document.getElementById('gd-sig'));
    logAct('Team', 'GDPR agreement opened', u.name, 'page');
  };
  function pad(c) {
    if (!c) return;
    var g = c.getContext('2d'), down = false, last = null;
    g.lineWidth = 2.4; g.lineCap = 'round'; g.strokeStyle = '#17283a';
    function pt(e) { var r = c.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; return { x: (t.clientX - r.left) * c.width / r.width, y: (t.clientY - r.top) * c.height / r.height }; }
    function start(e) { e.preventDefault(); down = true; last = pt(e); }
    function move(e) { if (!down) return; e.preventDefault(); var p = pt(e); g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); last = p; SIG.drawn = true; }
    function end() { down = false; }
    c.addEventListener('mousedown', start); c.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    c.addEventListener('touchstart', start, { passive: false }); c.addEventListener('touchmove', move, { passive: false }); c.addEventListener('touchend', end);
  }
  window.gdprSigClear = function () { var c = document.getElementById('gd-sig'); if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); SIG.drawn = false; };
  window.gdprSave = function () {
    var u = currentUser(), name = document.getElementById('gd-name').value.trim();
    if (!document.getElementById('gd-read').checked || !document.getElementById('gd-agree').checked) { alert('Tick both boxes to sign.'); return; }
    if (name.length < 3 || name.indexOf(' ') < 0) { alert('Type your full name (first and last name).'); return; }
    if (!SIG.drawn) { alert('Sign in the box with your finger or the mouse.'); return; }
    var rows = store('gdpr_signed').all();
    var row = { id: uid(), user: u.id, user_name: u.name, role: u.role, version: VERSION, name: name, at: nowTs(), ts: Date.now(), date: today(0),
      sig: document.getElementById('gd-sig').toDataURL('image/png'), ua: navigator.userAgent.slice(0, 160), revoked: null };
    rows.unshift(row); store('gdpr_signed').save(rows);
    logAct('Team', 'GDPR confidentiality agreement signed', name + ' · ' + u.role + ' · ' + VERSION);
    uToast('Agreement signed — children\'s names are now visible to you');
    closeDlg(); render();
  };
  window.gdprRevoke = function (id) {
    if (!(can('users_manage'))) { alert('Only a person who manages users can revoke an agreement.'); return; }
    var rows = store('gdpr_signed').all(), r = byId(rows, id); if (!r) return;
    var why = prompt('Revoke ' + r.name + '\'s agreement (their access to children\'s names stops now). Reason:', 'Left the company');
    if (why === null) return;
    r.revoked = { at: nowTs(), by: currentUser().name, why: why };
    store('gdpr_signed').save(rows);
    logAct('Team', 'GDPR agreement revoked', r.name + ' · ' + why);
    render();
  };
  window.gdprPrint = function (id) {
    var r = byId(store('gdpr_signed').all(), id); if (!r) return;
    var e = function (x) { return esc(x == null ? '' : x); };
    var w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print the agreement.'); return; }
    w.document.open();
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Confidentiality agreement — ' + e(r.name) + '</title><style>body{font-family:Helvetica,Arial,sans-serif;color:#17283a;margin:36px;font-size:12.5px;line-height:1.5}h1{font-size:18px;margin:0 0 4px}.muted{color:#64808e}.box{border:1px solid #d9d2c3;border-radius:8px;padding:12px;margin-top:16px}img{max-width:320px;border-bottom:1px solid #17283a}@media print{body{margin:16mm}}</style></head><body>' +
      '<h1>Tiny Tummy</h1>' + agreementHtml(true) +
      '<div class="box"><b>Signed by</b> ' + e(r.name) + ' · role ' + e(r.role) + ' · dashboard account ' + e(r.user_name) + '<br><b>Date</b> ' + e(r.at) + ' · version ' + e(r.version) +
      '<br><b>Statements</b> read and understood; agrees to keep the data confidential during and after the work.<br><img src="' + r.sig + '" alt="Signature"><div class="muted">Signature</div>' +
      (r.revoked ? '<p><b>Revoked</b> ' + e(r.revoked.at) + ' by ' + e(r.revoked.by) + ' — ' + e(r.revoked.why) + '</p>' : '') + '</div>' +
      '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>');
    w.document.close();
    logAct('Team', 'GDPR agreement printed', r.name);
  };

  /* ── reminder where children appear, for a person who has the permission but has not signed ── */
  function banner() {
    var u = currentUser();
    if (!u || !can('children_view') || signedRow(u.id)) return '';
    return '<div class="panel" style="display:flex;gap:10px;align-items:center;padding:10px 14px;border-color:#c98a1b;background:#fdf6e8;margin-bottom:10px">' + ic('lock') +
      '<div style="flex:1">You have access to children\'s names, but you have not signed the confidentiality agreement yet — names stay hidden until you do.</div>' +
      '<button class="btn p s" onclick="gdprSign()">' + ic('pen') + ' Read and sign</button></div>';
  }
  ['orders', 'kitchen', 'overview'].forEach(function (m) {
    var base = RENDER[m]; if (!base) return;
    RENDER[m] = function () { return banner() + base.apply(this, arguments); };
  });

  /* ── older texts (notifications history, activity log) never show a name to someone without access ── */
  function maskNames(html) {
    if (childCanSee()) return html;
    var kids = store('children').all();
    kids.forEach(function (c) {
      if (!c.name || c.name.length < 2) return;
      html = html.replace(new RegExp('(^|[^\\w])' + c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w])', 'g'), function (m, pre) { return pre + childCode(c); });
    });
    return html;
  }
  ['notify', 'audit'].forEach(function (m) {
    var base = RENDER[m]; if (!base) return;
    RENDER[m] = function () { return maskNames(base.apply(this, arguments)); };
  });

  /* ── Team & Access: register of agreements ── */
  var baseUsers = RENDER.users;
  RENDER.users = function () {
    var html = baseUsers.apply(this, arguments);
    if (UV.tab !== 'team') return html;
    var staff = store('staff').all(), sig = store('gdpr_signed').all();
    function last(u) { return sig.filter(function (r) { return r.user === u.id && r.version === VERSION; })[0] || null; }
    function hasPerm(u) { if (u.role === 'super_admin') return true; var rp = store('role_perms').all().filter(function (x) { return x.role === u.role && x.key === 'children_view'; })[0]; return rp ? rp.allowed : roleDefault(u.role, 'children_view'); }
    var me = currentUser();
    var list = ttList({ id: 'gdpr-reg', page: 'users', noViews: true, rows: staff, ph: 'Search person…',
      search: function (u) { return u.name + ' ' + u.role; },
      filters: [{ k: 'st', l: 'Status', opts: [['ok', 'Names visible'], ['unsigned', 'Access, not signed'], ['none', 'No access']], test: function (u, x) { var r = last(u), ok = hasPerm(u) && r && !r.revoked; return x === 'ok' ? ok : x === 'unsigned' ? hasPerm(u) && !(r && !r.revoked) : !hasPerm(u); } }],
      cols: [
        { k: 'name', l: 'Person', html: function (u) { return '<b>' + esc(u.name) + '</b><div class="il-sub muted">' + esc(u.role) + '</div>'; }, text: function (u) { return u.name; } },
        { k: 'perm', l: 'Permission', html: function (u) { return hasPerm(u) ? '<span class="ostat" style="--sc:#2f6fb0">granted</span>' : '<span class="muted">not granted</span>'; }, text: function (u) { return hasPerm(u) ? 'granted' : 'no'; } },
        { k: 'sig', l: 'Agreement ' + VERSION, wrap: true, html: function (u) { var r = last(u); return !r ? '<span class="muted">not signed</span>' : r.revoked ? '<span class="ostat" style="--sc:#b23a48">revoked ' + esc(r.revoked.at) + '</span><div class="il-sub muted">' + esc(r.revoked.why) + '</div>' : '<span class="ostat" style="--sc:#2e8770">signed ' + esc(r.at) + '</span><div class="il-sub muted">' + esc(r.name) + '</div>'; },
          text: function (u) { var r = last(u); return !r ? 'not signed' : r.revoked ? 'revoked ' + r.revoked.at : 'signed ' + r.at; } },
        { k: 'see', l: 'Sees names', html: function (u) { var r = last(u); return hasPerm(u) && r && !r.revoked ? '<b style="color:#2e8770">yes</b>' : '<span class="muted">no — codes only</span>'; } },
        { k: 'act', l: '', csv: false, sortable: false, html: function (u) {
          var r = last(u), b = '';
          if (r) b += '<button class="u-ib" title="Print the signed agreement" onclick="gdprPrint(\'' + r.id + '\')">' + ic('save') + '</button>';
          if (r && !r.revoked && can('users_manage')) b += '<button class="u-ib del" title="Revoke" onclick="gdprRevoke(\'' + r.id + '\')">' + ic('x') + '</button>';
          if (u.id === me.id && hasPerm(u) && !(r && !r.revoked)) b += '<button class="btn p s" onclick="gdprSign()">' + ic('pen') + ' Sign</button>';
          return '<div class="il-acts">' + b + '</div>'; } }] });
    return html + '<div class="panel" style="margin-top:14px"><h3>' + ic('lock') + ' GDPR — who may see children\'s names</h3>' +
      '<p class="muted" style="margin:4px 0 10px">Names and health data of children are visible only to a person with the permission <b>Children\'s names &amp; health data</b> who has signed the confidentiality agreement (' + VERSION + '). Everyone else sees a code; allergies stay visible for food safety. Grant the permission in the role cards above.</p>' + list + '</div>';
  };
})();
