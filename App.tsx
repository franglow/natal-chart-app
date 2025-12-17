
import React, { useState, useEffect, useRef } from 'react';
import StarBackground from './components/StarBackground';
import { analyzeChart, BirthData } from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer';

type Mode = 'image' | 'manual';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('image');
  const [image, setImage] = useState<string | null>(null);
  const [birthData, setBirthData] = useState<BirthData>({ date: '', time: '', location: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkStandalone = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsStandalone(true);
      }
    };
    checkStandalone();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (birthData.date && birthData.location) {
      startAnalysis(birthData);
    }
  };

  const startAnalysis = async (input: string | BirthData | null = null) => {
    const dataToAnalyze = input || (mode === 'image' ? image?.split(',')[1] : birthData);
    if (!dataToAnalyze) return;
    
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeChart(dataToAnalyze as any);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "An unexpected shadow fell across the stars.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Celestial Insights',
      text: 'Descubre tu destino con esta IA de Astrología.',
      url: window.location.origin + window.location.pathname,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert("No se pudo copiar el enlace. Por favor, copia la URL manualmente.");
    });
  };

  const downloadPDF = () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    const element = reportRef.current;
    
    const opt = {
      margin: [15, 15],
      filename: `Celestial_Insights_Report_${new Date().toLocaleDateString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#050510',
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    setTimeout(() => {
      (window as any).html2pdf().set(opt).from(element).save().then(() => {
        setIsExporting(false);
      }).catch((err: any) => {
        console.error("PDF Export Error:", err);
        setIsExporting(false);
        alert("Hubo un error al generar el PDF. Inténtalo de nuevo.");
      });
    }, 100);
  };

  return (
    <div className="min-h-screen relative text-gray-100 pb-20 flex flex-col">
      <StarBackground />
      
      <main className="relative z-10 container mx-auto px-4 pt-12 md:pt-20 max-w-4xl flex-grow">
        <header className="text-center mb-8 md:mb-12 animate-fade-in no-print">
          <h1 className="text-4xl md:text-7xl font-cinzel text-amber-200 mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(252,211,77,0.3)]">
            Celestial Insights
          </h1>
          <p className="text-xs md:text-sm text-amber-100/70 italic font-light tracking-widest uppercase">
            Natal Chart AI Interpretation
          </p>
        </header>

        {/* Mode Switcher */}
        {!result && !loading && (
          <div className="flex justify-center mb-8 no-print">
            <div className="bg-black/40 backdrop-blur-md p-1 rounded-full border border-amber-900/30 flex gap-1">
              <button 
                onClick={() => { setMode('image'); setResult(null); setError(null); }}
                className={`px-6 py-2 rounded-full text-xs md:text-sm font-cinzel tracking-widest transition-all ${mode === 'image' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-amber-100/50 hover:text-amber-100'}`}
              >
                Visual Chart
              </button>
              <button 
                onClick={() => { setMode('manual'); setResult(null); setError(null); }}
                className={`px-6 py-2 rounded-full text-xs md:text-sm font-cinzel tracking-widest transition-all ${mode === 'manual' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-amber-100/50 hover:text-amber-100'}`}
              >
                Birth Details
              </button>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="bg-black/40 backdrop-blur-xl border border-amber-900/30 rounded-3xl p-6 md:p-8 shadow-2xl mb-12 no-print">
            {mode === 'image' ? (
              <div>
                {!image ? (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-amber-900/30 rounded-2xl p-8 md:p-12 hover:border-amber-500/50 transition-all duration-500 bg-amber-900/5">
                    <svg className="w-12 h-12 md:w-16 md:h-16 text-amber-500/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h2 className="text-xl md:text-2xl font-cinzel text-amber-100 mb-2">Cosmic Vision</h2>
                    <p className="text-sm text-amber-100/60 mb-6 text-center max-w-sm">Scan your natal chart image for an instant reading.</p>
                    <label className="cursor-pointer bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-amber-900/20 active:scale-95 text-sm md:text-base">
                      Select Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative group mx-auto max-w-sm">
                      <img src={image} alt="Birth Chart" className="rounded-2xl border-4 border-amber-900/20 shadow-2xl w-full" />
                      <button 
                        onClick={() => setImage(null)}
                        className="absolute -top-3 -right-3 bg-red-900/80 hover:bg-red-700 text-white rounded-full p-2 backdrop-blur shadow-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {!result && !loading && (
                      <div className="flex justify-center">
                        <button 
                          onClick={() => startAnalysis()}
                          className="bg-gradient-to-r from-amber-700 to-amber-900 text-white px-10 py-4 rounded-full font-cinzel tracking-widest hover:scale-105 transition-all shadow-xl"
                        >
                          Decode Image
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-amber-100/60 text-xs uppercase tracking-widest ml-1">Birth Date</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-black/40 border border-amber-900/30 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-amber-100"
                      onChange={(e) => setBirthData({...birthData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-amber-100/60 text-xs uppercase tracking-widest ml-1">Birth Time (Exact)</label>
                    <input 
                      type="time" 
                      required
                      className="w-full bg-black/40 border border-amber-900/30 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-amber-100"
                      onChange={(e) => setBirthData({...birthData, time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-amber-100/60 text-xs uppercase tracking-widest ml-1">Birth Location (City, Country)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Buenos Aires, Argentina"
                    required
                    className="w-full bg-black/40 border border-amber-900/30 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-amber-100 placeholder:text-amber-100/20"
                    onChange={(e) => setBirthData({...birthData, location: e.target.value})}
                  />
                </div>
                {!result && !loading && (
                  <div className="flex justify-center pt-4">
                    <button 
                      type="submit"
                      className="bg-gradient-to-r from-amber-700 to-amber-900 text-white px-10 py-4 rounded-full font-cinzel tracking-widest hover:scale-105 transition-all shadow-xl"
                    >
                      Generate Chart
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* States and Results */}
        {loading && (
          <div className="text-center py-10 md:py-20 animate-pulse no-print">
            <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-2 border-amber-500/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 border border-amber-500/60 rounded-full animate-spin-slow flex items-center justify-center">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 16.2a7.2 7.2 0 110-14.4 7.2 7.2 0 010 14.4z"/>
                </svg>
              </div>
            </div>
            <p className="text-amber-200 text-lg md:text-xl font-cinzel tracking-widest">Consulting the Records...</p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in-up">
            <div 
              ref={reportRef}
              className="bg-black/60 backdrop-blur-2xl border border-amber-900/40 rounded-[2rem] p-6 md:p-10 shadow-2xl relative"
            >
              <div className="hidden print:block text-center mb-8">
                <h1 className="text-3xl font-cinzel text-amber-200">Celestial Insights</h1>
                <p className="text-xs text-amber-100/60 uppercase tracking-widest">Natal Report • {new Date().toLocaleDateString()}</p>
                <div className="w-24 h-px bg-amber-500/30 mx-auto mt-4"></div>
              </div>
              
              <MarkdownRenderer content={result} />
              
              <div className="mt-12 pt-8 border-t border-amber-900/20 flex flex-col md:flex-row items-center justify-center gap-4 no-print">
                <button 
                  onClick={downloadPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 px-6 py-3 rounded-full font-cinzel tracking-widest text-sm transition-all border border-amber-600/30 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Generando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar Reporte PDF
                    </>
                  )}
                </button>
                <button 
                  onClick={() => { setResult(null); setImage(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-amber-400/50 hover:text-amber-400 font-cinzel tracking-[0.2em] uppercase text-xs transition-colors px-6 py-3"
                >
                  Nueva Consulta
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Actions Row */}
      <footer className="relative z-10 py-10 no-print">
        <div className="flex justify-center gap-4 mb-6">
          <button 
            onClick={handleShare}
            className={`flex items-center gap-2 bg-black/40 backdrop-blur-md border border-amber-900/30 px-5 py-2.5 rounded-full transition-all shadow-lg text-xs font-cinzel tracking-widest uppercase ${copied ? 'text-green-400 border-green-500/50 scale-105' : 'text-amber-200 hover:bg-amber-900/20'}`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                ¡Copiado!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Compartir App
              </>
            )}
          </button>
          <button 
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-amber-900/30 px-5 py-2.5 rounded-full text-amber-200 hover:bg-amber-900/20 transition-all shadow-lg text-xs font-cinzel tracking-widest uppercase"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Instalar
          </button>
        </div>
        <div className="text-center text-amber-100/30 text-[10px] tracking-widest uppercase">
          <p>© {new Date().getFullYear()} Celestial Insights • AI Astrology</p>
        </div>
      </footer>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 no-print">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowHelp(false)}></div>
          <div className="relative bg-[#0a0a2a] border border-amber-500/30 rounded-[2.5rem] p-8 max-w-lg w-full shadow-[0_0_50px_rgba(252,211,77,0.1)] overflow-y-auto max-h-[90vh]">
            <h2 className="text-3xl font-cinzel text-amber-200 mb-2 text-center">Lleva la App Contigo</h2>
            <p className="text-amber-100/40 text-center text-xs mb-8 italic">Para instalarla en otros dispositivos, envíales el enlace usando el botón "Compartir".</p>
            
            <div className="space-y-8">
              <section>
                <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414L20.355 20.2184C20.661 20.7514 20.478 21.4324 19.945 21.7384C19.412 22.0444 18.731 21.8614 18.425 21.3284L15.65 16.5164C14.542 17.1494 13.293 17.5 12 17.5C10.707 17.5 9.458 17.1494 8.35 16.5164L5.575 21.3284C5.269 21.8614 4.588 22.0444 4.055 21.7384C3.522 21.4324 3.339 20.7514 3.645 20.2184L6.477 15.3414C4.945 13.8444 4 11.7814 4 9.5C4 5.3584 7.358 2 11.5 2H12.5C16.642 2 20 5.3584 20 9.5C20 11.7814 19.055 13.8444 17.523 15.3414ZM12 15.5C15.3137 15.5 18 12.8137 18 9.5C18 6.1863 15.3137 3.5 12 3.5C8.6863 3.5 6 6.1863 6 9.5C6 12.8137 8.6863 15.5 12 15.5Z"/></svg>
                  Android (Chrome)
                </h3>
                <p className="text-sm text-amber-100/70 ml-7">Toca los tres puntos (⋮) en la esquina superior derecha y selecciona <strong>"Instalar aplicación"</strong> o "Añadir a pantalla de inicio".</p>
              </section>

              <section>
                <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.07 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>
                  iPhone / iPad (Safari)
                </h3>
                <p className="text-sm text-amber-100/70 ml-7">Toca el botón de <strong>Compartir</strong> (cuadrado con flecha hacia arriba) y elige <strong>"Añadir a pantalla de inicio"</strong>.</p>
              </section>

              <section>
                <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v10H4V6zm16-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 15c-.55 0-1 .45-1 1h2c0-.55-.45-1-1-1z"/></svg>
                  Computadora (Chrome/Edge)
                </h3>
                <p className="text-sm text-amber-100/70 ml-7">Haz clic en el icono de <strong>Instalar</strong> (un símbolo de "+" o un ordenador pequeño) en la barra de direcciones.</p>
              </section>
            </div>

            <button 
              onClick={() => setShowHelp(false)}
              className="mt-10 w-full bg-amber-600 text-white py-3 rounded-full font-cinzel tracking-widest hover:bg-amber-500 transition-colors shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-fade-in { animation: fade-in 1.2s ease-out forwards; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.8) sepia(100%) saturate(1000%) hue-rotate(10deg);
          cursor: pointer;
        }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
