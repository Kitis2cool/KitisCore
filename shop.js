// shop.js — Full product + cart + EmailJS checkout logic

// ------- Product catalog (placeholders) -------
const PRODUCTS = [
  {
    id: 'M5S',
    name: 'M5StickC plus 2',
    price: 45.00,
    desc: 'A small device smaller than a battery to turn on TV\'s (And More) with a click of a button',
    img: 'https://http2.mlstatic.com/D_NQ_NP_812374-CBT82305651682_022025-O.webp'
  },
  {
    id: 'BLEj',
    name: 'Bluetooth Jammer',
    price: 60.00,
    desc: 'A Dual-Antenna NRF24 board with ESP-32 to disrupt bluetooth in a radius.',
    img: 'https://camo.githubusercontent.com/eaab020038849c03f4be188040d439f74595c2b27cfc67f57ea4f2de5c8bd6c4/68747470733a2f2f64776477706c642e70616765732e6465762f4449595043422e6a7067'
  },
  {
    id: 'T-embed',
    name: 'T-Embed CC1101 Plus',
    price: 85.00,
    desc: 'An \"All in one\" device simular to the Flipper zero for more than half the price',
    img: 'https://lilygo.cc/cdn/shop/files/T-Embed-CC1101-lilygo_2.jpg?v=1727250195&width=600'
  },
  {
    id: 'EMP',
    name: 'EMP (Electro Magnetic Pulse)',
    price: 95.00,
    desc: 'A deivce which can destroy electronics at short range (Be careful!)',
    img: 'https://picsum.photos/seed/sensors/400/300'
  },
  {
    id: 'Beeper-Speaker',
    name: 'Beeper Speaker',
    price: 6.00,
    desc: 'A small implant to emit a beep every few minutes. (Bulk prices available)',
    img: 'https://m.media-amazon.com/images/I/610DQu7hDuL._AC_SL1500_.jpg'
  },
  {
    id: 'GPTC',
    name: 'ChatGPT calculator',
    price: 0.00,
    desc: 'COMING SOON',
    img: 'https://miro.medium.com/v2/resize:fit:627/1*Xx6QzfSYLL30N4j51F292Q.jpeg'
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
      renderCartArea();
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
    <div class="small muted hint">Shipping will be arranged after you send your order.</div>
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

// ------- EmailJS Checkout -------
function setupEmailJSCheckout(formId){
  const form = document.getElementById(formId);
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const fd = new FormData(form);
    const billing = {
      fullName: fd.get('fullName') || '',
      email: fd.get('email') || '',
      address: fd.get('address') || '',
      city: fd.get('city') || '',
      zip: fd.get('zip') || '',
      notes: fd.get('notes') || ''
    };

    // Prepare cart items string
    const itemsStr = getCart().map(item => {
      const p = PRODUCTS.find(x => x.id === item.id) || { name: item.id, price: 0 };
      return `${p.name} (x${item.qty}) - $${(p.price * item.qty).toFixed(2)}`;
    }).join('\n');

    const templateParams = {
      fullName: billing.fullName,
      email: billing.email,
      address: billing.address,
      city: billing.city,
      zip: billing.zip,
      notes: billing.notes,
      items: itemsStr
    };

    emailjs.send('YOUR_SERVICE_ID','YOUR_TEMPLATE_ID', templateParams)
      .then(function(response){
        alert('Order sent successfully!');
        localStorage.removeItem('kitis_cart'); // auto-clear
        renderCartArea();
        updateCartCountInNav();
        form.reset();
        showToast('Cart cleared!');
      }, function(error){
        console.error('Failed to send order:', error);
        alert('Failed to send order. Please try again.');
      });
  });
}
