# Tiny Tummy — working rules

## The cahier des charges follows every change

`cahier/TINYTUMMY_CAHIER_DES_CHARGES_FR.md` is Tiny Tummy's cahier des
charges in French and `cahier/TINYTUMMY_SPECIFICATION_EN.md` its English
version, identical in content (same sections, same dated lines). **Every
change to how the platform works (website, Family Portal, dashboard,
database) updates both in the same PR**: the relevant section of Part B (the
system today), a line in Part A when notable, and a dated line
(`DD/MM/YYYY, #PR`) under the current version in the appendix (*Version
history*). A new month with changes opens a new version (V1.2, V1.3…; a new
set of modules is a major version, V2.0): bump `version:` and `date:` in both
front matters, the header line, and add the row to *Version tracking*.

Only lasting changes go in — never a one-off correction (one order, customer
or invoice), never a customer's or child's name, never a price.

Then rebuild: `node tools/cahier.mjs build` (needs pandoc + Playwright). It
writes PDF + Word, archives the version in `cahier/versions/<version>/`,
records it in `cahier/versions.json` and publishes it at the fixed file names
the dashboard links to (System → Cahier des charges, permission
`cahier_view`; not on the public website). Previous versions stay listed there.
Rollback: `node tools/cahier.mjs rollback V1.0` or GitHub → Actions →
*Cahier des charges — rollback*. Never delete an archived version.

## Dashboard working tools (`js/dash-ui.js`)

Loaded after the dashboard script. It owns: the Activity Log of **every
click, field change and page opened** (`logAct(..., kind)`: action / click /
page; keep it on for every new page), the shared list engine `ttList(cfg)`
(search, filters, sortable columns, counts, totals, CSV, saved views), saved
views per person (`SV_VARS[page]` for pages with their own filter variables;
a new page with filters registers there or uses `ttList`), the start page per
person and the grouped menu (`NAV`). **Every new page that shows records gets
a List view through `ttList` and its filters** — treat it as part of "the page
is finished". Never use the characters ★ ☆ in the dashboard: the emoji layer
turns them into icons; use `star(on)`.

## Ask me

`js/help.js` is the floating **Ask me** button on every page (page Q&A).
On the dashboard it first calls `window.ttOpsAsk` (`js/ask-ops.js`), which
answers live-operation questions (my orders, delivered today, to prepare,
clients, products, ingredients, order/case numbers) from the dashboard's own
data and links to them. New modules should add their intents there.
