"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BirthdaySurprise() {
  const { user } = useAuth();
  const [showSurprise, setShowSurprise] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!user || !user.dob) return;

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentMMDD = `${month}-${day}`;

    if (user.dob.endsWith(currentMMDD)) {
      const cacheKey = `birthday_wished_${today.getFullYear()}_${currentMMDD}`;
      if (!localStorage.getItem(cacheKey)) {
        setShowSurprise(true);
      }
    }
  }, [user]);

  const handleOpen = () => {
    setOpened(true);
    
    // Play sound
    const audio = new Audio("https://actions.google.com/sounds/v1/crowds/crowd_cheer.ogg");
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play blocked", e));

    // Fire confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#1e3a8a', '#ffffff', '#f59e0b']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#1e3a8a', '#ffffff', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleClose = () => {
    setShowSurprise(false);
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentMMDD = `${month}-${day}`;
    localStorage.setItem(`birthday_wished_${today.getFullYear()}_${currentMMDD}`, "true");
  };

  if (!showSurprise) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        {!opened ? (
          <motion.div 
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, -5, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="cursor-pointer"
              onClick={handleOpen}
            >
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)] border-4 border-white/20">
                <Gift className="w-16 h-16 text-white" />
              </div>
            </motion.div>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">You have a surprise!</h2>
              <p className="text-white/80">Tap the gift box to open it</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-center shadow-2xl border border-primary/30 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
            
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative z-10 flex flex-col items-center">
              <PartyPopper className="w-16 h-16 text-yellow-400 mb-6" />
              
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>
                Happy Birthday!
              </h1>
              
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/50 mx-auto mb-4 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-3xl font-bold text-white">
                    {user?.name?.charAt(0)}
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{user?.name}</h2>
              
              <p className="text-lg text-blue-100/80 leading-relaxed mb-8">
                Wishing you a fantastic day filled with joy, success, and unforgettable memories. Thank you for being a part of the ICT Network!
              </p>
              
              <Button 
                onClick={handleClose}
                className="bg-white text-slate-900 hover:bg-white/90 font-bold px-8 py-6 rounded-xl text-lg w-full"
              >
                Thank You! 💙
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
