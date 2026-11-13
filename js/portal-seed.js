/* Tiny Tummy — shared demo data for the Family Portal.
   Ingredients, products and recipes (BOM) mirror the operations dashboard,
   so the portal shows exactly what each meal is made of. Families,
   children and their records are the portal's own demo data. In
   production all of this comes from Supabase. */
var TT_SEED = {};
TT_SEED.ingredients = [
  { id: 'g1', name: 'Carrots', cat: 'Vegetables', unit: 'kg', cost: 1.2, min: 5, max: 20, use_m: 45, lead: 1, auto: true, reorder: 10 },
  { id: 'g2', name: 'Zucchini', cat: 'Vegetables', unit: 'kg', cost: 1.5, min: 4, max: 15, use_m: 30, lead: 1, auto: true, reorder: 8 },
  { id: 'g3', name: 'Millet', cat: 'Dry goods', unit: 'kg', cost: 3.0, min: 3, max: 12, use_m: 14, lead: 3, auto: true, reorder: 6 },
  { id: 'g4', name: 'Cauliflower', cat: 'Vegetables', unit: 'kg', cost: 1.8, min: 3, max: 10, use_m: 18, lead: 1, auto: true, reorder: 6 },
  { id: 'g5', name: 'Beetroot', cat: 'Vegetables', unit: 'kg', cost: 1.4, min: 3, max: 12, use_m: 22, lead: 1, auto: true, reorder: 6 },
  { id: 'g6', name: 'Quinoa', cat: 'Dry goods', unit: 'kg', cost: 5.5, min: 2, max: 8, use_m: 9, lead: 5, auto: true, reorder: 4 },
  { id: 'g7', name: 'Mango', cat: 'Fruit', unit: 'kg', cost: 3.2, min: 2, max: 8, use_m: 16, lead: 1, auto: true, reorder: 5 },
  { id: 'g8', name: 'Full-fat cow milk', cat: 'Dairy', unit: 'L', cost: 1.1, min: 10, max: 30, use_m: 80, lead: 1, auto: true, reorder: 20 },
  { id: 'g9', name: 'Walnuts', cat: 'Dry goods', unit: 'kg', cost: 9.0, min: 1, max: 4, use_m: 3, lead: 7, auto: true, reorder: 2 },
  { id: 'g10', name: 'Cocoa', cat: 'Dry goods', unit: 'kg', cost: 7.0, min: 1, max: 3, use_m: 1.5, lead: 7, auto: false, reorder: 2 },
  { id: 'g11', name: 'Carob molasses', cat: 'Dry goods', unit: 'kg', cost: 4.5, min: 1, max: 4, use_m: 2, lead: 5, auto: false, reorder: 2 },
  { id: 'g12', name: 'Biscuits (baby-safe)', cat: 'Bakery', unit: 'kg', cost: 4.0, min: 2, max: 8, use_m: 6, lead: 3, auto: true, reorder: 4 },
  { id: 'g13', name: 'Flour', cat: 'Dry goods', unit: 'kg', cost: 0.9, min: 5, max: 20, use_m: 12, lead: 2, auto: true, reorder: 10 },
  { id: 'g14', name: 'Eggs', cat: 'Dairy', unit: 'pc', cost: 0.18, min: 30, max: 120, use_m: 160, lead: 1, auto: true, reorder: 60 }
];
TT_SEED.products = [
  { id: 'p1', handle: 'puree-pack', name: 'Puree Pack', category: 'purees', age: '6M+', price: 18, portion_g: 120, batch_portions: 28 },
  { id: 'p2', handle: 'ratatouille', name: 'Ratatouille', category: 'purees', age: '6M+', price: 5, portion_g: 120, batch_portions: 24 },
  { id: 'p3', handle: 'milletflower', name: 'Milletflower', category: 'purees', age: '6M+', price: 5, portion_g: 120, batch_portions: 24 },
  { id: 'p4', handle: 'heartbeet', name: 'Heartbeet', category: 'purees', age: '6M+', price: 5, portion_g: 120, batch_portions: 24 },
  { id: 'p5', handle: 'tropical-quinoa', name: 'Tropical Quinoa', category: 'purees', age: '6M+', price: 5, portion_g: 120, batch_portions: 24 },
  { id: 'p6', handle: 'labneh', name: 'Labneh', category: 'meals', age: '7M+', price: 6, portion_g: 150, batch_portions: 16 },
  { id: 'p7', handle: 'tiny-balls-24m', name: 'Tiny Balls (24M+)', category: 'meals', age: '24M+', price: 7, portion_g: 35, batch_portions: 40 },
  { id: 'p8', handle: 'cake', name: 'Baby-Friendly Cake', category: 'cakes', age: '12M+', price: 25, portion_g: 900, batch_portions: 4 }
];
TT_SEED.bom = [
  { id: 'b1', product: 'p2', ing: 'g1', qty: 0.12 }, { id: 'b2', product: 'p2', ing: 'g2', qty: 0.12 },
  { id: 'b3', product: 'p3', ing: 'g3', qty: 0.08 }, { id: 'b4', product: 'p3', ing: 'g4', qty: 0.10 }, { id: 'b5', product: 'p3', ing: 'g8', qty: 0.05 },
  { id: 'b6', product: 'p4', ing: 'g5', qty: 0.15 }, { id: 'b7', product: 'p4', ing: 'g1', qty: 0.05 },
  { id: 'b8', product: 'p5', ing: 'g6', qty: 0.06 }, { id: 'b9', product: 'p5', ing: 'g7', qty: 0.10 },
  { id: 'b10', product: 'p6', ing: 'g8', qty: 0.30 },
  { id: 'b11', product: 'p7', ing: 'g12', qty: 0.05 }, { id: 'b12', product: 'p7', ing: 'g9', qty: 0.03 },
  { id: 'b13', product: 'p7', ing: 'g10', qty: 0.01 }, { id: 'b14', product: 'p7', ing: 'g11', qty: 0.02 },
  { id: 'b15', product: 'p1', ing: 'g1', qty: 0.12 }, { id: 'b16', product: 'p1', ing: 'g2', qty: 0.12 },
  { id: 'b17', product: 'p1', ing: 'g3', qty: 0.08 }, { id: 'b18', product: 'p1', ing: 'g4', qty: 0.10 },
  { id: 'b19', product: 'p1', ing: 'g5', qty: 0.15 }, { id: 'b20', product: 'p1', ing: 'g6', qty: 0.06 }, { id: 'b21', product: 'p1', ing: 'g7', qty: 0.10 },
  { id: 'b22', product: 'p8', ing: 'g13', qty: 0.35 }, { id: 'b23', product: 'p8', ing: 'g14', qty: 4 },
  { id: 'b24', product: 'p8', ing: 'g1', qty: 0.20 }, { id: 'b25', product: 'p8', ing: 'g8', qty: 0.20 }
];

