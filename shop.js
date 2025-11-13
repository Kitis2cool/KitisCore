// Simple product + cart logic for static site.
// Save this file as shop.js in repo root.

// ------- Product catalog (placeholders) -------
const PRODUCTS = [
  {
    id: 'esp32-dev',
    name: 'ESP32 Dev Board',
    price: 15.00,
    desc: 'Dual-core WiFi + Bluetooth microcontroller — great for IoT.',
    img: 'https://picsum.photos/seed/esp32/400/300'
  },
  {
    id: 'rpi-zero',
    name: 'Raspberry Pi Zero W',
    price: 18.50,
    desc: 'Tiny single-board computer for compact projects.',
    img: 'https://picsum.photos/seed/pi/400/300'
  },
  {
    id: 'nrf24-module',
    name: 'nRF24L01+ Module',
    price: 4.25,
    desc: '2.4GHz radio module for short-range wireless comms.',
    img: 'https://picsum.photos/seed/rf/400/300'
  },
  {
    id: 'mcu-sensor-kit',
    name: 'Micro Sensor Kit',
    price: 9.99,
    desc: 'Assorted sensors (temp, light, motion) for prototyping.',
    img: 'https://picsum.photos/seed/sensors/400/300'
  },
  {
    id: 'oled-display',
    name: '0.96" OLED Display',
    price: 6.50,
    desc: 'Compact I2C OLED for small UI projects.',
    img: 'https://picsum.photos/seed/oled/400/300'
  },
  {
    id: 'aaa-batt-holder',
    name: 'Battery Holder (3x AAA)',
    price: 2.75,
    desc: 'Simple battery holder with on/off switch.',
    img: 'https://picsum.photos/seed/batt/400/300'
  }
];

// ------- Cart helpers -------
function getCart(){
  try {
    const raw = localStorage.getItem('kitis_cart');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Could not parse cart', e);
    return [];
  }
}
function saveCart(cart){
  localStorage.setItem('kitis_cart', JSON.stringify(cart));
  updateCartCountInNav();
}
function addToCart(productId, qty = 1){
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === productId);
  if(idx >= 0) cart[idx].qty += qty;
  else cart.push({id:productId, qty});
  saveCart(cart);
  showToast('Added to cart');
}
function setQty(productId, qty){
  let cart = getCart();
  if(qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  } else {
    const idx = cart.findIndex(i => i.id === productId);
    if(idx >= 0) cart[idx].qty = qty;
  }
  saveCart(cart);
}
function removeFromCart(productId){
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
}

function cartCount(){
  return getCart().reduce((s,i)=>s + (parseInt(i.qty)||0), 0);
}
function updateCartCountInNav(){
  const el = document.getElementById('cart-count');
  if(el) el.innerText = cartCount();
}

