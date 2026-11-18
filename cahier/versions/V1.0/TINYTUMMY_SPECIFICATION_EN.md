---
title: "Tiny Tummy — Specification (Cahier des charges)"
version: "V1.0"
date: "28/08/2026"
lang: en
---

# Tiny Tummy — Specification / System protocol

**Version V1.0 — 28/08/2026** · reference version

This document describes, in plain words, **how the Tiny Tummy platform works
from end to end**: the public website and the operations dashboard — who does what, where the data goes, and which rules the system
enforces. 

## Version tracking

| Version | Period | Go-live date |
|---|---|---|
| V1.0 | reference version (platform launch) | 28/08/2026 |

**Numbering.** One
version per month that contains changes (V1.2, V1.3…); a new set of modules
opens a major version (V2.0). The latest version is always the one offered on
the home page; every earlier version stays available there (**Previous
versions**) and can be made the current one again (see Part C).

The dated detail of each version is in the appendix (**Version history**).
Only lasting changes to the system are listed there: one-off corrections (a
particular order, customer or invoice) are not.

---

# Part B — The system today (V1.0)

## 1. What the system is

One platform with two faces, all served as static web pages, with data,
sign-in and file storage at Supabase (Postgres + Auth + Storage):

- **Public website** — Home, Menu, Why Us, How It Works, Contact. Ordering
  goes through WhatsApp.
- **Operations dashboard** — the staff's tool for the whole business: orders,
  kitchen, recipes, stock, purchasing, delivery, quality (ISO 22000),
  complaints, team and access.

While Supabase is not connected, the dashboard runs on demonstration
data in the browser; nothing is lost and nothing is shared.

## 2. Public website

- **Menu**: purees (6 months +), finger food (7 months +) and cakes, with
  category filters. Products and prices come from the database; if it cannot be
  reached, the built-in catalogue is shown. A product without a price simply
  shows no price.
- **Ordering**: through WhatsApp. Order before 3:00 PM for next-day delivery,
  everywhere in Lebanon except Sundays.
- A discreet *Staff dashboard* link in the footer; the dashboard is useless
  without a staff login.

## 3. Operations dashboard — modules

The menu is grouped by trade:

| Group | Module | Purpose |
|---|---|---|
| — | Overview | Today across the operation, advisor tips, records waiting for me |
| Sales | Orders | Order pipeline, stage board, kanban / list |
| Sales | Age Programs | Programmes by age of the child |
| Production | Kitchen | Production steps, timers, stations |
| Production | Recipes · BOM | Ingredients, process steps, full cost |
| Production | Inventory · Lots | Stock as lots, FEFO, expiry |
| Production | Requisitions | Purchase requests |
| Delivery | Dispatch · Agents | Dispatch, live map, ETA, agents |
| Finance | Suppliers · Payables | Supplier invoices = stock entry, payables |
| Quality | ISO 22000 | Clause-by-clause checklist with owner and evidence |
| Quality | Complaints | Feedback & complaints register |
| Team | Team Chat, Notifications, Activity Log, Team · Access, Settings | |

## 4. From order to door

1. **Order** (website / WhatsApp) → confirmed by the team.
2. **Kitchen**: its steps are assigned to people holding the right station;
   an *Auto-assign* button spreads them over the least-loaded eligible hands.
3. Entering the kitchen **consumes stock FEFO** (first-expired, first-out)
   from the recipe's ingredient lines, logged lot by lot.
4. **Quality gates** (see §6), portioning, final QC; a **batch lot label**
   (e.g. B-2026-040-0828) is printed on the order.
5. **Dispatch**: the manager picks an agent and dispatches the order. The customer is notified with an ETA computed from road distance.
6. **On the road**: live map, *arriving soon* notice; a delay reported by the
   agent or detected automatically sends a new arrival time to the customer.
7. **Delivered**: timestamped confirmation. Every stage is timestamped.

## 5. Recipes, stock and purchasing

- **Recipe (BOM)**: ingredient lines (quantity per portion in the kitchen's
  unit, converted to the stocked unit), process steps (planned minutes, station,
  labour rate) and the **full cost** (materials + labour) per portion and per
  batch, with margin and food-cost % flagged above target.
- **Stock is a set of lots**: each lot has its quantity, expiry, location and
  purchase cost. Picking always takes the first-expired lot.
- **Supplier invoice = receiving**: each invoice line (item, quantity, cost,
  lot, expiry) becomes a lot. Payables age visibly until marked paid.
- **Needs attention**: expiring or expired lots (write-off, reason required)
  and items below minimum. Items set to *auto reorder* get a requisition
  when an order consumes stock below the minimum.

## 6. Food safety — ISO 22000 / HACCP

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

## 7. Complaints and customer feedback

- Every message becomes a numbered case (CF-YYYY-NNN) with category,
  priority up to *critical*, responsible person, follow-up date and status:
  new → in progress → escalated → resolved.
- Open cases greet their owner when they open the dashboard. A case can be
  passed to a person or a role with a note; the handover is logged.
- A food-quality case links the order and its batch lot.

## 8. People, roles and access

- Access follows one key per capability, resolved person → role → super
  admin, and is enforced in the database (row-level security), not only on
  screen.
- **Kitchen stations**: prep, cooking, assembly, portioning, chilling,
  packaging, QC. A person can only start steps of the stations they hold.
- A super admin can work *as* another user; both identities are logged.

## 9. Traceability of every action

- Every object (order, case, invoice, requisition, lot) carries its own history:
  who did what, and when.
- The **Activity Log** lists every action in the platform, per user and module,
  with date and time — filterable, searchable, exportable, append-only.

## 10. Notifications

- Customers are notified at each delivery stage (left the kitchen, arriving
  soon, delay, delivered), with sent / delivered / opened tracked in the
  push log.

---

# Part C — This document: versions, download and rollback

- The source of each language is a text file in `cahier/` in the website
  repository. A **build** turns it into PDF and Word, archives that version
  under `cahier/versions/<version>/`, and records it in
  `cahier/versions.json`.
- The **home page** always offers the *current* version (French and English,
  PDF and Word) at a fixed address, so a download is always up to date.
  Every other version stays listed under **Previous versions**.
- **Rollback**: any earlier version can be made the current one again
  (GitHub → Actions → *Cahier des charges — rollback*, or
  `node tools/cahier.mjs rollback V1.0`). Nothing is deleted: the newer
  version stays in the list and can be restored the same way.
- Every change to how the system works updates this document (both
  languages) in the same change: Part B, a line in Part A when notable, and a
  dated line in the appendix.

---

# Appendix — Version history

### V1.0 — 28/08/2026 (platform launch)

- Brand website (Home, Menu, Why Us, How It Works, Contact) with WhatsApp ordering (28/08/2026).
- Operations dashboard: orders pipeline, kitchen with HACCP gates, recipes · BOM with full cost, inventory as lots with FEFO, requisitions, suppliers and payables, dispatch with ETA, ISO 22000 checklist, complaints register, team chat, notifications, users and permissions (28/08/2026).
- Activity log of every action with date and time; *The Tiny Tummy Standard* project report (28/08/2026).
- Discreet staff link to the dashboard in the website footer (28/08/2026).

---

*For page-level details, open that page in the dashboard.*
