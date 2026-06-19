import React, { useState, useEffect } from 'react';
import { Product, Order } from '../types';
import { ShieldCheck, PlusCircle, Package, TrendingUp, DollarSign, Loader2, ArrowRight, ToggleLeft, CheckCircle, Clock } from 'lucide-react';

interface AdminDashboardProps {
  onProductAdded: () => void;
  productsList: Product[];
}

export function AdminDashboard({ onProductAdded, productsList }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New product form states
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodIngredients, setProdIngredients] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodCategory, setProdCategory] = useState<'Classic' | 'Seasonal' | 'Signature'>('Classic');
  const [prodPrepTime, setProdPrepTime] = useState('4');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/orders?role=staff');
      if (!res.ok) throw new Error('Failed to fetch store orders list.');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred fetching orders database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000); // Poll orders
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update rejected.');
      
      // Update local state immediately
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e: any) {
      alert(e.message || 'Error updating order status.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!prodName || !prodDesc || !prodPrice || !prodIngredients) {
      setFormError('Please fill out all required attributes.');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: prodName,
          description: prodDesc,
          price: Number(prodPrice),
          ingredients: prodIngredients.split(',').map(i => i.trim()),
          image: prodImage || undefined,
          category: prodCategory,
          prepTime: Number(prodPrepTime) || 4,
          inStock: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register product.');
      }

      setFormSuccess(`Successfully added organic juice "${prodName}" to the store catalog!`);
      // Reset form
      setProdName('');
      setProdDesc('');
      setProdPrice('');
      setProdIngredients('');
      setProdImage('');
      setProdPrepTime('4');
      
      onProductAdded();
    } catch (e: any) {
      setFormError(e.message || 'An error occurred during submission.');
    }
  };

  // Toggle inStock state
  const handleToggleStock = async (prodId: string, currentStock: boolean) => {
    try {
      const res = await fetch(`/api/products/${prodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !currentStock }),
      });
      if (res.ok) {
        onProductAdded(); // refresh products list on app level
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations for KPI Cards
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.total, 0);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const deliveryCount = orders.filter(o => o.status === 'on_the_way').length;

  return (
    <div id="staff-admin-portal" className="bg-[#FDF8F3] px-4 md:px-8 py-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-[#EBD9C6] shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#4E6E58]">
              <ShieldCheck className="w-5 h-5 text-[#4E6E58] animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#4E6E58]">Secured Staff Administration Node</span>
            </div>
            <h1 className="text-2xl font-serif italic text-[#31261E] tracking-tight">Artisan Command Center</h1>
            <p className="text-[#7C6354] text-xs">Manage cold-press inventory, process user delivery stages and inspect real-time metrics.</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="text-xs font-bold py-2.5 px-4 bg-[#FF7043] hover:bg-[#E64A19] text-white rounded-xl shadow-sm cursor-pointer transition-all"
          >
            Refresh Orders Live
          </button>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-6 rounded-3xl border border-[#EBD9C6] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#A58E7F] font-bold uppercase tracking-wider">Total Sales</p>
              <h3 className="text-2xl font-bold text-[#31261E] mt-1">${totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F2] border border-[#EBD9C6]/60 flex items-center justify-center text-[#FF7043]">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EBD9C6] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#A58E7F] font-bold uppercase tracking-wider">Pending Press</p>
              <h3 className="text-2xl font-bold text-[#FF7043] mt-1">{pendingCount} orders</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F2] border border-[#EBD9C6]/60 flex items-center justify-center text-[#FF7043]">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EBD9C6] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#A58E7F] font-bold uppercase tracking-wider">In Transit</p>
              <h3 className="text-2xl font-bold text-[#31261E] mt-1">{deliveryCount} riders</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAF3EF] border border-[#EBD9C6]/60 flex items-center justify-center text-[#7C6354]">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EBD9C6] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#A58E7F] font-bold uppercase tracking-wider">Total Products</p>
              <h3 className="text-2xl font-bold text-[#31261E] mt-1">{productsList.length} formulas</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAF3EF] border border-[#EBD9C6]/60 flex items-center justify-center text-[#7C6354]">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* MIDDLE: Active Orders List Tab */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EBD9C6] shadow-sm p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#FAF3EF]">
              <h2 className="text-lg font-serif italic text-[#31261E] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#FF7043]" />
                Customer Orders Pipeline
              </h2>
              <span className="text-[10px] font-mono text-[#7C6354] bg-[#FAF3EF] px-2.5 py-1 rounded border border-[#EBD9C6]/60 uppercase font-bold">
                Auto refresh active
              </span>
            </div>

            {isLoading && orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="w-8 h-8 text-[#FF7043] animate-spin" />
                <span className="text-[10px] text-[#7C6354] font-medium font-mono uppercase">Loading pipeline database...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[#EBD9C6] rounded-2xl bg-[#FAF3EF]/40">
                <Package className="w-10 h-10 mx-auto text-[#A58E7F]" />
                <p className="text-[#31261E] text-xs font-bold mt-2">Zero Active Pipeline Orders Available</p>
                <p className="text-[10px] text-[#7C6354] mt-0.5">Place customer orders using store panels to see them populate here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#31261E]">
                  <thead className="bg-[#FAF3EF] text-[10px] font-extrabold uppercase text-[#7C6354] tracking-wider border-b border-[#EBD9C6]/60">
                    <tr>
                      <th className="p-3">ID / Customer</th>
                      <th className="p-3">Juice Description & Custom Details</th>
                      <th className="p-3">Total Cost</th>
                      <th className="p-3">Status Gate</th>
                      <th className="p-3 text-right">Dispatch Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD9C6]/40">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF3EF]/20 transition-colors">
                        <td className="p-3 font-semibold space-y-0.5 whitespace-nowrap">
                          <span className="text-[#FF7043] font-bold bg-[#FFF5F2] px-1.5 py-0.5 rounded border border-[#EBD9C6]/40 font-mono text-[9px]">
                            {order.id}
                          </span>
                          <p className="text-[#31261E] pt-1.5 font-bold">{order.userName}</p>
                          <p className="text-[9px] text-[#7C6354] font-mono lowercase">{order.userEmail}</p>
                        </td>

                        <td className="p-3 max-w-xs space-y-2">
                          <div className="space-y-1">
                            {order.items.map((it) => (
                              <div key={it.id} className="pb-1">
                                <span className="font-bold text-[#31261E] text-[11px]">
                                  {it.name} <span className="text-[#7C6354] font-mono">x{it.quantity}</span>
                                </span>
                                {it.isCustom && it.customDetails && (
                                  <div className="mt-1 text-[10px] text-[#7C6354] space-y-0.5 bg-[#FAF3EF]/50 p-2 rounded-xl border border-[#EBD9C6]/60">
                                    <p className="font-medium italic text-[#7C6354]">
                                      "{it.customDetails.aiDescription?.slice(0, 100)}..."
                                    </p>
                                    <p className="text-[9px] text-[#A58E7F] font-mono">
                                      <strong>Base:</strong> {it.customDetails.base} |{' '}
                                      <strong>Sweetness:</strong> {it.customDetails.sweetness}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-[9px] text-[#7C6354] truncate bg-[#FAF3EF]/30 px-2 py-1 rounded inline-block max-w-[200px]">
                            <strong>Deliver:</strong> {order.address}
                          </p>
                        </td>

                        <td className="p-3 font-mono font-bold text-[#31261E]">
                          ${order.total.toFixed(2)}
                          <div className="text-[9px] mt-1">
                            {order.paymentStatus === 'paid' ? (
                              <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">Paid</span>
                            ) : (
                              <span className="text-[#FF7043] bg-[#FFF5F2] border border-[#EBD9C6]/60 px-2 py-0.5 rounded-full font-bold">Unpaid</span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider inline-block ${
                            order.status === 'pending' ? 'bg-[#FAF3EF] text-[#7C6354] border border-[#EBD9C6]' :
                            order.status === 'preparing' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            order.status === 'on_the_way' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex flex-col sm:flex-row gap-1 justify-end">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                className="text-[10px] font-bold bg-[#FF7043] hover:bg-[#E64A19] text-white rounded-lg px-2.5 py-1.5 transition-all text-center shrink-0 cursor-pointer shadow-sm"
                              >
                                Cold-Press
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'on_the_way')}
                                className="text-[10px] font-bold bg-[#4E6E58] hover:bg-[#395240] text-white rounded-lg px-2.5 py-1.5 transition-all text-center shrink-0 cursor-pointer shadow-sm"
                              >
                                Dispatch
                              </button>
                            )}
                            {order.status === 'on_the_way' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                className="text-[10px] font-bold bg-[#3b82f6] hover:bg-blue-700 text-white rounded-lg px-2.5 py-1.5 transition-all text-center shrink-0 cursor-pointer shadow-sm"
                              >
                                Delivered
                              </button>
                            )}
                            {order.status === 'delivered' && (
                              <span className="text-[10px] text-green-700 font-bold inline-flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Completed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT: Add Product Form Panel */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EBD9C6] shadow-sm p-6 space-y-4">
            
            <h2 className="text-lg font-serif italic text-[#31261E] flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#4E6E58]" />
              Add Product Formula
            </h2>
            <p className="text-xs text-[#7C6354]">Add a beautiful, organic classic flavor-blend formula directly to the store index catalog.</p>

            <form onSubmit={handleAddProduct} className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-[#7C6354] uppercase tracking-wider block">Product Formula Name *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-[#EBD9C6] bg-[#FDF8F3]/30 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] focus:border-[#FF7043]"
                  placeholder="e.g. Raspberry Royal Velvet"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7C6354] uppercase tracking-wider block">Ingredients Blend (Comma separated) *</label>
                <input
                  type="text"
                  required
                  value={prodIngredients}
                  onChange={(e) => setProdIngredients(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-[#EBD9C6] bg-[#FDF8F3]/30 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] focus:border-[#FF7043]"
                  placeholder="e.g. Raspberry, Lemon juice, Royal Honey"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#7C6354] uppercase tracking-wider block">Sale Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-[#EBD9C6] bg-[#FDF8F3]/30 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] focus:border-[#FF7043]"
                    placeholder="7.99"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7C6354] uppercase tracking-wider block">Prep Time (Mins) *</label>
                  <input
                    type="number"
                    required
                    value={prodPrepTime}
                    onChange={(e) => setProdPrepTime(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-[#EBD9C6] bg-[#FDF8F3]/30 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] focus:border-[#FF7043]"
                    placeholder="4"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7C6354] uppercase tracking-wider block">Liquid Category *</label>
                <select
                  value={prodCategory}
                  onChange={(e: any) => setProdCategory(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-[#EBD9C6] bg-[#FDF8F3]/35 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] focus:border-[#FF7043]"
                >
                  <option value="Classic">Classic Blend</option>
                  <option value="Signature">Signature Health Formulas</option>
                  <option value="Seasonal">Seasonal Specials</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7C6354] uppercase tracking-wider block">Beautiful Cover URL</label>
                <input
                  type="url"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-[#EBD9C6] bg-[#FDF8F3]/30 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] focus:border-[#FF7043]"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7C6354] uppercase tracking-wider block">Sensory Story & Description *</label>
                <textarea
                  required
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-[#EBD9C6] bg-[#FDF8F3]/30 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-[#FF7043] focus:border-[#FF7043]"
                  placeholder="A premium gourmet cold-press that integrates organic ingredients to..."
                />
              </div>

              {formError && <p className="text-[10px] text-red-700 font-bold bg-[#FFF5F2] border border-[#EBD9C6]/50 p-2.5 rounded-xl">{formError}</p>}
              {formSuccess && <p className="text-[10px] text-green-700 font-bold bg-[#E8F5E9] border border-[#EBD9C6]/40 p-2.5 rounded-xl">{formSuccess}</p>}

              <button
                type="submit"
                id="staff-submit-product-btn"
                className="w-full flex items-center justify-center gap-2 bg-[#4E6E58] hover:bg-[#395240] text-white py-3 px-4 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer shadow-sm"
              >
                DEPLOY PRODUCT TO CATALOG
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Live Catalog Stock Switch Checkboxes */}
            <div className="border-t border-dashed border-[#EBD9C6] pt-4 mt-2">
              <h3 className="text-xs font-serif italic text-[#31261E]">Quick Inventory Toggle</h3>
              <p className="text-[10px] text-[#7C6354] mt-0.5">Toggle stock status instantly for client catalog.</p>
              
              <div className="space-y-2 mt-2.5 max-h-48 overflow-y-auto pr-1">
                {productsList.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-xl border border-[#EBD9C6]/60 bg-[#FAF3EF]/40 hover:bg-[#FAF3EF] transition-colors">
                    <span className="font-bold text-[#31261E] truncate max-w-[120px]">{p.name}</span>
                    <button
                      onClick={() => handleToggleStock(p.id, p.inStock)}
                      className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        p.inStock 
                          ? 'bg-green-50 text-green-800 border-green-200' 
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {p.inStock ? 'In Stock' : 'Out Of Stock'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
