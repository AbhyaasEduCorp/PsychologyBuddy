"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icons } from "./Icons";
import { CardProps } from "./MusicCard";

interface PlayerModalProps {
  card: CardProps;
  onClose: () => void;
  categories: any[];
}

export const PlayerModal = ({ card, onClose, categories }: PlayerModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTrack, setActiveTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasTrackedCompletion, setHasTrackedCompletion] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const savedTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* -----------------------------------------------------------------------
   FETCHING TRACKS LOGIC (same as your code, unchanged)
  -------------------------------------------------------------------------*/
  const [tracks, setTracks] = useState([
    {
      title: card.title,
      artist: card.artist || "Unknown Artist",
      duration: card.duration,
      url: card.url,
    },
  ]);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const res = await fetch("/api/student/music/resources?limit=40");
        const json = await res.json();

        if (!json.success) return;

        const allMusic = json.data.resources || [];

        const categoryNames =
          card.categories?.map((c: any) => c.category?.name).filter(Boolean) ||
          [];

        const sameCategory = allMusic.filter((m: any) => {
          if (m.id === card.id) return false;
          return m.categories?.some((cat: any) =>
            categoryNames.includes(cat.category?.name)
          );
        });

        const mapped = sameCategory.map((m: any) => ({
          title: m.title,
          artist: m.artist,
          duration: m.duration,
          url: m.url,
        }));

        setTracks([
          {
            title: card.title,
            artist: card.artist,
            duration: card.duration,
            url: card.url,
          },
          ...mapped,
        ]);
      } catch (err) {
        console.log("Error:", err);
      }
    };

    loadTracks();
  }, []);

  /* -----------------------------------------------------------------------
   AUDIO EVENTS
  -------------------------------------------------------------------------*/
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const onMeta = () => {
      setDuration(audio.duration);
      if (savedTimeRef.current > 0) {
        audio.currentTime = savedTimeRef.current;
        savedTimeRef.current = 0;
        if (wasPlayingRef.current) { audio.play(); setIsPlaying(true); }
      }
    };
    const onEnd = async () => {
      if (!hasTrackedCompletion) {
        try {
          console.log('[Music] Track ended, tracking completion...', { 
            musicId: card.id, 
            duration: Math.floor(audio.duration) 
          });
          
          // Track music completion via API endpoint
          const response = await fetch('/api/student/challenges/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'music',
              itemId: card.id,
              duration: Math.floor(audio.duration)
            })
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('[Music] Failed to track completion:', error);
          } else {
            const result = await response.json();
            console.log('[Music] Successfully tracked completion:', result);
            setHasTrackedCompletion(true);
          }
        } catch (error) {
          console.error('[Music] Failed to track music completion:', error);
        }
      }
      handleNextTrack();
    };

    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [activeTrack, hasTrackedCompletion, card.id]);

  /* -----------------------------------------------------------------------
   PLAYER CONTROLS
  -------------------------------------------------------------------------*/
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    isPlaying ? audio.pause() : audio.play();
    setIsPlaying(!isPlaying);
  };

  const handleTrackSelect = (i: number) => {
    setActiveTrack(i);
    const audio = audioRef.current;

    if (audio && tracks[i]?.url) {
      audio.src = tracks[i].url;
      audio.load();
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    handleTrackSelect((activeTrack + 1) % tracks.length);
  };

  const handlePrevTrack = () => {
    handleTrackSelect(
      activeTrack === 0 ? tracks.length - 1 : activeTrack - 1
    );
  };

  const scrub = (e: any) => {
    const bar = e.target.getBoundingClientRect();
    const clickX = e.clientX - bar.left;
    const percent = clickX / bar.width;

    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = percent * audio.duration;
      setProgress(percent * 100);
    }
  };

  const format = (t: number) =>
    `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  const toggleFullscreen = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      savedTimeRef.current = audio.currentTime;
      wasPlayingRef.current = isPlaying;
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
    }
    if (!isFullscreen) {
      modalRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, [isFullscreen, isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setShowControls(true);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  /* -----------------------------------------------------------------------
   UI STARTS HERE — ALL NEW DESIGN
  -------------------------------------------------------------------------*/

  return (
    <div ref={modalRef} className="fixed inset-0 z-[999]">
      <audio ref={audioRef} src={tracks[activeTrack].url} />

      {isFullscreen ? (
        /* ============================================================
           YOUTUBE-STYLE FULLSCREEN (audio: blurred art + overlay)
        ============================================================ */
        <div
          className="w-full h-full bg-black relative flex items-center justify-center"
          onMouseMove={revealControls}
          onClick={revealControls}
        >

          {/* Blurred album art background */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-40"
            style={{ backgroundImage: `url(${card.coverImage || card.thumbnailUrl})` }}
          />
          <div className="absolute inset-0 bg-black/60" />

          {/* Centered album art */}
          <img
            src={card.coverImage || card.thumbnailUrl}
            alt={tracks[activeTrack].title}
            className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl object-cover shadow-2xl"
          />

          {/* TOP-RIGHT BUTTONS */}
          <div className={`absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={toggleFullscreen}
              className="bg-black/50 hover:bg-black/80 p-2.5 rounded-full backdrop-blur-sm transition-colors"
              title="Exit fullscreen"
            >
              <Icons.Minimize2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="bg-black/50 hover:bg-black/80 p-2.5 rounded-full backdrop-blur-sm transition-colors"
            >
              <Icons.X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* BOTTOM GRADIENT + CONTROLS */}
          <div className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-gradient-to-t from-black/95 via-black/70 to-transparent px-6 sm:px-10 md:px-16 pt-20 pb-6 sm:pb-10">

              {/* Track info */}
              <div className="mb-3 sm:mb-5">
                <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">Now Playing</span>
                <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mt-1 drop-shadow-lg">
                  {tracks[activeTrack].title}
                </h2>
                {tracks[activeTrack].artist && (
                  <p className="text-white/60 text-sm mt-0.5">{tracks[activeTrack].artist}</p>
                )}
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-7">
                <span className="text-white/70 text-xs sm:text-sm font-mono tabular-nums w-10 text-right flex-shrink-0">
                  {format(currentTime)}
                </span>
                <div
                  className="flex-1 h-1 sm:h-1.5 bg-white/30 rounded-full cursor-pointer relative group/bar"
                  onClick={scrub}
                >
                  <div className="h-full bg-white rounded-full relative" style={{ width: `${progress}%` }}>
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/bar:scale-100 transition-transform" />
                  </div>
                </div>
                <span className="text-white/70 text-xs sm:text-sm font-mono tabular-nums w-10 flex-shrink-0">
                  {format(typeof tracks[activeTrack].duration === 'string' ? parseFloat(tracks[activeTrack].duration) : tracks[activeTrack].duration)}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-14">
                <button onClick={handlePrevTrack} className="p-2 text-white/70 hover:text-white transition-colors">
                  <Icons.SkipBack className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                >
                  {isPlaying ? (
                    <Icons.Pause className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
                  ) : (
                    <Icons.Play className="w-6 h-6 sm:w-7 sm:h-7 text-black ml-1" />
                  )}
                </button>
                <button onClick={handleNextTrack} className="p-2 text-white/70 hover:text-white transition-colors">
                  <Icons.SkipForward className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* ============================================================
           NORMAL MODAL (two-panel layout)
        ============================================================ */
        <div className="w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[16px] sm:rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden animate-fadeIn flex flex-col md:flex-row">

            {/* LEFT — PLAYLIST */}
            <div className="w-full md:w-[360px] bg-[#F8FAFF] border-b md:border-b-0 md:border-r flex flex-col h-[40vh] md:h-auto">
              <div className="p-4 sm:p-5 md:p-6 border-b">
                <h1 className="text-lg sm:text-xl font-bold text-[#223344]">{card.title}</h1>
                <p className="text-xs sm:text-sm text-[#778395] mt-1">Gentle melodies to reduce stress and anxiety</p>
                <p className="text-xs text-[#99A3B3] mt-3 sm:mt-4">🎵 {tracks.length} Tracks</p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-2">
                {tracks.map((t, i) => (
                  <div
                    key={i}
                    onClick={() => handleTrackSelect(i)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeTrack === i ? 'bg-white shadow border border-[#D5E5FF]' : 'hover:bg-white/60'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-blue-600 border ${activeTrack === i ? 'bg-blue-600 text-white' : 'border-[#D8E1F3]'}`}>
                        {activeTrack === i ? <Icons.Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Icons.Play className="w-3 h-3 sm:w-4 sm:h-4 ml-[2px]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#223344] text-xs sm:text-sm truncate">{t.title}</p>
                        <p className="text-xs text-[#8C97A8] truncate">{t.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#7D8899] flex-shrink-0">{format(typeof t.duration === 'string' ? parseFloat(t.duration) : t.duration)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — MAIN PLAYER */}
            <div className="flex-1 p-4 sm:p-6 md:p-8 relative flex flex-col min-h-0">

              <div className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 z-10">
                <button onClick={onClose} className="p-1.5 sm:p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                  <Icons.X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </button>
              </div>

              <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg w-full max-h-[200px] sm:max-h-[250px] md:max-h-[320px] relative">
                <img src={card.coverImage || card.thumbnailUrl} className="w-full h-full object-cover" alt="cover" />
                {/* Fullscreen button — bottom-right of cover image */}
                <button
                  onClick={toggleFullscreen}
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/50 hover:bg-black/80 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-colors z-10"
                  title="Enter fullscreen"
                >
                  <Icons.Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>

              <div className="mt-4 sm:mt-6">
                <span className="text-xs px-2 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-semibold">Now Playing</span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#222] mt-2 sm:mt-3">{tracks[activeTrack].title}</h2>
                <p className="text-[#556070] mt-1 text-xs sm:text-sm">Perfect for your meditation experience</p>
              </div>

              <div className="mt-4 sm:mt-6">
                <div className="flex justify-between text-xs text-[#778395] mb-1">
                  <span>{format(currentTime)}</span>
                  <span>{format(typeof tracks[activeTrack].duration === 'string' ? parseFloat(tracks[activeTrack].duration) : tracks[activeTrack].duration)}</span>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full cursor-pointer" onClick={scrub}>
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-10">
                <button onClick={handlePrevTrack} className="p-3 sm:p-4 rounded-full bg-gray-100 hover:bg-gray-200">
                  <Icons.SkipBack className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#667085]" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition"
                >
                  {isPlaying ? (
                    <Icons.Pause className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                  ) : (
                    <Icons.Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white ml-1" />
                  )}
                </button>
                <button onClick={handleNextTrack} className="p-3 sm:p-4 rounded-full bg-gray-100 hover:bg-gray-200">
                  <Icons.SkipForward className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#667085]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

