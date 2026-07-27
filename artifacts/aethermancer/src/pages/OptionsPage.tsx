import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { sounds } from '../lib/sounds';
import { getSettings, saveSettings, Settings } from '../store/settings';
import { useAccount } from '../context/AccountContext';

export default function OptionsPage() {
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState<Settings>(getSettings());
  const { account } = useAccount();

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleBack = () => {
    sounds.play('uiClick');
    setLocation('/');
  };

  const toggle = (key: keyof Settings) => {
    sounds.play('uiClick');
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(s => ({ ...s, masterVolume: parseInt(e.target.value) }));
  };

  const onSliderUp = () => {
    sounds.play('uiClick');
  };

  // ── Admin secret code: press Q three times on desktop ──────────────────────
  const qPressCount = useRef(0);
  const qResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key.toLowerCase() !== 'q') return;
    qPressCount.current += 1;
    if (qResetTimer.current) clearTimeout(qResetTimer.current);
    qResetTimer.current = setTimeout(() => { qPressCount.current = 0; }, 1500);
    if (qPressCount.current >= 3) {
      qPressCount.current = 0;
      if (account?.isAdmin) {
        sounds.play('uiClick');
        setLocation('/admin');
      }
    }
  }, [account, setLocation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (qResetTimer.current) clearTimeout(qResetTimer.current);
    };
  }, [handleKeyDown]);

  // ── Admin secret: tap music slider 3× quickly on mobile ───────────────────
  const sliderTapCount = useRef(0);
  const sliderTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderTap = () => {
    sliderTapCount.current += 1;
    if (sliderTapTimer.current) clearTimeout(sliderTapTimer.current);
    sliderTapTimer.current = setTimeout(() => { sliderTapCount.current = 0; }, 1200);
    if (sliderTapCount.current >= 3) {
      sliderTapCount.current = 0;
      if (account?.isAdmin) {
        sounds.play('uiClick');
        setLocation('/admin');
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-12 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-display text-primary">OPTIONS</h1>
          </div>
          <button 
            onClick={() => { sounds.play('uiClick'); setLocation('/achievements'); }}
            className="px-4 py-2 bg-secondary border border-border text-foreground hover:border-primary/50 transition-colors font-bold flex items-center gap-2"
          >
            ACHIEVEMENTS
          </button>
        </header>

        <div className="bg-card border border-border p-8 flex flex-col gap-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Music</h3>
              <p className="text-sm text-muted-foreground">Placeholder for future music</p>
            </div>
            <button 
              onClick={() => toggle('music')}
              className={`w-16 h-8 flex items-center p-1 border transition-colors ${settings.music ? 'bg-primary border-primary justify-end' : 'bg-secondary border-border justify-start'}`}
            >
              <div className="w-6 h-6 bg-white shadow-sm" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">UI Sounds</h3>
              <p className="text-sm text-muted-foreground">Button clicks and menu navigation</p>
            </div>
            <button 
              onClick={() => toggle('uiSounds')}
              className={`w-16 h-8 flex items-center p-1 border transition-colors ${settings.uiSounds ? 'bg-primary border-primary justify-end' : 'bg-secondary border-border justify-start'}`}
            >
              <div className="w-6 h-6 bg-white shadow-sm" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Card Sounds</h3>
              <p className="text-sm text-muted-foreground">Card hovers, plays, and draws</p>
            </div>
            <button 
              onClick={() => toggle('cardSounds')}
              className={`w-16 h-8 flex items-center p-1 border transition-colors ${settings.cardSounds ? 'bg-primary border-primary justify-end' : 'bg-secondary border-border justify-start'}`}
            >
              <div className="w-6 h-6 bg-white shadow-sm" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Gold Sounds</h3>
              <p className="text-sm text-muted-foreground">Coins and shop purchases</p>
            </div>
            <button 
              onClick={() => toggle('goldSounds')}
              className={`w-16 h-8 flex items-center p-1 border transition-colors ${settings.goldSounds ? 'bg-primary border-primary justify-end' : 'bg-secondary border-border justify-start'}`}
            >
              <div className="w-6 h-6 bg-white shadow-sm" />
            </button>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-8 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Master Volume</h3>
              <span className="text-primary font-bold">{settings.masterVolume}%</span>
            </div>
            {/* onMouseDown + onTouchStart for slider triple-tap admin code */}
            <input 
              type="range" 
              min="0" max="100" 
              value={settings.masterVolume}
              onChange={handleSlider}
              onMouseUp={onSliderUp}
              onTouchEnd={onSliderUp}
              onMouseDown={handleSliderTap}
              onTouchStart={handleSliderTap}
              className="w-full h-2 bg-secondary appearance-none outline-none border border-border"
            />
          </div>

        </div>
        
        <p className="text-center text-muted-foreground text-sm mt-8">
          Music coming soon. UI and card sounds are active.
          {account?.isAdmin && (
            <span className="block text-purple-400/50 text-xs mt-1">Admin mode active</span>
          )}
        </p>
      </div>
    </div>
  );
}