// ------- UI renderers -------
function renderProducts(){
  const grid = document.getElementById('products-grid');
  if(!grid) return;
  grid.innerHTML = '';
  PRODUCTS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product';
    card.innerHTML = `
      <img src="${p.img}" alt="${escapeHtml(p.name)}">
      <h4>${escapeHtml(p.name)}</h4>
      <p class="small muted">${escapeHtml(p.desc)}</p>
      <div class="controls">
        <div class="price">$${p.price.toFixed(2)}</div>
        <div>
          <button class="btn" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // attach listeners
  grid.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', function(){
      addToCart(this.getAttribute('data-add'));
      updateCartCountInNav();
    });
  });
}

function renderCartArea(){
  const area = document.getElementById('cart-area');
  if(!area) return;
  const cart = getCart();
  if(cart.length === 0){
    area.innerHTML = `<p class="muted">Your cart is empty. <a href="shop.html" class="link">Browse products.</a></p>`;
    return;
  }

  let html = '<div class="cart-list">';
  let subtotal = 0;
  cart.forEach(item => {
    const p = PRODUCTS.find(x => x.id === item.id) || {name:item.id, price:0, img:''};
    const lineTotal = (p.price || 0) * (item.qty || 1);
    subtotal += lineTotal;
    html += `
      <div class="cart-item" data-id="${escapeHtml(item.id)}">
        <img src="${p.img}" alt="${escapeHtml(p.name)}" />
        <div style="flex:1">
          <div><strong>${escapeHtml(p.name)}</strong></div>
          <div class="muted small">${escapeHtml(p.desc || '')}</div>
          <div class="small hint">Unit: $${(p.price||0).toFixed(2)} • Line: $${lineTotal.toFixed(2)}</div>
        </div>
        <div style="text-align:right">
          <div class="qty-controls">
            <button class="qty-decr" title="Decrease">−</button>
            <div style="padding:6px 8px; background:rgba(255,255,255,0.02); border-radius:6px;">${item.qty}</div>
            <button class="qty-incr" title="Increase">+</button>
          </div>
          <div style="margin-top:8px">
            <button class="remove">Remove</button>
          </div>
        </div>
      </div>
    `;
  });
  html += `</div>
    <div class="total-row">
      <div>Subtotal</div>
      <div>$${subtotal.toFixed(2)}</div>
    </div>
    <div class="small muted hint">Shipping will be arranged after you email your order.</div>
  `;
  area.innerHTML = html;

  // attach qty/remove handlers
  area.querySelectorAll('.cart-item').forEach(itemEl => {
    const id = itemEl.getAttribute('data-id');
    const decr = itemEl.querySelector('.qty-decr');
    const incr = itemEl.querySelector('.qty-incr');
    const removeBtn = itemEl.querySelector('.remove');

    decr.addEventListener('click', () => {
      const cart = getCart();
      const it = cart.find(i=>i.id===id);
      if(!it) return;
      it.qty = Math.max(0, it.qty - 1);
      if(it.qty === 0) removeFromCart(id);
      else saveCart(cart);
      renderCartArea();
      updateCartCountInNav();
    });

    incr.addEventListener('click', () => {
      const cart = getCart();
      const it = cart.find(i=>i.id===id);
      if(!it) return;
      it.qty = (it.qty||0) + 1;
      saveCart(cart);
      renderCartArea();
      updateCartCountInNav();
    });

    removeBtn.addEventListener('click', () => {
      removeFromCart(id);
      renderCartArea();
      updateCartCountInNav();
    });
  });
}

// ------- Order email builder -------
function buildOrderMailto(billing){
  const cart = getCart();
  if(cart.length === 0){
    alert('Your cart is empty.');
    return '#';
  }
  const lines = [];
  lines.push('Order from Kitis Hardware');
  lines.push('---');
  lines.push('Items:');
  let subtotal = 0;
  cart.forEach(item => {
    const p = PRODUCTS.find(x=>x.id===item.id) || {name:item.id, price:0};
    const qty = item.qty || 0;
    const lineTotal = (p.price||0) * qty;
    subtotal += lineTotal;
    lines.push(`- ${p.name} (x${qty}) — $${lineTotal.toFixed(2)}`);
  });
  lines.push('');
  lines.push(`Subtotal: $${subtotal.toFixed(2)}`);
  lines.push('');
  lines.push('Billing / Shipping info:');
  lines.push(`Name: ${billing.fullName}`);
  lines.push(`Email: ${billing.email}`);
  lines.push(`Address: ${billing.address}`);
  lines.push(`City: ${billing.city}`);
  lines.push(`State/Region: ${billing.state}`);
  lines.push(`ZIP: ${billing.zip}`);
  lines.push(`Country: ${billing.country}`);
  if(billing.notes) {
    lines.push('');
    lines.push('Notes:');
    lines.push(billing.notes);
  }

  lines.push('');
  lines.push('Please reply with payment & shipping options. Thanks!');

  const subject = `Order from ${billing.fullName || 'Customer'}`;
  const body = lines.join('\n');

  const to = 'kitis2cool@outlook.com';
  const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return mailto;
}

// ------- Utilities -------
function escapeHtml(s = '') {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(msg){
  // tiny ephemeral toast
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position = 'fixed';
  t.style.bottom = '20px';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%)';
  t.style.background = 'rgba(255,255,255,0.05)';
  t.style.color = 'var(--text)';
  t.style.padding = '10px 14px';
  t.style.borderRadius = '10px';
  t.style.boxShadow = '0 6px 18px rgba(0,0,0,0.5)';
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 1400);
}