(function () {
  function iso(d) { return d.toISOString().slice(0, 10); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
  function monthsAgo(m, extraDays) { var d = new Date(); d.setMonth(d.getMonth() - m); d.setDate(d.getDate() - (extraDays || 0)); return iso(d); }
  function addDays(dateStr, n) { var d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function plusMonths(dateStr, m) { var d = new Date(dateStr + 'T00:00:00'); d.setMonth(d.getMonth() + m); return iso(d); }

  var leaDob = monthsAgo(6, 4);          // turned 6 months 4 days ago
  var adamDob = monthsAgo(24, 0);        // 2nd birthday today

  TT_SEED.families = [
    { id: 'f1', parent: 'Hussein M.', phone: '+961 76 789 039', email: 'hussein.family@example.com', address: 'Hamra, Beirut' }
  ];
  TT_SEED.children = [
    { id: 'c1', family: 'f1', name: 'Lea', sex: 'girl', dob: leaDob, allergies: [], diet: 'Breastfed; starting first tastes.',
      doctor: { name: 'Dr. Rima Haddad', phone: '+961 1 340 340', token: 'dr-lea-7k2p9q' }, avatar: '' },
    { id: 'c2', family: 'f1', name: 'Adam', sex: 'boy', dob: adamDob, allergies: ['Eggs'], diet: 'Egg allergy (skin-test confirmed). Loves finger food.',
      doctor: { name: 'Dr. Rima Haddad', phone: '+961 1 340 340', token: 'dr-adam-4m8x2w' }, avatar: '' }
  ];
  /* Delivered meals before this demo (each tagged to a child). */
  TT_SEED.portal_history = [
    { id: 'h1', child: 'c1', code: 'TT-2026-031', date: daysAgo(3), items: [{ product: 'p2', qty: 3 }], lot: 'B-2026-031' },
    { id: 'h2', child: 'c1', code: 'TT-2026-036', date: daysAgo(1), items: [{ product: 'p3', qty: 2 }, { product: 'p4', qty: 1 }], lot: 'B-2026-036' },
    { id: 'h3', child: 'c2', code: 'TT-2026-012', date: daysAgo(52), items: [{ product: 'p6', qty: 3 }, { product: 'p2', qty: 2 }], lot: 'B-2026-012' },
    { id: 'h4', child: 'c2', code: 'TT-2026-017', date: daysAgo(38), items: [{ product: 'p5', qty: 3 }], lot: 'B-2026-017' },
    { id: 'h5', child: 'c2', code: 'TT-2026-022', date: daysAgo(24), items: [{ product: 'p6', qty: 2 }, { product: 'p3', qty: 2 }], lot: 'B-2026-022' },
    { id: 'h6', child: 'c2', code: 'TT-2026-028', date: daysAgo(10), items: [{ product: 'p7', qty: 2 }, { product: 'p4', qty: 2 }], lot: 'B-2026-028' }
  ];
  /* Live dashboard orders that belong to a child (order id -> child id). */
  TT_SEED.order_child = [{ id: 'o2', child: 'c2' }];
  TT_SEED.growth = [
    { id: 'g1', child: 'c1', date: leaDob, weight: 3.3, height: 50 },
    { id: 'g2', child: 'c1', date: plusMonths(leaDob, 1), weight: 4.2, height: 54 },
    { id: 'g3', child: 'c1', date: plusMonths(leaDob, 2), weight: 5.1, height: 57.5 },
    { id: 'g4', child: 'c1', date: plusMonths(leaDob, 4), weight: 6.4, height: 62 },
    { id: 'g5', child: 'c1', date: daysAgo(2), weight: 7.3, height: 66 },
    { id: 'g6', child: 'c2', date: adamDob, weight: 3.5, height: 51 },
    { id: 'g7', child: 'c2', date: plusMonths(adamDob, 6), weight: 7.8, height: 67 },
    { id: 'g8', child: 'c2', date: plusMonths(adamDob, 12), weight: 9.6, height: 75 },
    { id: 'g9', child: 'c2', date: plusMonths(adamDob, 18), weight: 11, height: 81 },
    { id: 'g10', child: 'c2', date: daysAgo(1), weight: 12.2, height: 87 }
  ];
  TT_SEED.vaccines = [
    { id: 'v1', child: 'c1', name: '6-month vaccine visit', due: addDays(iso(new Date()), 2), given: '', by: 'Dr. Rima Haddad', note: 'Bring the vaccination booklet.' },
    { id: 'v2', child: 'c1', name: '4-month vaccine visit', due: plusMonths(leaDob, 4), given: plusMonths(leaDob, 4), by: 'Dr. Rima Haddad', note: '' },
    { id: 'v3', child: 'c2', name: '2-year check-up', due: addDays(iso(new Date()), 9), given: '', by: 'Dr. Rima Haddad', note: 'Growth review and booster as scheduled.' }
  ];
  TT_SEED.dr_notes = [
    { id: 'n1', child: 'c1', date: daysAgo(2), by: 'Dr. Rima Haddad', text: 'Growing well along her curve. OK to start single-vegetable purees — one new food every 3 days, watch for any reaction.' },
    { id: 'n2', child: 'c2', date: daysAgo(40), by: 'Dr. Rima Haddad', text: 'Egg allergy confirmed by skin test. Avoid egg in all forms, including baked goods. Re-test at 3 years.' }
  ];
  TT_SEED.photos = [];
  TT_SEED.greetings = [];
})();
