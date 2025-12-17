
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { getDetectedLanguage } from '../services/geminiService';

const VOICE_SAMPLE_RATE = 24000;
const INPUT_SAMPLE_RATE = 16000;

const CosmicVoice: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);

  const lang = getDetectedLanguage();

  // Helper: Base64 Decoding
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Helper: Base64 Encoding
  const encodeBase64 = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Decode Raw PCM to AudioBuffer
  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      // Note: session.close() is handled by the API internally usually via closing websocket
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
    setIsSpeaking(false);
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: VOICE_SAMPLE_RATE });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are the Ethereal Oracle of the Stars. Your voice is calm, deep, and mystical. Speak in ${lang === 'es' ? 'Spanish' : 'English'}. The user is seeking a spoken reading of their current vibes or chart. Be concise but poetic.`,
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encodeBase64(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decodeBase64(audioData), ctx, VOICE_SAMPLE_RATE);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Cosmic connection failed", e);
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
          }
        }
      });

    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-12">
      <div className="relative">
        {/* Pulsating Orb */}
        <div className={`w-48 h-48 md:w-64 md:h-64 rounded-full relative transition-all duration-1000 ${isActive ? 'scale-110' : 'scale-100'}`}>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-purple-800 opacity-20 blur-2xl animate-pulse`}></div>
          <div className={`absolute inset-0 rounded-full border-2 border-amber-500/30 transition-all duration-700 ${isActive ? 'scale-125 opacity-100' : 'scale-100 opacity-0'}`}></div>
          
          <div className={`relative w-full h-full rounded-full bg-black/40 border border-amber-500/20 flex items-center justify-center overflow-hidden backdrop-blur-md`}>
            {isActive ? (
              <div className="flex items-center gap-1.5 h-12">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 bg-amber-400 rounded-full transition-all duration-150 ${isSpeaking ? 'animate-bounce' : 'opacity-40 h-2'}`}
                    style={{ 
                      height: isSpeaking ? `${20 + Math.random() * 40}px` : '8px',
                      animationDelay: `${i * 0.1}s` 
                    }}
                  ></div>
                ))}
              </div>
            ) : (
              <span className="text-amber-500/20 text-6xl font-cinzel">❂</span>
            )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-4 max-w-sm">
        <h3 className="text-2xl font-cinzel text-amber-200 tracking-widest uppercase">
          {isActive ? (isSpeaking ? "The Oracle Speaks" : "The Oracle Listens") : "Ethereal Communion"}
        </h3>
        <p className="text-[10px] text-amber-100/40 uppercase tracking-[0.2em] leading-relaxed">
          {isActive 
            ? "Speak your query to the stars. The Oracle will respond in real-time." 
            : "Engage in a live voice session to hear your cosmic alignment interpreted by the Ethereal Voice."}
        </p>
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`relative group px-16 py-5 rounded-full font-cinzel tracking-[0.4em] text-xs uppercase transition-all duration-500 ${
          isActive 
            ? 'bg-red-950/20 border border-red-500/40 text-red-400 hover:bg-red-900/40' 
            : 'bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
        } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 shadow-2xl'}`}
      >
        {isConnecting ? "Establishing Orbit..." : (isActive ? "Sever Connection" : "Begin Communion")}
        {!isActive && !isConnecting && (
          <div className="absolute inset-0 rounded-full bg-amber-500/10 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
        )}
      </button>

      {isActive && (
        <div className="flex items-center gap-3 text-amber-500/30 text-[9px] font-cinzel tracking-[0.2em] uppercase">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Cosmic Link Active
        </div>
      )}
    </div>
  );
};

export default CosmicVoice;
