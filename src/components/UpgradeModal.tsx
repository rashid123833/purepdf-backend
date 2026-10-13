import React, { useState } from 'react';
import {
  X,
  Crown,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UpgradeModal: React.FC = () => {
  const { upgradeModalOpen, closeUpgradeModal, user, upgradeToPro, settings, openAuthModal } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successTxn, setSuccessTxn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!upgradeModalOpen) return null;

  const price = settings.proPriceInr || 109;

  const handlePayAndActivate = async () => {
    if (!user) {
      closeUpgradeModal();
      openAuthModal('login');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // Generate realistic reference code
      const txnRef = `${paymentMethod.toUpperCase()}/DEMO/${Date.now().toString().slice(-8)}`;

      // Simulate quick network settlement delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await upgradeToPro(paymentMethod, txnRef);
      setSuccessTxn(txnRef);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Glow backdrop */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={closeUpgradeModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successTxn ? (
          <div className="text-center py-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Payment Verified & Pro Activated!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-4">
              Thank you! Your account <span className="text-cyan-400 font-semibold">{user?.email}</span> has been upgraded to <strong className="text-amber-400">Pro Lifetime</strong>.
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 max-w-sm mx-auto mb-6 text-left text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-200">{successTxn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-semibold text-emerald-400">₹{price} (One-Time)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-semibold">Verified & Completed</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessTxn(null);
                closeUpgradeModal();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:opacity-95"
            >
              Start Using Pro Tools Now
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-white">Upgrade to Pro</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ONE-TIME OFFER
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Unlimited PDF conversions & Gemini document intelligence
                </p>
              </div>
            </div>

            {/* Price tag */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Tutorial Demonstration Pass</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-extrabold text-white">₹{price}</span>
                  <span className="text-xs text-slate-400">one-time payment</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <Zap className="w-3.5 h-3.5" />
                  Instant Activation
                </span>
              </div>
            </div>

            {/* Benefits list */}
            <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited PDF Merges & Splits</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited Gemini AI Queries</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100MB Large File Limits</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Priority Processing Engine</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                  <span className="text-xs font-semibold block">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    paymentMethod === 'Card'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
                  <span className="text-xs font-semibold block">Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NetBanking')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    paymentMethod === 'NetBanking'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <span className="text-xs font-semibold block">NetBanking</span>
                </button>
              </div>
            </div>

            {/* Selected Method Details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
              {paymentMethod === 'UPI' && (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-24 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 shadow-md">
                    {/* Simulated QR Pattern */}
                    <div className="w-full h-full border-2 border-slate-900 border-dashed rounded flex flex-col items-center justify-center text-slate-900">
                      <QrCode className="w-12 h-12" />
                      <span className="text-[8px] font-bold mt-1">₹{price}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 w-full space-y-2">
                    <p className="text-slate-400">Scan using Google Pay, PhonePe, Paytm, or enter UPI ID:</p>
                    <input
                      type="text"
                      placeholder="e.g. yourname@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>UPI ID: <strong className="text-cyan-400">purepdf@upi</strong> (purepdf.store)</span>
                      <span className="text-emerald-400 font-medium">Verified Merchant</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'Card' && (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Expiry</label>
                      <input
                        type="text"
                        defaultValue="08/29"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">CVV</label>
                      <input
                        type="password"
                        defaultValue="883"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'NetBanking' && (
                <div className="space-y-2 text-xs">
                  <label className="text-slate-400 block mb-1">Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option>HDFC Bank</option>
                    <option>State Bank of India (SBI)</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
                {error}
              </div>
            )}

            {!user && (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Please sign in or register so Pro access attaches to your user account.</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handlePayAndActivate}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Payment with Bank Gateway...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-200" />
                  <span>
                    {user ? `Verify & Activate Pro (Pay ₹${price})` : 'Sign In to Upgrade'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              100% Secure 256-bit encrypted checkout demonstration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
