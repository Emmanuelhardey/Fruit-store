import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Truck, Phone, Compass, CheckCircle2, MapPin, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { Order } from '../types';

interface DeliveryTrackerProps {
  order: Order | null;
  onClose: () => void;
}

export function DeliveryTracker({ order, onClose }: DeliveryTrackerProps) {
  const [localOrder, setLocalOrder] = useState<Order | null>(order);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll server for updates to this specific order
  const syncOrder = async () => {
    if (!localOrder) return;
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/orders?role=customer`);
      if (res.ok) {
        const data = await res.json();
        const found = data.orders.find((o: Order) => o.id === localOrder.id);
        if (found) {
          setLocalOrder(found);
        }
      }
    } catch (e) {
      console.error('Error syncing tracker order metrics: ', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLocalOrder(order);
  }, [order]);

  useEffect(() => {
    if (!localOrder) return;
    
    // Auto sync every 5 seconds to get status shifts from Staff panel or auto ticker
    const interval = setInterval(syncOrder, 5000);
    return () => clearInterval(interval);
  }, [localOrder?.id]);

  if (!localOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-12 p-6 bg-white border border-neutral-100 rounded-2xl">
        <MapPin className="w-10 h-10 text-neutral-300 animate-bounce" />
        <p className="text-xs font-semibold text-neutral-500 mt-2">No Active Order Selected for Tracking</p>
      </div>
    );
  }

  const { tracking, status, address, total } = localOrder;
  const currentProgress = tracking.simulatedProgress;
  const steps = [
    { title: 'Payment Secured', desc: 'Recipe sent to cold-press' },
    { title: 'Fresh Cold-Press', desc: 'Liam is blending your juices' },
    { title: 'Onto Vehicle', desc: 'Insulated carrier in ice bag' },
    { title: 'Delivered Fresh', desc: 'Enjoy maximum micro-nutrients!' }
  ];

  return (
    <div className="bg-white rounded-3xl border border-neutral-150 shadow-sm overflow-hidden space-y-6 p-6 md:p-8 max-w-4xl mx-auto">
      
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-100 pb-5 gap-3">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded inline-block">
            🔴 LIVE ORDER DISPATCH
          </span>
          <h2 className="text-xl font-black text-neutral-800 tracking-tight mt-1 flex items-center gap-2">
            Real-Time Carrier Tracking
          </h2>
          <p className="text-xs text-neutral-400 font-mono">
            ID: <span className="font-bold text-neutral-600 uppercase">{localOrder.id}</span> | placed recently
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={syncOrder}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 disabled:opacity-50 transition-colors cursor-pointer"
            title="Force status sync"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="text-xs font-semibold py-2 px-4 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-neutral-600 transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: Step List & Driver Card */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Driver details card */}
          {status !== 'pending' && (
            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center font-bold text-lg text-amber-800 border border-amber-200 shrink-0 select-none">
                🤠
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Courier Partner</span>
                <p className="font-extrabold text-neutral-800 text-sm leading-tight">{tracking.driverName}</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  {tracking.driverPhone}
                </p>
              </div>
            </div>
          )}

          {/* Core Checkpoint Pipeline */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Cold-Press Milestone Steps</h3>
            <div className="space-y-6 relative border-l-2 border-neutral-200 ml-4 pl-6 pt-1">
              {steps.map((st, i) => {
                const isPassed = tracking.driverStep >= i;
                const isCurrent = tracking.driverStep === i;
                return (
                  <div key={st.title} className="relative">
                    {/* Checkpoint Dot */}
                    <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 transition-all ${
                      isPassed ? 'bg-emerald-600 border-white ring-2 ring-emerald-200' : 'bg-white border-neutral-300'
                    }`} />

                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-bold ${
                        isCurrent ? 'text-neutral-900 border-l-2 border-amber-400 pl-2' : isPassed ? 'text-neutral-700' : 'text-neutral-400'
                      }`}>
                        {st.title}
                      </h4>
                      <p className={`text-[10px] ${isPassed ? 'text-neutral-500' : 'text-neutral-300'}`}>
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Coordinates Details */}
          <div className="bg-neutral-50/50 p-4 border border-neutral-100 rounded-xl space-y-1">
            <div className="flex gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#e11d48]" />
              <span>Target Delivery Address</span>
            </div>
            <p className="text-xs font-semibold text-neutral-700 leading-tight">
              {address}
            </p>
          </div>

        </div>

        {/* RIGHT: Beautiful visual Map-simulations canvas */}
        <div className="lg:col-span-7 bg-amber-50/20 p-5 rounded-3xl border border-amber-100 flex flex-col items-center justify-between min-h-[400px]">
          
          <div className="w-full flex justify-between items-center text-xs">
            <span className="font-bold text-amber-950 font-mono">Live Route Visualizer</span>
            <span className="font-bold text-amber-800 font-mono bg-amber-100 px-2 py-0.5 rounded-full">
              {currentProgress}% along paths
            </span>
          </div>

          {/* Simulated mini Map SVG graphics */}
          <div className="w-full h-64 bg-white/70 rounded-2xl border border-amber-100/60 shadow-inner relative flex items-center justify-center p-4">
            
            {/* Minimalist streets vectors */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              {/* Grid roads */}
              <line x1="0" y1="50" x2="400" y2="50" stroke="#78716c" strokeWidth="6" strokeDasharray="3 3" />
              <line x1="0" y1="180" x2="400" y2="180" stroke="#78716c" strokeWidth="12" />
              <line x1="120" y1="0" x2="120" y2="300" stroke="#78716c" strokeWidth="12" />
              <line x1="280" y1="0" x2="280" y2="300" stroke="#78716c" strokeWidth="6" strokeDasharray="5 5" />
            </svg>

            {/* Juice Store Depot Marker */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center text-center z-10">
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg font-bold text-xs border border-white">
                🥤
              </div>
              <span className="text-[8px] font-black text-neutral-800 uppercase tracking-wide bg-white border border-neutral-100 px-1 py-0.5 mt-1 rounded">
                Store Depot
              </span>
            </div>

            {/* Customer coordinates Destination Pin */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center text-center z-10">
              <motion.div 
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg font-bold text-xs border border-white"
              >
                🏠
              </motion.div>
              <span className="text-[8px] font-black text-rose-800 uppercase tracking-wide bg-rose-50 border border-rose-100 px-1 py-0.5 mt-1 rounded">
                Your Glass!
              </span>
            </div>

            {/* Simulated Delivery Path spline & Moving Scooter with high-end motion transitions */}
            {status === 'on_the_way' || status === 'delivered' ? (
              <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 w-[calc(100%-6rem)] h-1 text-center flex items-center">
                {/* Visual path spline */}
                <div className="w-full bg-neutral-200 h-1 rounded-full relative">
                  {/* Visually highlighted segment */}
                  <div 
                    className="absolute h-full bg-amber-500 rounded-full transition-all duration-300" 
                    style={{ width: `${currentProgress}%` }}
                  />

                  {/* Rider scooter icon walking along path */}
                  <div 
                    className="absolute -top-3 w-8 -ml-3 cursor-pointer transition-all duration-300 flex flex-col items-center"
                    style={{ left: `${currentProgress}%` }}
                  >
                    <span className="text-xl">🛵</span>
                    <span className="bg-neutral-900 text-white font-mono text-[7px] font-bold px-1.5 rounded py-0.5 uppercase tracking-wide mt-0.5">
                      Liam
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Preparing or Pending Status display */
              <div className="text-center space-y-2 max-w-sm">
                <Compass className="w-10 h-10 mx-auto text-amber-500 animate-spin" />
                <h4 className="text-xs font-black text-neutral-700">Waiting for dispatch release</h4>
                <p className="text-[10px] text-neutral-400">
                  Once organic raw blending completes andpayment is processed, the driver scooter will progress dynamically along roads here.
                </p>
              </div>
            )}

          </div>

          {/* Delivery logs status history */}
          <div className="w-full bg-white p-4 rounded-2xl border border-amber-100/50 mt-4 space-y-1.5 text-left">
            <span className="text-[8px] font-black uppercase text-neutral-400 font-mono block">Real-time status history log</span>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {tracking.statusLog.map((log, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] text-neutral-600 font-mono border-b border-neutral-50 pb-1 py-1">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 inline" />
                    {log.status}
                  </span>
                  <span className="text-neutral-400 text-[9px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
