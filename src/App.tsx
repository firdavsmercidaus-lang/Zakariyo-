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
  Volume2, 
  Trash2, 
  Loader2,
  Sparkles,
  Github,
  History,
  Star,
  Settings,
  Search,
  ChevronDown,
  Maximize2,
  Mic,
  Share2,
  Download,
  Video,
  Play,
  X,
  AlertCircle,
  Key,
  MessageSquare,
  Send,
  Smartphone,
  FileText
} from 'lucide-react';
import { getAIResponse, translateText } from './services/gemini';
import { generateVideo } from './services/videoService';

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
  const [history, setHistory] = useState<{source: string, target: string, id: number}[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'translate'>('chat');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('uzbek');
  
  // Video Generation State
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isDemoVideo, setIsDemoVideo] = useState(false);
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
    const checkApiKey = async () => {
      const win = window as any;
      if (win.aistudio) {
        const selected = await win.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const showDemoVideo = () => {
    setVideoUrl("https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
    setIsDemoVideo(true);
    setVideoError(null);
    setIsVideoLoading(false);
  };

  const loadingMessages = [
    "AI sahnalarni tasavvur qilmoqda...",
    "Video kadrlar yaratilmoqda...",
    "Raqamli olam shakllantirilmoqda...",
    "Sifat tekshirilmoqda...",
    "Deyarli tayyor, ozgina qoldi..."
  ];

  const handleGenerateVideo = async () => {
    if (!targetText.trim()) {
      alert("Avval matnni tarjima qiling.");
      return;
    }
    
    setIsDemoVideo(false);
    if (!hasApiKey) {
      await handleOpenKeySelector();
      return;
    }

    setIsVideoLoading(true);
    setVideoError(null);
    setVideoUrl(null);
    
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      setLoadingMessage(loadingMessages[msgIndex]);
      msgIndex = (msgIndex + 1) % loadingMessages.length;
    }, 5000);

    try {
      const url = await generateVideo(targetText);
      setVideoUrl(url);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setVideoError("API kalit xatosi. Iltimos, qaytadan tanlang.");
      } else {
        setVideoError("Video yaratishda xatolik yuz berdi.");
      }
    } finally {
      setIsVideoLoading(false);
      clearInterval(msgInterval);
    }
  };

  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSourceText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi.");
        return;
      }
      recognitionRef.current.lang = 'uz-UZ';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Debounced translation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim().length > 0) {
        if (activeTab === 'chat') {
          handleQuery();
        } else {
          handleTranslate();
        }
      } else {
        setTargetText('');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [sourceText, activeTab, sourceLang, targetLang]);

  const handleQuery = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    const result = await getAIResponse(sourceText);
    setTargetText(result);
    setIsLoading(false);
    
    if (isAutoSpeak && result && result !== "Kechirasiz, javob topilmadi.") {
      speak(result);
    }
    
    if (result && result !== "Kechirasiz, javob topilmadi.") {
      setHistory(prev => [{ source: sourceText, target: result, id: Date.now() }, ...prev].slice(0, 5));
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    const result = await translateText(sourceText, sourceLang, targetLang);
    setTargetText(result);
    setIsLoading(false);
    
    if (isAutoSpeak && result && result !== "Tarjima amalga oshmadi.") {
      speak(result, targetLang);
    }
    
    if (result && result !== "Tarjima amalga oshmadi.") {
      setHistory(prev => [{ source: sourceText, target: result, id: Date.now() }, ...prev].slice(0, 5));
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
    element.download = `zakariyo-ai-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadHistory = () => {
    if (history.length === 0) return;
    const content = history.map(item => `Savol: ${item.source}\nJavob: ${item.target}\n-------------------\n`).join('\n');
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `zakariyo-ai-tarix-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const speak = (text: string, lang?: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      uzbek: 'uz-UZ',
      english: 'en-US',
      russian: 'ru-RU',
      german: 'de-DE',
      french: 'fr-FR',
      turkish: 'tr-TR',
      spanish: 'es-ES',
      korean: 'ko-KR',
      japanese: 'ja-JP',
      arabic: 'ar-SA',
    };
    utterance.lang = lang ? (langMap[lang] || lang) : 'uz-UZ';
    window.speechSynthesis.speak(utterance);
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
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Zakariyo Umzo <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI</span></h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Zakariyo Umzo AI Assistant v1.0</p>
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
                      title: 'Umzo AI Translator',
                      text: 'Eng zamonaviy AI tarjimonni sinab ko\'ring!',
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
            <button className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all relative"
            >
              <History className="w-5 h-5" />
              {history.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />}
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
                Ilovani o'rnatish
              </button>
            )}
            <div className="h-6 w-[1px] bg-white/10 mx-2" />
            <button className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-white/5">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Hero & Controls */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center lg:text-left"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-4 md:mb-6">
                Chat with <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Zakariyo Umzo AI.</span>
              </h2>
              <p className="text-base sm:text-lg text-white/40 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                Sizning aqlli yordamchingiz. Savol bering, tarjima qiling yoki shunchaki suhbatlashing.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
              <div 
                onClick={toggleListening}
                className={`flex items-center gap-3 p-4 glass-panel rounded-2xl group transition-all cursor-pointer ${isListening ? 'border-indigo-500 bg-indigo-500/10' : 'hover:bg-white/[0.05]'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500/10 group-hover:bg-indigo-500/20'}`}>
                  <Mic className={`${isListening ? 'text-white' : 'text-indigo-400'} w-5 h-5`} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{isListening ? 'Eshitmoqdaman...' : 'Ovozli buyruq'}</h4>
                  <p className="text-xs text-white/30">{isListening ? 'Gapiring' : 'Ovoz orqali savol bering'}</p>
                </div>
              </div>
              <div 
                onClick={() => setIsAutoSpeak(!isAutoSpeak)}
                className={`flex items-center gap-3 p-4 glass-panel rounded-2xl group transition-all cursor-pointer ${isAutoSpeak ? 'border-purple-500 bg-purple-500/10' : 'hover:bg-white/[0.05]'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isAutoSpeak ? 'bg-purple-500' : 'bg-purple-500/10 group-hover:bg-purple-500/20'}`}>
                  <Volume2 className={`${isAutoSpeak ? 'text-white' : 'text-purple-400'} w-5 h-5`} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Auto Speak</h4>
                  <p className="text-xs text-white/30">{isAutoSpeak ? 'Enabled' : 'Javobni ovozli eshiting'}</p>
                </div>
              </div>

              <div 
                onClick={handleGenerateVideo}
                className={`flex items-center gap-3 p-4 glass-panel rounded-2xl group transition-all cursor-pointer ${isVideoLoading ? 'border-pink-500 bg-pink-500/10 cursor-wait' : 'hover:bg-white/[0.05]'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isVideoLoading ? 'bg-pink-500 animate-pulse' : 'bg-pink-500/10 group-hover:bg-pink-500/20'}`}>
                  <Video className={`${isVideoLoading ? 'text-white' : 'text-pink-400'} w-5 h-5`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">{isVideoLoading ? 'Yaratilmoqda...' : 'AI Video'}</h4>
                  <p className="text-xs text-white/30">{isVideoLoading ? 'Kino sahnasi yaratilmoqda' : 'Javobdan video yarating'}</p>
                </div>
                {!hasApiKey && <Key className="w-4 h-4 text-white/20" />}
              </div>

              <div 
                onClick={showDemoVideo}
                className="flex items-center gap-3 p-4 glass-panel rounded-2xl group hover:bg-white/[0.05] transition-all cursor-pointer border-white/5"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-all">
                  <Play className="text-white/40 w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Watch Demo</h4>
                  <p className="text-xs text-white/30">See what Umzo AI can create</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Chat/Translate Interface */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex p-1 bg-white/5 rounded-2xl w-full sm:w-fit mb-4">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white/60'}`}
              >
                Chat Mode
              </button>
              <button 
                onClick={() => setActiveTab('translate')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'translate' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white/60'}`}
              >
                Translate Mode
              </button>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[1.5rem] sm:rounded-[2.5rem] p-2 sm:p-3 overflow-hidden"
            >
              {activeTab === 'chat' ? (
                /* Chat Header */
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500/10 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <MessageSquare className="text-indigo-400 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white">Umzo Chat</h3>
                      <p className="text-[8px] sm:text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 sm:px-3 py-1 bg-white/5 rounded-full text-[8px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      AI Powered
                    </div>
                  </div>
                </div>
              ) : (
                /* Translate Header */
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
              )}

              {/* Text Areas */}
              <div className={`grid grid-cols-1 ${activeTab === 'translate' ? 'lg:grid-cols-2' : ''} gap-2 sm:gap-3 p-2 sm:p-3`}>
                <div className="relative group">
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={activeTab === 'chat' ? "Xabar yozing yoki savol bering..." : "Tarjima uchun matn kiriting..."}
                    className={`w-full ${activeTab === 'chat' ? 'min-h-[120px] sm:min-h-[150px]' : 'min-h-[200px] sm:min-h-[400px]'} p-6 sm:p-8 text-base sm:text-lg font-medium bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] sm:rounded-[2rem] focus:bg-white/[0.04] focus:border-indigo-500/30 outline-none transition-all resize-none placeholder:text-white/10`}
                  />
                  <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 flex items-center gap-3 sm:gap-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={clearText} className="p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                  </div>
                  {activeTab === 'chat' && (
                    <button 
                      onClick={handleQuery}
                      className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 p-3 sm:p-4 bg-indigo-500 text-white rounded-xl sm:rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                </div>

                <div className="relative group">
                  <div className={`w-full ${activeTab === 'chat' ? 'min-h-[200px] sm:min-h-[300px]' : 'min-h-[200px] sm:min-h-[400px]'} p-6 sm:p-8 text-base sm:text-lg font-medium bg-indigo-500/[0.02] border border-indigo-500/10 rounded-[1.5rem] sm:rounded-[2rem] transition-all relative overflow-hidden ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-20">
                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500 animate-spin" />
                          <span className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-[0.3em]">{activeTab === 'chat' ? "O'ylamoqdaman" : "Tarjima qilinmoqda"}</span>
                        </div>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-white/90 leading-relaxed">
                      {targetText || (
                        <span className="text-white/5 italic">{activeTab === 'chat' ? "Javob bu yerda paydo bo'ladi..." : "Tarjima bu yerda paydo bo'ladi..."}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => speak(targetText, activeTab === 'translate' ? targetLang : 'uzbek')} className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg sm:rounded-xl transition-all"><Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
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
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Neural Engine
                  </div>
                </div>
              </div>
            </motion.div>

            {/* History Preview */}
            <AnimatePresence>
              {videoUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="glass-panel rounded-[2rem] overflow-hidden mt-6"
                >
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-pink-500/10 to-transparent">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-pink-400" />
                      {isDemoVideo ? 'Demo Video Preview' : 'Generated AI Video'}
                    </h3>
                    <button onClick={() => { setVideoUrl(null); setIsDemoVideo(false); }} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                  <div className="p-6">
                    <video 
                      src={videoUrl} 
                      controls 
                      className="w-full rounded-2xl shadow-2xl border border-white/10"
                      autoPlay={!isDemoVideo}
                    />
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-white/40 italic">
                        {isDemoVideo ? 'Bu namunaviy video. O\'zingiznikini yaratish uchun "AI Video" tugmasini bosing.' : `Generated based on: "${targetText.slice(0, 50)}..."`}
                      </p>
                      {!isDemoVideo && (
                        <a 
                          href={videoUrl} 
                          download="umzo-ai-video.mp4"
                          className="flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download Video
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {isVideoLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-[2rem] p-12 text-center space-y-6 mt-6 border-pink-500/20"
                >
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full animate-pulse" />
                    <Loader2 className="w-16 h-16 text-pink-500 animate-spin relative z-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Cinematic Magic in Progress</h3>
                    <p className="text-indigo-400 font-medium animate-pulse">{loadingMessage}</p>
                  </div>
                  <p className="text-xs text-white/20 max-w-xs mx-auto">
                    Video yaratish bir necha daqiqa vaqt olishi mumkin. Iltimos, kutib turing.
                  </p>
                </motion.div>
              )}

              {videoError && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-[2rem] p-6 flex items-center gap-4 border-red-500/20 mt-6"
                >
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <AlertCircle className="text-red-400 w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{videoError}</p>
                    {!hasApiKey && (
                      <button 
                        onClick={handleOpenKeySelector}
                        className="text-xs text-indigo-400 hover:underline mt-1 font-bold"
                      >
                        API kalitni qayta tanlash
                      </button>
                    )}
                  </div>
                  <button onClick={() => setVideoError(null)} className="p-2 hover:bg-white/5 rounded-lg">
                    <X className="w-4 h-4 text-white/20" />
                  </button>
                </motion.div>
              )}

              {isHistoryOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel rounded-[2rem] overflow-hidden"
                >
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-400" />
                      Recent Chats
                    </h3>
                    <div className="flex items-center gap-4">
                      <button onClick={downloadHistory} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">Download History</button>
                      <button onClick={() => setHistory([])} className="text-[10px] font-bold text-white/20 hover:text-red-400 uppercase tracking-widest transition-colors">Clear All</button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {history.length === 0 ? (
                      <div className="py-8 text-center text-white/10 text-sm font-medium italic">No history yet</div>
                    ) : (
                      history.map(item => (
                        <div key={item.id} className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-between group cursor-pointer">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm text-white/60 truncate font-medium">{item.source}</p>
                            <p className="text-xs text-indigo-400/60 truncate font-bold mt-0.5">{item.target}</p>
                          </div>
                          <Star className="w-4 h-4 text-white/5 group-hover:text-amber-400 transition-colors" />
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                <Languages className="text-white/40 w-5 h-5" />
              </div>
              <span className="font-bold text-white/40 tracking-tight">Zakariyo Umzo AI</span>
            </div>
            <p className="text-xs text-white/20 font-medium">
              © {new Date().getFullYear()} Zakariyo Umzo AI Labs. Built for the future of communication.
            </p>
          </div>
          
          <div className="flex items-center gap-10 text-xs font-bold text-white/20 uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Status</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              <Github className="w-5 h-5 text-white/40" />
            </button>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              <Settings className="w-5 h-5 text-white/40" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
