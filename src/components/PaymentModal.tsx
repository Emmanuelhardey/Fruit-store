import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Lock, ArrowRight, Loader } from 'lucide-react';

interface PaymentModalProps {
  orderId: string;
  totalAmount: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export function PaymentModal({ orderId, totalAmount, onPaymentSuccess, onClose }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Auto spacing for card numbers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += value[i];
    }
    setCardNumber(formatted);
  };

  // Auto spacing for card expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length && i < 4; i++) {
      if (i === 2) {
        formatted += '/';
      }
      formatted += value[i];
    }
    setExpiry(formatted);
  };

  const handlePaySqueeze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setIsProcessing(true);

    if (!cardNumber || !cardName || !expiry || !cvc) {
      setErrorStatus('Please complete all required fields.');
      setIsProcessing(false);
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardNumber,
          cardName,
          expiry,
          cvc,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'The payment gateway declined this card.');
      }

      onPaymentSuccess();
    } catch (err: any) {
      setErrorStatus(err.message || 'Payment processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl overflow-hidden max-w-md w-full p-6 md:p-8 space-y-6 relative">
        
        {/* Close absolute */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-xs font-bold text-neutral-400 hover:text-neutral-700 w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
        >
          ✕
        </button>

        {/* Modal headers */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-700">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-black text-neutral-900 tracking-tight">JuicePay Secure Gateway</h3>
          <p className="text-xs text-neutral-400">Total payable amount: <span className="font-bold text-neutral-800">${totalAmount.toFixed(2)}</span></p>
        </div>

        <form onSubmit={handlePaySqueeze} className="space-y-4 pt-1">
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block">Cardholder Family Name *</label>
            <input
              type="text"
              required
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full text-xs font-semibold p-3 border border-neutral-200 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-neutral-50/50"
              placeholder="e.g. Jane M. Doe"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block">Credit Card Digits *</label>
            <div className="relative mt-1">
              <input
                type="text"
                required
                value={cardNumber}
                onChange={handleCardNumberChange}
                className="w-full text-xs font-semibold p-3 pl-10 border border-neutral-200 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-neutral-50/50 font-mono tracking-widest"
                placeholder="xxxx xxxx xxxx xxxx"
              />
              <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase block">Expiration *</label>
              <input
                type="text"
                required
                value={expiry}
                onChange={handleExpiryChange}
                className="w-full text-xs font-semibold p-3 border border-neutral-200 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-neutral-50/50 font-mono text-center"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase block">CVC Security Code *</label>
              <input
                type="password"
                required
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                className="w-full text-xs font-semibold p-3 border border-neutral-200 mt-1 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-neutral-50/50 font-mono text-center"
                placeholder="•••"
              />
            </div>
          </div>

          {errorStatus && (
            <p className="text-[10px] text-red-700 font-bold bg-red-50 p-2.5 rounded-lg border border-red-100 text-center">
              {errorStatus}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              id="pay-gateway-action-btn"
              className="w-full flex items-center justify-center gap-2 bg-[#1b3b2b] hover:bg-[#132a1e] text-emerald-100 py-3 rounded-xl font-bold text-xs tracking-wider transition-all disabled:opacity-50 hover:text-white"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  AUTHENTICATING & SECURING FUNDS...
                </>
              ) : (
                <>
                  AUTHORIZE & SECURE PAYMENT LIMITS
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="border-t border-dashed border-neutral-100 pt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PCI-DSS compliant SSL encryption certified</span>
        </div>

      </div>
    </div>
  );
}
