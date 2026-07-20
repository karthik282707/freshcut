FreshCut Connect

A responsive web prototype for a marketplace that connects Customers with verified local Butcher shops. It starts with **no business data**. Admins, Butchers, and Customers enter and manage their own information through the application.

## Architecture

`React frontend → Express REST API → PostgreSQL database`

## Setup

1. Install Node.js 20+ and PostgreSQL 15+.
2. In PostgreSQL, run `CREATE DATABASE freshcut_connect;` then connect to it and run `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.
3. Run the complete contents of `database/schema.sql` against that database.
4. Copy `backend/.env.example` to `backend/.env` and set your PostgreSQL password and a long JWT secret.
5. Copy `frontend/.env.example` to `frontend/.env`.
6. From this project folder, run `npm install`.
7. Run `npm run dev` for the backend and, in another terminal, run `npm run client` for the frontend.
8. Open the Vite address displayed in the terminal, normally `http://localhost:5173`.

## First-use workflow

The schema deliberately has no default account or products. Open the app and select **Create the first Admin account**; this one-time form saves the Admin details you enter and becomes unavailable once an Admin exists. Then:

1. Admin creates products and market prices.
2. Butcher registers, submits their shop, and adds stock/prices.
3. Admin verifies that shop.
4. Customer registers and orders from verified shop inventory.

## Important

The current environment does not include PostgreSQL, so it cannot be run here. The database schema and app are ready to connect to your local PostgreSQL installation.
