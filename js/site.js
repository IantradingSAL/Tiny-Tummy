/* Shared page behavior: nav toggle, product card rendering, image fallback. */

function ttNavToggle() {
  var links = document.querySelector('nav.links');
  if (links) links.classList.toggle('open');
}

/* Inline SVG placeholder shown until the real photo exists in images/. */
function ttPlaceholder(name, bare) {
  var label = (name || 'Tiny Tummy').trim();
  if (label.length > 22) label = label.slice(0, 21) + '…';
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf3df"/><stop offset="1" stop-color="#eef3f2"/></linearGradient></defs>' +
    '<rect width="400" height="400" fill="url(#g)"/>' +
    '<circle cx="200" cy="165" r="74" fill="#ffffff" stroke="#e7e1d2" stroke-width="2"/>' +
    '<g transform="translate(152 117) scale(4)" fill="none" stroke="#17455e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M2 11h20a10 10 0 0 1-20 0z"/><path d="M7 21h10"/><path d="M9 7c0-1 1-1 1-2s-1-1-1-2"/><path d="M14 7c0-1 1-1 1-2s-1-1-1-2"/></g>' +
    '<path d="M193 188c-4-5-12-1-9 5l9 8 9-8c3-6-5-10-9-5z" fill="#d95d76" opacity=".85"/>' +
    (bare ? '' : '<text x="200" y="292" font-family="Verdana,sans-serif" font-size="25" font-weight="bold" fill="#17455e" text-anchor="middle">' + label.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text>' +
    '<text x="200" y="328" font-family="Verdana,sans-serif" font-size="17" fill="#8fa3ad" text-anchor="middle">photo coming soon</text>') +
    '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function ttWaLink(productName) {
  var msg = 'Hello Tiny Tummy! I would like to order: ' + productName;
  return 'https://wa.me/' + (TT_CONTACT.whatsapp || TT_CONTACT.phone).replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
}

function ttPrice(p) {
  return (p.price === null || p.price === undefined || p.price === '')
    ? ''
    : '<span class="price">$' + Number(p.price).toFixed(2) + '</span>';
}

function ttProductCard(p) {
  var card = document.createElement('article');
  card.className = 'card';
  card.dataset.category = p.category;
  card.innerHTML =
    '<div class="photo"><img loading="lazy" alt="' + p.name + '"></div>' +
    '<div class="body">' +
    '  <div class="meta"><h3>' + p.name + '</h3><span class="tag">' + (p.age || '') + '</span></div>' +
    '  <p class="desc">' + (p.desc || '') + '</p>' +
    '  <div class="meta">' + ttPrice(p) +
    '    <div class="actions"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' +
    ttWaLink(p.name) + '">Order on WhatsApp</a></div>' +
    '  </div>' +
    '</div>';
  var img = card.querySelector('img');
  img.onerror = function () { img.onerror = null; img.src = ttPlaceholder(p.name); };
  img.src = p.image;
  return card;
}

/* Render products into #product-grid; optional filter pills in .filters. */
async function ttRenderProducts(opts) {
  opts = opts || {};
  var grid = document.getElementById('product-grid');
  if (!grid) return;
  var products = await ttLoadProducts();
  if (opts.limit) products = products.slice(0, opts.limit);

  function draw(cat) {
    grid.innerHTML = '';
    products
      .filter(function (p) { return !cat || cat === 'all' || p.category === cat; })
      .forEach(function (p) { grid.appendChild(ttProductCard(p)); });
  }
  draw('all');

  var pills = document.querySelectorAll('.filters button');
  pills.forEach(function (b) {
    b.addEventListener('click', function () {
      pills.forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      draw(b.dataset.cat);
    });
  });
}

/* Give every standalone photo box a graceful fallback too. */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    img.onerror = function () { img.onerror = null; img.src = ttPlaceholder(img.dataset.fallback, !!img.closest('.cat-tile')); };
    if (img.complete && img.naturalWidth === 0) img.onerror();
  });
});
