import { useLocation } from 'wouter';
import { sounds } from '../lib/sounds';
import { useLobby } from '../context/LobbyContext';
import { useGame } from '../context/GameContext';
import { ArrowLeft, User, UserPlus, X } from 'lucide-react';

export default function LobbyPage() {
  const [, setLocation] = useLocation();
  const { 
    roomName, setRoomName, 
    difficulty, setDifficulty, 
    maxAether, setMaxAether,
    animatedBattlefield, setAnimatedBattlefield,
    aiPlayers, addAi, removeAi,
    generatePlayers
  } = useLobby();
  const { dispatch } = useGame();

  const handleBack = () => {
    sounds.play('uiClick');
    setLocation('/');
  };

  const handleStart = () => {
    sounds.play('uiClick');
    const players = generatePlayers();
    dispatch({ type: 'START_GAME', payload: { players } });
    setLocation('/game');
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-6 md:p-12 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-display text-primary drop-shadow-[0_0_5px_rgba(30,144,255,0.5)]">
              SINGLE PLAYER LOBBY
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Settings Column */}
          <div className="bg-card border border-border p-6 flex flex-col gap-6">
            <h2 className="text-xl font-display text-muted-foreground border-b border-border/50 pb-2">Game Settings</h2>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground">Room Name</label>
              <input 
                type="text" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-input border border-border p-3 outline-none focus:border-primary transition-colors text-foreground"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground">Difficulty</label>
              <div className="flex gap-2">
                {['Easy', 'Normal', 'Hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => { sounds.play('uiClick'); setDifficulty(d); }}
                    className={`flex-1 py-2 border ${difficulty === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground">Animated Battlefield</label>
              <div className="flex gap-2">
                {['OFF', 'ON'].map(v => (
                  <button
                    key={v}
                    onClick={() => { sounds.play('uiClick'); setAnimatedBattlefield(v === 'ON'); }}
                    className={`flex-1 py-2 border ${animatedBattlefield === (v === 'ON') ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Players Column */}
          <div className="bg-card border border-border p-6 flex flex-col gap-4">
            <h2 className="text-xl font-display text-muted-foreground border-b border-border/50 pb-2">Players ({aiPlayers.length + 1}/5)</h2>
            
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between bg-primary/10 border border-primary/30 p-3">
                <div className="flex items-center gap-3">
                  <User className="text-primary" />
                  <span className="font-semibold">YOU</span>
                </div>
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 font-bold">P1</span>
              </div>
              
              {aiPlayers.map(ai => (
                <div key={ai.id} className="flex items-center justify-between bg-secondary/50 border border-border p-3">
                  <div className="flex items-center gap-3">
                    <User className="text-muted-foreground" />
                    <span className="text-secondary-foreground">{ai.name}</span>
                  </div>
                  <button 
                    onClick={() => { sounds.play('uiClick'); removeAi(ai.id); }}
                    disabled={aiPlayers.length <= 2}
                    className={`p-1 ${aiPlayers.length <= 2 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-destructive/20 hover:text-destructive'}`}
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => { sounds.play('uiClick'); addAi(); }}
              disabled={aiPlayers.length >= 4}
              className={`flex items-center justify-center gap-2 w-full py-3 border ${aiPlayers.length >= 4 ? 'bg-secondary/30 text-muted-foreground border-border/30 cursor-not-allowed' : 'bg-secondary hover:bg-secondary/80 text-foreground border-border hover:border-primary/50'}`}
            >
              <UserPlus size={18} />
              ADD AI
            </button>
          </div>
        </div>

        <div className="mt-8">
          <button 
            data-testid="btn-start-game"
            onClick={handleStart}
            className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-display text-2xl font-bold tracking-widest border border-primary hover:border-white transition-all shadow-[0_0_15px_rgba(30,144,255,0.4)] hover:shadow-[0_0_25px_rgba(30,144,255,0.7)]"
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
}
