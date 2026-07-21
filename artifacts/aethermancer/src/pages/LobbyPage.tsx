import { useLocation } from 'wouter';
import { sounds } from '../lib/sounds';
import { useLobby, Difficulty, DIFFICULTY_CFG } from '../context/LobbyContext';
import { useGame } from '../context/GameContext';
import { ArrowLeft, User, UserPlus, X, Swords, ScrollText } from 'lucide-react';

const DIFFICULTIES: Difficulty[] = ['Novice', 'Easy', 'Normal', 'Hard', 'Expert', 'Nightmare'];

const DIFF_COLOR: Record<Difficulty, string> = {
  Novice: 'bg-sky-700 border-sky-500',
  Easy: 'bg-green-800 border-green-500',
  Normal: 'bg-primary border-primary',
  Hard: 'bg-orange-700 border-orange-500',
  Expert: 'bg-red-700 border-red-500',
  Nightmare: 'bg-purple-900 border-purple-500',
};

export default function LobbyPage() {
  const [, setLocation] = useLocation();
  const {
    difficulty, setDifficulty,
    animatedBattlefield, setAnimatedBattlefield,
    aiPlayers, addAi, removeAi,
    generatePlayers,
    gameMode, setGameMode,
    getDifficultyConfig,
  } = useLobby();
  const { dispatch } = useGame();

  const handleStart = () => {
    sounds.play('uiClick');
    const players = generatePlayers({ gameMode, matchType: 'singleplayer', ranked: false });
    dispatch({ type: 'START_GAME', payload: { players, gameMode, matchType: 'singleplayer', ranked: false, difficulty } });
    // Draft mode: show pre-game card selection screen first
    setLocation(gameMode === 'draft' ? '/pre-draft' : '/game');
  };

  const cfg = getDifficultyConfig(difficulty);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8 pb-4 border-b border-border">
          <button onClick={() => { sounds.play('uiClick'); setLocation('/'); }} className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-3xl font-display text-primary drop-shadow-[0_0_5px_rgba(30,144,255,0.5)]">
            SINGLE PLAYER
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Settings */}
          <div className="flex flex-col gap-5">

            {/* Game Mode */}
            <div className="bg-card border border-border p-5 flex flex-col gap-4">
              <h2 className="text-base font-display text-muted-foreground border-b border-border/50 pb-2">Game Mode</h2>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { sounds.play('uiClick'); setGameMode('8card'); }}
                  className={`flex items-start gap-3 p-3 border text-left transition-colors ${gameMode === '8card' ? 'bg-primary/10 border-primary/60 text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}
                >
                  <Swords size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">8 Card Draw</div>
                    <div className="text-xs opacity-70 mt-0.5">Start with 8 cards drawn from the pool. Draw 1 card each turn.</div>
                  </div>
                </button>
                <button
                  onClick={() => { sounds.play('uiClick'); setGameMode('draft'); }}
                  className={`flex items-start gap-3 p-3 border text-left transition-colors ${gameMode === 'draft' ? 'bg-primary/10 border-primary/60 text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}
                >
                  <ScrollText size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">3 Card Draft</div>
                    <div className="text-xs opacity-70 mt-0.5">Each draw phase, choose 1 of 3 cards offered. Build your deck as you play.</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Difficulty */}
            <div className="bg-card border border-border p-5 flex flex-col gap-3">
              <h2 className="text-base font-display text-muted-foreground border-b border-border/50 pb-2">Difficulty</h2>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => { sounds.play('uiClick'); setDifficulty(d); }}
                    className={`py-2 px-1 border text-xs font-semibold transition-colors ${difficulty === d ? `${DIFF_COLOR[d]} text-white` : 'bg-secondary border-border text-muted-foreground hover:border-primary/40'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs italic text-muted-foreground mt-1">{cfg.label}</p>
              <div className="flex gap-4 text-xs text-muted-foreground/70 mt-1">
                <span>Enemy HP: <strong className="text-muted-foreground">{cfg.hp}</strong></span>
                {cfg.aetherBonus > 0 && <span>Aether Bonus: <strong className="text-amber-400">+{cfg.aetherBonus}</strong></span>}
              </div>
            </div>

            {/* Visual */}
            <div className="bg-card border border-border p-5 flex flex-col gap-3">
              <h2 className="text-base font-display text-muted-foreground border-b border-border/50 pb-2">Visual</h2>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Animated Battlefield</span>
                <div className="flex gap-2">
                  {(['OFF', 'ON'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => { sounds.play('uiClick'); setAnimatedBattlefield(v === 'ON'); }}
                      className={`px-4 py-1.5 border text-sm font-semibold transition-colors ${animatedBattlefield === (v === 'ON') ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Players */}
          <div className="bg-card border border-border p-5 flex flex-col gap-4">
            <h2 className="text-base font-display text-muted-foreground border-b border-border/50 pb-2">
              Opponents ({aiPlayers.length}/4)
            </h2>

            <div className="flex flex-col gap-3 flex-1">
              {/* Human */}
              <div className="flex items-center justify-between bg-primary/10 border border-primary/30 p-3">
                <div className="flex items-center gap-3">
                  <User className="text-primary" size={18} />
                  <div>
                    <div className="font-semibold text-sm">YOU</div>
                    <div className="text-xs text-muted-foreground">Human · 30 HP</div>
                  </div>
                </div>
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 font-bold">P1</span>
              </div>

              {/* AI Players */}
              {aiPlayers.map((ai, i) => (
                <div key={ai.id} className="flex items-center justify-between bg-secondary/50 border border-border p-3">
                  <div className="flex items-center gap-3">
                    <User className="text-muted-foreground" size={18} />
                    <div>
                      <div className="text-sm text-secondary-foreground">{ai.name}</div>
                      <div className="text-xs text-muted-foreground">AI · {cfg.hp} HP</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { sounds.play('uiClick'); removeAi(ai.id); }}
                    disabled={aiPlayers.length <= 1}
                    className={`p-1 ${aiPlayers.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-destructive/20 hover:text-destructive'}`}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => { sounds.play('uiClick'); addAi(); }}
              disabled={aiPlayers.length >= 4}
              className={`flex items-center justify-center gap-2 w-full py-3 border text-sm font-semibold ${aiPlayers.length >= 4 ? 'opacity-30 cursor-not-allowed border-border text-muted-foreground' : 'hover:bg-secondary/80 text-foreground border-border hover:border-primary/50'}`}
            >
              <UserPlus size={16} />
              Add AI Opponent
            </button>
          </div>
        </div>

        <button
          data-testid="btn-start-game"
          onClick={handleStart}
          className="w-full mt-6 py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-display text-2xl font-bold tracking-widest border border-primary hover:border-white transition-all shadow-[0_0_15px_rgba(30,144,255,0.4)] hover:shadow-[0_0_25px_rgba(30,144,255,0.7)]"
        >
          START GAME — {gameMode === '8card' ? '8 Card Draw' : '3 Card Draft'}
        </button>
      </div>
    </div>
  );
}
