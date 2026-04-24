/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Music, 
  RefreshCw
} from 'lucide-react';

// --- Configuration & Constants ---

const GRID_SIZE = 20;
const TICK_INITIAL = 140;
const TICK_MIN = 60;

type Point = { x: number; y: number };

const TRACKS = [
  {
    id: 't1',
    title: "NEON HORIZON",
    artist: "SYNTH-AURA AI",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "#00f2ff",
    theme: "cyan"
  },
  {
    id: 't2',
    title: "CYBER CITY DRIFT",
    artist: "DATA_WAVE",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "#ff00ff",
    theme: "magenta"
  },
  {
    id: 't3',
    title: "ELECTRIC DREAMS",
    artist: "NEURAL_BEATZ",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    color: "#a855f7",
    theme: "purple"
  }
];

// --- Sub-components ---

const SnakeEngine: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [dir, setDir] = useState<Point>({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(TICK_INITIAL);
  const lastTime = useRef(0);
  const requestRef = useRef<number>(0);

  const spawnFood = useCallback((currentSnake: Point[]) => {
    let p;
    do {
      p = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    } while (currentSnake.some(s => s.x === p.x && s.y === p.y));
    return p;
  }, []);

  const reset = () => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    setDir({ x: 0, y: -1 });
    setFood(spawnFood([]));
    setGameOver(false);
    setScore(0);
    setSpeed(TICK_INITIAL);
    onScore(0);
  };

  const move = useCallback(() => {
    setSnake(prev => {
      const head = { x: (prev[0].x + dir.x + GRID_SIZE) % GRID_SIZE, y: (prev[0].y + dir.y + GRID_SIZE) % GRID_SIZE };
      
      if (prev.some(s => s.x === head.x && s.y === head.y)) {
        setGameOver(true);
        return prev;
      }

      const next = [head, ...prev];
      if (head.x === food.x && head.y === food.y) {
        setScore(s => {
          const ns = s + 10;
          onScore(ns);
          return ns;
        });
        setFood(spawnFood(next));
        setSpeed(v => Math.max(v - 2, TICK_MIN));
      } else {
        next.pop();
      }
      return next;
    });
  }, [dir, food, spawnFood, onScore]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && dir.y === 0) setDir({ x: 0, y: -1 });
      if (e.key === 'ArrowDown' && dir.y === 0) setDir({ x: 0, y: 1 });
      if (e.key === 'ArrowLeft' && dir.x === 0) setDir({ x: -1, y: 0 });
      if (e.key === 'ArrowRight' && dir.x === 0) setDir({ x: 1, y: 0 });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dir]);

  const frame = useCallback((t: number) => {
    if (!gameOver && t - lastTime.current >= speed) {
      move();
      lastTime.current = t;
    }
    requestRef.current = requestAnimationFrame(frame);
  }, [speed, gameOver, move]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(requestRef.current);
  }, [frame]);

  return (
    <div className="relative group">
      <div className="relative w-[400px] h-[400px] bg-black border-4 border-neon-cyan shadow-[8px_8px_0px_rgba(255,0,255,0.5)] overflow-hidden">
        <div className="absolute inset-0 static-noise z-10" />
        <div className="scanline z-20" />
        
        <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 opacity-20 z-0">
          {Array.from({ length: 400 }).map((_, i) => <div key={i} className="border-[0.5px] border-neon-cyan/30" />)}
        </div>

        <div className="absolute inset-0 z-5">
          {snake.map((p, i) => (
            <motion.div
              key={`${p.x}-${p.y}-${i}`}
              className="absolute bg-neon-green"
              style={{ 
                width: 18, 
                height: 18, 
                left: p.x * 20 + 1, 
                top: p.y * 20 + 1,
                boxShadow: '0 0 10px #39ff14' 
              }}
              initial={false}
              animate={{ 
                left: p.x * 20 + 1, 
                top: p.y * 20 + 1
              }}
              transition={{ type: 'just' }}
            />
          ))}
          <motion.div
            className="absolute bg-white"
            style={{ width: 14, height: 14, left: food.x * 20 + 3, top: food.y * 20 + 3, boxShadow: '0 0 10px #fff' }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.1 }}
          />
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neon-magenta/90 mix-blend-multiply flex flex-col items-center justify-center z-50 px-8 text-center"
            >
              <Activity className="text-white mb-4 animate-ping" size={64} />
              <h2 className="text-6xl font-black italic tracking-tighter text-white mb-2 glitch-text">SEGFAULT</h2>
              <p className="text-white font-mono text-sm uppercase tracking-[0.3em] mb-8 bg-black p-2">_CRITICAL_LOGIC_FAIL_</p>
              <button 
                onClick={reset}
                className="group flex items-center gap-3 bg-white text-black px-10 py-4 font-bold border-4 border-black hover:bg-neon-cyan transition-all"
              >
                <RefreshCw size={24} />
                RELOAD_OS
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex justify-between items-center mt-6 px-2 text-[12px] font-mono text-neon-magenta tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <Gamepad2 size={14} />
          INPUT_MAPPING: ARROWS
        </div>
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-neon-cyan" />
          CPU_FREQ: {200 - speed}HZ
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);

  const track = TRACKS[trackIdx];

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  useEffect(() => {
    if (audio.current) {
      if (playing) audio.current.play().catch(() => setPlaying(false));
      else audio.current.pause();
    }
  }, [playing, trackIdx]);

  return (
    <div className="h-screen w-full p-6 box-border bg-obsidian overflow-hidden">
      <div className="grid grid-cols-12 grid-rows-8 gap-4 h-full w-full max-w-[1600px] mx-auto">
        
        {/* Card 1: System Status (StatBox?) - Span 3, Row 2 */}
        <div className="card neon-border col-span-3 row-span-2 p-5 justify-center">
          <div className="text-[10px] uppercase tracking-[2px] text-white/50 mb-1">System Status</div>
          <div className="neon-text-cyan text-2xl font-extrabold">NEON_SNK v2.0</div>
          <div className="text-[12px] mt-2 text-neon-green flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span>CORE ENGINE ONLINE</span>
          </div>
        </div>

        {/* Card 2: Playlist - Span 3, Row 4 */}
        <div className="card neon-border col-span-3 row-span-4 p-5">
          <div className="text-sm font-bold tracking-widest uppercase mb-4 px-1">Playlist</div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {TRACKS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => { setTrackIdx(i); setPlaying(true); }}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  trackIdx === i 
                  ? 'bg-neon-cyan/10 border border-neon-cyan/30' 
                  : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
              >
                <div 
                  className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${trackIdx === i ? 'bg-neon-cyan text-black' : 'bg-white/10 text-white/40'}`}
                >
                  <Music size={14} />
                </div>
                <div className="flex-1 text-left truncate">
                  <div className={`text-[13px] font-semibold truncate ${trackIdx === i ? 'text-neon-cyan' : 'text-white'}`}>{t.title}</div>
                  <div className="text-[11px] opacity-60 truncate">AI GEN #{t.id.replace('t', '')}</div>
                </div>
                {trackIdx === i && playing && <div className="neon-text-cyan text-[10px]">▶</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Card 3: Snake Game - Span 6, Row 6 */}
        <div className="card neon-border col-span-6 row-span-6 flex flex-col">
          <div className="p-4 px-5 flex justify-between items-center border-b border-white/5">
            <span className="text-xs font-bold tracking-[2px] uppercase">SNAKE_MODULE_PRO</span>
            <div className="flex gap-6 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-50 uppercase">Score:</span>
                <span className="neon-text-green font-bold text-sm tracking-widest leading-none">
                  {score.toString().padStart(6, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-50 uppercase">High:</span>
                <span className="text-white/80 font-bold text-sm tracking-widest leading-none">
                  {highScore.toString().padStart(6, '0')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-grow p-3 bg-black flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 game-canvas-bg pointer-events-none opacity-40" />
            <div className="transform scale-[0.85] lg:scale-100">
               <SnakeEngine onScore={setScore} />
            </div>
          </div>
        </div>

        {/* Card 4: Now Playing - Span 3, Row 4 */}
        <div className="card neon-border col-span-3 row-span-4 p-5 text-center justify-center items-center">
          <div className="relative mb-6">
            <motion.div 
               animate={{ rotate: playing ? 360 : 0 }}
               transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
               className="w-32 h-32 rounded-full border-4 border-neon-cyan/80 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,243,255,0.2),0_0_20px_rgba(0,243,255,0.2)]"
            >
               <div className="w-24 h-24 rounded-full bg-radial-gradient from-neon-magenta/60 to-transparent flex items-center justify-center">
                 <Music size={32} className="text-white/20" />
               </div>
            </motion.div>
          </div>
          <div className="neon-text-cyan text-lg font-black tracking-tight">{track.title}</div>
          <div className="text-[10px] opacity-50 tracking-[2px] uppercase mt-1 mb-5">Now Playing</div>
          
          <div className="w-full space-y-2">
             <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                   className="h-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]"
                   animate={{ width: playing ? "100%" : "30%" }}
                   transition={{ duration: playing ? 180 : 0.5 }}
                />
             </div>
             <div className="flex justify-between text-[10px] text-white/40 font-mono tracking-widest">
               <span>02:45</span>
               <span>04:12</span>
             </div>
          </div>
        </div>

        {/* Card 5: Stats (Level/Speed) - Span 3, Row 2 */}
        <div className="card neon-border col-span-3 row-span-2 p-5 flex-row items-center gap-6 justify-center">
          <div className="flex-1 text-center">
            <div className="text-[10px] opacity-50 tracking-widest mb-1 uppercase font-mono">Rank</div>
            <div className="text-3xl font-black italic">
               {Math.floor(score / 50) + 1 < 10 ? `0${Math.floor(score / 50) + 1}` : Math.floor(score / 50) + 1}
            </div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex-1 text-center">
            <div className="text-[10px] opacity-50 tracking-widest mb-1 uppercase font-mono">BPM</div>
            <div className="text-3xl font-black text-neon-magenta">{(120 + score/10).toFixed(0)}</div>
          </div>
        </div>

        {/* Card 6: Controls & Visualizer - Span 9, Row 2 */}
        <div className="card neon-border col-span-9 row-span-2 px-10 flex-row items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-6">
               <button 
                 onClick={() => setTrackIdx(i => (i - 1 + TRACKS.length) % TRACKS.length)}
                 className="p-2 text-white/60 hover:text-white transition-opacity active:scale-95"
               >
                 <SkipBack size={28} />
               </button>
               <button 
                  onClick={() => setPlaying(!playing)}
                  className="w-16 h-16 rounded-full bg-neon-cyan flex items-center justify-center text-obsidian shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:scale-105 active:scale-90 transition-all"
               >
                  {playing ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
               </button>
               <button 
                  onClick={() => setTrackIdx(i => (i + 1) % TRACKS.length)}
                  className="p-2 text-white/60 hover:text-white transition-opacity active:scale-95"
               >
                  <SkipForward size={28} />
               </button>
            </div>
            
            <div className="h-10 w-px bg-white/10" />

            <div className="flex flex-col gap-1">
               <div className="text-[10px] opacity-40 uppercase tracking-[2px] mb-1">Visualizer</div>
               <div className="flex items-end gap-[3px] h-8">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: playing ? [10, 24, 12, 30, 8] : 4 }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 0.6 + Math.random() * 0.4, 
                        delay: i * 0.05 
                      }}
                      className="w-1 bg-neon-cyan"
                      style={{ backgroundColor: i % 4 === 0 ? '#ff00ff' : '#00f3ff' }}
                    />
                  ))}
               </div>
            </div>
          </div>

          <button 
             onClick={() => window.location.reload()}
             className="bg-transparent border border-neon-magenta text-neon-magenta px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neon-magenta hover:text-black transition-all flex items-center gap-2 group"
          >
             <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
             Reset System
          </button>
        </div>

      </div>

      <audio ref={audio} src={track.src} onEnded={() => setTrackIdx(i => (i + 1) % TRACKS.length)} />
    </div>
  );
}
