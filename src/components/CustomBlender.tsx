import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Milk, Blend, Sparkles, Plus, Minus, ArrowRight, HelpCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { CustomBlend, OrderItem } from '../types';

interface BlenderProps {
  onAddCustomToCart: (blend: CustomBlend) => void;
  userEmail?: string;
}

const AVAILABLE_FRUITS = [
  { name: 'Red Dragon Fruit', color: '#ec4899', benefit: 'Immune defense & vibrant magenta color' },
  { name: 'Organic Mango', color: '#f97316', benefit: 'Velvety fiber & rich vitamin A profile' },
  { name: 'Golden Pineapple', color: '#facc15', benefit: 'Bromelain enzymes & tropical tang zest' },
  { name: 'Crisp Green Apple', color: '#84cc16', benefit: 'Fibre density & balanced sour crunch' },
  { name: 'Alkaline Spinach', color: '#22c55e', benefit: 'Chlorophyll energy & iron fortification' },
  { name: 'Zesty Lemon juice', color: '#eab308', benefit: 'Alkalizing citric acid & liver detox' },
  { name: 'Spicy Ginger root', color: '#b45309', benefit: 'Anti-inflammatory punch & spicy zest' },
  { name: 'Mountain Blueberry', color: '#3b82f6', benefit: 'High brain antioxidants & indigo tone' },
];

const AVAILABLE_BASES = [
  { name: 'Organic Coconut Water', description: 'Ultra-hydrating natural electrolytes', price: 1.50 },
  { name: 'Pressed Apple juice', description: 'Naturally sweet and refreshing', price: 1.00 },
  { name: 'Fresh Almond Milk', description: 'Creamy vegan protein and omega-3s', price: 1.50 },
  { name: 'Pure Aloe vera juice', description: 'Excellent digestive and skin support', price: 2.00 },
];

const AVAILABLE_ADDINS = [
  { name: 'Organic Chia Seeds', benefit: 'Omega-3 fatty acids & premium fiber' },
  { name: 'Golden Royal Jelly', benefit: 'Sustained energy & immune fuel' },
  { name: 'Spirulina Super-green', benefit: 'Intense plant marine protein' },
  { name: 'Fresh Mint Leaves', benefit: 'Digestive soothing & cooling aroma' },
  { name: 'Clean Plant-protein Scoop', benefit: 'Muscle recovery & structural fullness' },
];

