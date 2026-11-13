/* Tiny Tummy — Help assistant (every page)
   A floating "Help" button that explains the page you are on and answers
   questions about it. Answers come from the knowledge base below, matched
   by keywords, so it works on the static site with no server. The
   dashboard's help follows the module that is open.
   To upgrade to a free-text AI assistant later: send the question and the
   page id to a Supabase edge function that calls the Claude API with this
   knowledge base as context, and show its reply in the same panel. */
(function () {
  'use strict';
  var WA = 'https://wa.me/96170341002';

  /* ── knowledge base ──────────────────────────────────────────────────── */
  var SITE_COMMON = [
    ['How do I order?', 'order buy purchase how whatsapp', 'Open the <a href="products.html">Menu</a>, choose a meal and tap <b>Order on WhatsApp</b> — your message is ready to send. You can also write to us directly on <a href="' + WA + '" target="_blank" rel="noopener">WhatsApp +961 70 341 002</a>.'],
    ['When will my order arrive?', 'delivery deliver when arrive time next day sunday 3pm hours', 'Order before <b>3:00 PM</b> and it arrives the <b>next day</b>. Otherwise within <b>48 hours</b>. We deliver everywhere in Lebanon, except on Sundays.'],
    ['Which ages are the meals for?', 'age ages month months baby toddler old 6m 7m suitable', 'All <b>purees are suitable from 6 months</b> and all <b>meals from 7 months</b>. Each product on the Menu shows its age tag (for example 6M+, 12M+ or 24M+).'],
    ['What is in the food?', 'ingredients salt sugar preservatives healthy natural what inside contain', 'Real ingredients only: fresh produce and honest recipes designed by dietitians and cooked by chefs. <b>No added salt, no added sugar, no preservatives.</b> In the <a href="portal.html">Family portal</a> you can see every ingredient of every meal your child ate.'],
    ['My child has an allergy', 'allergy allergies allergic nut egg milk dairy gluten intolerance', 'Tell us when you order, and add the allergy to your child\'s profile in the <a href="portal.html">Family portal</a> — our kitchen then sees a red alert on every order for your child. For anything medical, please follow your doctor\'s advice.'],
    ['How do I store the meals?', 'store storage fridge refrigerate keep freeze freezer', 'Keep meals <b>refrigerated</b> as soon as they arrive, and follow the storage guidance printed on each label.'],
    ['What is the Family portal?', 'portal family record carnet diary account login doctor growth', 'Your child\'s food &amp; growth record: every meal and its ingredients, foods tried, weight and height, monthly photos, vaccine reminders and your doctor\'s notes. <a href="portal.html">Open the Family portal</a>.'],
    ['How can I contact you?', 'contact phone call email instagram facebook reach talk human', 'WhatsApp <a href="' + WA + '" target="_blank" rel="noopener">+961 70 341 002</a> or call <b>+961 71 008 604</b>, email <b>tinytummylb@outlook.com</b>, or Instagram <b>@tinytummylb</b>.'],
    ['How much does it cost?', 'price prices cost how much pay payment money', 'Prices are shown on each product in the <a href="products.html">Menu</a> when available. For bundles, programs and payment options, ask us on <a href="' + WA + '" target="_blank" rel="noopener">WhatsApp</a>.'],
    ['Do you make birthday cakes?', 'cake cakes birthday party celebration', 'Yes — baby-friendly celebration cakes (12M+). Ask us on <a href="' + WA + '" target="_blank" rel="noopener">WhatsApp</a> about flavours and dates.']
  ];

  var KB = {
    'site-home': { title: 'Home', intro: 'Welcome to Tiny Tummy: healthy puree and finger meals for babies and toddlers, designed by dietitians, cooked by chefs and delivered fresh across Lebanon.', qa: [] },
    'site-menu': { title: 'Menu', intro: 'Every meal we make. Use the tabs to filter Purees, Finger Food or Cakes, check the age tag on each product, and tap <b>Order on WhatsApp</b>.', qa: [
      ['How do I filter the menu?', 'filter tab purees finger cakes category show only', 'Use the tabs above the products: <b>All</b>, <b>Purees</b>, <b>Finger Food</b> or <b>Cakes</b>.'],
      ['What does 6M+ mean?', '6m 7m 12m 24m tag label mean plus', 'It is the minimum age: <b>6M+</b> means from 6 months, <b>24M+</b> from 2 years.']] },
    'site-why': { title: 'Why us', intro: 'Why parents choose Tiny Tummy: dietitian designed, chef crafted, real ingredients only, diverse textures, fresh delivery — and as seen on Shark Tank.', qa: [
      ['Why are the first 1,000 days important?', '1000 days brain development first important why', 'About 80% of a baby\'s brain forms in the first 1,000 days of life, so every meal is a chance to support healthy growth and development.']] },
    'site-how': { title: 'How it works', intro: 'Three steps: choose your meals, we cook them fresh, and we deliver to your door — next day if you order before 3 PM.', qa: [] },
    'site-contact': { title: 'Contact', intro: 'Talk to us by WhatsApp, phone or email — or fill in the form, which opens WhatsApp with your message ready to send.', qa: [
      ['How does the form work?', 'form send message submit', 'Fill in your name, phone and message, then tap <b>Send on WhatsApp</b> — WhatsApp opens with your message ready; just press send.']] },
    'site-report': { title: 'Project report', intro: 'The Tiny Tummy Standard: how the kitchen runs ISO 22000 food safety, lot traceability, quality gates and the delivery protocol.', qa: [] },

    'portal': { title: 'Family portal', intro: 'Your child\'s record: food diary, foods tried, growth, photos, vaccines and doctor notes. Pick a child at the top, then use the tabs.', qa: [
      ['How do I add a child?', 'add child new baby second kid profile create', 'Tap <b>Add child</b> next to your children\'s names, enter first name and date of birth, allergies, diet notes and your doctor, then <b>Save</b>.'],
      ['Where do I see what my child ate?', 'diary meals ate food eaten ingredients order history', 'Open the <b>Food diary</b> tab and tap any meal: you see every ingredient, the amount per portion and the batch number.'],
      ['What is "Foods tried"?', 'foods tried new taste first list introduced', 'A list built automatically from delivered meals, with the date each food was first eaten and a <b>New</b> tag for recent ones — useful to introduce one new food every 3 days.'],
      ['How do I add weight and height?', 'weight height measure growth chart kg cm add', 'Open <b>Growth</b>, enter the date, weight (kg) and/or height (cm) and tap <b>Save</b>. The charts update straight away.'],
      ['How do I add a photo?', 'photo picture album upload image month', 'Open <b>Photos</b> and tap <b>Add this month\'s photo</b>. One photo a month builds a growing-up album.'],
      ['How do I share with my doctor?', 'doctor share link send pediatrician see view record give open', 'Tap <b>Share with doctor</b>, then send the private link by WhatsApp or email. Your doctor sees the record and can add notes and vaccines, which appear here as reminders.'],
      ['How do I stop the doctor\'s access?', 'revoke stop remove access cancel link new', 'In <b>Profile → Doctor access</b> tap <b>New link (revoke old)</b>. The old link stops working immediately.'],
      ['Where are vaccine reminders?', 'vaccine vaccination reminder visit appointment health', 'In the <b>Health</b> tab. Reminders also appear at the top of the page from 7 days before the due date. Tap <b>Done</b> once it\'s given.'],
      ['What are the "Bravo" messages?', 'bravo milestone stage month congratulations next', 'When your child reaches 6, 7, 9, 12, 18, 24 or 36 months we tell you which food stage starts and suggest suitable meals. It\'s general guidance — always follow your doctor.'],
      ['How do I add an allergy?', 'allergy allergies add edit profile', 'Open <b>Profile</b> → <b>Edit</b> and type allergies separated by commas (for example <i>Eggs, Walnuts</i>). Our kitchen sees them on every order.'],
      ['Is my data private?', 'private privacy safe secure data who see', 'Only your family can see your children\'s records, and only a doctor you send a link to. In this demo the data stays in your own browser.']] },

    'dash-overview': { title: 'Overview', intro: 'Today across the whole operation: orders, pipeline, revenue, margin, stock alerts, complaints and ISO readiness — plus the Advisor\'s tips.', qa: [
      ['What is the Advisor?', 'advisor tips recommendations suggestions', 'Live tips computed from the data: expiring lots, low stock, overdue invoices, follow-ups due, unconfirmed orders and birthdays (cupcake to send).'],
      ['Can I click the boxes?', 'click tiles boxes kpi', 'Yes — most boxes open the matching module.']] },
    'dash-orders': { title: 'Orders', intro: 'Every order from Placed to Delivered. Tap a stage tile to filter, switch between Board and List, and tap an order to open it.', qa: [
      ['How do I move an order forward?', 'confirm move next stage status kitchen dispatch', 'Open the order and use the button at the bottom: Confirm → Send to kitchen → Kitchen done → QC pass → Dispatch → Delivered.'],
      ['How do I create an order?', 'new order create add', 'Tap <b>New order</b> at the top right.'],
      ['What does "late" mean?', 'late overdue red', 'The kitchen has passed the planned finish time for that order.'],
      ['Why is there a red STOP?', 'stop allergy red alert child', 'The order contains an ingredient the child is allergic to (from the Family portal). Call the parent before cooking.']] },
    'dash-programs': { title: 'Age programs', intro: 'Subscription meal programs per age band, with weekly plans, enrolments and monthly recurring revenue.', qa: [
      ['How do I enrol a family?', 'enroll enrol add family subscriber', 'Tap <b>Enroll</b> on the program card; use <b>−</b> to remove one.']] },
    'dash-kitchen': { title: 'Kitchen', intro: 'The production floor: each order\'s steps with timers, the station load chart and who is assigned. Steps are assigned automatically.', qa: [
      ['How are people assigned?', 'assign assigned automatic who person auto', 'Automatically when an order is confirmed: only people allowed at that station, kitchen staff first, least busy first. Change anyone from the dropdown, or tap <b>Re-balance</b>.'],
      ['How do I start or finish a step?', 'start done finish timer step', 'Tap <b>Start</b> to run the timer, then <b>Done</b>. Cook and Blast chill ask for the measured temperature (critical control points).'],
      ['Why can\'t someone start a step?', 'cannot refused station permission blocked', 'They don\'t hold that kitchen station. A manager can grant it in <b>Team · Access</b>.'],
      ['What is the alarm?', 'alarm overdue buzzer timer late', 'When a step runs past its planned minutes, the timer turns red and a buzzer sounds while the page is open.']] },
    'dash-bom': { title: 'Recipes · BOM', intro: 'Each recipe\'s ingredients per portion and process steps with minutes. Tap a recipe to open it; costs and margins update live.', qa: [
      ['How is the cost calculated?', 'cost margin calculate full food price', 'Full cost = ingredient cost per portion + kitchen time (minutes × hourly rate ÷ portions per batch). Margin = price − full cost.'],
      ['How do I add an ingredient line?', 'add ingredient line recipe', 'Open the recipe and tap <b>Add ingredient line</b>, then choose the ingredient and quantity.'],
      ['What do the step names do?', 'step name cook chill portion pack ccp', 'Names containing <i>cook</i> or <i>chill</i> become temperature checks, <i>portion</i> opens the portioning sheet and <i>pack</i> prints the lot label.']] },
    'dash-inventory': { title: 'Inventory', intro: 'Every ingredient and lot. Low items are re-ordered automatically and lots are used first-expired-first-out.', qa: [
      ['How do I receive stock?', 'receive delivery stock arrived lot add', 'Tap <b>Receive stock</b>, pick the item, then enter lot number, quantity, expiry and location.'],
      ['What does Auto reorder do?', 'auto reorder requisition automatic minimum', 'When the item falls below its minimum, a requisition opens automatically to refill it to its maximum.'],
      ['What is FEFO / next out?', 'fefo next out expire first', 'First-Expired-First-Out: the kitchen always uses the lot that expires soonest — marked <b>next out</b>.'],
      ['How do I write off a lot?', 'write off expired damaged remove bin', 'Tap the bin icon on the lot (or <b>Write off</b> in Needs attention) and give the reason.']] },
    'dash-requisitions': { title: 'Requisitions', intro: 'Purchase requests: opened automatically below minimum, approved by a manager, then received as a lot.', qa: [
      ['How do I approve?', 'approve requisition purchase', 'Tap <b>Approve</b> on a pending line; once the goods arrive tap <b>Receive</b>.']] },
    'dash-delivery': { title: 'Dispatch & Delivery', intro: 'Ready orders get the least-busy driver automatically — one tap dispatches. Track every delivery live.', qa: [
      ['How is the driver chosen?', 'driver agent choose auto assign', 'The on-duty driver with the fewest deliveries right now is pre-selected (marked Auto). You can pick another.'],
      ['How do I report a delay?', 'delay late traffic 15', 'Tap the alarm button on the delivery card: +15 minutes, and the customer is told automatically.'],
      ['How do I take a driver off duty?', 'off duty switch driver agent', 'Use the switch next to the driver in <b>Delivery agents</b>. Off-duty drivers are never chosen.']] },
    'dash-suppliers': { title: 'Suppliers · Payables', intro: 'Suppliers and staff payments in one book: invoices, paid/unpaid/overdue, spend charts. Posting a goods invoice receives its lots into stock.', qa: [
      ['How do I post an invoice?', 'post invoice add bill', 'Tap <b>Post invoice</b>, choose the provider and add the lines; goods lines go straight into stock.'],
      ['How do I mark it paid?', 'paid pay mark unpay', 'Tap <b>Mark paid</b> on the invoice row (or <b>Unpay</b> to undo).']] },
    'dash-iso': { title: 'ISO 22000', intro: 'The food-safety readiness checklist, clause by clause. Set each item to done, in progress or not done, with owner and evidence.', qa: [
      ['How do I update an item?', 'update flag status done progress', 'Change the coloured dropdown on the row and fill owner and evidence reference.']] },
    'dash-complaints': { title: 'Complaints', intro: 'Every customer voice — complaints, questions, suggestions and praise — with priority, owner, follow-up date and status.', qa: [
      ['How do I log feedback?', 'log new complaint feedback add', 'Tap <b>Log feedback</b> and fill in the details.'],
      ['How do I pass a case to someone?', 'pass ball assign reassign hand over', 'Use the arrow button (Pass the ball) to hand it to a person or a role with a note.']] },
    'dash-chat': { title: 'Team chat', intro: 'Kitchen, delivery and management channels in one place.', qa: [] },
    'dash-notify': { title: 'Notifications', intro: 'Send push messages to customers or roles and see what was sent, delivered and opened.', qa: [] },
    'dash-audit': { title: 'Activity log', intro: 'Every action with who, when and what — filter by user or search; export as CSV.', qa: [] },
    'dash-users': { title: 'Team & Access', intro: 'Who is on the team, what each role may do, and which kitchen stations each person can work.', qa: [
      ['How do I add someone?', 'add team member employee staff new', 'Tap <b>Add team member</b>, choose a role and the kitchen stations they may work.'],
      ['How do I change permissions?', 'permission role access switch allow', 'Open the <b>Role permissions</b> tab and use the switches — they apply to everyone in that role.'],
      ['How do I see what someone sees?', 'view as act as impersonate eye', 'Press the eye button on their card; press <b>Back to super admin</b> (bottom-left) to return.']] },
    'dash-settings': { title: 'Settings', intro: 'Connection to the database and demo data reset.', qa: [] }
  };
  var DASH_COMMON = [
    ['Is this real data?', 'demo real data saved browser', 'This is demo mode: everything works and is saved in this browser. Once Supabase is connected, data is shared by the whole team with real logins.'],
    ['Why can\'t I see a module?', 'cannot see missing permission locked access', 'Your role doesn\'t hold that permission. A super admin can grant it in <b>Team · Access</b>.'],
    ['How do I switch user?', 'switch user act as login bottom left', 'Use the selector at the bottom-left of the menu (super admin only).']
  ];

  /* ── which page are we on? ───────────────────────────────────────────── */
  function pageId() {
    var f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (f === 'dashboard.html') return 'dash-' + (window.current || (location.hash || '#overview').slice(1) || 'overview');
    if (f === 'portal.html') return 'portal';
    return { 'index.html': 'site-home', '': 'site-home', 'products.html': 'site-menu', 'why-us.html': 'site-why',
      'how-it-works.html': 'site-how', 'contact.html': 'site-contact', 'project-report.html': 'site-report' }[f] || 'site-home';
  }
  function entry(id) {
    var e = KB[id] || KB['site-home'];
    var common = id.indexOf('dash-') === 0 ? DASH_COMMON : id === 'portal' ? SITE_COMMON.slice(4, 5).concat(SITE_COMMON.slice(7, 8)) : SITE_COMMON;
    return { title: e.title, intro: e.intro, qa: e.qa.concat(common) };
  }

  /* ── matching ────────────────────────────────────────────────────────── */
  var STOP = 'a an the i my me is are do does how what when where why can to of for in on it this that you your with and or be we our'.split(' ');
  function words(t) { return String(t).toLowerCase().replace(/[^a-z0-9؀-ۿ ]+/g, ' ').split(/\s+/).filter(function (w) { return w && STOP.indexOf(w) < 0; }); }
  function stem(w) { return w.replace(/(ies|es|s|ing|ed)$/, ''); }
  function answer(q, e) {
    var qw = words(q).map(stem); if (!qw.length) return null;
    var best = null, bestScore = 0;
    e.qa.forEach(function (item) {
      var kw = words(item[0] + ' ' + item[1]).map(stem), score = 0;
      qw.forEach(function (w) { if (kw.indexOf(w) >= 0) score += 2; else if (w.length > 3 && kw.some(function (k) { return k.indexOf(w) === 0 || w.indexOf(k) === 0; })) score += 1; });
      if (score > bestScore) { bestScore = score; best = item; }
    });
    return bestScore >= 2 ? best : null;
  }

  /* ── UI ──────────────────────────────────────────────────────────────── */
  var SVG = {
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>'
  };
  function svg(n) { return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + SVG[n] + '</svg>'; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  var css = '' +
    '.tth-btn{position:fixed;right:18px;bottom:18px;z-index:900;display:flex;align-items:center;gap:8px;background:#123c56;color:#fff;border:none;border-radius:999px;padding:12px 18px 12px 14px;font:700 14px Quicksand,system-ui,sans-serif;box-shadow:0 10px 28px rgba(14,51,69,.35);cursor:pointer;transition:transform .15s}' +
    '.tth-btn:hover{transform:translateY(-2px)}.tth-btn svg{font-size:20px;color:#f0b64b}' +
    '.tth-panel{position:fixed;right:18px;bottom:78px;z-index:901;width:370px;max-width:calc(100vw - 24px);height:min(560px,calc(100vh - 110px));background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(14,51,69,.35);display:none;flex-direction:column;overflow:hidden;font:14px/1.5 Quicksand,system-ui,sans-serif;color:#17455e}' +
    '.tth-panel.on{display:flex}' +
    '.tth-h{background:#123c56;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}.tth-h .bi{width:34px;height:34px;border-radius:10px;background:#f0b64b;color:#123c56;display:grid;place-items:center;font-size:18px}' +
    '.tth-h b{display:block;font-family:"Baloo 2",Quicksand,sans-serif;font-size:16px;line-height:1.2}.tth-h small{color:#c9d9e2;font-size:12px}' +
    '.tth-h button{margin-left:auto;background:rgba(255,255,255,.12);border:none;color:#fff;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;cursor:pointer;font-size:16px}' +
    '.tth-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f8f4ea}' +
    '.tth-msg{max-width:88%;padding:9px 12px;border-radius:14px;font-size:13.5px}.tth-msg a{color:#2f6fb0;font-weight:700}' +
    '.tth-msg.bot{background:#fff;border:1px solid #e7e1d2;border-bottom-left-radius:4px;align-self:flex-start}' +
    '.tth-msg.me{background:#123c56;color:#fff;border-bottom-right-radius:4px;align-self:flex-end}' +
    '.tth-intro{background:#fff8e6;border:1px solid #f3dca6;border-radius:14px;padding:10px 12px;font-size:13.5px}' +
    '.tth-chips{display:flex;flex-wrap:wrap;gap:6px}.tth-chips button{border:1.5px solid #d8d0bd;background:#fff;color:#17455e;border-radius:999px;padding:5px 11px;font:600 12.5px Quicksand,system-ui,sans-serif;cursor:pointer;text-align:left}' +
    '.tth-chips button:hover{border-color:#f0b64b;background:#fffaf0}' +
    '.tth-f{display:flex;gap:8px;padding:10px;border-top:1px solid #e7e1d2;background:#fff}' +
    '.tth-f input{flex:1;border:1.5px solid #e7e1d2;border-radius:999px;padding:9px 14px;font:14px Quicksand,system-ui,sans-serif;color:#17455e;min-width:0}' +
    '.tth-f input:focus{outline:2px solid #17455e;border-color:#17455e}' +
    '.tth-f button{width:40px;height:40px;border-radius:50%;border:none;background:#f0b64b;color:#123c56;display:grid;place-items:center;font-size:17px;cursor:pointer;flex-shrink:0}' +
    '@media (max-width:640px){.tth-btn span{display:none}.tth-btn{padding:13px}.tth-panel{right:8px;left:8px;width:auto;max-width:none;bottom:74px;height:min(70vh,560px)}}' +
    '@media print{.tth-btn,.tth-panel{display:none!important}}';

  var panel, body, lastId = null;
  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var btn = document.createElement('button');
    btn.className = 'tth-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Help'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = svg('help') + '<span>Help</span>';
    panel = document.createElement('div'); panel.className = 'tth-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Help');
    document.body.appendChild(btn); document.body.appendChild(panel);
    btn.addEventListener('click', function () {
      var on = !panel.classList.contains('on');
      if (on) open(); else panel.classList.remove('on');
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    window.addEventListener('hashchange', function () { if (panel.classList.contains('on') && pageId() !== lastId) open(); });
  }
  function open() {
    var id = pageId(), e = entry(id); lastId = id;
    panel.innerHTML = '<div class="tth-h"><span class="bi">' + svg('bot') + '</span><div><b>Help · ' + esc(e.title) + '</b><small>Ask anything about this page</small></div>' +
      '<button type="button" aria-label="Close help">' + svg('x') + '</button></div>' +
      '<div class="tth-body"><div class="tth-intro">' + e.intro + '</div><div class="tth-chips">' +
      e.qa.slice(0, 6).map(function (q, i) { return '<button type="button" data-i="' + i + '">' + esc(q[0]) + '</button>'; }).join('') + '</div></div>' +
      '<form class="tth-f"><input placeholder="Type your question…" aria-label="Your question" autocomplete="off"><button type="submit" aria-label="Send">' + svg('send') + '</button></form>';
    panel.classList.add('on');
    body = panel.querySelector('.tth-body');
    panel.querySelector('.tth-h button').onclick = function () { panel.classList.remove('on'); };
    panel.querySelectorAll('.tth-chips button').forEach(function (b) { b.onclick = function () { ask(e.qa[+b.dataset.i][0], e); }; });
    panel.querySelector('form').onsubmit = function (ev) {
      ev.preventDefault(); var inp = panel.querySelector('input'); var q = inp.value.trim(); if (!q) return; inp.value = ''; ask(q, e);
    };
    setTimeout(function () { var i = panel.querySelector('input'); if (i && window.innerWidth > 640) i.focus(); }, 50);
  }
  function add(html, who) { var m = document.createElement('div'); m.className = 'tth-msg ' + who; m.innerHTML = html; body.appendChild(m); body.scrollTop = body.scrollHeight; }
  function ask(q, e) {
    add(esc(q), 'me');
    var hit = answer(q, e) || answer(q, entry('site-home'));
    setTimeout(function () {
      if (hit) add(hit[2], 'bot');
      else if (pageId().indexOf('dash-') === 0) add('I don\'t have an answer for that yet. Try one of the suggestions above, or ask your manager in <b>Team chat</b>.', 'bot');
      else add('I\'m not sure about that one. Our team will gladly help on <a href="' + WA + '" target="_blank" rel="noopener">WhatsApp +961 70 341 002</a>.', 'bot');
    }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
