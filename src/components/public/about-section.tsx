"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Cpu } from "lucide-react";

const features = [
  {
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    title: "Academic Excellence",
    description: "Rigorous curriculum blending core sciences with practical mathematics."
  },
  {
    icon: <Cpu className="h-6 w-6 text-secondary" />,
    title: "Technological Innovation",
    description: "Hands-on experience with modern tools, programming, and electronics."
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Strong Community",
    description: "A tight-knit family of scholars supporting each other through peer mentoring."
  }
];

export function AboutSection() {
  return (
    <section className="py-24 bg-muted/30" id="about">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About the <span className="text-primary">ICT Network</span></h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              The Information and Communication Technology (ICT) combination at the University of Sri Jayewardenepura is designed to produce analytical thinkers and innovative problem solvers.
            </p>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Our community goes beyond the classroom. The ICT Network is a vibrant network of students, alumni, and faculty dedicated to fostering academic growth, professional development, and lifelong friendships.
            </p>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold text-foreground">500+</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Students</span>
              </div>
              <div className="w-px h-12 bg-border mx-4" />
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold text-foreground">15+</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Batches</span>
              </div>
            </div>
          </motion.div>
          
          <div className="grid gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-background/60 backdrop-blur border-primary/10 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-muted">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
