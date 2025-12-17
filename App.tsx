
import React, { useState, useEffect, useRef, useMemo } from 'react';
import StarBackground from './components/StarBackground';
import { analyzeChart, BirthData, getDetectedLanguage, searchLocations, LocationSuggestion } from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer';

type Mode = 'image' | 'manual';

const translations = {
  en: {
    subtitle: "Natal Chart AI Interpretation",
    visualChart: "Visual Chart",
    birthDetails: "Birth Details",
    cosmicVision: "Cosmic Vision",
    scanPrompt: "Scan your natal chart image for an instant reading.",
    selectImage: "Select Image",
    decodeImage: "Decode Image",
    birthDate: "Birth Date",
    birthTime: "Birth Time (Exact)",
    birthLocation: "Birth Location (City, Country)",
    locationPlaceholder: "Enter city (at least 3 chars)...",
    searchingLocations: "Scanning coordinates...",
    noResults: "No celestial match found.",
    generateChart: "Generate Chart",
    consulting: "Consulting the Records...",
    newConsultation: "New Consultation",
    cookieTitle: "Celestial Cookies",
    cookieText: "We use local data for performance and compliance.",
    accept: "Accept",
    errors: {
      generic: "An unexpected shadow fell across the stars.",
      fillAll: "Please fill all required fields."
    }
  },
  es: {
    subtitle: "Interpretación de Carta Natal con IA",
    visualChart: "Carta Visual",
    birthDetails: "Datos de Nacimiento",
    cosmicVision: "Visión Cósmica",
    scanPrompt: "Escanea la imagen de tu carta natal para una lectura instantánea.",
    selectImage: "Seleccionar Imagen",
    decodeImage: "Decodificar Imagen",
    birthDate: "Fecha de Nacimiento",
    birthTime: "Hora de Nacimiento (Exacta)",
    birthLocation: "Lugar de Nacimiento (Ciudad, País)",
    locationPlaceholder: "Escribe la ciudad (mín. 3 letras)...",
    searchingLocations: "Escaneando coordenadas...",
    noResults: "No se encontró coincidencia estelar.",
    generateChart: "Generar Carta",
    consulting: "Consultando los Registros...",
    newConsultation: "Nueva Consulta",
    cookieTitle: "Cookies Celestiales",
    cookieText: "Usamos datos locales para rendimiento y cumplimiento.",
    accept: "Aceptar",
    errors: {
      generic: "Una sombra inesperada cayó sobre las estrellas.",
      fillAll: "Por favor completa todos los campos."
    }
  }
};

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('manual');
  const [image, setImage] = useState<string | null>(null);
  const [birthData, setBirthData] = useState<BirthData>({ date: '', time: '', location: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const dateInputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const t = useMemo(() => translations[getDetectedLanguage()], []);

  // Focus date input on mount
  useEffect(() => {
    if (mode === 'manual' && dateInputRef.current) {
      // Small delay helps with browser rendering and Safari autofocus rules
      const timer = setTimeout(() => {
        dateInputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  useEffect(() => {
    const consent = localStorage.getItem('celestial_cookie_consent');
    if (!consent) setTimeout(() => setShowCookieBanner(true), 1500);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = locationInput.trim();
      if (trimmed.length >= 3 && !birthData.location) {
        setIsSearchingLocations(true);
        const results = await searchLocations(trimmed);
        setSuggestions(results);
        setIsSearchingLocations(false);
        setShowSuggestions(true);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [locationInput, birthData.location]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (birthData.date && birthData.time && birthData.location) {
      startAnalysis(birthData);
    } else {
      setError(t.errors.fillAll);
    }
  };

  const startAnalysis = async (input: any) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const analysis = await analyzeChart(input);
      setResult(analysis);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConsultation = () => {
    setResult(null);
    setImage(null);
    setBirthData({ date: '', time: '', location: '' });
    setLocationInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Refocus after resetting
    setTimeout(() => dateInputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen relative text-gray-100 flex flex-col overflow-x-hidden safari-fix">
      <StarBackground />
      
      <main className="relative z-10 container mx-auto px-4 pt-12 md:pt-20 max-w-4xl flex-grow">
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-cinzel text-amber-200 mb-2 tracking-tighter drop-shadow-[0_0_20px_rgba(252,211,77,0.3)]">
            Celestial Insights
          </h1>
          <p className="text-xs text-amber-100/60 italic tracking-[0.3em] uppercase">{t.subtitle}</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-200 text-center animate-fade-in text-sm font-cinzel tracking-wider">
            {error}
          </div>
        )}

        {!result && !loading && (
          <div className="glass-card bg-black/50 border border-amber-900/30 rounded-[3rem] p-6 md:p-10 shadow-2xl mb-12 animate-fade-in relative group overflow-hidden">
            {/* Ambient Background Glow for the Card */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="flex justify-center gap-1 bg-black/60 p-1.5 rounded-full border border-amber-900/20 mb-10 w-fit mx-auto shadow-2xl">
              <button 
                onClick={() => { setMode('manual'); setError(null); }} 
                className={`px-8 py-3 rounded-full text-[10px] md:text-xs font-cinzel tracking-[0.2em] transition-all uppercase ${mode === 'manual' ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg' : 'text-amber-100/40 hover:text-amber-100/70'}`}
              >
                {t.birthDetails}
              </button>
              <button 
                onClick={() => { setMode('image'); setError(null); }} 
                className={`px-8 py-3 rounded-full text-[10px] md:text-xs font-cinzel tracking-[0.2em] transition-all uppercase ${mode === 'image' ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg' : 'text-amber-100/40 hover:text-amber-100/70'}`}
              >
                {t.visualChart}
              </button>
            </div>

            {mode === 'manual' ? (
              <form onSubmit={handleManualSubmit} className="space-y-8 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] md:text-xs font-cinzel text-amber-500/70 uppercase ml-2 tracking-[0.2em]">{t.birthDate}</label>
                    <div className="relative group">
                      <input 
                        ref={dateInputRef}
                        type="date" 
                        className="w-full bg-black/40 border border-amber-900/40 rounded-2xl px-5 py-4 text-amber-100 focus:border-amber-400/50 focus:shadow-[0_0_15px_rgba(251,191,36,0.1)] outline-none transition-all cursor-pointer appearance-none" 
                        value={birthData.date} 
                        onChange={e => setBirthData({...birthData, date: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] md:text-xs font-cinzel text-amber-500/70 uppercase ml-2 tracking-[0.2em]">{t.birthTime}</label>
                    <div className="relative group">
                      <input 
                        type="time" 
                        className="w-full bg-black/40 border border-amber-900/40 rounded-2xl px-5 py-4 text-amber-100 focus:border-amber-400/50 focus:shadow-[0_0_15px_rgba(251,191,36,0.1)] outline-none transition-all cursor-pointer appearance-none" 
                        value={birthData.time} 
                        onChange={e => setBirthData({...birthData, time: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 relative" ref={suggestionRef}>
                  <label className="text-[10px] md:text-xs font-cinzel text-amber-500/70 uppercase ml-2 tracking-[0.2em]">{t.birthLocation}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={t.locationPlaceholder} 
                      className="w-full bg-black/40 border border-amber-900/40 rounded-2xl px-5 py-4 text-amber-100 focus:border-amber-400/50 focus:shadow-[0_0_15px_rgba(251,191,36,0.1)] outline-none transition-all placeholder:text-amber-100/20" 
                      value={locationInput} 
                      onChange={e => { setLocationInput(e.target.value); setBirthData({...birthData, location: ''}); }} 
                    />
                    {isSearchingLocations && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                    )}
                  </div>
                  {showSuggestions && (
                    <div className="absolute z-50 left-0 right-0 mt-3 bg-[#0a0a25]/95 border border-amber-500/30 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] glass-card animate-fade-in">
                      {suggestions.map((s, i) => (
                        <button 
                          key={i} 
                          type="button" 
                          onClick={() => { setBirthData({...birthData, location: s.fullName}); setLocationInput(s.fullName); setShowSuggestions(false); }} 
                          className="w-full px-5 py-4 text-left hover:bg-amber-600/20 text-sm text-amber-100 border-b border-amber-900/20 last:border-0 transition-colors group flex items-center gap-3"
                        >
                          <span className="text-amber-500/40 group-hover:text-amber-500">✦</span>
                          {s.fullName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-amber-700 to-amber-900 text-white py-5 rounded-2xl font-cinzel tracking-[0.4em] hover:from-amber-600 hover:to-amber-800 transition-all uppercase shadow-2xl shadow-amber-950/40 active:scale-[0.98] mt-4 text-xs md:text-sm"
                >
                  {t.generateChart}
                </button>
              </form>
            ) : (
              <div className="max-w-xl mx-auto py-12 px-6 border-2 border-dashed border-amber-900/40 rounded-[2.5rem] bg-amber-900/5 group hover:border-amber-500/50 transition-all duration-700 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <label className="cursor-pointer relative z-10 block">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-amber-900/20 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 group-hover:border-amber-500/50 transition-all duration-500">
                      <svg className="w-10 h-10 text-amber-500/40 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4M15 8l-3-3-3 3m6 8l-3 3-3-3" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-cinzel text-amber-100 tracking-widest">{t.cosmicVision}</h3>
                      <p className="text-xs text-amber-100/40 font-light max-w-[250px] mx-auto leading-relaxed">{t.scanPrompt}</p>
                    </div>
                    <span className="bg-gradient-to-r from-amber-700 to-amber-900 text-white px-12 py-3.5 rounded-full font-cinzel tracking-[0.2em] text-[10px] md:text-xs uppercase shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95">
                      {t.selectImage}
                    </span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        setImage(reader.result as string);
                        startAnalysis(base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-20 animate-pulse no-print">
            <div className="relative w-24 h-24 mx-auto mb-10">
              <div className="absolute inset-0 border-t-2 border-amber-400 border-solid rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-b-2 border-amber-600 border-solid rounded-full animate-spin-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-amber-500/50 text-2xl">✺</span>
              </div>
            </div>
            <p className="text-amber-200 font-cinzel tracking-[0.5em] uppercase text-xs animate-pulse">{t.consulting}</p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in-up pb-20">
            <div className="glass-card bg-black/60 border border-amber-900/40 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
              {/* Decorative Corner Stars */}
              <div className="absolute top-8 left-8 text-amber-500/20 text-xl group-hover:text-amber-500/40 transition-colors">✦</div>
              <div className="absolute top-8 right-8 text-amber-500/20 text-xl group-hover:text-amber-500/40 transition-colors">✦</div>
              <div className="absolute bottom-8 left-8 text-amber-500/20 text-xl group-hover:text-amber-500/40 transition-colors">✦</div>
              <div className="absolute bottom-8 right-8 text-amber-500/20 text-xl group-hover:text-amber-500/40 transition-colors">✦</div>

              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
              
              <MarkdownRenderer content={result} />
              
              <div className="mt-20 pt-10 border-t border-amber-900/20 flex justify-center no-print">
                <button 
                  onClick={handleNewConsultation} 
                  className="bg-amber-900/10 hover:bg-amber-900/30 border border-amber-600/20 text-amber-300 px-16 py-4 rounded-full font-cinzel tracking-[0.4em] uppercase text-[10px] md:text-xs transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/40"
                >
                  {t.newConsultation}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-6 no-print">
          <div className="max-w-4xl mx-auto glass-card bg-black/95 border border-amber-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-black/80">
            <div className="text-center md:text-left">
              <h4 className="text-amber-200 font-cinzel text-xs uppercase tracking-[0.3em] mb-1">{t.cookieTitle}</h4>
              <p className="text-amber-100/40 text-[10px] uppercase tracking-wider">{t.cookieText}</p>
            </div>
            <button 
              onClick={() => { localStorage.setItem('celestial_cookie_consent', 'true'); setShowCookieBanner(false); }} 
              className="bg-amber-600 text-white px-10 py-3 rounded-full text-[10px] font-cinzel tracking-widest uppercase shadow-lg hover:bg-amber-500 transition-all whitespace-nowrap"
            >
              {t.accept}
            </button>
          </div>
        </div>
      )}

      <style>{`
        /* Safari Specific Fixes */
        .glass-card {
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }
        
        .safari-fix {
          /* Prevents overscroll glow in Safari mobile */
          overscroll-behavior: none;
        }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .animate-fade-in-up { animation: fade-in-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 2s ease-out forwards; }
        .animate-spin-slow { animation: spin-slow 6s linear infinite; }
        
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.8) sepia(100%) saturate(1000%) hue-rotate(10deg);
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.3s;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover,
        input[type="time"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        
        /* Custom scrollbar for a mystical look */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(5, 5, 16, 0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(251, 191, 36, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(251, 191, 36, 0.3); }

        /* Ensure clean display in Safari for inputs */
        input {
          -webkit-appearance: none;
        }
      `}</style>
    </div>
  );
};

export default App;