export function CustomBlender({ onAddCustomToCart, userEmail }: BlenderProps) {
  const [selectedBase, setSelectedBase] = useState(AVAILABLE_BASES[0]);
  const [selectedFruits, setSelectedFruits] = useState<{ [name: string]: { amount: number; color: string } }>({
    'Organic Mango': { amount: 40, color: '#f97316' },
    'Golden Pineapple': { amount: 30, color: '#facc15' },
    'Red Dragon Fruit': { amount: 30, color: '#ec4899' },
  });
  const [sweetness, setSweetness] = useState<'None' | 'Subtle' | 'Natural' | 'Sweet'>('Natural');
  const [selectedAddins, setSelectedAddins] = useState<string[]>([]);
  const [isBlending, setIsBlending] = useState(false);
  const [aiResult, setAiResult] = useState<CustomBlend | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const totalFruitPercent = Object.keys(selectedFruits).reduce((acc, name) => acc + selectedFruits[name].amount, 0);

  const handleFruitAmountChange = (name: string, diff: number, color: string) => {
    setErrorStatus(null);
    const current = selectedFruits[name]?.amount || 0;
    const newVal = Math.max(0, current + diff);

    if (newVal === 0) {
      const copy = { ...selectedFruits };
      delete copy[name];
      setSelectedFruits(copy);
      return;
    }

    // Cap total percent at 100%
    const currentOthers = totalFruitPercent - current;
    if (currentOthers + newVal > 100) {
      setErrorStatus('Fruit composition cannot exceed a total of 100%. Adjust down other values first.');
      return;
    }

    setSelectedFruits({
      ...selectedFruits,
      [name]: { amount: newVal, color },
    });
  };

  const handleToggleAddin = (name: string) => {
    if (selectedAddins.includes(name)) {
      setSelectedAddins(selectedAddins.filter(a => a !== name));
    } else {
      if (selectedAddins.length >= 3) {
        setErrorStatus('You can select a maximum of 3 wellness boosters.');
        return;
      }
      setSelectedAddins([...selectedAddins, name]);
    }
  };

  const handleTriggerBlend = async () => {
    if (totalFruitPercent !== 100) {
      setErrorStatus(`Your blend is currently at ${totalFruitPercent}%. To achieve the perfect consistency, your fruit blend must total exactly 100%.`);
      return;
    }

    setErrorStatus(null);
    setIsBlending(true);
    setAiResult(null);

    // Prepare payload
    const payload = {
      base: selectedBase.name,
      ingredients: Object.keys(selectedFruits).map((name) => ({
        name,
        amount: selectedFruits[name].amount,
        color: selectedFruits[name].color,
      })),
      sweetness,
      addins: selectedAddins,
    };

    try {
      const res = await fetch('/api/blend/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server connection error. Please try again.');
      }

      const data = await res.json();

      setAiResult({
        name: data.name,
        base: selectedBase.name,
        ingredients: payload.ingredients,
        sweetness,
        addins: selectedAddins,
        aiDescription: data.aiDescription,
        aiTagline: data.aiTagline,
        aiFunFact: data.aiFunFact,
        aiColor: data.aiColor || '#ec4899',
      });
    } catch (e: any) {
      setErrorStatus(e.message || 'Blending error occurred.');
    } finally {
      setIsBlending(false);
    }
  };

  const handleAddToCart = () => {
    if (!aiResult) return;
    onAddCustomToCart(aiResult);
    // Reset state
    setAiResult(null);
    setSelectedFruits({
      'Organic Mango': { amount: 40, color: '#f97316' },
      'Golden Pineapple': { amount: 30, color: '#facc15' },
      'Red Dragon Fruit': { amount: 30, color: '#ec4899' },
    });
    setSelectedAddins([]);
  };

  // Compute calculated price for custom juice
  const customJuicePrice = 6.00 + selectedBase.price + (selectedAddins.length * 0.75);

  return (
    <div id="custom-blender-portal" className="max-w-7xl mx-auto px-4 py-4">
      <div className="bg-white rounded-3xl border border-[#EBD9C6] p-6 md:p-8 shadow-sm space-y-8">
        
        <div className="text-center space-y-2">
          <span className="bg-[#FAF3EF] text-[#FF7043] border border-[#EBD9C6]/60 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Flavor Lab Customizer
          </span>
          <h2 className="text-3xl font-serif italic text-[#31261E] tracking-tight">
            Artisanal Liquid Alchemist
          </h2>
          <p className="text-[#7C6354] max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
            Select an organic hydrating base, design your ideal fruit ratios down to the single digit, adjust sweetness scale, and tap into real-time AI to forecast tasting notes, name your creations and bottle it fresh!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Cup Visualization & AI Result */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6 lg:sticky lg:top-24 bg-[#FAF3EF]/40 p-6 rounded-3xl border border-[#EBD9C6] shadow-sm">
            
            {/* Liquid Cup Animation Block */}
            <div className="relative w-64 h-80 flex flex-col justify-end items-center">
              {/* Cup container */}
              <div 
                className="relative w-48 h-72 border-4 border-[#7C6354] rounded-b-3xl border-t-0 bg-white/70 shadow-inner overflow-hidden flex flex-col justify-end"
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)' }}
              >
                {/* Visual measuring markers */}
                <div className="absolute left-3 top-4 h-full flex flex-col justify-between text-[9px] text-[#7C6354]/60 font-mono select-none z-10 pointer-events-none">
                  <div>100%</div>
                  <div>80%</div>
                  <div>60%</div>
                  <div>40%</div>
                  <div>20%</div>
                </div>

                {isBlending ? (
                  /* Energetic vortex blending block */
                  <motion.div 
                    animate={{ 
                      borderRadius: ["0% 0% 0% 0%", "50% 50% 50% 50%", "0% 0% 0% 0%"],
                      scaleY: [1, 1.15, 0.95, 1],
                      scaleX: [1, 0.9, 1.1, 1],
                    }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                    className="w-full h-full flex flex-col items-center justify-center opacity-90 relative"
                    style={{
                      background: `linear-gradient(135deg, #FF7043, #ec4899, #4E6E58)`,
                      filter: 'blur(3px)'
                    }}
                  >
                    <Blend className="w-12 h-12 text-white animate-spin" />
                  </motion.div>
                ) : (
                  /* Multi layered visual stack representing actual selected ratios */
                  <div className="w-full h-full flex flex-col justify-end relative">
                    {/* Add-in visual floating bubbles */}
                    {selectedAddins.map((addin, i) => (
                      <motion.div 
                        key={addin}
                        animate={{ y: [0, -120], x: [i * 10, -i * 5, i * 15], opacity: [0.8, 0] }}
                        transition={{ repeat: Infinity, duration: 2 + i * 0.5, ease: "easeOut" }}
                        className="absolute w-3 h-3 rounded-full bg-[#FF7043] z-10"
                        style={{ bottom: '10%' }}
                      />
                    ))}

                    {/* Stack layers */}
                    {Object.keys(selectedFruits).map((name) => {
                      const val = selectedFruits[name];
                      return (
                        <motion.div
                          key={name}
                          initial={{ height: 0 }}
                          animate={{ height: `${val.amount}%` }}
                          transition={{ type: 'spring', stiffness: 80 }}
                          className="w-full relative transition-colors duration-500"
                          style={{ backgroundColor: val.color }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-white/95 text-[10px] font-bold font-mono tracking-wider drop-shadow border-b border-white/10">
                            {val.amount}%
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cup Lid & Base */}
              <div className="w-56 h-3 bg-[#EBD9C6] rounded-full shadow-sm -mt-0.5 absolute bottom-0 border border-[#7C6354]/40" />
            </div>

            {/* Price Estimator */}
            <div className="w-full text-center border-t border-dashed border-[#EBD9C6] pt-4">
              <span className="text-xs text-[#7C6354] font-semibold block mb-1">Estimated Pricing Scheme</span>
              <p className="text-3xl font-bold text-[#31261E]">${customJuicePrice.toFixed(2)}</p>
              <span className="text-[10px] text-[#FF7043] bg-[#FFF5F2] px-3 py-1 rounded-md inline-block mt-1 font-mono uppercase tracking-wider font-bold">
                Base ({selectedBase.name}) + boosters calculated
              </span>
            </div>

            {/* AI Results Output Stage */}
            <AnimatePresence>
              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full bg-white rounded-2xl p-5 border border-dashed border-[#EBD9C6] mt-2 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-[#FF7043] uppercase block">
                        ✨ AI GOURMET RESULTS
                      </span>
                      <h4 className="text-lg font-serif italic text-[#31261E]" style={{ color: aiResult.aiColor }}>
                        {aiResult.name}
                      </h4>
                    </div>
                    <div className="w-6 h-6 rounded-full border border-[#EBD9C6]" style={{ backgroundColor: aiResult.aiColor }} />
                  </div>

                  <p className="text-xs text-[#7C6354] font-medium italic">
                    "{aiResult.aiTagline}"
                  </p>

                  <div className="text-xs text-[#31261E] space-y-2 bg-[#FDF8F3] p-4 rounded-xl border border-[#EBD9C6]/50">
                    <p className="leading-relaxed">
                      {aiResult.aiDescription}
                    </p>
                    {aiResult.aiFunFact && (
                      <div className="pt-2 border-t border-[#EBD9C6]/40 flex gap-1.5 text-[10px] text-[#4E6E58]">
                        <Sparkles className="w-3.5 h-3.5 inline shrink-0 mt-0.5 text-[#FF7043]" />
                        <span><strong>Organic Fact:</strong> {aiResult.aiFunFact}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAddToCart}
                    id="add-custom-juice-to-cart-btn"
                    className="w-full flex items-center justify-center gap-2 bg-[#FF7043] hover:bg-[#E64A19] text-white py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    ADD THIS BLEND TO CART (${customJuicePrice.toFixed(2)})
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Sliders and Customizer Panel */}
          <div className="lg:col-span-7 space-y-6">

            {/* Step 1: Core Hydration Base */}
            <div className="bg-[#FAF3EF]/30 p-6 rounded-3xl border border-[#EBD9C6] space-y-3">
              <div className="flex items-center gap-2 text-[#31261E]">
                <span className="w-6 h-6 rounded-full bg-[#FAF3EF] text-[#FF7043] border border-[#EBD9C6]/80 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="font-serif italic text-base text-[#31261E]">Select Your Wholesome Hydration Base</h3>
              </div>
              <p className="text-xs text-[#7C6354]">Every craft juice requires a refreshing base to activate the fluid matrix.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {AVAILABLE_BASES.map((b) => (
                  <label
                    key={b.name}
                    className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                      selectedBase.name === b.name
                        ? 'border-[#FF7043] bg-[#FFF5F2] ring-1 ring-[#FF7043]'
                        : 'border-[#EBD9C6] hover:border-[#7C6354] bg-white text-[#31261E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="base-group"
                      className="sr-only"
                      checked={selectedBase.name === b.name}
                      onChange={() => setSelectedBase(b)}
                    />
                    <div>
                      <div className="flex justify-between font-bold text-[#31261E] text-xs">
                        <span>{b.name}</span>
                        <span className="text-[#FF7043] font-mono">+${b.price.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-[#7C6354] mt-1 leading-snug">{b.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 2: Fruits Balance & Sliders */}
            <div className="bg-[#FAF3EF]/30 p-6 rounded-3xl border border-[#EBD9C6] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#31261E]">
                  <span className="w-6 h-6 rounded-full bg-[#FAF3EF] text-[#FF7043] border border-[#EBD9C6]/80 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h3 className="font-serif italic text-base text-[#31261E]">Balance Your Organic Fruit Ratios</h3>
                </div>
                <div className="text-xs font-bold font-mono">
                  <span className={totalFruitPercent === 100 ? 'text-[#4E6E58]' : 'text-[#7C6354]'}>
                    {totalFruitPercent}%
                  </span>{' '}
                  / 100%
                </div>
              </div>
              <p className="text-xs text-[#7C6354]">
                Mix and match multiple ingredients dynamically. Press (-) or (+) to calibrate your blend volume down to 10% blocks.
              </p>

              {/* Slider grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {AVAILABLE_FRUITS.map((fruit) => {
                  const currentPct = selectedFruits[fruit.name]?.amount || 0;
                  return (
                    <div key={fruit.name} className="flex flex-col justify-between p-4 rounded-2xl border border-[#EBD9C6] bg-white gap-3">
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full border border-[#EBD9C6] shrink-0 mt-0.5" style={{ backgroundColor: fruit.color }} />
                        <div>
                          <p className="text-xs font-bold text-[#31261E] leading-tight">{fruit.name}</p>
                          <p className="text-[9px] text-[#7C6354] leading-normal">{fruit.benefit}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#FAF3EF]">
                        <span className="text-[10px] text-[#7C6354] uppercase font-bold font-mono">Calibrate:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFruitAmountChange(fruit.name, -10, fruit.color)}
                            className="w-7 h-7 rounded-lg border border-[#EBD9C6] hover:bg-[#FAF3EF] flex items-center justify-center text-[#7C6354] hover:text-[#31261E] transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-mono text-xs font-bold text-[#31261E]">
                            {currentPct}%
                          </span>
                          <button
                            onClick={() => handleFruitAmountChange(fruit.name, 10, fruit.color)}
                            className="w-7 h-7 rounded-lg border border-[#EBD9C6] hover:bg-[#FAF3EF] flex items-center justify-center text-[#7C6354] hover:text-[#31261E] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Sweetness Scale & Boosters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Sweetness Slider */}
              <div className="bg-[#FAF3EF]/30 p-6 rounded-3xl border border-[#EBD9C6] space-y-3">
                <div className="flex items-center gap-2 text-[#31261E]">
                  <span className="w-6 h-6 rounded-full bg-[#FAF3EF] text-[#FF7043] border border-[#EBD9C6]/80 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <h3 className="font-serif italic text-base text-[#31261E]">Sweetness Profile</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(['None', 'Subtle', 'Natural', 'Sweet'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSweetness(s)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        sweetness === s
                          ? 'border-[#FF7043] bg-[#FF7043] text-white shadow-sm'
                          : 'border-[#EBD9C6] hover:border-[#7C6354] text-[#7C6354] bg-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Superfood booster pack */}
              <div className="bg-[#FAF3EF]/30 p-6 rounded-3xl border border-[#EBD9C6] space-y-3">
                <div className="flex items-center gap-2 text-[#31261E]">
                  <span className="w-6 h-6 rounded-full bg-[#FAF3EF] text-[#FF7043] border border-[#EBD9C6]/80 flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <h3 className="font-serif italic text-base text-[#31261E]">Vitality Boosters</h3>
                </div>
                <p className="text-[10px] text-[#A58E7F] leading-snug">Infuse top organic boosters for $0.75 each (Max 3)</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_ADDINS.map((addin) => {
                    const isSelected = selectedAddins.includes(addin.name);
                    return (
                      <button
                        key={addin.name}
                        onClick={() => handleToggleAddin(addin.name)}
                        className={`text-[10px] font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFF0E6] text-[#FF7043] border-[#FF7043]/50'
                            : 'bg-white hover:bg-[#FAF3EF]/40 text-[#7C6354] border-[#EBD9C6]'
                        }`}
                        title={addin.benefit}
                      >
                        {addin.name}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Error messaging state */}
            {errorStatus && (
              <div className="bg-[#FFF5F2] text-[#FF7043] text-xs p-4 rounded-2xl flex gap-2.5 items-start border border-[#EBD9C6]/50">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorStatus}</span>
              </div>
            )}

            {/* Master Blend Squeeze Action Button */}
            <button
              onClick={handleTriggerBlend}
              disabled={isBlending}
              id="press-blend-ai-btn"
              className="w-full bg-[#4E6E58] hover:bg-[#395240] text-emerald-100 hover:text-white py-4 px-6 rounded-2xl font-bold text-xs tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md"
            >
              <Blend className={`w-5 h-5 ${isBlending ? 'animate-spin' : ''}`} />
              {isBlending ? 'CO-PROCESSING BLEND & INITIATING ALCH-AI...' : 'CO-PRESS JUICE & INITIATE AI ALCHEMY'}
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </button>

            {/* Unconfigured API Warning Box (Non-disruptively placed) */}
            {!aiResult && !isBlending && (
              <div className="bg-[#FAF3EF] p-4.5 border border-[#EBD9C6]/80 rounded-2xl flex items-start gap-2.5 text-xs text-[#7C6354]">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF7043]" />
                <div>
                  <span className="font-serif italic font-bold text-[#31261E]">Organic AI Synthesis enabled:</span>
                  <p className="mt-1 leading-relaxed text-[10px] text-[#7C6354]/90">
                    If Gemini API credentials are set in your AI Studio secrets, clicking the button triggers real-time organic wellness reports and computed color matches. Otherwise, a physical simulator completes the blend seamlessly without crash interruptions.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
