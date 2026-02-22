/**
 * WhiteNoisePlayer.tsx
 *
 * Ambient sound player using the Web Audio API — no external files or network
 * requests. All sounds are generated procedurally in the browser.
 *
 * Presets:
 *  White — full-spectrum static
 *  Pink  — softer 1/f noise (sounds like gentle rain or TV static)
 *  Brown — bass-heavy rumble (engine, distant thunder)
 *  Rain  — pink noise + high-pass + slow amplitude modulation
 *  Fan   — white noise through a narrow bandpass (~500 Hz)
 *  Ocean — brown noise with very slow LFO swells (~20 s period)
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  CloudRain,
  Wind,
  Waves,
  Radio,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { THEME } from '@/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

type NoisePreset = 'white' | 'pink' | 'brown' | 'rain' | 'fan' | 'ocean';

interface Preset {
  id: NoisePreset;
  label: string;
  icon: React.ElementType;
}

const PRESETS: Preset[] = [
  { id: 'white', label: 'White', icon: Radio },
  { id: 'pink',  label: 'Pink',  icon: Wind },
  { id: 'brown', label: 'Brown', icon: Layers },
  { id: 'rain',  label: 'Rain',  icon: CloudRain },
  { id: 'fan',   label: 'Fan',   icon: RefreshCw },
  { id: 'ocean', label: 'Ocean', icon: Waves },
];

// ─── Noise buffer generators ──────────────────────────────────────────────────

/** 2-second looping buffer of white noise (uniform random samples). */
function makeWhiteBuffer(ctx: AudioContext): AudioBuffer {
  const n = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** 2-second looping buffer of pink noise (Paul Kellet's 7-stage approximation). */
function makePinkBuffer(ctx: AudioContext): AudioBuffer {
  const n = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616  * b5 - w * 0.0168980;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}

/** 2-second looping buffer of brown (Brownian / red) noise. */
function makeBrownBuffer(ctx: AudioContext): AudioBuffer {
  const n = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

// ─── Audio graph builder ──────────────────────────────────────────────────────

interface Graph {
  source: AudioBufferSourceNode;
  lfo?: OscillatorNode;
}

function buildGraph(ctx: AudioContext, preset: NoisePreset, master: GainNode): Graph {
  const connectAndLoop = (buf: AudioBuffer): AudioBufferSourceNode => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  };

  switch (preset) {
    case 'white': {
      const src = connectAndLoop(makeWhiteBuffer(ctx));
      src.connect(master);
      return { source: src };
    }

    case 'pink': {
      const src = connectAndLoop(makePinkBuffer(ctx));
      src.connect(master);
      return { source: src };
    }

    case 'brown': {
      const src = connectAndLoop(makeBrownBuffer(ctx));
      src.connect(master);
      return { source: src };
    }

    case 'rain': {
      // Pink noise → highpass (emphasises the "pitter-patter" band) → LFO gain → master
      const src = connectAndLoop(makePinkBuffer(ctx));
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 300;
      hp.Q.value = 0.5;

      const presetGain = ctx.createGain();
      presetGain.gain.value = 1;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.2; // 0.2 Hz — slow variation
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(presetGain.gain);

      src.connect(hp);
      hp.connect(presetGain);
      presetGain.connect(master);

      return { source: src, lfo };
    }

    case 'fan': {
      // White noise → narrow bandpass centred on ~500 Hz
      const src = connectAndLoop(makeWhiteBuffer(ctx));
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 500;
      bp.Q.value = 3;

      const lvl = ctx.createGain();
      lvl.gain.value = 4; // bandpass attenuates, compensate

      src.connect(bp);
      bp.connect(lvl);
      lvl.connect(master);
      return { source: src };
    }

    case 'ocean': {
      // Brown noise with very slow LFO (~20 s period) to simulate wave swells
      const src = connectAndLoop(makeBrownBuffer(ctx));
      const presetGain = ctx.createGain();
      presetGain.gain.value = 0.85;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05; // 0.05 Hz = 20-second waves
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.2;
      lfo.connect(lfoGain);
      lfoGain.connect(presetGain.gain);

      src.connect(presetGain);
      presetGain.connect(master);
      return { source: src, lfo };
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const WhiteNoisePlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [preset, setPreset] = useState<NoisePreset>('pink');

  const ctxRef    = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const graphRef  = useRef<Graph | null>(null);

  const getEffectiveVolume = (vol: number, muted: boolean) => (muted ? 0 : vol);

  /** Tear down the current audio graph cleanly. */
  const stopGraph = useCallback(() => {
    if (!graphRef.current) return;
    try {
      graphRef.current.source.stop();
      graphRef.current.lfo?.stop();
    } catch {
      // already stopped — ignore
    }
    graphRef.current = null;
  }, []);

  /** Start playing the given preset. Creates AudioContext on first call. */
  const startGraph = useCallback((p: NoisePreset, vol: number, muted: boolean) => {
    // Create (or resume) AudioContext in response to user gesture
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }

    // Master gain node
    if (!masterRef.current) {
      masterRef.current = ctxRef.current.createGain();
      masterRef.current.connect(ctxRef.current.destination);
    }
    masterRef.current.gain.value = getEffectiveVolume(vol, muted);

    const graph = buildGraph(ctxRef.current, p, masterRef.current);
    graph.source.start();
    graph.lfo?.start();
    graphRef.current = graph;
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopGraph();
      ctxRef.current?.suspend();
      setIsPlaying(false);
    } else {
      startGraph(preset, volume, isMuted);
      setIsPlaying(true);
    }
  };

  const handlePresetChange = (next: NoisePreset) => {
    setPreset(next);
    if (isPlaying) {
      stopGraph();
      // Rebuild graph with new preset immediately
      startGraph(next, volume, isMuted);
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (masterRef.current) {
      masterRef.current.gain.value = getEffectiveVolume(val, isMuted);
    }
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (masterRef.current) {
      masterRef.current.gain.value = getEffectiveVolume(volume, next);
    }
  };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <div className="space-y-4">
      {/* Preset grid — 3 × 2 */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(({ id, label, icon: Icon }) => {
          const active = preset === id;
          return (
            <button
              key={id}
              onClick={() => handlePresetChange(id)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                active
                  ? 'bg-pilot-orange/10 border-pilot-orange/40 text-pilot-orange'
                  : 'bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/5 hover:text-white/50'
              }`}
            >
              <Icon size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="bg-pilot-orange text-white p-3 rounded-full shadow-lg shadow-pilot-orange/30 hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          {isPlaying
            ? <Pause size={16} fill="currentColor" />
            : <Play size={16} fill="currentColor" className="ml-0.5" />
          }
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <button
            onClick={handleMuteToggle}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="text-white/30 hover:text-white transition-colors shrink-0"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            aria-label="Volume"
            className="flex-1 h-0.5 appearance-none rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, #F37324 0%, #F37324 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.08) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.08) 100%)`,
            }}
          />
        </div>
      </div>

      {/* Now playing label */}
      <p className="text-[9px] text-white/20 uppercase tracking-widest text-center">
        {isPlaying ? `Playing — ${activePreset.label} Noise` : 'Tap play to start'}
      </p>
    </div>
  );
};
