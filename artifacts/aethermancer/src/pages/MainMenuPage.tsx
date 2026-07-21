import { useLocation } from 'wouter';
import { sounds } from '../lib/sounds';

export default function MainMenuPage() {
  const [, setLocation] = useLocation();

  const handlePlayClick = () => {
    sounds.play('uiClick');
    setLocation('/lobby');
  };

  const handleOptionsClick = () => {
    sounds.play('uiClick');
    setLocation('/options');
  };

  const handleQuit = () => {
    sounds.play('uiClick');
    alert("Goodbye, Aethermancer.");
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-kodi-gradient overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] pointer-events-none opacity-40"></div>
      
      <div className="z-10 flex flex-col items-center max-w-sm w-full px-6">
        <h1 className="text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-primary drop-shadow-[0_0_15px_rgba(30,144,255,0.8)] mb-2 text-center tracking-wider">
          AETHERMANCER
        </h1>
        <p className="text-muted-foreground text-lg mb-12 tracking-widest text-center">
          A Game of Arcane Mastery
        </p>
        
        <div className="w-full flex flex-col gap-2">
          <button 
            data-testid="btn-single-player"
            onClick={handlePlayClick}
            className="w-full py-4 px-6 bg-primary/90 hover:bg-primary text-primary-foreground font-semibold text-lg transition-colors border border-primary/50 hover:border-white shadow-[0_0_10px_rgba(30,144,255,0.3)] hover:shadow-[0_0_20px_rgba(30,144,255,0.6)]"
          >
            SINGLE PLAYER
          </button>
          
          <div className="relative group w-full">
            <button 
              disabled
              className="w-full py-4 px-6 bg-secondary/60 text-secondary-foreground/50 font-semibold text-lg cursor-not-allowed border border-border/50"
            >
              MULTIPLAYER
            </button>
            <div className="absolute top-0 left-full ml-4 top-1/2 -translate-y-1/2 hidden group-hover:block w-48 bg-card border border-border p-2 text-sm shadow-xl z-20">
              Not Available Yet
            </div>
          </div>
          
          <button 
            onClick={handleOptionsClick}
            className="w-full py-4 px-6 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-lg transition-colors border border-border hover:border-primary/50"
          >
            OPTIONS
          </button>
          
          <button 
            onClick={handleQuit}
            className="w-full py-4 px-6 bg-card hover:bg-destructive/80 text-muted-foreground hover:text-destructive-foreground font-semibold text-lg transition-colors border border-border"
          >
            QUIT
          </button>
        </div>
        
        <p className="text-muted-foreground/50 text-xs mt-12">
          v0.1.0 Alpha
        </p>
      </div>
    </div>
  );
}
