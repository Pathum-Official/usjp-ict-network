import { useRef, useState } from "react";
import { User, Cohort } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Gift, Copy, Download, MessageCircle, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as htmlToImage from "html-to-image";
import { toast } from "sonner";

export function BirthdayModal({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: { user: User, cohort: Cohort } }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const getOrdinalNum = (n: number) => {
    return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
  };
  
  const today = new Date();
  const dateString = `${getOrdinalNum(today.getDate())} of ${today.toLocaleString('default', { month: 'long' })}`;
  
  const cohortDisplayName = (data.cohort?.name || "ICT Network").replace(/PMT/g, 'ICT');

  const birthdayText = `🎉 Happy Birthday, ${data.user.name}! 🎂\n\nWishing you a fantastic day filled with joy and unforgettable memories. On behalf of the ${cohortDisplayName}, Faculty of Applied Sciences, we wish you great success, happiness, and new adventures in the year ahead!\n\nHave an amazing birthday! ✨\nWarm wishes from ${cohortDisplayName} 💙`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#1e293b'
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Birthday_${data.user.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Image downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(birthdayText);
    toast.success("Birthday wish copied to clipboard!");
  };

  const formatPhoneForWhatsApp = (phone?: string) => {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '94' + cleaned.substring(1);
    }
    return cleaned;
  };
  
  const waPhone = formatPhoneForWhatsApp(data.user.whatsapp || data.user.phone);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-w-4xl p-0 overflow-hidden bg-background border-none shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Birthday Wish for {data.user.name}</DialogTitle>
        <DialogDescription className="sr-only">Generate and download a birthday post, copy the wish text, and send via WhatsApp.</DialogDescription>
        
        {/* Left Side: The Image to Generate */}
        <div 
          className="w-full md:w-1/2 bg-[#0f172a] relative min-h-[350px] sm:min-h-[400px] md:min-h-[500px] overflow-hidden flex items-center justify-center"
          style={{ containerType: 'size' }}
        >
          {/* We wrap the content in an absolute div with dynamic scaling based on container size to prevent layout clipping */}
          <div 
            className="absolute flex items-center justify-center w-full h-full"
            style={{ 
              transform: 'scale(min(0.95, calc(100cqw / 400), calc(100cqh / 500)))',
              transformOrigin: 'center center'
            }}
          >
            <div 
              ref={cardRef} 
              className="relative flex flex-col items-center shrink-0"
              style={{ 
                width: '400px',
                height: '500px',
                backgroundColor: '#0a1128',
                backgroundImage: 'radial-gradient(circle at 50% 20%, #172a5a 0%, #0a1128 80%)',
                fontFamily: '"Inter", system-ui, sans-serif',
                boxSizing: 'border-box',
                padding: '20px 16px',
                overflow: 'hidden'
              }}
            >
              {/* Professional subtle tech background pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} />
              
              {/* Tech connecting lines in background */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 500" fill="none" stroke="#38bdf8" strokeWidth="1">
                <path d="M-50 100 Q100 150 450 50" />
                <path d="M-50 350 Q200 250 450 400" />
                <circle cx="150" cy="130" r="3" fill="#38bdf8"/>
                <circle cx="280" cy="300" r="3" fill="#38bdf8"/>
                <circle cx="80" cy="300" r="2" fill="#38bdf8"/>
                <circle cx="350" cy="100" r="2" fill="#38bdf8"/>
              </svg>
              
              {/* Balloons (Top Left) */}
              <svg className="absolute -top-2 -left-2 w-28 h-36 opacity-70" viewBox="0 0 80 100" fill="none" stroke="#ffffff" strokeWidth="1.5">
                <ellipse cx="30" cy="30" rx="18" ry="22"/>
                <ellipse cx="55" cy="40" rx="14" ry="18"/>
                <path d="M28 52 Q20 70 25 90" />
                <path d="M53 58 Q65 75 55 90" />
                <path d="M25 52 L35 52 L30 57 Z" fill="#ffffff"/>
                <path d="M50 58 L58 58 L54 62 Z" fill="#ffffff"/>
              </svg>
              
              {/* Bunting / Flags (Top Right) */}
              <svg className="absolute -top-2 -right-2 w-32 h-20 opacity-70" viewBox="0 0 100 60" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M0 10 Q50 30 100 5" />
                <path d="M12 14 L20 35 L28 17" />
                <path d="M38 21 L45 42 L52 24" />
                <path d="M62 25 L70 45 L78 23" />
                <path d="M88 15 L95 35 L100 10" />
              </svg>
              
              {/* Party Popper (Bottom Left) */}
              <svg className="absolute bottom-16 left-2 w-24 h-24 opacity-60" viewBox="0 0 60 60" fill="none" stroke="#ffffff" strokeWidth="1.5">
                <path d="M10 50 L25 35 M5 45 L20 30 M15 55 L30 40" />
                <circle cx="45" cy="15" r="1.5" fill="#ffffff"/>
                <circle cx="50" cy="25" r="1.5" fill="#ffffff"/>
                <circle cx="35" cy="10" r="1.5" fill="#ffffff"/>
                <circle cx="25" cy="20" r="1" fill="#ffffff"/>
                <circle cx="40" cy="30" r="1" fill="#ffffff"/>
                <path d="M40 20 L45 25 M30 15 L35 10 M50 35 L55 30" />
              </svg>
              
              <div className="z-10 text-center w-full flex flex-col items-center h-full justify-between">
                {/* Top Header */}
                <div className="flex flex-col items-center mt-4">
                  <span className="text-[#ffffff] text-[10px] font-bold tracking-[0.4em] uppercase mb-1">HAPPY</span>
                  <h2 className="text-5xl font-black text-[#ffffff]" style={{ 
                    textShadow: '3px 3px 0px rgba(148,163,184,0.7), -1px -1px 0px rgba(255,255,255,0.5)',
                    fontFamily: 'Arial Black, Impact, sans-serif',
                    letterSpacing: '1px',
                    lineHeight: '1'
                  }}>
                    Birthday
                  </h2>
                </div>
                
                {/* Tech Photo Frame */}
                <div className="relative w-[50%] aspect-[4/5] flex items-center justify-center my-3 shrink-0">
                  {/* Glowing Outer Frame */}
                  <div className="absolute inset-[-6px] border border-[#38bdf8]/60 shadow-[0_0_20px_rgba(56,189,248,0.4)]"></div>
                  <div className="absolute inset-0 border-[3px] border-[#38bdf8]"></div>
                  
                  {/* Techy Corners */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-[#38bdf8] bg-[#0a1128]"></div>
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-[#38bdf8] bg-[#0a1128]"></div>
                  
                  {/* Slanted lines accent */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-2" style={{ background: 'repeating-linear-gradient(45deg, #38bdf8, #38bdf8 2px, transparent 2px, transparent 5px)' }}></div>
                  
                  {/* Photo itself */}
                  <div className="w-[96%] h-[96%] bg-[#1e293b] overflow-hidden z-10">
                    {data.user.photoURL ? (
                      <img src={data.user.photoURL} alt={data.user.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#94a3b8] text-5xl font-bold bg-[#0f172a]">
                        {data.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Name and Date */}
                <div className="flex flex-col items-center justify-center mb-4 z-10 w-full px-4">
                  <h3 className="text-[26px] font-black text-[#ffffff] uppercase tracking-wider text-center w-full leading-tight" style={{ 
                    fontFamily: '"Comic Sans MS", "Marker Felt", Impact, sans-serif',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}>
                    {data.user.name}
                  </h3>
                  <p className="text-[#ffffff] font-bold tracking-widest text-[10px] uppercase mt-1 drop-shadow-md">
                    {dateString}
                  </p>
                </div>
                
                {/* Footer banner */}
                <div className="w-full flex justify-center mt-auto z-10 mb-2">
                  <div className="bg-[#291c14] text-[#ffffff] py-2 px-4 rounded-xl flex items-center justify-center gap-3 w-[85%] max-w-[340px] border border-[#ca8a04]/30" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                    {/* Mock USJP Logo */}
                    <div className="w-8 h-8 rounded-full bg-[#eab308] flex items-center justify-center border-2 border-[#ca8a04] shrink-0 relative overflow-hidden">
                      <div className="absolute inset-[2px] border border-[#ca8a04] rounded-full"></div>
                      <div className="absolute inset-[4px] border border-[#ca8a04] rounded-full bg-[#ca8a04]"></div>
                      <span className="text-[5px] font-bold text-[#713f12] z-10">USJP</span>
                    </div>
                    <div className="flex flex-col min-w-0 justify-center">
                      <span className="text-[9px] font-bold tracking-[0.1em] whitespace-nowrap leading-tight">FACULTY OF APPLIED SCIENCE</span>
                      <span className="text-[8px] text-[#ffffff] font-medium tracking-[0.1em] uppercase whitespace-nowrap leading-tight mt-0.5">PHYSICAL SCIENCE - {cohortDisplayName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Actions & Text */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between bg-card text-card-foreground">
          <div>
            <h3 className="text-2xl font-bold mb-4">Send a Wish!</h3>
            <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-medium border relative group">
              {birthdayText}
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                onClick={handleCopy}
                title="Copy Text"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Button onClick={handleCopy} variant="outline" className="w-full justify-start">
              <Copy className="w-4 h-4 mr-2" />
              Copy Wish Text
            </Button>
            
            <Button onClick={handleDownload} disabled={downloading} className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "Generating..." : "Download Post Image"}
            </Button>
            
            {waPhone ? (
              <Button 
                onClick={() => window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(birthdayText)}`, '_blank')} 
                className="w-full justify-start bg-green-500 hover:bg-green-600 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Wish via WhatsApp
              </Button>
            ) : (
              <Button disabled variant="outline" className="w-full justify-start text-muted-foreground">
                <MessageCircle className="w-4 h-4 mr-2" />
                No WhatsApp Number
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
