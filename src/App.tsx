import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Trash2, Calendar, MapPin, Sparkles, UserCheck, 
  Store, ListFilter, Users, ArrowRight, ShieldCheck, Mail, Lock, LogOut, Check 
} from 'lucide-react';
import { CustomBlender } from './components/CustomBlender';
import { AdminDashboard } from './components/AdminDashboard';
import { DeliveryTracker } from './components/DeliveryTracker';
import { PaymentModal } from './components/PaymentModal';
import { Product, Order, OrderItem, User, CustomBlend } from './types';

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Products and Category filter states
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Classic' | 'Signature' | 'Seasonal'>('All');
  const [activeProductsLoading, setActiveProductsLoading] = useState(true);

  // Cart and orders state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('123 Greenery Heights, Fresh Town');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  
  // Tracking & gateways triggers
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [paymentTargetOrderId, setPaymentTargetOrderId] = useState<string | null>(null);
  const [paymentTargetTotal, setPaymentTargetTotal] = useState<number>(0);

  // Load and refresh products list
  const loadProductsList = async () => {
    try {
      setActiveProductsLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Error fetching catalog products: ', e);
    } finally {
      setActiveProductsLoading(false);
    }
  };

  // Sync customer order history regularly
  const syncCustomerOrders = async () => {
    if (!currentUser || currentUser.role === 'staff') return;
    try {
      const res = await fetch(`/api/orders?userId=${currentUser.id}&role=customer`);
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Error checking active customer orders: ', e);
    }
  };

  useEffect(() => {
    loadProductsList();
  }, []);

  useEffect(() => {
    syncCustomerOrders();
    const interval = setInterval(syncCustomerOrders, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Auth logins
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login rejected.');
      }
      const userData = await res.json();
      setCurrentUser(userData);
      // Reset forms
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Error occurred.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authName) {
      setAuthError('Please input your name details.');
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration rejected.');
      }
      const userData = await res.json();
      setCurrentUser(userData);
      setIsRegistering(false);
      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Error occurred.');
    }
  };

  const handleQuickDemoSession = async (role: 'customer' | 'staff') => {
    setAuthError(null);
    const email = role === 'customer' ? 'customer@juicecraft.com' : 'staff@juicecraft.com';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    setTrackedOrder(null);
    setCustomerOrders([]);
  };

  // Cart operations
  const handleAddClassicToCart = (p: Product) => {
    const existing = cart.find(it => it.isCustom === false && it.id === p.id);
    if (existing) {
      setCart(cart.map(it => (it.isCustom === false && it.id === p.id) ? { ...it, quantity: it.quantity + 1 } : it));
    } else {
      setCart([...cart, {
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: 1,
        isCustom: false,
      }]);
    }
  };

  const handleAddCustomToCart = (blend: CustomBlend) => {
    const customPrice = 6.00 + (blend.base === 'Pure Aloe vera juice' ? 2.00 : blend.base === 'Organic Coconut Water' ? 1.50 : 1.00) + (blend.addins.length * 0.75);
    const id = `custom-${Date.now()}`;
    setCart([...cart, {
      id,
      name: `Custom Blend: ${blend.name}`,
      price: customPrice,
      quantity: 1,
      isCustom: true,
      customDetails: blend,
    }]);
  };

  const handleQuantityAdjust = (id: string, diff: number) => {
    setCart(cart.map(it => {
      if (it.id === id) {
        const newVal = Math.max(1, it.quantity + diff);
        return { ...it, quantity: newVal };
      }
      return it;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(it => it.id !== id));
  };

  const cartTotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);

  // Checkout order placement
  const handlePlaceOrder = async () => {
    if (!currentUser) return;
    if (!cart.length) return;
    setIsPlacingOrder(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          items: cart,
          total: cartTotal,
          address: deliveryAddress,
        }),
      });

      if (!res.ok) throw new Error('Order submission declined by platform server.');
      const orderData = await res.json();
      
      // Clear shopping cart
      setCart([]);
      
      // Trigger checkout payment modal immediately as instructed
      setPaymentTargetOrderId(orderData.id);
      setPaymentTargetTotal(orderData.total);
      
      // Update local orders list
      syncCustomerOrders();
    } catch (e: any) {
      alert(e.message || 'Checkout failed.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div id="juicecraft-applet-root" className="min-h-screen bg-[#FDF8F3] text-[#31261E] font-sans selection:bg-[#EBD9C6] border-8 border-[#F5E6D3] box-border antialiased">
      
      {/* GLOBAL NAVBAR HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#EBD9C6] py-4 px-4 md:px-8 rounded-b-3xl shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTrackedOrder(null)}>
            <div className="w-10 h-10 bg-[#FF7043] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
              J
            </div>
            <div>
              <h1 className="text-xl font-serif italic text-[#4A3B31] leading-none">JuiceCraft Artisan</h1>
              <span className="text-[10px] font-bold text-[#7C6354] tracking-wider block mt-1 uppercase">Cold-Pressed Alchemy</span>
            </div>
          </div>

          {/* Center Navigation Role Indicator Widgets */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-1.5 bg-[#FAF3EF] p-1 rounded-xl border border-[#EBD9C6]">
              <span className="text-[10px] font-bold text-[#7C6354] px-2.5">Mode:</span>
              <button 
                onClick={() => handleLogout()} 
                className={`text-[10px] font-bold py-1 px-3.5 rounded-lg flex items-center gap-1 transition-all uppercase tracking-wider ${
                  currentUser.role === 'customer' 
                    ? 'bg-[#FF7043] text-white shadow-sm' 
                    : 'bg-white/40 hover:bg-white/80 text-[#7C6354]'
                }`}
              >
                Customer Portal
              </button>
              <button 
                onClick={() => handleLogout()} 
                className={`text-[10px] font-bold py-1 px-3.5 rounded-lg flex items-center gap-1 transition-all uppercase tracking-wider ${
                  currentUser.role === 'staff' 
                    ? 'bg-[#4E6E58] text-white shadow-sm' 
                    : 'bg-white/40 hover:bg-white/80 text-[#7C6354]'
                }`}
              >
                Artisan Staff Node
              </button>
            </div>
          )}

          {/* User controls / Auth actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right leading-none">
                  <p className="text-xs font-bold text-[#31261E]">{currentUser.name}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider inline-block mt-1 px-2 py-0.5 rounded ${
                    currentUser.role === 'staff' ? 'text-white bg-[#4E6E58]' : 'text-white bg-[#FF7043]'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 w-9 h-9 flex items-center justify-center rounded-xl border border-[#EBD9C6] hover:bg-red-50 hover:text-red-600 text-[#7C6354] transition-colors cursor-pointer"
                  title="Logout Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleQuickDemoSession('customer')}
                  className="text-[10px] font-bold bg-[#FF7043] hover:bg-[#E64A19] text-white py-2 px-3.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Demo Customer
                </button>
                <button 
                  onClick={() => handleQuickDemoSession('staff')}
                  className="text-[10px] font-bold bg-[#4E6E58] hover:bg-[#395240] text-white py-2 px-3.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Demo Staff
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* RENDER VIEW ACCORDING TO USER ROLES AND CHOSEN TARGET CARRIER */}
      <main className="pb-20 pt-6">

        {/* AUTHENTICATION ENTRANCE GRID SCREEN */}
        {!currentUser && (
          <div className="max-w-md mx-auto my-16 px-4">
            <div className="bg-white rounded-3xl border border-[#EBD9C6] p-8 space-y-6 shadow-sm">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#FF7043] mx-auto flex items-center justify-center text-2xl text-white font-bold font-serif shadow-sm">
                  J
                </div>
                <h2 className="text-2xl font-serif italic text-[#31261E] tracking-tight">Access JuiceCraft Network</h2>
                <p className="text-xs text-[#7C6354]">Log in as a customer to blend your custom juice, or access staff dashboard with staff details.</p>
              </div>

              {/* DEMO USER TRIGGER HELPER BOX */}
              <div className="bg-[#FAF3EF] border border-[#EBD9C6] rounded-2xl p-5 space-y-3">
                <span className="text-[10px] font-bold text-[#7C6354] uppercase tracking-widest block font-mono">
                  🚀 Quick Demo Entrances (No password required)
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleQuickDemoSession('customer')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#EBD9C6] bg-white hover:bg-[#FFF5F2] transition-all text-xs text-[#31261E] font-bold shadow-sm cursor-pointer"
                  >
                    <span className="text-[#FF7043]">Customer View</span>
                    <span className="text-[9px] text-[#7C6354] font-normal lowercase mt-1">customer@juicecraft.com</span>
                  </button>
                  <button
                    onClick={() => handleQuickDemoSession('staff')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#EBD9C6] bg-white hover:bg-[#F4F7F5] transition-all text-xs text-[#31261E] font-bold shadow-sm cursor-pointer"
                  >
                    <span className="text-[#4E6E58]">Artisan Staff</span>
                    <span className="text-[9px] text-[#7C6354] font-normal lowercase mt-1">staff@juicecraft.com</span>
                  </button>
                </div>
              </div>

              {/* Credential login forms */}
              <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4 pt-1">
                {isRegistering && (
                  <div>
                    <label className="text-[10px] font-bold text-[#7C6354] uppercase block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full text-xs font-semibold p-3 border border-[#EBD9C6] rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] bg-[#FDF8F3] mt-1 text-[#31261E]"
                      placeholder="e.g. Liam Smith"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-[#7C6354] uppercase block">Email address</label>
                  <div className="relative mt-1">
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full text-xs font-semibold p-3 pl-10 border border-[#EBD9C6] rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] bg-[#FDF8F3] text-[#31261E]"
                      placeholder="you@juicecraft.com"
                    />
                    <Mail className="w-4 h-4 text-[#7C6354] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#7C6354] uppercase block">Password parameter</label>
                  <div className="relative mt-1 font-mono">
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full text-xs font-semibold p-3 pl-10 border border-[#EBD9C6] rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] bg-[#FDF8F3] text-[#31261E]"
                      placeholder="••••••••"
                    />
                    <Lock className="w-4 h-4 text-[#7C6354] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {authError && <p className="text-[10px] text-red-700 font-bold bg-red-50 p-2.5 rounded-lg text-center border border-red-100">{authError}</p>}

                <button
                  type="submit"
                  id="auth-submit-btn"
                  className="w-full flex items-center justify-center gap-2 bg-[#FF7043] hover:bg-[#E64A19] text-white py-3.5 rounded-2xl font-bold text-xs tracking-wider transition-all cursor-pointer shadow-md"
                >
                  {isRegistering ? 'CREATE NEW ACCOUNT' : 'SECURE SESSION LOGIN'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Toggler */}
              <div className="text-center pt-3 border-t border-[#EBD9C6]/50">
                <button
                  onClick={() => {
                    setAuthError(null);
                    setIsRegistering(!isRegistering);
                  }}
                  className="text-xs font-bold text-[#7C6354] hover:text-[#31261E] underline underline-offset-4 cursor-pointer"
                >
                  {isRegistering ? 'Already have an account? Log in' : 'New to JuiceCraft? Register secure customer account'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* CUSTOMER PORTAL WORKSPACE */}
        {currentUser && currentUser.role === 'customer' && (
          <div className="space-y-10">
            
            {/* HERO SECTION SLATE */}
            <div className="max-w-7xl mx-auto px-4 pt-6">
              <div className="relative rounded-3xl overflow-hidden bg-white border border-[#EBD9C6] p-8 md:p-12 shadow-sm flex flex-col relative">
                {/* Decorative design layers */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFF0E6] rounded-full -mr-24 -mt-24 opacity-60 blur-xl pointer-events-none"></div>
                
                <div className="max-w-xl space-y-4 relative z-10 flex flex-col h-full text-[#31261E]">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#FF7043] mb-1">
                    Seasonal Selection
                  </span>
                  <h2 className="text-4xl md:text-5xl font-serif text-[#31261E] leading-tight">
                    The Sun-Kissed<br/>Mango & Lime
                  </h2>
                  <p className="text-[#7C6354] text-xs md:text-sm leading-relaxed">
                    Welcome back, <strong className="text-[#31261E] font-bold">{currentUser.name}</strong>. Our cold-pressed alphonso mango is paired with zesty key lime and raw honey. Engineered under organic guidelines to protect 100% vitamins, enzymes, and micro-nutrients.
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-3">
                    <a href="#store-catalog-anchor" className="text-xs font-bold py-3.5 px-7 bg-[#FF7043] hover:bg-[#E64A19] text-white rounded-2xl shadow-md transition-all">
                      Explore Catalog
                    </a>
                    <a href="#custom-blender-portal" className="text-xs font-bold py-3.5 px-7 bg-[#4E6E58] hover:bg-[#395240] text-white rounded-2xl transition-all shadow-md">
                      Mix Custom Recipe
                    </a>
                  </div>
                </div>

                <div className="absolute bottom-8 right-8 hidden sm:flex gap-3">
                  <div className="w-14 h-14 rounded-full border border-[#EBD9C6] bg-white flex items-center justify-center font-bold text-[#4E6E58] text-sm shadow-sm">100%</div>
                  <div className="w-14 h-14 rounded-full border border-[#EBD9C6] bg-white flex items-center justify-center text-[10px] text-center font-bold text-[#7C6354] leading-tight shadow-sm">RAW<br/>PRESS</div>
                </div>
              </div>
            </div>

            {/* TRACKED LIVE SINK AREA */}
            {trackedOrder && (
              <div className="max-w-7xl mx-auto px-4">
                <DeliveryTracker 
                  order={trackedOrder} 
                  onClose={() => setTrackedOrder(null)} 
                />
              </div>
            )}

            {/* CUSTOM BLENDER COMPONENT */}
            <CustomBlender 
              onAddCustomToCart={handleAddCustomToCart} 
              userEmail={currentUser.email} 
            />

            {/* CLASSIC STOREFRONT AND SHOPPING CART SPLIT */}
            <div id="store-catalog-anchor" className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
              
              {/* LEFT: Catalog Products Index */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Catalog headers / filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EBD9C6] pb-5">
                  <div>
                    <h3 className="text-2xl font-serif italic text-[#31261E] tracking-tight">Handmade Cold-Pressed Catalog</h3>
                    <p className="text-xs text-[#7C6354]">Pressed daily, chilled instantly, delivered in under 30 minutes securely.</p>
                  </div>

                  {/* Category filters */}
                  <div className="flex flex-wrap gap-1 bg-[#FAF3EF] p-1 rounded-2xl border border-[#EBD9C6]">
                    {(['All', 'Classic', 'Signature', 'Seasonal'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[10px] font-bold px-3.5 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                          selectedCategory === cat 
                            ? 'bg-[#FF7043] text-white shadow-sm' 
                            : 'text-[#7C6354] hover:text-[#31261E]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {activeProductsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-[#EBD9C6] border-t-[#FF7043] animate-spin" />
                    <span className="text-xs text-[#7C6354] font-medium font-mono">Refreshing organic catalog...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {products
                      .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
                      .map((p) => (
                        <div 
                          key={p.id} 
                          className="bg-white rounded-3xl border border-[#EBD9C6] overflow-hidden shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all"
                        >
                          <div>
                            {/* Product Cover image */}
                            <div className="h-44 w-full overflow-hidden bg-[#FAF3EF] relative">
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#4A3B31] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border border-[#EBD9C6]/55">
                                {p.category}
                              </span>
                              {!p.inStock && (
                                <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="bg-[#FF7043] text-white font-extrabold text-[10px] tracking-widest uppercase px-4 py-2 rounded-xl shadow-md">
                                    Sold Out Today
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-6 space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-serif italic text-lg text-[#31261E] leading-tight">{p.name}</h4>
                                <span className="font-bold font-mono text-[#FF7043] text-base shrink-0">${p.price.toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-[#7C6354] leading-relaxed">{p.description}</p>
                              
                              {/* Product Ingredients bubble list */}
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {p.ingredients.map(ing => (
                                  <span key={ing} className="bg-[#FAF3EF] text-[#7C6354]/90 text-[9px] font-bold px-2.5 py-0.5 rounded-lg border border-[#EBD9C6]/40">
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Squeeze trigger */}
                          <div className="p-6 pt-0">
                            <button
                              onClick={() => handleAddClassicToCart(p)}
                              disabled={!p.inStock}
                              className="w-full text-center bg-[#4E6E58] hover:bg-[#395240] text-white disabled:bg-stone-100 disabled:text-stone-450 py-2.5 rounded-2xl text-xs font-bold tracking-wider transition-all cursor-pointer shadow-sm"
                            >
                              ADD TO BASKET (+${p.price.toFixed(2)})
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

              </div>

              {/* RIGHT: Active Shopping Cart Sidebar */}
              <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EBD9C6] p-6 space-y-6 shadow-sm">
                
                <h3 className="text-xl font-serif italic text-[#31261E] tracking-tight flex items-center justify-between">
                  <span>Your Basket</span>
                  <ShoppingBag className="w-5 h-5 text-[#FF7043]" />
                </h3>

                {cart.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <span className="text-3xl inline-block animate-bounce">🍊</span>
                    <p className="text-xs font-bold text-[#7C6354]">Basket is completely empty.</p>
                    <p className="text-[10px] text-[#A58E7F] mt-1 lead-relaxed">Choose delicious classic mixtures from our catalog or design custom elixirs inside the Flavor Lab above.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Basket Item List */}
                    <div className="space-y-3 divide-y divide-[#EBD9C6]/40 max-h-72 overflow-y-auto pr-1">
                      {cart.map((it) => (
                        <div key={it.id} className="flex justify-between items-start gap-2.5 pt-3 first:pt-0">
                          <div className="space-y-0.5 max-w-[160px]">
                            <p className="font-bold text-xs text-[#31261E] leading-tight">{it.name}</p>
                            <span className="text-[10px] text-[#FF7043] font-mono font-bold">${(it.price * it.quantity).toFixed(2)}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button 
                              onClick={() => handleQuantityAdjust(it.id, -1)}
                              className="w-5 h-5 rounded hover:bg-[#FAF3EF] flex items-center justify-center text-xs border border-[#EBD9C6] text-[#7C6354] font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-mono text-xs font-extrabold text-[#31261E]">
                              {it.quantity}
                            </span>
                            <button 
                              onClick={() => handleQuantityAdjust(it.id, 1)}
                              className="w-5 h-5 rounded hover:bg-[#FAF3EF] flex items-center justify-center text-xs border border-[#EBD9C6] text-[#7C6354] font-bold cursor-pointer"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => handleRemoveFromCart(it.id)}
                              className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 ml-1.5 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total math */}
                    <div className="border-t border-dashed border-[#EBD9C6] pt-4 space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#7C6354] font-medium">
                        <span>Items Subtotal</span>
                        <span className="font-mono text-[#31261E]">${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#7C6354] font-medium">
                        <span>Instant Delivery</span>
                        <span className="font-mono text-[#4E6E58] font-bold">FREE</span>
                      </div>
                      <div className="flex justify-between text-[#31261E] font-bold text-sm pt-2.5 border-t border-[#EBD9C6]/50">
                        <span>Total Checkout Payment</span>
                        <span className="font-mono text-[#FF7043]">${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Delivery Target inputs */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#7C6354] uppercase tracking-widest block">Delivery Address details *</label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 border border-[#EBD9C6] rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] bg-[#FDF8F3] text-[#31261E]"
                        rows={2}
                        placeholder="Complete Street address..."
                      />
                    </div>

                    {/* Place Order Squeeze */}
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder}
                      id="place-checkout-order-btn"
                      className="w-full text-center bg-[#FF7043] hover:bg-[#E64A19] text-white py-3 rounded-2xl font-bold text-xs tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isPlacingOrder ? 'STAMPING PARCEL ORDER...' : 'PLACE ORDER & SIGN SECURELY'}
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* ORDER HISTORY INDEX (FOR SELECTING DYNAMIC MAP COMPONENT) */}
            {customerOrders.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 pt-4">
                <div className="bg-white rounded-3xl border border-[#EBD9C6] p-6 md:p-8 space-y-4 shadow-sm">
                  <h3 className="text-xl font-serif italic text-[#31261E] tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#FF7043]" />
                    Your Micro-Nutritional Cold-Pressed History
                  </h3>
                  <p className="text-xs text-[#7C6354]">Track and view active driver progress and payment certificates live.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="p-5 rounded-2xl border border-[#EBD9C6] bg-[#FAF3EF] hover:bg-[#FFF5F2] transition-colors flex justify-between items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#FF7043] bg-[#FFF5F2] px-2 py-0.5 rounded font-mono uppercase border border-[#EBD9C6]/50">
                              {order.id}
                            </span>
                            <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              order.status === 'pending' ? 'bg-[#FAF3EF] text-[#7C6354] border border-[#EBD9C6]' :
                              order.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                              order.status === 'on_the_way' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          
                          <p className="text-xs font-bold text-[#31261E]">
                            {order.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                          </p>
                          <p className="text-[10px] text-[#7C6354] font-mono">
                            Total: <strong>${order.total.toFixed(2)}</strong> | {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1.5 items-end">
                          {order.paymentStatus === 'pending' ? (
                            <button
                              onClick={() => {
                                setPaymentTargetOrderId(order.id);
                                setPaymentTargetTotal(order.total);
                              }}
                              className="text-[10px] font-bold tracking-wider bg-[#FF7043] hover:bg-[#E64A19] text-white rounded-xl px-3 py-2 transition-all cursor-pointer shadow-sm"
                            >
                              Authorize Pay
                            </button>
                          ) : (
                            <button
                              onClick={() => setTrackedOrder(order)}
                              className="text-[10px] font-bold tracking-wider bg-[#4E6E58] hover:bg-[#395240] text-white rounded-xl px-3 py-2 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              Live Tracker
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* STAFF/ARTISAN PORTAL CONFIGURATIONS */}
        {currentUser && currentUser.role === 'staff' && (
          <AdminDashboard 
            onProductAdded={loadProductsList} 
            productsList={products} 
          />
        )}

      </main>

      {/* FOOTER METRICS INFO */}
      <footer className="bg-white border-t border-[#EBD9C6] py-4 px-4 md:px-8 text-[10px] text-[#A58E7F] uppercase font-bold tracking-tighter">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex gap-4">
            <span>Session ID: J-992-STAFF</span>
            <span>Last Sync: Realtime Active</span>
          </div>
          <div className="flex gap-4">
            <span>Secure SSL Payment Active</span>
            <span>Stripe Secured</span>
          </div>
        </div>
      </footer>

      {/* PAYMENT MODAL TRIGGER OVERLAYS */}
      {paymentTargetOrderId && (
        <PaymentModal
          orderId={paymentTargetOrderId}
          totalAmount={paymentTargetTotal}
          onClose={() => {
            setPaymentTargetOrderId(null);
            syncCustomerOrders();
          }}
          onPaymentSuccess={() => {
            setPaymentTargetOrderId(null);
            // Refresh customer order lists
            syncCustomerOrders();
            // Automatically launch tracker for the paid order to delight the user!
            const matched = customerOrders.find(o => o.id === paymentTargetOrderId);
            if (matched) {
              setTrackedOrder(matched);
            } else {
              // Try force load
              setTimeout(syncCustomerOrders, 1000);
            }
          }}
        />
      )}

    </div>
  );
}
