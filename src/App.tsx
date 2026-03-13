/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Trash2, 
  Loader2,
  ChevronDown,
  Maximize2,
  Share2,
  Smartphone,
  FileText
} from 'lucide-react';
import { translateText } from './services/gemini';

const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect', flag: '✨' },
  { code: 'uzbek', name: 'O\'zbekcha', flag: '🇺🇿' },
  { code: 'english', name: 'English', flag: '🇺🇸' },
  { code: 'russian', name: 'Русский', flag: '🇷🇺' },
  { code: 'german', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'french', name: 'Français', flag: '🇫🇷' },
  { code: 'turkish', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'spanish', name: 'Español', flag: '🇪🇸' },
  { code: 'korean', name: '한국어', flag: '🇰🇷' },
  { code: 'japanese', name: '日本語', flag: '🇯🇵' },
  { code: 'arabic', name: 'العربية', flag: '🇸🇦' },
];

export default function App() {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('uzbek');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim().length > 0) {
        handleTranslate();
      } else {
        setTargetText('');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [sourceText, sourceLang, targetLang]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    try {
      const result = await translateText(sourceText, sourceLang, targetLang);
      setTargetText(result);
    } catch (error) {
      console.error("Translation error:", error);
      setTargetText("Xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(targetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearText = () => {
    setSourceText('');
    setTargetText('');
  };

  const downloadAsFile = () => {
    if (!targetText) return;
    const element = document.createElement("a");
    const file = new Blob([targetText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `zakariyo-translate-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/30">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
            >
              <Languages className="text-white w-7 h-7" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Zakariyo Umzo</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Zakariyo Umzo Assistant v1.0</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#" className="hover:text-white transition-colors">Products</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: 'Zakariyo Translate',
                      text: 'Tezkor va aniq tarjima platformasi!',
                      url: window.location.href,
                    });
                  } catch (err) {
                    console.log('Share failed', err);
                  }
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Havola nusxalandi!');
                }
              }}
              className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              title="Ulashish"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleFullScreen}
              className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              title={isFullScreen ? "Kichraytirish" : "To'liq ekran"}
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                <Smartphone className="w-4 h-4" />
                O'rnatish
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 md:py-20">
        <div className="space-y-12">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Zakariyo <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Translate.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/40 leading-relaxed font-medium max-w-2xl mx-auto">
              Tezkor va aniq tarjima platformasi. Matnlarni o'zingiz xohlagan tilga osonlik bilan o'giring.
            </p>
          </motion.div>

          {/* Translate Interface */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[1.5rem] sm:rounded-[2.5rem] p-2 sm:p-3 overflow-hidden"
            >
              {/* Translate Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-2 gap-2">
                <div className="w-full sm:flex-1 relative group">
                  <select 
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.05] px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white/80 focus:outline-none cursor-pointer hover:bg-white/[0.06] transition-all appearance-none"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code} className="bg-[#0a0a0a]">{lang.flag} {lang.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9, rotate: 180 }}
                  onClick={swapLanguages}
                  disabled={sourceLang === 'auto'}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all ${sourceLang === 'auto' ? 'text-white/10 cursor-not-allowed' : 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'}`}
                >
                  <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5 rotate-90 sm:rotate-0" />
                </motion.button>

                <div className="w-full sm:flex-1 relative group">
                  <select 
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.05] px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white/80 focus:outline-none cursor-pointer hover:bg-white/[0.06] transition-all appearance-none text-left sm:text-right"
                  >
                    {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                      <option key={lang.code} value={lang.code} className="bg-[#0a0a0a]">{lang.flag} {lang.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 sm:left-auto sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
              </div>

              {/* Text Areas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3">
                <div className="relative group">
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Tarjima uchun matn kiriting..."
                    className="w-full min-h-[200px] sm:min-h-[400px] p-6 sm:p-8 text-base sm:text-lg font-medium bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] sm:rounded-[2rem] focus:bg-white/[0.04] focus:border-indigo-500/30 outline-none transition-all resize-none placeholder:text-white/10"
                  />
                  <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 flex items-center gap-3 sm:gap-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={clearText} className="p-2 text-white/20 hover:text-red-400 transition-colors" title="Tozalash"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                    <button 
                      onClick={handleTranslate}
                      disabled={isLoading || !sourceText.trim()}
                      className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Tarjima qilish
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <div className="w-full min-h-[200px] sm:min-h-[400px] p-6 sm:p-8 text-base sm:text-lg font-medium bg-indigo-500/[0.02] border border-indigo-500/10 rounded-[1.5rem] sm:rounded-[2rem] transition-all relative overflow-hidden">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-20">
                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500 animate-spin" />
                          <span className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-[0.3em]">Tarjima qilinmoqda</span>
                        </div>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-white/90 leading-relaxed">
                      {targetText || (
                        <span className="text-white/5 italic">Tarjima bu yerda paydo bo'ladi...</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={downloadAsFile}
                      className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg sm:rounded-xl transition-all"
                      title="Faylga yuklash"
                    >
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button 
                      onClick={copyToClipboard} 
                      className="p-2 sm:p-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg sm:rounded-xl transition-all flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{copied ? 'Nusxalandi' : 'Nusxa'}</span>
                    </button>
                  </div>

                  <div className="absolute top-6 sm:top-8 right-6 sm:right-8 flex items-center gap-1.5 text-[8px] sm:text-[10px] font-black text-indigo-500/40 uppercase tracking-[0.2em]">
                    Umzo Engine
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/20">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                <Languages className="text-white/40 w-5 h-5" />
              </div>
              <span className="font-bold text-white/40 tracking-tight">Zakariyo Umzo</span>
            </div>
            <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.1em]">© 2024 Zakariyo Umzo. Barcha huquqlar himoyalangan.</p>
          </div>
          
          <div className="flex items-center gap-10 text-xs font-bold text-white/20 uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              <Smartphone className="w-5 h-5 text-white/40" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
