import { useLocation } from 'wouter';
import { sounds } from '../lib/sounds';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export default function AchievementsPage() {
  const [, setLocation] = useLocation();
  const { achievements } = useGame();

  const handleBack = () => {
    sounds.play('uiClick');
    setLocation('/options');
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-6 md:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-12 border-b border-border pb-4">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-display text-primary drop-shadow-[0_0_5px_rgba(30,144,255,0.5)]">
            ACHIEVEMENTS
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map(a => {
            const IconComponent = (LucideIcons as any)[a.icon.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')] || LucideIcons.Star;
            
            return (
              <div 
                key={a.id} 
                className={`p-4 border flex gap-4 items-center transition-colors ${
                  a.unlocked 
                    ? 'bg-card border-gold shadow-[0_0_10px_rgba(245,197,24,0.2)]' 
                    : 'bg-secondary/30 border-border/50 opacity-60'
                }`}
              >
                <div className={`w-12 h-12 flex items-center justify-center border ${a.unlocked ? 'bg-amber-900/30 border-gold text-gold' : 'bg-background border-border text-muted-foreground'}`}>
                  {a.unlocked ? <IconComponent size={24} /> : <Lock size={20} />}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-bold text-lg leading-tight ${a.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {a.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  
                  {a.target && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-background overflow-hidden border border-border">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ width: `${Math.min(100, ((a.progress || 0) / a.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground min-w-[3ch] text-right">
                        {Math.min(a.progress || 0, a.target)}/{a.target}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
