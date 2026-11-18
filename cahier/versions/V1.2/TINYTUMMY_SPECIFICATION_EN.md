---
title: "Tiny Tummy — Specification (Cahier des charges)"
version: "V1.2"
date: "18/11/2026"
lang: en
---

# Tiny Tummy — Specification / System protocol

**Version V1.2 — 18/11/2026** · replaces V1.1 of 18/11/2026

This document describes, in plain words, **how the Tiny Tummy platform works
from end to end**: the public website, the Family Portal and the operations
dashboard — who does what, where the data goes, and which rules the system
enforces. It complements the built-in help (the **Ask me** button on every page),
which explains each page as you use it.

## Version tracking

| Version | Period | Go-live date |
|---|---|---|
| V1.0 | reference version (platform launch) | 28/08/2026 |
| V1.1 | 01/11/2026 – 18/11/2026 | 18/11/2026 |
| V1.2 | 18/11/2026 — dashboard working tools and full activity trace | 18/11/2026 |

No change was recorded in September and October 2026. **Numbering.** One
version per month that contains changes (V1.2, V1.3…); a new set of modules
opens a major version (V2.0). The latest version is always the one offered in
the dashboard (System → *Cahier des charges*); every earlier version stays
available there and can be made the current one again (see Part C).

The dated detail of each version is in the appendix (**Version history**).
Only lasting changes to the system are listed there: one-off corrections (a
particular order, customer or invoice) are not.

---

# Part A — What changed since V1.0 (28/08/2026)

**New in V1.2 — working in the dashboard**

- **Every click is recorded**: each click, each field changed and each page
  opened is written to the Activity Log with the person, date and time
  (18/11/2026).
- **A list view and filters on every page**, with sortable columns, a row
  count and CSV export; more filters on Inventory (18/11/2026).
- **Saved views**: any combination of filters can be named, re-applied in one
  click and made the default of its page (18/11/2026).
- **Start page**: each person chooses the page the dashboard opens on
  (18/11/2026).
- **Menu** reorganised: groups that fold, favourites per person, *Find a
  page* (Ctrl K), only the pages the person may open (18/11/2026).

**Website**

