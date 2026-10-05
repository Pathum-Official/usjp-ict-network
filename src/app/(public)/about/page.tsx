"use client";

import { motion } from "framer-motion";
import { BookOpen, Users, Lightbulb, Target } from "lucide-react";

export default function AboutPage() {
  const fadeInUp: any = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const stagger: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-primary/5 to-background pointer-events-none" />
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 py-24 relative z-10">
        <motion.div 
          initial="hidden" 
          animate="show" 
          variants={stagger}
          className="space-y-24"
        >
          {/* Header Section */}
          <motion.section variants={fadeInUp} className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              About the <br />
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                ICT Network
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We are a dynamic community of students at the University of Sri Jayewardenepura, united by our passion for Physics, Mathematics, and Technology.
            </p>
          </motion.section>

          {/* Mission & Vision */}
          <motion.section variants={fadeInUp} className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-card border shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-150 duration-500" />
              <Target className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To foster academic excellence, encourage innovative thinking, and build a supportive network that empowers every student to reach their full potential in the fields of science and technology.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-card border shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-150 duration-500" />
              <Lightbulb className="w-12 h-12 text-indigo-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To be the leading student community that bridges the gap between theoretical knowledge and practical application, creating the next generation of innovators and leaders.
              </p>
            </div>
          </motion.section>

          {/* Core Values */}
          <motion.section variants={fadeInUp} className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Our Core Values</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: BookOpen, title: "Academic Excellence", desc: "We strive for the highest standards in our studies and support each other through peer learning." },
                { icon: Users, title: "Community & Unity", desc: "A family that stands together. We believe in the power of collaboration and mutual respect." },
                { icon: Lightbulb, title: "Innovation", desc: "Embracing new technologies and creative problem-solving to tackle modern challenges." }
              ].map((value, idx) => (
                <div key={idx} className="flex flex-col items-center p-6 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
                  <div className="p-4 bg-background rounded-full mb-6 shadow-sm border">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold mb-3">{value.title}</h4>
                  <p className="text-muted-foreground">{value.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
