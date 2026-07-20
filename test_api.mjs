// FreshCut Connect — Comprehensive API Test Suite
// Tests: auth, customer, butcher, and admin endpoints

const BASE = 'http://localhost:5000/api';
let tokens = {};
let createdOrderId = null;

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg, extra) { console.error(`  ❌ FAIL: ${msg}`, extra || ''); }
function section(title) { console.log(`\n${'─'.repeat(55)}\n🧪 ${title}\n${'─'.repeat(55)}`); }

async function runTests() {
  // ─── 1. Health ─────────────────────────────────────────
  section('Health Check');
  const health = await req('GET', '/health');
  health.status === 200
    ? pass(`Health OK — ${JSON.stringify(health.data)}`)
    : fail('Health failed', health);

  // ─── 2. Auth: Login all 3 roles ────────────────────────
  section('Authentication');
  for (const [role, email] of [
    ['customer', 'customer@freshcut.com'],
    ['butcher',  'butcher@freshcut.com'],
    ['admin',    'admin@freshcut.com'],
  ]) {
    const r = await req('POST', '/auth/login', { email, password: 'password123' });
    if (r.status === 200 && r.data.token) {
      tokens[role] = r.data.token;
      pass(`Login ${role} — role: ${r.data.user?.role}`);
    } else {
      fail(`Login ${role}`, r);
    }
  }

  // ─── 3. Customer: Browse shops ─────────────────────────
  section('Customer — Browse Shops');
  const shops = await req('GET', '/shops', null, tokens.customer);
  if (shops.status === 200 && Array.isArray(shops.data) && shops.data.length > 0) {
    pass(`Got ${shops.data.length} shops — first: "${shops.data[0].name}" (⭐ ${shops.data[0].rating})`);
  } else {
    fail('Get shops', shops);
  }
  const shopId = shops.data?.[0]?.id;

  // ─── 4. Customer: Shop inventory ───────────────────────
  section('Customer — Shop Inventory');
  const inv = await req('GET', `/shops/${shopId}/products`, null, tokens.customer);
  if (inv.status === 200 && Array.isArray(inv.data)) {
    pass(`Shop ${shopId} inventory — ${inv.data.length} products`);
    inv.data.slice(0, 3).forEach(p => 
      console.log(`     • ${p.name} — ₹${p.selling_price_per_kg}/kg, qty: ${p.available_quantity_kg}kg`)
    );
  } else {
    fail('Get shop inventory', inv);
  }
  const product = inv.data?.[0];

  // ─── 5. Customer: Place order (COD) ────────────────────
  section('Customer — Place Order (COD)');
  if (product && shopId) {
    const orderPayload = {
      shop_id: shopId,
      delivery_address: '12 Anna Nagar, Chennai 600040',
      payment_method: 'COD',
      items: [
        { product_id: product.product_id, quantity_kg: 0.5, cutting_style: 'Curry Cut', special_instruction: 'Less spice please' },
      ],
    };
    const order = await req('POST', '/orders', orderPayload, tokens.customer);
    if (order.status === 201 && order.data?.id) {
      createdOrderId = order.data.id;
      pass(`Order placed — ID: ${createdOrderId}, total: ₹${order.data.total_amount}`);
    } else {
      fail('Place order', order);
    }
  }

  // ─── 6. Customer: My orders ────────────────────────────
  section('Customer — My Orders');
  const myOrders = await req('GET', '/orders/my-orders', null, tokens.customer);
  if (myOrders.status === 200 && Array.isArray(myOrders.data)) {
    pass(`Got ${myOrders.data.length} customer orders`);
  } else {
    fail('My orders', myOrders);
  }

  // ─── 7. Customer: Order detail + tracking ──────────────
  section('Customer — Order Tracking');
  if (createdOrderId) {
    const detail = await req('GET', `/orders/${createdOrderId}`, null, tokens.customer);
    if (detail.status === 200 && detail.data && detail.data.order_status) {
      pass(`Order ${createdOrderId} detail — status: "${detail.data.order_status}"`);
    } else {
      fail('Order detail', detail);
    }
  }

  // ─── 8. Butcher: Dashboard stats ───────────────────────
  section('Butcher — Dashboard Stats');
  const stats = await req('GET', '/butcher/dashboard', null, tokens.butcher);
  if (stats.status === 200) {
    pass(`Dashboard stats — ${JSON.stringify(stats.data).substring(0, 120)}`);
  } else {
    fail('Butcher stats', stats);
  }

  // ─── 9. Butcher: Inventory ─────────────────────────────
  section('Butcher — Inventory');
  const butcherInv = await req('GET', '/butcher/inventory', null, tokens.butcher);
  if (butcherInv.status === 200 && butcherInv.data && Array.isArray(butcherInv.data.inventory)) {
    pass(`Butcher inventory — ${butcherInv.data.inventory.length} products`);
    const item = butcherInv.data.inventory[0];

    // Update price
    if (item) {
      const upd = await req('PUT', `/butcher/inventory/${item.product_id}`, {
        selling_price_per_kg: 300,
        available_quantity_kg: 15,
      }, tokens.butcher);
      upd.status === 200 ? pass('Inventory updated') : fail('Update inventory', upd);
    }
  } else {
    fail('Get butcher inventory', butcherInv);
  }

  // ─── 10. Butcher: List orders ──────────────────────────
  section('Butcher — Orders');
  const bOrders = await req('GET', '/butcher/orders', null, tokens.butcher);
  if (bOrders.status === 200 && Array.isArray(bOrders.data)) {
    pass(`Butcher has ${bOrders.data.length} orders`);
    const newOrder = bOrders.data.find(o => o.order_status === 'New');
    
    // ─── 11. Butcher: Accept order ─────────────────────
    section('Butcher — Accept Order');
    if (newOrder) {
      const acc = await req('PUT', `/butcher/orders/${newOrder.id}/accept`, {}, tokens.butcher);
      if (acc.status === 200) {
        pass(`Order ${newOrder.id} accepted! Stock should be reduced.`);
      } else {
        fail(`Accept order ${newOrder.id}`, acc);
      }
    } else {
      console.log('     ⚠️  No New orders to accept (all already accepted)');
    }

    // ─── 12. Butcher: Update order status ──────────────
    section('Butcher — Update Order Status');
    const anOrder = bOrders.data.find(o => ['Accepted','Cutting Meat','Packed'].includes(o.order_status));
    if (anOrder) {
      const nextStatus = { Accepted: 'Cutting Meat', 'Cutting Meat': 'Packed', Packed: 'Out for Delivery' };
      const newStatus = nextStatus[anOrder.order_status];
      if (newStatus) {
        const upd = await req('PUT', `/butcher/orders/${anOrder.id}/status`, { status: newStatus }, tokens.butcher);
        upd.status === 200
          ? pass(`Order ${anOrder.id} status updated → "${newStatus}"`)
          : fail(`Update status for order ${anOrder.id}`, upd);
      }
    }
  } else {
    fail('Get butcher orders', bOrders);
  }

  // ─── 13. Admin: Dashboard ──────────────────────────────
  section('Admin — Dashboard (via Reports)');
  const adminStats = await req('GET', '/admin/reports', null, tokens.admin);
  if (adminStats.status === 200) {
    pass(`Admin dashboard — ${JSON.stringify(adminStats.data).substring(0, 120)}`);
  } else {
    fail('Admin dashboard', adminStats);
  }

  // ─── 14. Admin: Pending shops ──────────────────────────
  section('Admin — Pending Shops');
  const pending = await req('GET', '/admin/shops/pending', null, tokens.admin);
  if (pending.status === 200 && Array.isArray(pending.data)) {
    pass(`${pending.data.length} shops in system`);
    const pendingShop = pending.data.find(s => s.verification_status === 'pending');
    if (pendingShop) {
      const verif = await req('PUT', `/admin/shops/${pendingShop.id}/verify`, { action: 'verified', notes: 'Documents OK' }, tokens.admin);
      verif.status === 200 ? pass(`Shop "${pendingShop.name}" verified!`) : fail('Verify shop', verif);
    } else {
      console.log('     ⚠️  No pending shops found');
    }
  } else {
    fail('Admin pending shops', pending);
  }

  // ─── 15. Admin: Market prices ──────────────────────────
  section('Admin — Market Prices');
  const prices = await req('GET', '/admin/market-prices', null, tokens.admin);
  if (prices.status === 200 && prices.data && Array.isArray(prices.data.prices)) {
    pass(`Market prices — ${prices.data.prices.length} entries`);
    prices.data.prices.slice(0, 3).forEach(p =>
      console.log(`     • ${p.product_name}: ₹${p.reference_price_per_kg}/kg`)
    );
  } else {
    fail('Get market prices', prices);
  }

  // ─── 16. Admin: Set market price ───────────────────────
  section('Admin — Set Market Price');
  const setPrice = await req('POST', '/admin/market-prices', {
    product_id: 1,
    city: 'Chennai',
    reference_price_per_kg: 280,
  }, tokens.admin);
  setPrice.status === 200 || setPrice.status === 201
    ? pass(`Set market price — ₹${setPrice.data.reference_price_per_kg}/kg`)
    : fail('Set market price', setPrice);

  // ─── 17. Admin: Reports ────────────────────────────────
  section('Admin — Reports');
  const reports = await req('GET', '/admin/reports', null, tokens.admin);
  if (reports.status === 200) {
    pass(`Reports — ${JSON.stringify(reports.data).substring(0, 120)}`);
  } else {
    fail('Reports', reports);
  }

  // ─── 18. Role gating check ─────────────────────────────
  section('Security — Role Gate');
  const blocked = await req('GET', '/admin/reports', null, tokens.customer);
  blocked.status === 403
    ? pass('Customer blocked from admin routes ✓')
    : fail('Role gate failed!', blocked);

  console.log('\n' + '═'.repeat(55));
  console.log('🎉 API Test Suite Complete');
  console.log('═'.repeat(55) + '\n');
}

runTests().catch(err => { console.error('Test runner error:', err); process.exit(1); });
