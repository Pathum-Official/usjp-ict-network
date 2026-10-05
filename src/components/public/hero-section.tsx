"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Atom, Calculator, ChevronLeft, ChevronRight } from "lucide-react";

export function HeroSection() {
  const [slides, setSlides] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const q = query(collection(db, "hero_slides"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          setSlides(list);
        } else {
          // Fallback slide
          setSlides([{
            id: 'default',
            title: 'The Next Generation of <br class="hidden md:block" /><span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ICT Scholars</span>',
            subtitle: 'Physics, Mathematics, and Technology. United in excellence. Access your cohort portal, collaborate with peers, and unlock your academic potential.',
            imageUrl: '' // default grid
          }]);
        }
      } catch (error) {
        console.error("Failed to load hero slides:", error);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[currentIndex];

  if (!currentSlide) return null; // loading state essentially

  return (
    <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40 min-h-[90vh] flex items-center">
      {/* Background Image / Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id + '-bg'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          {currentSlide.imageUrl ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-background bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold mb-8 bg-secondary/10 text-secondary border-secondary/20"
          >
            <span className="flex h-2 w-2 rounded-full bg-secondary mr-2 animate-pulse" />
            University of Sri Jayewardenepura
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id + '-content'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <h1 
                className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 text-foreground drop-shadow-sm"
                dangerouslySetInnerHTML={{ __html: currentSlide.title }}
              />

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 font-medium">
                {currentSlide.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/login" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary/25 group" })}>
              Access Portal
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/about" className={buttonVariants({ size: "lg", variant: "outline", className: "w-full sm:w-auto h-12 px-8 text-base" })}>
              Discover ICT
            </Link>
          </motion.div>
          {slides.length > 1 && (
            <div className="flex gap-2 mt-12 mb-4 items-center justify-center">
              {slides.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/40'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating Icons */}
        <div className="absolute top-1/4 left-10 md:left-1/4 opacity-20 -z-10 animate-bounce" style={{ animationDuration: '4s' }}>
          <Atom size={64} className="text-primary" />
        </div>
        <div className="absolute bottom-1/4 right-10 md:right-1/4 opacity-20 -z-10 animate-bounce" style={{ animationDuration: '5s' }}>
          <Calculator size={48} className="text-secondary" />
        </div>
        <div className="absolute top-1/2 right-12 md:right-1/3 opacity-10 -z-10 animate-bounce" style={{ animationDuration: '3.5s' }}>
          <GraduationCap size={56} className="text-primary" />
        </div>
      </div>
    </section>
  );
}
