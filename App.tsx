
import React, { useState, useEffect, useRef, useMemo } from 'react';
import StarBackground from './components/StarBackground';
import { analyzeChart, BirthData, getDetectedLanguage, searchLocations, LocationSuggestion, generateChartImage } from './services/geminiService';
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
    invalidChart: "The stars are clouded. This image does not appear to be a clear natal chart.",
    retryWarning: "The cosmic alignment is difficult to perceive through this image. Perhaps the 'Manual Path' would be clearer?",
    etherealSources: "Ethereal Sources",
    sourceText: "This interpretation blends ancient Western Astrology principles with advanced AI pattern recognition. Visuals are synthesized via Generative Intelligence to match your unique vibrations.",
    visualAura: "Aura Reference",
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
    invalidChart: "Las estrellas están nubladas. Esta imagen no parece ser una carta natal clara.",
    retryWarning: "La alineación cósmica es difícil de percibir a través de esta imagen. ¿Quizás el 'Camino Manual' sea más claro?",
    etherealSources: "Fuentes Etéreas",
    sourceText: "Esta interpretación combina principios antiguos de la Astrología Occidental con reconocimiento de patrones de IA avanzado. Los visuales son sintetizados vía Inteligencia Generativa para coincidir con tus vibraciones únicas.",
    visualAura: "Referencia de Aura",
    errors: {
      generic: "Una sombra inesperada cayó sobre las estrellas.",
      fillAll: "Por favor completa todos los campos."
    }
  }
};

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('manual');
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [birthData, setBirthData] = useState<BirthData>({ date: '', time: '', location: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [uploadAttempts, setUploadAttempts] = useState(0);
  
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const dateInputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const t = useMemo(() => translations[getDetectedLanguage()], []);

  useEffect(() => {
    if (mode === 'manual' && dateInputRef.current && !result && !loading) {
      const timer = setTimeout(() => dateInputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [mode, result, loading]);

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
    setGeneratedImage(null);
    try {
      const analysis = await analyzeChart(input);
      
      if (analysis.includes("ERROR_INVALID_CHART")) {
        setUploadAttempts(prev => prev + 1);
        setError(uploadAttempts >= 1 ? t.retryWarning : t.invalidChart);
        setLoading(false);
        return;
      }

      setResult(analysis);

      // If manual mode, generate a beautiful chart image too
      if (typeof input !== 'string') {
        try {
          const genImg = await generateChartImage(input);
          setGeneratedImage(genImg);
        } catch (imgErr) {
          console.error("Image generation failed", imgErr);
        }
      }

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
    setGeneratedImage(null);
    setBirthData({ date: '', time: '', location: '' });
    setLocationInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => dateInputRef.current?.focus(), 150);
  };

  const handleCookieAccept = () => {
    localStorage.setItem('celestial_cookie_consent', 'true');
    setShowCookieBanner(false);
    // Restoration focus with priority
    if (mode === 'manual' && dateInputRef.current) {
      setTimeout(() => {
        dateInputRef.current?.focus();
        // Force the layout to recognize the focus on Apple devices
        dateInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
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
          <div className="mb-6 p-6 bg-red-950/20 border border-red-500/30 rounded-3xl text-red-200 text-center animate-fade-in text-sm font-cinzel tracking-wider backdrop-blur-xl shadow-2xl">
            <span className="block mb-2 text-lg">⚠</span>
            {error}
            {uploadAttempts >= 1 && mode === 'image' && (
              <button 
                onClick={() => setMode('manual')}
                className="mt-4 block mx-auto text-amber-400 hover:text-amber-300 underline underline-offset-4 decoration-amber-500/30"
              >
                {t.birthDetails} →
              </button>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="glass-card bg-black/40 border border-amber-900/20 rounded-[3rem] p-6 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] mb-12 animate-fade-in relative group overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-60"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-60"></div>

            <div className="flex justify-center gap-1 bg-black/60 p-1.5 rounded-full border border-amber-900/20 mb-12 w-fit mx-auto shadow-2xl backdrop-blur-xl">
              <button onClick={() => { setMode('manual'); setError(null); }} className={`px-10 py-3.5 rounded-full text-[10px] md:text-xs font-cinzel tracking-[0.25em] transition-all uppercase ${mode === 'manual' ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'text-amber-100/30 hover:text-amber-100/60'}`}>{t.birthDetails}</button>
              <button onClick={() => { setMode('image'); setError(null); }} className={`px-10 py-3.5 rounded-full text-[10px] md:text-xs font-cinzel tracking-[0.25em] transition-all uppercase ${mode === 'image' ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'text-amber-100/30 hover:text-amber-100/60'}`}>{t.visualChart}</button>
            </div>

            {mode === 'manual' ? (
              <form onSubmit={handleManualSubmit} className="space-y-10 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] md:text-xs font-cinzel text-amber-500/50 uppercase ml-4 tracking-[0.3em] flex items-center gap-2">
                      <span className="w-1 h-1 bg-amber-500 rounded-full"></span> {t.birthDate}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-amber-500/5 blur-xl group-focus-within:bg-amber-500/10 transition-all rounded-3xl"></div>
                      <input ref={dateInputRef} type="date" className="relative w-full bg-black/50 border border-amber-900/40 rounded-3xl px-6 py-5 text-amber-50 text-base md:text-lg focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 outline-none transition-all cursor-pointer appearance-none shadow-inner" value={birthData.date} onChange={e => setBirthData({...birthData, date: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] md:text-xs font-cinzel text-amber-500/50 uppercase ml-4 tracking-[0.3em] flex items-center gap-2">
                      <span className="w-1 h-1 bg-amber-500 rounded-full"></span> {t.birthTime}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-amber-500/5 blur-xl group-focus-within:bg-amber-500/10 transition-all rounded-3xl"></div>
                      <input type="time" className="relative w-full bg-black/50 border border-amber-900/40 rounded-3xl px-6 py-5 text-amber-50 text-base md:text-lg focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 outline-none transition-all cursor-pointer appearance-none shadow-inner" value={birthData.time} onChange={e => setBirthData({...birthData, time: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 relative" ref={suggestionRef}>
                  <label className="text-[10px] md:text-xs font-cinzel text-amber-500/50 uppercase ml-4 tracking-[0.3em] flex items-center gap-2">
                    <span className="w-1 h-1 bg-amber-500 rounded-full"></span> {t.birthLocation}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-amber-500/5 blur-xl group-focus-within:bg-amber-500/10 transition-all rounded-3xl"></div>
                    <input type="text" placeholder={t.locationPlaceholder} className="relative w-full bg-black/50 border border-amber-900/40 rounded-3xl px-6 py-5 text-amber-50 text-base md:text-lg focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 outline-none transition-all placeholder:text-amber-500/10 shadow-inner" value={locationInput} onChange={e => { setLocationInput(e.target.value); setBirthData({...birthData, location: ''}); }} />
                    {isSearchingLocations && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>}
                  </div>
                  {showSuggestions && (
                    <div className="absolute z-50 left-0 right-0 mt-4 bg-[#0a0a25]/95 border border-amber-500/30 rounded-[2rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9)] backdrop-blur-3xl animate-fade-in ring-1 ring-amber-500/10">
                      {suggestions.map((s, i) => (
                        <button key={i} type="button" onClick={() => { setBirthData({...birthData, location: s.fullName}); setLocationInput(s.fullName); setShowSuggestions(false); }} className="w-full px-6 py-5 text-left hover:bg-amber-600/10 text-base text-amber-100 border-b border-amber-900/20 last:border-0 transition-all group flex items-center gap-4 active:bg-amber-600/20">
                          <span className="text-amber-500/30 group-hover:text-amber-500 transition-colors transform group-hover:scale-125">✦</span>
                          <span className="font-light tracking-wide">{s.fullName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white py-6 rounded-[2rem] font-cinzel tracking-[0.5em] hover:from-amber-600 hover:to-amber-700 transition-all uppercase shadow-[0_15px_40px_rgba(120,60,20,0.4)] active:scale-[0.97] mt-6 text-xs md:text-sm font-bold border border-amber-500/20">{t.generateChart}</button>
              </form>
            ) : (
              <div className="max-w-xl mx-auto py-16 px-8 border-2 border-dashed border-amber-900/30 rounded-[3rem] bg-amber-900/5 group hover:border-amber-500/50 transition-all duration-1000 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <label className="cursor-pointer relative z-10 block">
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-24 h-24 rounded-full bg-amber-900/30 flex items-center justify-center border border-amber-500/10 group-hover:scale-110 group-hover:border-amber-500/60 transition-all duration-700 shadow-2xl">
                      <svg className="w-12 h-12 text-amber-500/40 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" d="M12 4v16m8-8H4M15 8l-3-3-3 3m6 8l-3 3-3-3" /></svg>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-cinzel text-amber-100 tracking-[0.2em]">{t.cosmicVision}</h3>
                      <p className="text-[11px] text-amber-100/30 font-light max-w-[280px] mx-auto leading-relaxed uppercase tracking-widest">{t.scanPrompt}</p>
                    </div>
                    <span className="bg-gradient-to-r from-amber-700 to-amber-900 text-white px-14 py-4 rounded-full font-cinzel tracking-[0.3em] text-[10px] md:text-xs uppercase shadow-[0_10px_30px_rgba(120,60,20,0.3)] hover:shadow-amber-500/30 transition-all active:scale-95 border border-amber-500/20">{t.selectImage}</span>
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
            <div className="relative w-32 h-32 mx-auto mb-12">
              <div className="absolute inset-0 border-t-2 border-amber-400 border-solid rounded-full animate-spin shadow-[0_0_20px_rgba(251,191,36,0.3)]"></div>
              <div className="absolute inset-6 border-b-2 border-amber-700 border-solid rounded-full animate-spin-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-amber-500/40 text-4xl transform scale-150">✺</span></div>
            </div>
            <p className="text-amber-200 font-cinzel tracking-[0.6em] uppercase text-xs animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.2)]">{t.consulting}</p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in-up pb-24">
            <div className="glass-card bg-black/60 border border-amber-900/40 rounded-[3.5rem] p-8 md:p-20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
              <div className="absolute top-12 left-12 text-amber-500/15 text-2xl group-hover:text-amber-500/40 transition-all duration-1000 group-hover:rotate-180">✦</div>
              <div className="absolute top-12 right-12 text-amber-500/15 text-2xl group-hover:text-amber-500/40 transition-all duration-1000 group-hover:-rotate-180">✦</div>
              <div className="absolute bottom-12 left-12 text-amber-500/15 text-2xl group-hover:text-amber-500/40 transition-all duration-1000 group-hover:-rotate-90">✦</div>
              <div className="absolute bottom-12 right-12 text-amber-500/15 text-2xl group-hover:text-amber-500/40 transition-all duration-1000 group-hover:rotate-90">✦</div>

              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
              
              <MarkdownRenderer content={result} />

              {/* Visual Reference Section - Shown AFTER Text */}
              <div className="mt-20 space-y-12 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-900/50"></div>
                  <span className="text-amber-500/40 text-[10px] font-cinzel tracking-[0.5em] uppercase">{t.visualAura}</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-900/50"></div>
                </div>

                <div className="relative group/img max-w-2xl mx-auto rounded-[2.5rem] overflow-hidden border border-amber-500/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] transition-all hover:scale-[1.01] hover:border-amber-500/30">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                  {(mode === 'image' && image) ? (
                    <img src={image} alt="Original Chart" className="w-full h-auto object-contain bg-black/40" />
                  ) : generatedImage ? (
                    <img src={generatedImage} alt="Synthesized Chart" className="w-full h-auto object-contain bg-black/40" />
                  ) : (
                    <div className="aspect-video bg-amber-900/5 flex items-center justify-center">
                      <span className="text-amber-500/10 animate-pulse text-4xl">❂</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sources / Cosmic Bibliography - Shown AFTER Image */}
              <div className="mt-24 bg-gradient-to-b from-amber-950/5 to-transparent border border-amber-900/20 rounded-[2.5rem] p-10 md:p-14 text-center space-y-6 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <div className="inline-block px-6 py-1.5 border border-amber-500/20 rounded-full text-amber-500/50 text-[10px] uppercase tracking-[0.4em] font-cinzel mb-2">
                  {t.etherealSources}
                </div>
                <p className="text-amber-100/40 text-[11px] md:text-sm leading-relaxed max-w-xl mx-auto uppercase tracking-[0.15em] font-light italic">
                  {t.sourceText}
                </p>
                <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-amber-500/30 text-[9px] md:text-[10px] font-cinzel tracking-[0.2em]">
                  <span className="flex items-center gap-2">❂ Western Tropical Tradition</span>
                  <span className="flex items-center gap-2">✧ Placidus House System</span>
                  <span className="flex items-center gap-2">❂ AI Pattern Resonance</span>
                </div>
              </div>
              
              <div className="mt-24 pt-12 border-t border-amber-900/30 flex justify-center no-print">
                <button onClick={handleNewConsultation} className="bg-amber-900/10 hover:bg-amber-900/40 border border-amber-600/30 text-amber-300 px-16 py-4.5 rounded-full font-cinzel tracking-[0.4em] uppercase text-[10px] md:text-xs transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-amber-500/10">
                  {t.newConsultation}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-6 no-print">
          <div className="max-w-4xl mx-auto glass-card bg-black/95 border border-amber-500/20 rounded-3xl p-7 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_-10px_50px_rgba(0,0,0,0.8)]">
            <div className="text-center md:text-left space-y-1">
              <h4 className="text-amber-200 font-cinzel text-xs uppercase tracking-[0.4em]">{t.cookieTitle}</h4>
              <p className="text-amber-100/30 text-[10px] uppercase tracking-[0.15em] font-light">{t.cookieText}</p>
            </div>
            <button 
              onClick={handleCookieAccept} 
              className="bg-amber-600 hover:bg-amber-500 text-white px-12 py-3.5 rounded-full text-[10px] font-cinzel tracking-[0.2em] uppercase shadow-lg transition-all whitespace-nowrap active:scale-95 border border-amber-400/20"
            >
              {t.accept}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .glass-card { backdrop-filter: blur(50px) saturate(180%); -webkit-backdrop-filter: blur(50px) saturate(180%); }
        .safari-fix { overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .animate-fade-in-up { animation: fade-in-up 1.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-fade-in { animation: fade-in 2s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        input[type="date"], input[type="time"] { -webkit-appearance: none; -moz-appearance: none; appearance: none; color-scheme: dark; }
        input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.7) sepia(100%) saturate(1200%) hue-rotate(15deg); cursor: pointer; opacity: 0.6; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s; padding: 4px; }
        input[type="date"]::-webkit-calendar-picker-indicator:hover, input[type="time"]::-webkit-calendar-picker-indicator:hover { opacity: 1; transform: scale(1.2); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(251, 191, 36, 0.08); border-radius: 20px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(251, 191, 36, 0.2); }
        * { -webkit-tap-highlight-color: rgba(0,0,0,0); }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
};

export default App;
