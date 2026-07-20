/**
 * Seed script — populates the database with demo data for all 4 roles.
 * Run: node src/seed.js
 */
import dotenv from 'dotenv';
dotenv.config();
import pool from './db/pool.js';
import bcrypt from 'bcryptjs';

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Meat categories
        const categories = ['Chicken', 'Mutton', 'Fish', 'Pork', 'Beef'];
        const catIds = {};
        for (const cat of categories) {
            const res = await client.query(
                `INSERT INTO meat_categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
                [cat]
            );
            catIds[cat] = res.rows[0].id;
        }

        // Users (one of each role)
        const hash = await bcrypt.hash('password123', 10);
        const users = [
            { name: 'Arjun Kumar', email: 'customer@freshcut.com', role: 'customer', phone: '9876543210' },
            { name: 'Rajan Meats', email: 'butcher@freshcut.com', role: 'butcher', phone: '9123456789' },
            { name: 'Admin FreshCut', email: 'admin@freshcut.com', role: 'admin', phone: '9000000001' },
            { name: 'Suresh Delivery', email: 'delivery@freshcut.com', role: 'delivery', phone: '9000000002' },
        ];
        const userIds = {};
        for (const u of users) {
            const res = await client.query(
                `INSERT INTO users (name, email, password_hash, role, phone)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id, role`,
                [u.name, u.email, hash, u.role, u.phone]
            );
            userIds[u.role] = res.rows[0].id;
        }

        // Shop (owned by butcher)
        const shopRes = await client.query(
            `INSERT INTO shops (owner_id, name, description, address, city, latitude, longitude, status, opens_at, closes_at)
       VALUES ($1,'Rajan Fresh Meats','Premium fresh cuts daily','12 Market Street, T. Nagar','Chennai',13.0350,80.2329,'verified','06:00','20:00')
       ON CONFLICT DO NOTHING RETURNING id`,
            [userIds['butcher']]
        );
        let shopId;
        if (shopRes.rows.length) {
            shopId = shopRes.rows[0].id;
        } else {
            const existing = await client.query('SELECT id FROM shops WHERE owner_id=$1', [userIds['butcher']]);
            shopId = existing.rows[0].id;
        }

        // Products
        const products = [
            { category: 'Chicken', name: 'Country Chicken', styles: ['Whole', 'Curry Cut', 'Boneless', 'Minced'], price: 320, stock: 50 },
            { category: 'Chicken', name: 'Broiler Chicken', styles: ['Whole', 'Curry Cut', 'Boneless', 'Minced', 'Lollipop'], price: 180, stock: 80 },
            { category: 'Mutton', name: 'Goat Mutton', styles: ['Curry Cut', 'Boneless', 'Chops', 'Ribs'], price: 750, stock: 25 },
            { category: 'Fish', name: 'Rohu Fish', styles: ['Whole', 'Sliced', 'Cleaned'], price: 280, stock: 40 },
            { category: 'Fish', name: 'Pomfret', styles: ['Whole', 'Cleaned'], price: 450, stock: 15 },
        ];

        for (const p of products) {
            const pRes = await client.query(
                `INSERT INTO products (shop_id, category_id, name, cutting_styles, unit)
         VALUES ($1,$2,$3,$4,'kg')
         ON CONFLICT DO NOTHING RETURNING id`,
                [shopId, catIds[p.category], p.name, JSON.stringify(p.styles)]
            );
            if (pRes.rows.length) {
                await client.query(
                    `INSERT INTO inventory (product_id, shop_id, stock_qty, selling_price)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (product_id, shop_id) DO UPDATE SET stock_qty=$3, selling_price=$4`,
                    [pRes.rows[0].id, shopId, p.stock, p.price]
                );
            }
        }

        // Market reference prices
        const marketPrices = { Chicken: 200, Mutton: 700, Fish: 300, Pork: 400, Beef: 500 };
        for (const [cat, price] of Object.entries(marketPrices)) {
            await client.query(
                `INSERT INTO market_prices (category_id, reference_price, updated_by)
         VALUES ($1,$2,$3)
         ON CONFLICT (category_id) DO UPDATE SET reference_price=$2`,
                [catIds[cat], price, userIds['admin']]
            );
        }

        await client.query('COMMIT');
        console.log('✅ Database seeded successfully!');
        console.log('\nDemo Accounts (password: password123):');
        console.log('  Customer : customer@freshcut.com');
        console.log('  Butcher  : butcher@freshcut.com');
        console.log('  Admin    : admin@freshcut.com');
        console.log('  Delivery : delivery@freshcut.com\n');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seed failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
