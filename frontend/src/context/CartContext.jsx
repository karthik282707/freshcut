import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [shopId, setShopId] = useState(null);

    const addToCart = (item) => {
        if (shopId && shopId !== item.shop_id) {
            if (!window.confirm('Your cart has items from another shop. Clear cart and add new item?')) return;
            setCartItems([]);
            setShopId(null);
        }
        setShopId(item.shop_id);
        setCartItems(prev => {
            const key = `${item.id}-${item.cutting_style}`;
            const existing = prev.find(i => `${i.id}-${i.cutting_style}` === key);
            if (existing) {
                return prev.map(i => `${i.id}-${i.cutting_style}` === key ? { ...i, quantity: i.quantity + item.quantity } : i);
            }
            return [...prev, { ...item, cartKey: key }];
        });
    };

    const removeFromCart = (cartKey) => {
        setCartItems(prev => prev.filter(i => i.cartKey !== cartKey));
        if (cartItems.length <= 1) setShopId(null);
    };

    const updateQty = (cartKey, qty) => {
        if (qty <= 0) return removeFromCart(cartKey);
        setCartItems(prev => prev.map(i => i.cartKey === cartKey ? { ...i, quantity: qty } : i));
    };

    const clearCart = () => { setCartItems([]); setShopId(null); };

    const cartCount = cartItems.length;
    const cartTotal = cartItems.reduce((s, i) => s + i.selling_price * i.quantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, shopId, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
