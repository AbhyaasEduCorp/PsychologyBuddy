"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icons } from "./Icons";
import { CardProps } from "./MeditationCard";

interface PlayerModalProps {
  card: CardProps;
  onClose: () => void;
}

export const PlayerModal = ({ card, onClose }: PlayerModalProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const savedTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getMedia = () => card.type === 'video' ? videoRef.current : audioRef.current;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasTrackedCompletion, setHasTrackedCompletion] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  /* --------------------------------------------
    MEDIA EVENTS (AUDIO/VIDEO)
  -------------------------------------------- */
  useEffect(() => {
    const media = getMedia();
    if (!media) return;

    const updateProgress = () => {
      setCurrentTime(media.currentTime);
      if (media.duration) {
        setProgress((media.currentTime / media.duration) * 100);
      }
    };
    const loadMeta = () => {
      setDuration(media.duration);
      if (savedTimeRef.current > 0) {
        media.currentTime = savedTimeRef.current;
        savedTimeRef.current = 0;
        if (wasPlayingRef.current) { media.play(); setIsPlaying(true); }
      }
    };
    
    const handleEnded = async () => {
      if (hasTrackedCompletion) return;
      
      try {
        console.log('[Meditation] Video ended, tracking completion...', { 
          meditationId: card.id, 
          duration: Math.floor(media.duration) 
        });
        
        // Track meditation completion via API endpoint
        const response = await fetch('/api/student/challenges/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'meditation',
            itemId: card.id,
            duration: Math.floor(media.duration)
          })
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[Meditation] Failed to track completion:', error);
        } else {
          const result = await response.json();
          console.log('[Meditation] Successfully tracked completion:', result);
          setHasTrackedCompletion(true);
        }
      } catch (error) {
        console.error('[Meditation] Failed to track meditation completion:', error);
      }
    };

    media.addEventListener("timeupdate", updateProgress);
    media.addEventListener("loadedmetadata", loadMeta);
    media.addEventListener("ended", handleEnded);

    return () => {
      media.removeEventListener("timeupdate", updateProgress);
      media.removeEventListener("loadedmetadata", loadMeta);
      media.removeEventListener("ended", handleEnded);
    };
  }, [card.type, card.id, hasTrackedCompletion, isFullscreen]);

  const togglePlayPause = () => {
    const media = getMedia();
    if (!media) return;
    if (isPlaying) {
      media.pause();
      setIsPlaying(false);
    } else {
      media.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: any) => {
    const media = getMedia();
    if (!media || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    media.currentTime = percent * duration;
    setProgress(percent * 100);
  };

  const format = (time: number) =>
    `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}`;

  const toggleFullscreen = useCallback(() => {
    const media = getMedia();
    if (media) {
      savedTimeRef.current = media.currentTime;
      wasPlayingRef.current = isPlaying;
      if (isPlaying) { media.pause(); setIsPlaying(false); }
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

  /* --------------------------------------------
    FINAL UI — EXACT LIKE YOUR SCREENSHOT
  -------------------------------------------- */

  return (
    <div ref={modalRef} className="fixed inset-0 z-[100]">

      {isFullscreen ? (
        /* ============================================================
           YOUTUBE-STYLE FULLSCREEN
        ============================================================ */
        <div
          className="w-full h-full bg-black relative flex items-center justify-center"
          onMouseMove={revealControls}
          onClick={revealControls}
        >

          {card.type !== 'video' && (
            <audio src={card.url} ref={audioRef} preload="metadata" />
          )}

          {card.type === 'video' ? (
            <video
              src={card.url}
              ref={videoRef}
              controls={false}
              preload="metadata"
              className="w-full h-full object-contain"
              onClick={togglePlayPause}
            />
          ) : (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-40"
                style={{ backgroundImage: `url(${card.image})` }}
              />
              <div className="absolute inset-0 bg-black/60" />
              <img
                src={card.image}
                alt={card.title}
                className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl object-cover shadow-2xl"
              />
            </>
          )}

          {card.type === 'video' && !isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
              onClick={togglePlayPause}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors shadow-2xl">
                <Icons.Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
              </div>
            </div>
          )}

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

              <div className="mb-3 sm:mb-5">
                <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">Now Playing</span>
                <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mt-1 drop-shadow-lg">
                  {card.title}
                </h2>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-7">
                <span className="text-white/70 text-xs sm:text-sm font-mono tabular-nums w-10 text-right flex-shrink-0">
                  {format(currentTime)}
                </span>
                <div
                  className="flex-1 h-1 sm:h-1.5 bg-white/30 rounded-full cursor-pointer relative group/bar"
                  onClick={handleSeek}
                >
                  <div className="h-full bg-white rounded-full relative" style={{ width: `${progress}%` }}>
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/bar:scale-100 transition-transform" />
                  </div>
                </div>
                <span className="text-white/70 text-xs sm:text-sm font-mono tabular-nums w-10 flex-shrink-0">
                  {duration ? format(duration) : card.duration}
                </span>
              </div>

              <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-14">
                <button className="p-2 text-white/70 hover:text-white transition-colors">
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
                <button className="p-2 text-white/70 hover:text-white transition-colors">
                  <Icons.SkipForward className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* ============================================================
           NORMAL MODAL
        ============================================================ */
        <div className="w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6">

          {card.type !== 'video' && (
            <audio src={card.url} ref={audioRef} preload="metadata" />
          )}

          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[16px] sm:rounded-[20px] md:rounded-[2.5rem] shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10">

            <div className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 z-10">
              <button
                onClick={onClose}
                className="bg-white shadow-md hover:bg-gray-100 p-1.5 sm:p-2 rounded-full"
              >
                <Icons.X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              </button>
            </div>

            <div className="w-full rounded-[12px] sm:rounded-[16px] md:rounded-[2rem] overflow-hidden shadow-lg relative">
              {card.type === 'video' ? (
                <>
                  <video
                    src={card.url}
                    ref={videoRef}
                    controls={false}
                    preload="metadata"
                    className="w-full h-[180px] sm:h-[240px] md:h-[320px] lg:h-[360px] object-cover rounded-[12px] sm:rounded-[16px] md:rounded-[2rem]"
                    onClick={togglePlayPause}
                  />
                  {!isPlaying && (
                    <div
                      className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer rounded-[12px] sm:rounded-[16px] md:rounded-[2rem]"
                      onClick={togglePlayPause}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                        <Icons.Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600 ml-1" />
                      </div>
                    </div>
                  )}
                  {/* Fullscreen button — bottom-right of video */}
                  <button
                    onClick={toggleFullscreen}
                    className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/50 hover:bg-black/80 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-colors z-10"
                    title="Enter fullscreen"
                  >
                    <Icons.Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                </>
              ) : (
                <>
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-[180px] sm:h-[240px] md:h-[320px] lg:h-[360px] object-cover rounded-[12px] sm:rounded-[16px] md:rounded-[2rem]"
                  />
                  {/* Fullscreen button — bottom-right of image */}
                  <button
                    onClick={toggleFullscreen}
                    className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/50 hover:bg-black/80 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-colors z-10"
                    title="Enter fullscreen"
                  >
                    <Icons.Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 sm:mt-6">
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
                Now Playing
              </span>
            </div>

            <div className="mt-2 sm:mt-3">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{card.title}</h2>
              <p className="text-gray-500 mt-1 text-xs sm:text-sm">
                {card.type === 'video' ? 'Video meditation' : 'Perfect for your first meditation experience'}
              </p>
            </div>

            <div className="mt-4 sm:mt-6 flex justify-between text-xs font-semibold text-gray-500">
              <span>{format(currentTime)}</span>
              <span>{duration ? format(duration) : card.duration}</span>
            </div>

            <div className="w-full bg-gray-200 h-1.5 sm:h-2 rounded-full mt-1.5 sm:mt-2 cursor-pointer" onClick={handleSeek}>
              <div className="bg-blue-500 h-full rounded-full relative" style={{ width: `${progress}%` }}>
                <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
              </div>
            </div>

            <div className="mt-6 sm:mt-8 flex items-center justify-center gap-6 sm:gap-8 md:gap-10">
              <button className="p-3 sm:p-4 rounded-full hover:bg-gray-100 text-gray-500">
                <Icons.SkipBack className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </button>
              <button
                onClick={togglePlayPause}
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition"
              >
                {isPlaying ? (
                  <Icons.Pause className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                ) : (
                  <Icons.Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white ml-1" />
                )}
              </button>
              <button className="p-3 sm:p-4 rounded-full hover:bg-gray-100 text-gray-500">
                <Icons.SkipForward className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

