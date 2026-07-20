import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function test() {
    try {
        console.log('1. Logging in as customer...');
        const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'customer@freshcut.com',
            password: 'password123'
        });
        const customerToken = customerLogin.data.token;
        console.log('✓ Customer logged in. Token acquired.');

        console.log('2. Placing order as customer...');
        const orderRes = await axios.post(
            `${BASE_URL}/orders`,
            {
                shop_id: 1,
                items: [
                    { product_id: 1, quantity: 2, cutting_style: 'Curry Cut' }
                ],
                delivery_address: '123 Test St',
                delivery_city: 'Chennai',
                notes: 'Please cut clean.',
                payment_method: 'mock'
            },
            {
                headers: { Authorization: `Bearer ${customerToken}` }
            }
        );
        const orderId = orderRes.data.id;
        console.log(`✓ Order placed successfully! Order ID: ${orderId}`);

        console.log('3. Logging in as butcher...');
        const butcherLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'butcher@freshcut.com',
            password: 'password123'
        });
        const butcherToken = butcherLogin.data.token;
        console.log('✓ Butcher logged in. Token acquired.');

        console.log('4. Fetching butcher shop details...');
        const shopRes = await axios.get(`${BASE_URL}/shops/owner/mine`, {
            headers: { Authorization: `Bearer ${butcherToken}` }
        });
        const shopId = shopRes.data.id;
        console.log(`✓ Butcher Shop ID: ${shopId}`);

        console.log('5. Fetching butcher orders list...');
        const ordersRes = await axios.get(`${BASE_URL}/orders/shop/${shopId}`, {
            headers: { Authorization: `Bearer ${butcherToken}` }
        });
        const foundOrder = ordersRes.data.find(o => o.id === orderId);
        if (!foundOrder) {
            throw new Error(`Placed order ID ${orderId} was not found in the shop orders list!`);
        }
        console.log('✓ Placed order successfully found in butcher orders list.');

        console.log('6. Updating order status to "accepted"...');
        let updateRes = await axios.patch(
            `${BASE_URL}/orders/${orderId}/status`,
            { status: 'accepted' },
            { headers: { Authorization: `Bearer ${butcherToken}` } }
        );
        console.log(`✓ Status updated. New Status: ${updateRes.data.status}`);

        console.log('7. Updating order status to "preparing"...');
        updateRes = await axios.patch(
            `${BASE_URL}/orders/${orderId}/status`,
            { status: 'preparing' },
            { headers: { Authorization: `Bearer ${butcherToken}` } }
        );
        console.log(`✓ Status updated. New Status: ${updateRes.data.status}`);

        console.log('8. Updating order status to "ready"...');
        updateRes = await axios.patch(
            `${BASE_URL}/orders/${orderId}/status`,
            { status: 'ready' },
            { headers: { Authorization: `Bearer ${butcherToken}` } }
        );
        console.log(`✓ Status updated. New Status: ${updateRes.data.status}`);

        console.log('9. Verifying final details...');
        const verifyRes = await axios.get(`${BASE_URL}/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${butcherToken}` }
        });
        console.log('✓ Verified details loaded successfully.');
        console.log('Order Items:', verifyRes.data.items);
        console.log('Final Order Status:', verifyRes.data.status);
        if (verifyRes.data.status !== 'ready') {
            throw new Error(`Expected status 'ready' but got '${verifyRes.data.status}'`);
        }

        console.log('\n🎉 ALL ORDER LIFECYCLE TESTS PASSED SUCCESSFULLY! 🎉');
    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);
        process.exit(1);
    }
}

test();
