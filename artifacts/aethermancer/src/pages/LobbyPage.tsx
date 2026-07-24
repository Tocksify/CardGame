import { useLocation } from 'wouter';
import { sounds } from '../lib/sounds';
import { useLobby, Difficulty, DIFFICULTY_CFG } from '../context/LobbyContext';
import { useGame } from '../context/GameContext';
import { useChallenger } from '../context/ChallengerContext';
import { getChallengerById, RARITY_COLORS, RARITY_LABEL } from '../lib/challengers';
import { getCardTemplate } from '../lib/cards';
import { generateId } from '../store/gameStore';
import { ArrowLeft, User, UserPlus, X, Swords, ScrollText, Zap } from 'lucide-react';

const DIFFICULTIES: Difficulty[] = ['Novice', 'Easy', 'Normal', 'Hard', 'Expert', 'Nightmare'];

const DIFF_COLOR: Record<Difficulty, string> = {
  Novice: 'bg-sky-700 border-sky-500',
  Easy: 'bg-green-800 border-green-500',
  Normal: 'bg-primary border-primary',
  Hard: 'bg-orange-700 border-orange-500',
  Expert: 'bg-red-700 border-red-500',
  Nightmare: 'bg-purple-900 border-purple-500',
};

// Legendary character template IDs for the start_legendary effect
const LEGENDARY_CHAR_IDS = ['c10', 'c11', 'h3', 'h9', 'h18', 'h19', 'l1', 'l2'];

export default function LobbyPage() {
  const [, setLocation] = useLocation();
  const {
    difficulty, setDifficulty,
    animatedBattlefield, setAnimatedBattlefield,
    autoCombat, setAutoCombat,
    aiPlayers, addAi, removeAi,
    generatePlayers,
    gameMode, setGameMode,
    getDifficultyConfig,
  } = useLobby();
  const { dispatch } = useGame();
  const { save, equippedChallenger } = useChallenger();

  const handleStart = () => {
    sounds.play('uiClick');
    let players = generatePlayers({ gameMode, matchType: 'singleplayer', ranked: false });

    // Apply challenger starter effects to the human player
    if (equippedChallenger) {
      const effects = equippedChallenger.effectKeys;
      players = players.map(p => {
        if (!p.isHuman) return p;
        let modified = { ...p };

        if (effects.includes('bonus_gold_start_300')) modified.gold += 300;
        if (effects.includes('bonus_hp_10')) { modified.maxHp += 10; modified.hp += 10; }
        if (effects.includes('bonus_aether_3')) { modified.aetherBonus += 3; modified.aether += 3; }
        if (effects.includes('bonus_aether_4')) { modified.aetherBonus += 4; modified.aether += 4; }

        // Perk-based effects applied at start
        const perksToAdd: string[] = [];
        if (effects.includes('perk_poison_immune')) perksToAdd.push('perk_poison_immune');
        if (effects.includes('perk_stun_immune')) perksToAdd.push('perk_stun_immune');
        if (effects.includes('perk_draw_1')) perksToAdd.push('perk_draw_1');
        if (effects.includes('perk_resist_1')) perksToAdd.push('perk_resist_1');
        if (effects.includes('perk_undying')) perksToAdd.push('perk_undying');
        if (effects.includes('perk_deploy_bonus')) perksToAdd.push('perk_deploy_bonus');
        if (perksToAdd.length > 0) modified.perks = [...modified.perks, ...perksToAdd];

        // Start with a random legendary card in hand
        if (effects.includes('start_legendary')) {
          const shuffled = [...LEGENDARY_CHAR_IDS].sort(() => Math.random() - 0.5);
          for (const tplId of shuffled) {
            const tpl = getCardTemplate(tplId);
            if (tpl) {
              modified.hand = [...modified.hand, { ...tpl, instanceId: `card_${generateId()}` }];
              break;
            }
          }
        }

        return modified;
      });
    }

    dispatch({ type: 'START_GAME', payload: { players, gameMode, matchType: 'singleplayer', ranked: false, difficulty } });
    setLocation(gameMode === 'draft' ? '/pre-draft' : '/game');
  };

  const cfg = getDifficultyConfig(difficulty);
  const equipped = equippedChallenger;
  const rarityColorClass = equipped ? RARITY_COLORS[equipped.rarity] : '';

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

        {/* Equipped Challenger Banner */}
        {equipped ? (
          <div
            className={`mb-5 flex items-center gap-3 border p-3 cursor-pointer hover:opacity-90 transition-opacity ${rarityColorClass.split(' ')[0]} bg-card`}
            onClick={() => { sounds.play('uiClick'); setLocation('/challengers'); }}
          >
            <span className="text-3xl">{equipped.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display text-sm font-bold text-foreground">{equipped.name} <span className={`font-normal text-xs ${rarityColorClass.split(' ')[1]}`}>{equipped.title}</span></p>
                <span className={`text-[10px] px-1.5 border ${rarityColorClass} font-bold uppercase`}>{RARITY_LABEL[equipped.rarity]}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">⚡ {equipped.abilityName}: {equipped.abilityDescription.split('.')[0]}.</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">Change →</span>
          </div>
        ) : (
          <button
            onClick={() => { sounds.play('uiClick'); setLocation('/challengers'); }}
            className="mb-5 w-full flex items-center justify-center gap-2 border border-dashed border-border p-3 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors text-sm"
          >
            <Zap size={14} />
            No Challenger equipped — tap to select one
          </button>
        )}

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
                    <div className="text-xs opacity-70 mt-0.5">Start with 8 cards drawn from the pool. Draw 2 cards each turn.</div>
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

            {/* Gameplay */}
            <div className="bg-card border border-border p-5 flex flex-col gap-3">
              <h2 className="text-base font-display text-muted-foreground border-b border-border/50 pb-2">Gameplay</h2>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-muted-foreground">Automated Combat</span>
                  <span className="text-xs text-muted-foreground/60">Your characters act automatically each combat phase — strongest ability on the lowest-HP enemy first. You still control the main phase.</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  {(['OFF', 'ON'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => { sounds.play('uiClick'); setAutoCombat(v === 'ON'); }}
                      className={`px-4 py-1.5 border text-sm font-semibold transition-colors ${autoCombat === (v === 'ON') ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'}`}
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
                  <span className="text-xl">{equipped?.icon ?? '⚔️'}</span>
                  <div>
                    <div className="font-semibold text-sm">{equipped ? equipped.name : 'YOU'}</div>
                    <div className="text-xs text-muted-foreground">Human · {equipped?.effectKeys.includes('bonus_hp_10') ? '40' : '30'} HP</div>
                  </div>
                </div>
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 font-bold">P1</span>
              </div>

              {/* AI Players */}
              {aiPlayers.map((ai) => (
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