- New design on every public page: brand logo in the header and footer,
  line icons, mobile-friendly layout (13/11/2026, #5).
- Home page: *Family portal* section and button (13/11/2026, #7).
- **Ask me** assistant on every page (first named *Help*): explains the page
  and answers questions, with WhatsApp as a fallback (13/11/2026, #8;
  renamed 18/11/2026).
- One contact number everywhere: +961 70 341 002 (13/11/2026, #10).

**Family Portal (new)**

- A *carnet de santé* for every child, linked to the kitchen: food diary with
  ingredients and batch lot, foods tried, feeding stages, growth, photo album,
  vaccines and doctor notes (13/11/2026, #5).
- Private doctor link per child, expiring and revocable (13/11/2026, #5–#6).
- Pink theme for a girl, blue for a boy (13/11/2026, #9).

**Operations dashboard**

- Orders: stage board (Placed → Delivered), kanban and list views; kitchen
  steps assigned automatically when an order is confirmed (13/11/2026, #1).
- Dispatch & delivery: least-busy agent suggested, one-tap dispatch, agent
  roster (13/11/2026, #2).
- Inventory: needs-attention list and automatic reorder below minimum
  (13/11/2026, #3).
- Inventory: **stock ledger** of every movement (received, used by an
  order, count ±, written off) with date, lot, order, person and cost;
  **List** view with stock counts typed in, and a consumption **Report**
  by item, order, person, day or month (18/11/2026).
- Allergy **STOP** alert when an order contains one of the child's allergies
  (13/11/2026, #5).
- Team & Access redesign; same design on every dashboard page (13/11/2026,
  #1, #4).
- **Cahier des charges** in the dashboard (System group), French and
  English, version in force and every earlier version, in cards or list
  view, for the people given access (18/11/2026).
- **Ask me** for staff: answers questions on the live operation (my orders,
  delivered today, what to prepare, a client, an item, an order number) and
  opens the right page, order, client or item (18/11/2026).

**Security / data**

- Family data separated per family in the database; staff-only data can no
  longer be read by a signed-in parent (13/11/2026, #6).

---

# Part B — The system today (V1.2)

## 1. What the system is

One platform with three faces, all served as static web pages, with data,
sign-in and file storage at Supabase (Postgres + Auth + Storage):

- **Public website** — Home, Menu, Why Us, How It Works, Contact. Ordering
  goes through WhatsApp.
- **Family Portal** — the parents' space: each child's food and growth
  record, shared with their doctor.
- **Operations dashboard** — the staff's tool for the whole business: orders,
  kitchen, recipes, stock, purchasing, delivery, quality (ISO 22000),
  complaints, team and access.

While Supabase is not connected, the dashboard and portal run on demonstration
data in the browser; nothing is lost and nothing is shared.

## 2. Public website

- **Menu**: purees (6 months +), finger food (7 months +) and cakes, with
  category filters. Products and prices come from the database; if it cannot be
  reached, the built-in catalogue is shown. A product without a price simply
  shows no price.
- **Ordering**: through WhatsApp. Order before 3:00 PM for next-day delivery,
  everywhere in Lebanon except Sundays.
- **Ask me** button on every page: explains the page and answers common
  questions; anything else is sent to WhatsApp.
- A discreet *Staff dashboard* link in the footer; the dashboard is useless
  without a staff login.

## 3. Family Portal

- A parent signs in (phone code in production) and sees **only their own
  family**. One profile per child: age, birth date, allergies, diet notes,
  doctor, photo; pink theme for a girl, blue for a boy.
- **Food diary**: every order for the child by month; each product shows its
  ingredients, quantity per portion and **batch lot**, with allergy flags.
- **Foods tried**: built automatically from delivered meals, with the date of
  first taste.
- **Feeding stages**: a *Bravo!* message at 6, 7, 9, 12, 18, 24 and 36 months
  with what to start next and suitable products (allergen-free for the child).
- **Growth**: weight and height with charts by age; monthly photo album
  (photos compressed in the browser, stored privately per family).
- **Vaccines & visits** with reminders; **doctor notes**.
- **Doctor access**: a private link per child (copy, WhatsApp, email,
  revoke). The doctor reads the record and adds notes and vaccines, which
  become reminders for the family. The link is random, stored only as a hash,
  expires and can be revoked at any time; the doctor needs no account.

## 4. Operations dashboard — modules

The menu is grouped by trade:

| Group | Module | Purpose |
|---|---|---|
| — | Overview | Today across the operation, advisor tips, records waiting for me |
| Sales | Orders | Order pipeline: stage tiles, Board, and List (search, period, driver, sort; customer, child and allergy STOP, items, stage, kitchen progress, batch lot, driver and ETA, value, cost, margin; totals; CSV; link to the stock the order used) |
| Sales | Age Programs | Programmes by age of the child |
| Production | Kitchen | Board (one card per order: timeline, clocks, steps) and List (one row per step of every order in production: order and items, allergy STOP, step and CCP, station, person, planned minutes, status and timer; filters to do / running / overdue / done, person or *my steps*, station; Start, Done and Undo on the row; totals: steps, running, overdue, minutes still to do) |
| Production | Recipes · BOM | Ingredients, process steps, full cost |
| Production | Inventory · Lots | Stock as lots, FEFO, expiry, reorder |
| Production | Requisitions | Purchase requests |
| Delivery | Dispatch · Agents | Board (ready / on the road cards, live map, agents) and List (every delivery: status, driver, address and distance, ready / out / ETA / delivered times, minutes on the road, on time or late; filters by status, period, driver; dispatch, ping, delay and delivered from the row; totals: km, average time, % on time; CSV) |
| Finance | Suppliers · Payables | Supplier invoices = stock entry, payables |
| Quality | ISO 22000 | Clause-by-clause checklist with owner and evidence |
| Quality | Complaints | Feedback & complaints register |
| Team | Team Chat, Notifications, Activity Log, Team · Access | |
| System | Cahier des charges | This document: version in force, FR/EN, every earlier version |
| System | Settings | Database connection, demo data |

**Ask me (staff).** On every dashboard page, the **Ask me** button answers
questions about the live operation and takes the employee straight to the
answer, within the modules their role allows:

- *My orders / my tasks*: the kitchen steps, deliveries and cases assigned to
  the person signed in;
- *Delivered today*, *what is to prepare* (with the total per item), *ready
  to dispatch*, *on the road*, *late*, *new orders*, *orders today*;
- a **client's name**: their orders, cases and phone; a **product**: open
  orders containing it and its recipe; an **ingredient**: stock and lots
  (next out first);
- an **order or case number** (TT-2026-041, 041, CF-2026-002) opens it.

Each order, client, recipe or ingredient in the answer is a link to it.

## 4 bis. Working in the dashboard

- **Menu.** Grouped by trade — Sales; Kitchen & stock; Delivery; Money;
  Quality; Team; System — with Overview on top. Groups fold; the group of the
  page in use stays open, and the others keep the state each person left
  them in. Each person stars their **favourites**, shown at the top (by
  default those of their role). **Find a page** (Ctrl K, Enter opens the
  first match) searches page names and their usual words (e.g. *delivery*,
  *stock*). Only the pages the person may open are listed.
- **Lists everywhere.** Every page that shows records offers a **List** view
  next to its cards or board (Orders, Kitchen, Delivery, Inventory, Recipes,
  Age programs, ISO 22000, Team), and the pages that are lists by nature
  (Requisitions, Suppliers, Notifications, Activity Log, Complaints) use the
  same tools: search, filters, columns sorted by a click on their title, a
  count of the rows shown, totals where they make sense and **CSV** export of
  exactly what is on screen.
- **Inventory filters**: category, storage location, stock level (OK, below
  minimum, over maximum, lot expiring within 7 days, out of stock) and
  auto reorder on/off, on the Cards, List and Lots views.
- **Saved views.** On every page with filters, *Save view* keeps the current
  filters, search and layout under a name; the list of saved views re-applies
  one in a click; the star makes it the page's **default view**, applied when
  the page opens; a view can be deleted. Views belong to each person.
- **Start page.** *Set as start page*, at the top of every page, makes it
  the page the dashboard opens on for that person (a link that names a page
  still opens that page). Clicking it again goes back to Overview.

## 5. From order to door

1. **Order** (website / WhatsApp) → confirmed by the team. The order records
   which child it is for. If it contains one of that child's allergies, a red
   **STOP** alert is shown on the order and on the kitchen card.
2. **Kitchen**: as soon as an order is confirmed, its steps are **assigned
   automatically** to people holding the right station (kitchen role first,
   least loaded and most specialised first). A manager can override or
   re-balance.
   Confirmed orders wait in **Kitchen → Waiting to be sent to the kitchen**
   until someone presses **Send to kitchen** there or on the order.
3. Entering the kitchen **consumes stock FEFO** (first-expired, first-out)
   from the recipe's ingredient lines, logged lot by lot.
4. **Quality gates** (see §7), portioning, final QC; a **batch lot label**
   (e.g. B-2026-040-0828) is printed on the order.
5. **Dispatch**: the least-busy agent on duty is suggested; one tap sends the
   order. The customer is notified with an ETA computed from road distance.
6. **On the road**: live map, *arriving soon* notice; a delay reported by the
   agent or detected automatically sends a new arrival time to the customer.
7. **Delivered**: timestamped confirmation. Every stage is timestamped.

## 6. Recipes, stock and purchasing

- **Recipe (BOM)**: ingredient lines (quantity per portion in the kitchen's
  unit, converted to the stocked unit), process steps (planned minutes, station,
  labour rate) and the **full cost** (materials + labour) per portion and per
  batch, with margin and food-cost % flagged above target.
- **Stock is a set of lots**: each lot has its quantity, expiry, location and
  purchase cost. Picking always takes the first-expired lot.
- **Supplier invoice = receiving**: each invoice line (item, quantity, cost,
  lot, expiry) becomes a lot. Payables age visibly until marked paid.
- **Stock ledger**: every movement is a line — *Received* (receipt or
  supplier invoice), *Used* (consumed by an order, FEFO, with the order
  number and the person who sent it to the kitchen), *Count +/−* (physical
  count) and *Written off* (with its reason) — with date and time, lot,
  quantity, unit cost, value, order or reference, who and note. Stock can be
  re-derived from it. Filters: item, movement, order, person, dates (today,
  7 / 30 days); totals per type; CSV export.
- Inventory views: **Cards**, **List** (one row per item: stock against
  min/max, used in the last 7 days, next lot out, value, status, auto
  reorder, and a **Count** box: the quantity typed is compared with the
  system and the difference booked in the ledger, taken from the lot that
  expires first or added to the newest), **Lots (FEFO)**, **Ledger** and
  **Report** (the ledger added up by item, order, person, day or month:
  received, used, count ±, written off, cost of use; each line opens its
  movements).
- **Needs attention**: expiring or expired lots (write-off, reason required)
  and items below minimum. Items set to *auto reorder* get a requisition
  automatically, sized to refill to the maximum.

## 7. Food safety — ISO 22000 / HACCP

| Gate | Check | Limit | If it fails |
|---|---|---|---|
| Cooking (CCP) | Core temperature | ≥ 85 °C | Step cannot close; failure logged, manager alerted |
| Blast chill (CCP) | Temperature within 90 min | ≤ 5 °C | Step stays open; excursion recorded |
| Portioning | Portions and average weight vs target | ± 5 % | Recorded; outside tolerance alerts the manager |
| Final QC | Label vs order, seal, weight, cold chain | Pass | Nothing reaches dispatch without QC signature |

- Each step has a planned time; when it is exceeded, the kitchen buzzer sounds
  and the step turns red.
- The **ISO 22000** module holds the clause-by-clause checklist (context to
  improvement, PRPs, HACCP chain) with status, owner and evidence, and a
  readiness bar reviewed monthly. A traceability drill (delivered order →
  every ingredient lot) is run twice a year.
- **Traceability in both directions**: any complaint finds its ingredients;
  any supplier lot finds its customers.

## 8. Complaints and customer feedback

- Every message becomes a numbered case (CF-YYYY-NNN) with category,
  priority up to *critical*, responsible person, follow-up date and status:
  new → in progress → escalated → resolved.
- Open cases greet their owner when they open the dashboard. A case can be
  passed to a person or a role with a note; the handover is logged.
- A food-quality case links the order and its batch lot.

## 9. People, roles and access

- Access follows one key per capability, resolved person → role → super
  admin, and is enforced in the database (row-level security), not only on
  screen.
- **Kitchen stations**: prep, cooking, assembly, portioning, chilling,
  packaging, QC. A person can only start steps of the stations they hold.
- A super admin can work *as* another user; both identities are logged.

## 10. Traceability of every action

- Every object (order, case, invoice, requisition, lot) carries its own history:
  who did what, and when.
- The **Activity Log** records, per person and with date and time: every
  action of the platform (order moves, kitchen signatures, stock movements,
  payments, permission changes…), **every click** (button, link, tab, row,
  switch — with what was clicked and on which record), **every field
  changed** (filter, selection, entry — with the value) and **every page
  opened**. It keeps the latest 5,000 entries in this browser until the
  database is connected. Filters: person, page, type (actions, clicks and
  changes, pages opened), period; search; CSV export; nothing can be edited
  or deleted.

## 11. Notifications and family alerts

- Customers are notified at each delivery stage (left the kitchen, arriving
  soon, delay, delivered), with sent / delivered / opened tracked in the
  push log.
- Birthday: the manager is alerted to send an allergy-free cupcake; birthday,
  milestone and vaccine messages go to the family once each.

---

# Part C — This document: versions, download and rollback

- The source of each language is a text file in `cahier/` in the website
  repository. A **build** turns it into PDF and Word, archives that version
  under `cahier/versions/<version>/`, and records it in
  `cahier/versions.json`.
- The dashboard page **System → Cahier des charges** always offers the
  *current* version (French and English, PDF and Word) at a fixed address,
  so a download is always up to date, and lists every version with its
  status (*In force* / *Archived*) and the period it was in force, as cards
  or as a list. It is not on the public website.
- Access is a permission like any module (*Cahier des charges* in
  Team · Access), per role or per person; managers have it by default.
- **Rollback**: any earlier version can be made the current one again
  (GitHub → Actions → *Cahier des charges — rollback*, or
  `node tools/cahier.mjs rollback V1.0`). Nothing is deleted: the newer
  version stays in the list and can be restored the same way.
- Every change to how the system works updates this document (both
  languages) in the same change: Part B, a line in Part A when notable, and a
  dated line in the appendix.

---

# Appendix — Version history

### V1.2 — 18/11/2026 (live on 18/11/2026)

- Activity Log: every click, every field changed and every page opened is recorded with the person, date and time, alongside the actions; filters by person, page, type and period; latest 5,000 entries kept (18/11/2026).
- List view on every page with records (Recipes, Age programs, ISO 22000, Team added; Requisitions, Suppliers, Notifications and Activity Log rebuilt) with search, filters, sortable columns, counts, totals and CSV (18/11/2026).
- Inventory: filters by category, location, stock level and auto reorder (18/11/2026).
- Saved views on every page with filters, with a default view per page (18/11/2026).
- Start page per person (18/11/2026).
- Menu: groups that fold, favourites, Find a page (Ctrl K), pages limited to the person's access (18/11/2026).
- Orders: the next step (Confirm, Send to kitchen, Kitchen done → QC, QC pass, Dispatch, Delivered) is a button on every order — in the order window's top bar, on each board card and on each list row; Kitchen shows the confirmed orders waiting to be sent, with their Send to kitchen button (18/11/2026).

### V1.1 — from 01/11/2026 to 18/11/2026 (live on 18/11/2026)

- Dashboard: Team & Access redesign with role cards, permission toggles and line icons; orders stage board with kanban and list views; kitchen steps assigned automatically on confirmation (13/11/2026, #1).
- Dispatch & delivery: KPI strip, least-busy agent suggested, one-tap dispatch, on-the-road cards with ETA and delay, agent roster (13/11/2026, #2).
- Inventory: item cards, needs-attention list, automatic reorder below minimum, FEFO lots register (13/11/2026, #3).
- Same design applied to every dashboard page; recipes as fold-out cards with cost and margin; ISO 22000 progress per clause (13/11/2026, #4).
- Website redesign with logo on every page; Family Portal created (food diary, foods tried, feeding stages, growth, album, vaccines, doctor link); allergy STOP alert in orders and kitchen; birthday and milestone alerts (13/11/2026, #5).
- Database: Family Portal tables with per-family privacy, token-based doctor access, private photo storage; staff-only data closed to parents (13/11/2026, #6).
- Home page: Family portal section and hero button (13/11/2026, #7).
- Help assistant on every page (13/11/2026, #8).
- Family Portal: pink theme for a girl, blue for a boy (13/11/2026, #9).
- One contact number everywhere: +961 70 341 002 (13/11/2026, #10).
- Cahier des charges in French and English, with every previous version and rollback (18/11/2026).
- The Help button is renamed **Ask me** on every page (18/11/2026).
- Ask me for staff: my orders, delivered today, what to prepare, ready / on the road / late, a client, a product, an ingredient or an order number — with links that open the page, order, client or item (18/11/2026).
- Cahier des charges moved from the public home page into the dashboard (System → Cahier des charges), with its own permission, cards and list views (18/11/2026).
- Inventory: stock ledger of every movement, List view with stock counts, consumption Report by item / order / person / day / month, CSV export (18/11/2026).
- Orders: professional List view (filters, kitchen progress, batch lot, driver and ETA, value, cost and margin, totals, CSV, stock used by the order) (18/11/2026).
- Dispatch & Delivery: List view of every delivery with times, on-time result, filters, totals and CSV (18/11/2026).
- Kitchen: List view, one row per production step with person, station, timer and Start / Done, filters (my steps, station, overdue) and totals (18/11/2026).

### V1.0 — 28/08/2026 (platform launch)

- Brand website (Home, Menu, Why Us, How It Works, Contact) with WhatsApp ordering (28/08/2026).
- Operations dashboard: orders pipeline, kitchen with HACCP gates, recipes · BOM with full cost, inventory as lots with FEFO, requisitions, suppliers and payables, dispatch with ETA, ISO 22000 checklist, complaints register, team chat, notifications, users and permissions (28/08/2026).
- Activity log of every action with date and time; *The Tiny Tummy Standard* project report (28/08/2026).
- Discreet staff link to the dashboard in the website footer (28/08/2026).

---

*For page-level details, open the page and press **Ask me**: the built-in help
stays the reference for each screen.*
