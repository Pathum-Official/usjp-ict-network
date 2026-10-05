"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
const Plyr = dynamic(() => import("plyr-react").then((mod) => mod.Plyr), { ssr: false });
import "plyr-react/plyr.css";

interface LectureVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  moduleCode?: string;
  chapters?: string;
}

export function LectureVideoModal({ isOpen, onClose, url, title, moduleCode, chapters }: LectureVideoModalProps) {
  const playerRef = React.useRef<any>(null);
  const watermarkRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    let animationFrameId: number;
    let posX = Math.random() * 50;
    let posY = Math.random() * 50;
    let velX = 0.5;
    let velY = 0.5;

    const animate = () => {
      const container = containerRef.current;
      const watermark = watermarkRef.current;
      if (container && watermark) {
        const cw = container.offsetWidth;
        const ch = container.offsetHeight;
        const ww = watermark.offsetWidth;
        const wh = watermark.offsetHeight;

        // Bounce logic
        if (posX + ww >= cw || posX <= 0) velX *= -1;
        if (posY + wh >= ch || posY <= 0) velY *= -1;

        posX += velX;
        posY += velY;

        // Ensure it doesn't get stuck outside boundaries on resize
        if (posX + ww > cw) posX = Math.max(0, cw - ww - 1);
        if (posY + wh > ch) posY = Math.max(0, ch - wh - 1);
        if (posX < 0) posX = 1;
        if (posY < 0) posY = 1;

        watermark.style.transform = `translate(${posX}px, ${posY}px)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);


  // Extract video ID from URL
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;

  const plyrSource = videoId ? {
    type: "video" as const,
    sources: [
      {
        src: videoId,
        provider: "youtube" as const,
      }
    ]
  } : null;

  const plyrOptions = {
    settings: ['speed'],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
    controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'settings', 'fullscreen'],
    youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 },
    clickToPlay: false, // handled by shield
  };

  const parsedChapters = React.useMemo(() => {
    if (!chapters) return [];
    const chaptersData = chapters.split('|');
    return chaptersData.map(chapter => {
      const parts = chapter.split('~');
      if (parts.length < 2) return null;
      const time = parts[0];
      const title = parts.slice(1).join('~');
      
      const timeParts = time.split(':').reverse();
      let seconds = 0;
      for (let i = 0; i < timeParts.length; i++) {
          seconds += parseInt(timeParts[i], 10) * Math.pow(60, i);
      }
      return { time, title, seconds };
    }).filter(Boolean) as { time: string, title: string, seconds: number }[];
  }, [chapters]);

  const handleShieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const player = playerRef.current?.plyr;
    if (!player) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width / 3) {
      player.rewind(10);
    } else if (clickX > (2 * width) / 3) {
      player.forward(10);
    } else {
      player.togglePlay();
    }
  };

  const playChapter = (seconds: number) => {
    const player = playerRef.current?.plyr;
    if (player) {
      player.currentTime = seconds;
      player.play();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!w-[95vw] !max-w-5xl p-0 overflow-hidden bg-black border-zinc-800">
        <div className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Video player for {title}</DialogDescription>
        </div>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 to-transparent z-50 flex items-center justify-between pointer-events-none">
          <div>
            {moduleCode && (
              <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-1 block">
                {moduleCode}
              </span>
            )}
            <h2 className="text-white font-medium text-lg lg:text-xl drop-shadow-md">
              {title}
            </h2>
          </div>
        </div>

        {/* Video Player & Chapters */}
        <div className={`w-full bg-black pt-16 pb-8 px-0 sm:px-8 relative flex flex-col ${parsedChapters.length > 0 ? 'lg:flex-row lg:items-start gap-6' : ''}`}>
          <div ref={containerRef} className={`relative ${parsedChapters.length > 0 ? 'w-full lg:w-[65%]' : 'w-full'} [&_.plyr-react]:w-full [&_.plyr]:w-full overflow-hidden`}>
            {plyrSource ? (
              <>
                <div 
                  className="absolute inset-0 bottom-[60px] z-10 cursor-pointer"
                  onClick={handleShieldClick}
                />
                <div 
                  ref={watermarkRef}
                  className="absolute top-0 left-0 z-20 text-white/40 font-semibold px-2 py-1 bg-black/30 rounded pointer-events-none transition-opacity duration-300 select-none text-xs sm:text-sm drop-shadow-md"
                  style={{ willChange: 'transform' }}
                >
                  ICT Network
                </div>
                <Plyr 
                  ref={playerRef}
                  source={plyrSource} 
                  options={plyrOptions as any} 
                />
              </>
            ) : (
              <div className="text-white text-center p-8">
                <p>Invalid Video URL</p>
              </div>
            )}
          </div>
          
          {/* Chapters Section */}
          {parsedChapters.length > 0 && (
            <div className="w-full lg:w-[35%] flex flex-col bg-zinc-900/40 rounded-xl border border-zinc-800/60 max-h-[400px] lg:max-h-[500px] mt-4 lg:mt-0">
              <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/50 rounded-t-xl shrink-0">
                <h3 className="text-zinc-100 font-semibold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                  පාඩමේ අන්තර්ගතය (Chapters)
                </h3>
              </div>
              <div className="p-3 overflow-y-auto space-y-2 flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {parsedChapters.map((ch, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => playChapter(ch.seconds)}
                    className="flex items-center gap-3 p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-primary/50 rounded-lg cursor-pointer transition-colors group"
                  >
                    <span className="bg-primary/20 text-primary px-2 py-1 text-xs font-bold rounded-md min-w-[50px] text-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {ch.time}
                    </span>
                    <span className="text-zinc-300 text-sm font-medium group-hover:text-white transition-colors flex-1 line-clamp-2">
                      {ch.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
