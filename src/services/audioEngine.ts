// Web Audio Engine for Radio D-Leacon (রেডিও ডি-লিকন)

class RadioAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private micGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;

  // Synthesizer / Generative playback loops
  private activeSynthTimers: number[] = [];
  private currentHtmlAudio: HTMLAudioElement | null = null;
  private htmlAudioSource: MediaElementAudioSourceNode | null = null;

  private isPlaying: boolean = false;
  private isMicActive: boolean = false;
  private autoDucking: boolean = true;
  private micVolumeLevel: number = 0; // 0 to 1 for VU meters

  // Voice recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.micGain = this.ctx.createGain();
      this.micGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Routing:
      // musicGain -> masterGain -> analyser -> destination
      // micGain   -> masterGain -> analyser -> destination
      this.musicGain.connect(this.masterGain);
      this.micGain.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(vol: number) {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public setMicGain(vol: number) {
    if (this.micGain && this.ctx) {
      this.micGain.gain.setTargetAtTime(Math.max(0, Math.min(1.5, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public setAutoDucking(enabled: boolean) {
    this.autoDucking = enabled;
  }

  private onTrackEndedCallback: (() => void) | null = null;

  public setOnTrackEnded(callback: (() => void) | null) {
    this.onTrackEndedCallback = callback;
  }

  // --- AUDIO PLAYBACK (GENERATIVE OR FILE) ---
  public playTrack(theme: string = 'morning_raga', audioUrl?: string, loop: boolean = true) {
    this.initContext();
    this.stopMusic();
    this.isPlaying = true;

    if (audioUrl) {
      // Play real audio file (uploaded or recorded)
      this.playAudioFile(audioUrl, loop);
    } else {
      // Play synthesized realistic radio program soundscape
      this.startSynthesizedTheme(theme);
    }
  }

  private playAudioFile(url: string, loop: boolean = true) {
    if (!this.ctx || !this.musicGain) return;

    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.pause();
      this.currentHtmlAudio = null;
    }

    const audio = new Audio(url);
    if (!url.startsWith('blob:')) {
      audio.crossOrigin = 'anonymous';
    }
    audio.loop = loop;
    audio.onended = () => {
      if (this.onTrackEndedCallback) {
        this.onTrackEndedCallback();
      }
    };

    try {
      this.htmlAudioSource = this.ctx.createMediaElementSource(audio);
      this.htmlAudioSource.connect(this.musicGain);
    } catch (e) {
      console.warn('MediaElementSource error:', e);
    }

    audio.play().catch((err) => {
      console.warn('Audio play error, falling back to generative theme:', err);
      this.startSynthesizedTheme('evening_melody');
    });

    this.currentHtmlAudio = audio;
  }

  public getHtmlAudio(): HTMLAudioElement | null {
    return this.currentHtmlAudio;
  }

  public seek(seconds: number) {
    if (this.currentHtmlAudio && !isNaN(this.currentHtmlAudio.duration)) {
      this.currentHtmlAudio.currentTime = seconds;
    }
  }

  public getPlaybackProgress(): { currentTime: number; duration: number } {
    if (this.currentHtmlAudio && !isNaN(this.currentHtmlAudio.duration)) {
      return {
        currentTime: this.currentHtmlAudio.currentTime,
        duration: this.currentHtmlAudio.duration,
      };
    }
    return { currentTime: 0, duration: 0 };
  }

  private startSynthesizedTheme(theme: string) {
    if (!this.ctx || !this.musicGain) return;

    // Harmonious musical scales
    const scales: Record<string, number[]> = {
      morning_raga: [220, 247.5, 277.18, 329.63, 370, 440, 495, 554.37], // Bhairav / Bilawal acoustic dawn
      afternoon_talk: [261.63, 293.66, 329.63, 392, 440, 523.25], // Clean acoustic warmth
      evening_melody: [196, 220, 246.94, 293.66, 329.63, 392, 440], // Yaman soothing evening tones
      night_ambient: [146.83, 174.61, 220, 261.63, 293.66, 349.23], // Deep tranquil night
      news_bulletin: [261.63, 329.63, 392, 523.25], // Crisp broadcast rhythmic pulse
    };

    const notes = scales[theme] || scales.evening_melody;

    // 1. Continuous warm ambient pad / drone
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    droneOsc.type = 'triangle';
    droneOsc.frequency.setValueAtTime(notes[0] / 2, this.ctx.currentTime); // root octave down

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);

    droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    droneGain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 2.0);

    droneOsc.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.musicGain);
    droneOsc.start();

    // 2. Periodic acoustic notes & chord arpeggiations
    const playNote = () => {
      if (!this.isPlaying || !this.ctx || !this.musicGain) return;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const noteFilter = this.ctx.createBiquadFilter();

      const note = notes[Math.floor(Math.random() * notes.length)];
      const now = this.ctx.currentTime;

      osc.type = theme === 'news_bulletin' ? 'sine' : 'sine';
      osc.frequency.setValueAtTime(note, now);

      // Gentle acoustic envelope (soft attack, resonant decay)
      const attack = 0.15;
      const decay = 2.2 + Math.random() * 1.5;

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.14, now + attack);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

      noteFilter.type = 'lowpass';
      noteFilter.frequency.setValueAtTime(1400, now);

      osc.connect(noteFilter);
      noteFilter.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + attack + decay + 0.1);

      // Clean up node memory
      setTimeout(() => {
        try {
          osc.disconnect();
          noteGain.disconnect();
        } catch {
          // ignore
        }
      }, (attack + decay + 0.2) * 1000);

      // Schedule next note with humanized cadence
      const delay = theme === 'news_bulletin' ? 1200 : (1600 + Math.random() * 2200);
      const timer = window.setTimeout(playNote, delay);
      this.activeSynthTimers.push(timer);
    };

    // Kick off note generator
    const firstTimer = window.setTimeout(playNote, 500);
    this.activeSynthTimers.push(firstTimer);

    // Save drone oscillator for cleanup
    (this as unknown as { _droneOsc?: OscillatorNode })._droneOsc = droneOsc;
    (this as unknown as { _droneGain?: GainNode })._droneGain = droneGain;
  }

  public stopMusic() {
    this.isPlaying = false;

    // Clear timers
    this.activeSynthTimers.forEach((t) => clearTimeout(t));
    this.activeSynthTimers = [];

    // Stop HTML audio
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.pause();
      this.currentHtmlAudio = null;
    }

    // Fade out drone oscillator
    const droneOsc = (this as unknown as { _droneOsc?: OscillatorNode })._droneOsc;
    const droneGain = (this as unknown as { _droneGain?: GainNode })._droneGain;
    if (droneGain && this.ctx) {
      try {
        droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
        setTimeout(() => {
          try {
            droneOsc?.stop();
            droneOsc?.disconnect();
          } catch {
            // ignore
          }
        }, 300);
      } catch {
        // ignore
      }
    }
  }

  // --- LIVE STUDIO MICROPHONE STREAMING ---
  public async startMicrophone(): Promise<boolean> {
    this.initContext();
    if (!this.ctx || !this.micGain) return false;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 64;

      this.micSource.connect(this.micGain);
      this.micSource.connect(this.micAnalyser);
      this.isMicActive = true;

      // Start VU meter polling & auto-ducking
      this.monitorMicLevel();
      return true;
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      this.isMicActive = false;
      return false;
    }
  }

  public stopMicrophone() {
    this.isMicActive = false;
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {
        // ignore
      }
      this.micSource = null;
    }
    // Restore music volume if ducked
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0.8, this.ctx.currentTime, 0.2);
    }
    this.micVolumeLevel = 0;
  }

  private monitorMicLevel() {
    if (!this.isMicActive || !this.micAnalyser || !this.ctx) return;

    const dataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);
    this.micAnalyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    this.micVolumeLevel = Math.min(1, avg / 128);

    // Auto-ducking: if host is speaking (level > 0.15), lower music volume
    if (this.autoDucking && this.musicGain && this.isPlaying) {
      if (this.micVolumeLevel > 0.18) {
        // Duck down to 25% volume smoothly
        this.musicGain.gain.setTargetAtTime(0.2, this.ctx.currentTime, 0.1);
      } else {
        // Bring back up to 80% volume
        this.musicGain.gain.setTargetAtTime(0.8, this.ctx.currentTime, 0.4);
      }
    }

    if (this.isMicActive) {
      requestAnimationFrame(() => this.monitorMicLevel());
    }
  }

  public getMicLevel(): number {
    return this.micVolumeLevel;
  }

  // --- SOUNDBOARD / JINGLE EFFECTS ---
  public playSoundEffect(type: string) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'station_id': {
        // 3-tone signature station chime (D4, F#4, A4, D5 chord arpeggio)
        const frequencies = [293.66, 369.99, 440.0, 587.33];
        frequencies.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const t = now + idx * 0.22;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

          osc.connect(gain);
          gain.connect(this.masterGain!);

          osc.start(t);
          osc.stop(t + 1.3);
        });
        break;
      }
      case 'applause': {
        // Filtered pink noise burst simulating crowd cheer
        const bufferSize = this.ctx.sampleRate * 2.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.95 * b1 + white * 0.11;
          b2 = 0.85 * b2 + white * 0.25;
          output[i] = (b0 + b1 + b2) * 0.3;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        break;
      }
      case 'gong': {
        // Deep Tibetan/Studio resonant chime gong
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(146.83, now); // D3

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 3.1);
        break;
      }
      case 'sweep': {
        // High frequency radio frequency tuner sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(2800, now + 0.6);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.65);
        break;
      }
      default:
        break;
    }
  }

  // --- VOICE / SHOW RECORDER ---
  public async startRecording(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch {
      return false;
    }
  }

  public stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      // stop stream tracks
      this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      this.mediaRecorder = null;
    });
  }

  // Real-time audio waveform / frequency data
  public getFrequencyData(array: Uint8Array<ArrayBufferLike>) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  public getTimeDomainData(array: Uint8Array<ArrayBufferLike>) {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(array as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMicActive(): boolean {
    return this.isMicActive;
  }
}

export const audioEngine = new RadioAudioEngine();
