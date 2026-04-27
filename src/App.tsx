/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, RefreshCcw, Scan, User, IdCard, Activity, Percent, Crosshair, Image as LucideImage, ExternalLink, Linkedin, Twitter, Instagram, FileText, Database, ShieldAlert } from 'lucide-react';
import { analyzeFace, FaceAnalysisResult } from './services/geminiService';

export default function App() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [manualNotes, setManualNotes] = useState<string>('');
  const [status, setStatus] = useState('System ready. Awaiting input...');
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCameraOpen && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setStatus('Camera active. Position face in frame.');
          }
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setStatus('Error: Camera access denied.');
          setIsCameraOpen(false);
        });
    } else if (!isCameraOpen && videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, [isCameraOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setIsCameraOpen(false);
        setStatus('Image captured. Ready for scanning.');
      }
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        setIsCameraOpen(false);
        setResult(null);
        setStatus('Image uploaded. Ready for scanning.');
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    if (!capturedImage) return;

    setIsScanning(true);
    setResult(null);
    setStatus('Scanning target... Initializing biometric analysis.');
    setProgress(0);

    // Simulated progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    try {
      const analysisResult = await analyzeFace(capturedImage.split(',')[1]);
      setResult(analysisResult);
      setManualNotes(''); // Reset notes for new subject
      setStatus('Analysis complete. Match found.');
    } catch (err) {
      console.error(err);
      setStatus('Error: Biometric analysis failed.');
    } finally {
      setIsScanning(false);
      setProgress(100);
      clearInterval(interval);
    }
  };

  const clearAll = () => {
    setCapturedImage(null);
    setIsCameraOpen(false);
    setIsScanning(false);
    setResult(null);
    setManualNotes('');
    setStatus('System ready. Awaiting input...');
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col tech-grid relative overflow-hidden font-sans">
      {/* Background HUD elements - simplified for professional look */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-t border-l border-blue-500/30" />
        <div className="absolute bottom-10 right-10 w-32 h-32 border-b border-r border-blue-500/30" />
      </div>

      {/* Header / Nav Bar */}
      <nav className="h-16 border-b border-slate-800 bg-slate-900/50 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Crosshair className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-semibold tracking-tight text-lg text-white">OCULAR_ID <span className="text-blue-400 font-mono text-xs font-normal italic opacity-75">v2.4.0</span></span>
            <div className="text-[10px] text-slate-500 uppercase tracking-tighter -mt-1">Biometric Authentication Interface</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}></div>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${isScanning ? 'text-orange-500' : 'text-emerald-500'}`}>
              {isScanning ? 'Processing Engine' : 'Live Engine Active'}
            </span>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Network Latency</div>
            <div className="text-xs font-mono text-slate-300">14ms</div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-7xl mx-auto w-full z-10 overflow-hidden">
        
        {/* Left Side: Viewport & Main Actions */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Main Viewfinder */}
          <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl flex flex-col">
            <div className="flex-1 relative flex items-center justify-center p-4">
              {/* Internal HUD Elements */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-blue-500/40 z-20 pointer-events-none" />
              <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-blue-500/40 z-20 pointer-events-none" />
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-blue-500/40 z-20 pointer-events-none" />
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-blue-500/40 z-20 pointer-events-none" />
              
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(59,130,246,0.02),rgba(16,185,129,0.01),rgba(59,130,246,0.02))] pointer-events-none z-10" style={{ backgroundSize: '100% 4px, 3px 100%' }}></div>

              <div className="w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-700 shadow-inner group">
                {isCameraOpen ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover grayscale brightness-110 contrast-110 transition-all duration-700"
                  />
                ) : capturedImage ? (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)] opacity-80">
                    <div className="w-48 h-48 border-2 border-dashed border-blue-400/20 rounded-full flex items-center justify-center animate-pulse">
                        <Camera className="w-12 h-12 text-blue-500/20" />
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Awaiting Spatial Mesh Input</p>
                  </div>
                )}

                {/* Animated Scanning Line */}
                {isScanning && (
                  <motion.div 
                    className="absolute left-0 w-full h-[2px] scan-line z-30"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>

              {/* Float Overlays */}
              <div className="absolute top-6 left-6 bg-slate-950/60 backdrop-blur px-3 py-1 rounded border border-slate-800 z-20">
                <span className="text-[9px] font-mono text-slate-400">LAT: 40.7128° N | LON: 74.0060° W</span>
              </div>
            </div>

            {/* Viewport Control Bar */}
            <div className="h-12 border-t border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-20">
              <div className="flex items-center gap-4">
                <div className="flex gap-1 items-center">
                  {[1, 3, 5, 3, 1].map((h, i) => (
                    <motion.div 
                      key={i}
                      className="w-1 bg-blue-500 rounded-full"
                      animate={{ height: isScanning ? [4, 16, 4] : h * 4 }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      style={{ height: h * 4 }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                  {status}
                </p>
              </div>
              <div className="text-[10px] font-mono text-blue-400 uppercase tracking-tight">
                SEQ_REF: {Math.random().toString(36).substring(7).toUpperCase()}
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Quick Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex gap-2 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-2">
              {!isCameraOpen ? (
                <button 
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center justify-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all text-sm font-medium border border-slate-700"
                >
                  <Camera size={18} className="text-blue-400" />
                  <span>Real-time Scan</span>
                </button>
              ) : (
                <button 
                  onClick={handleCapture}
                  className="flex items-center justify-center gap-3 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-blue-600/20"
                >
                  <Activity size={18} />
                  <span>Capture Frame</span>
                </button>
              )}

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all text-sm font-medium border border-slate-700"
              >
                <Upload size={18} className="text-blue-400" />
                <span>Upload Data</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </button>

              <button 
                onClick={startScan}
                disabled={!capturedImage || isScanning}
                className={`flex items-center justify-center gap-3 p-3 rounded-xl transition-all text-sm font-bold border ${
                  !capturedImage || isScanning 
                  ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' 
                  : 'bg-emerald-600/10 border-emerald-500 text-emerald-500 hover:bg-emerald-600/20'
                }`}
              >
                <Scan size={18} className={isScanning ? "animate-spin" : ""} />
                <span>Execute Scan</span>
              </button>

              <button 
                onClick={clearAll}
                className="flex items-center justify-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all text-sm font-medium border border-slate-700"
              >
                <RefreshCcw size={18} className="text-red-400" />
                <span>Reset Terminal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Results & Detailed Info */}
        <aside className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden flex-1">
            <div className="absolute top-0 right-0 p-4 text-[8px] text-slate-700 font-mono select-none opacity-50">
              ENCRYPTED_DB_REPLICA_721
            </div>

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col gap-6"
                >
                  {/* Result Avatar / Silhouette */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-2xl bg-slate-800 ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-900 overflow-hidden relative group">
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-2">
                         <span className="text-[10px] font-bold text-blue-400">VERIFIED SUBJECT</span>
                       </div>
                       {capturedImage ? (
                         <img src={capturedImage} alt="Match" className="w-full h-full object-cover" />
                       ) : (
                        <svg className="w-full h-full text-slate-700 translate-y-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                       )}
                    </div>
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-white mb-0.5">{result.name}</h2>
                      <p className="text-blue-400 text-[10px] font-mono tracking-widest uppercase">Subject_Ref: #{result.id}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 transition-all hover:bg-slate-800/80">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1.5 flex justify-between items-center">
                        Match Confidence
                        <span className="text-emerald-400 font-mono tracking-normal">{result.match}</span>
                      </p>
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/30">
                        <motion.div 
                          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: result.match }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Status</p>
                        <p className={`text-sm font-semibold ${
                          result.status.toLowerCase().includes('sus') ? 'text-red-400' : 'text-slate-100'
                        }`}>{result.status}</p>
                      </div>
                      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Age Profile</p>
                        <p className="text-sm font-semibold text-slate-100">{result.age}</p>
                      </div>
                    </div>

                    {result.bio && (
                      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                          <Database size={10} className="text-blue-400" />
                          Intelligence Brief
                        </p>
                        <p className="text-xs leading-relaxed text-slate-300 italic">
                          "{result.bio}"
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                        <FileText size={10} className="text-blue-400" />
                        Tactical Intelligence Overlays
                      </p>
                      <textarea 
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        placeholder="Enter manual background notes, observation data, or custom identifiers..."
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg p-3 text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none min-h-[100px] font-sans"
                      />
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Subject Data Tag</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-xs text-slate-300">
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          Authorized Level 4 Participant
                        </li>
                        <li className="flex items-center gap-2 text-xs text-slate-300">
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          No known spatial restrictions detected
                        </li>
                      </ul>
                    </div>

                    {result.socialLinks.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                          <ExternalLink size={10} className="text-blue-400" />
                          Verified Network Nodes
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {result.socialLinks.map((link, idx) => (
                            <a 
                              key={idx} 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-blue-600/20 border border-slate-700/50 hover:border-blue-500/50 text-slate-200 rounded-xl transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-blue-400 group-hover:text-blue-300">
                                  {link.platform.toLowerCase().includes('twitter') || link.platform.toLowerCase().includes('x') ? <Twitter size={14} /> : 
                                   link.platform.toLowerCase().includes('link') ? <Linkedin size={14} /> : 
                                   link.platform.toLowerCase().includes('insta') ? <Instagram size={14} /> :
                                   <User size={14} />}
                                </div>
                                <span className="text-xs font-semibold">{link.platform}</span>
                              </div>
                              <ExternalLink size={10} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 mt-auto">
                    Open Full Profile Case
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center gap-6 text-slate-700 py-12"
                >
                  <div className="w-24 h-24 border-2 border-dashed border-slate-800 rounded-full flex items-center justify-center animate-spin-slow">
                    <User size={32} className="opacity-20" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                      Awaiting Scan Sequence
                    </p>
                    <p className="text-[10px] text-slate-600 max-w-[200px] leading-relaxed">
                      Initialize optical feed to begin biometric extraction and identity verification.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-4 shadow-lg shadow-blue-500/5">
            <Activity className="w-6 h-6 text-blue-400 shrink-0" />
            <p className="text-[11px] text-blue-200/80 leading-relaxed font-medium">
              Neural network updated. 1.2M face encodings processed today. Secure biometric tunneling active.
            </p>
          </div>
        </aside>
      </main>

      {/* Footer Info */}
      <footer className="px-6 py-4 border-t border-slate-800 flex justify-between text-[10px] font-mono text-slate-600 z-10 bg-slate-950">
        <div className="flex gap-6">
          <span>HOST_IP: {window.location.hostname}</span>
          <span>MESH_STATUS: CONNECTED</span>
        </div>
        <div>
          <span>© 2026 OCULAR_ID GLOBAL SOLUTIONS</span>
        </div>
      </footer>
    </div>
  );
}

function ResultItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[10px] text-tech-border">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-bold text-white border-b border-tech-border/30 pb-1 flex justify-between items-end">
        {value}
        <div className="flex gap-0.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-scan-cyan/20" />
          ))}
        </div>
      </div>
    </div>
  );
}

