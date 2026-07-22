import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { CardTemplate, generateDraftOptions } from '../lib/cards';
import { generateId } from '../store/gameStore';
import { sounds } from '../lib/sounds';
import { CardArt } from '../components/game/CardArt';
import { Swords, ShieldAlert, Zap, Package, Sparkles } from 'lucide-react';

const TOTAL_PICKS = 3; // How many cards the player drafts in total

const TYPE_FRAME: Record<string, { bg: string; bar: string; icon: React.ReactNode }> = {
  character:   { bg: '#0e1f3d', bar: '#1a3a6e', icon: <Swords size={8} /> },
  spell:       { bg: '#2a0a0a', bar: '#6e1a1a', icon: <Zap size={8} /> },
  artifact:    { bg: '#241600', bar: '#6e4e1a', icon: <Package size={8} /> },
  enchantment: { bg: '#072210', bar: '#1a5a2e', icon: <Sparkles size={8} /> },
};

function rarityBorder(rarity?: string): string {
  if (rarity === 'secret')    return 'border-purple-400 shadow-[0_0_14px_rgba(160,80,220,0.8)]';
  if (rarity === 'legendary') return 'border-amber-400 shadow-[0_0_14px_rgba(255,180,0,0.9)]';
  if (rarity === 'rare')      return 'border-blue-400 shadow-[0_0_8px_rgba(80,140,220,0.7)]';
  return 'border-[#4a3000]/70';
}

function rarityLabel(rarity?: string): string {
  if (rarity === 'secret')    return 'text-purple-400';
  if (rarity === 'legendary') return 'text-amber-400';
  if (rarity === 'rare')      return 'text-blue-400';
  return 'text-stone-400';
}

export default function PreDraftPage() {
  const [, setLocation] = useLocation();
  const { gameState, dispatch } = useGame();

  const [round, setRound] = useState(0);                         // 0-based current round
  const [options, setOptions] = useState<CardTemplate[]>([]);    // 3 cards to choose from
  const [picked, setPicked] = useState<CardTemplate[]>([]);      // cards chosen so far
  const [chosen, setChosen] = useState<CardTemplate | null>(null); // just-picked (for animation)

  // Generate first set of options on mount
  useEffect(() => {
    setOptions(generateDraftOptions());
  }, []);

  const handlePick = (card: CardTemplate) => {
    sounds.play('draft');
    setChosen(card);

    setTimeout(() => {
      const newPicked = [...picked, card];
      setPicked(newPicked);
      setChosen(null);

      if (newPicked.length < TOTAL_PICKS) {
        // More rounds — generate fresh options
        setOptions(generateDraftOptions());
        setRound(r => r + 1);
      } else {
        // All picks done — start the game
        finishDraft(newPicked);
      }
    }, 380);
  };

  const finishDraft = (finalPicked: CardTemplate[]) => {
    const makeInst = (tpl: CardTemplate) => ({ ...tpl, instanceId: `card_${generateId()}` });

    const humanPlayer = gameState.players.find(p => p.isHuman);
    if (humanPlayer) {
      dispatch({
        type: 'GIVE_STARTING_CARDS',
        payload: { playerId: humanPlayer.id, cards: finalPicked.map(makeInst) },
      });
    }

    // Auto-pick 3 random cards for each AI player
    gameState.players.filter(p => !p.isHuman).forEach(ai => {
      const aiCards = generateDraftOptions().map(makeInst);
      dispatch({ type: 'GIVE_STARTING_CARDS', payload: { playerId: ai.id, cards: aiCards } });
    });

    setLocation('/game');
  };

  const currentRound = picked.length; // how many picks done

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden"
      style={{ fontFamily: "'IM Fell English', Georgia, serif" }}
    >
      {/* Header */}
      <div
        className="shrink-0 px-6 pt-6 pb-4 text-center"
        style={{
          background: 'linear-gradient(180deg, #100b06 0%, #0d0906 100%)',
          borderBottom: '2px solid #3a2800',
        }}
      >
        <div className="text-[10px] font-display uppercase tracking-[0.5em] mb-1" style={{ color: '#7a6040' }}>
          Pre-Game Draft
        </div>
        <h1 className="text-3xl font-display font-black mb-2" style={{ color: '#c9a227', letterSpacing: '0.08em' }}>
          CHOOSE YOUR STARTING HAND
        </h1>
        <p className="text-xs" style={{ color: '#7a6040' }}>
          Pick 1 of 3 cards each round — you'll draft {TOTAL_PICKS} cards total to begin with.
        </p>

        {/* Round pips */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {Array.from({ length: TOTAL_PICKS }).map((_, i) => {
            const isDone = i < picked.length;
            const isCurrent = i === picked.length;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 border-2 flex items-center justify-center transition-all duration-300"
                  style={{
                    borderColor: isDone ? '#5db860' : isCurrent ? '#c9a227' : 'rgba(74,48,0,0.35)',
                    background: isDone ? 'rgba(93,184,96,0.15)' : isCurrent ? 'rgba(201,162,39,0.1)' : 'transparent',
                    boxShadow: isCurrent ? '0 0 12px rgba(201,162,39,0.4)' : 'none',
                  }}
                >
                  {isDone
                    ? <span className="text-[13px]" style={{ color: '#5db860' }}>✓</span>
                    : <span className="text-xs font-display font-bold" style={{ color: isCurrent ? '#c9a227' : 'rgba(74,48,0,0.4)' }}>{i + 1}</span>
                  }
                </div>
                {isDone && picked[i] && (
                  <span className="text-[7px] font-display max-w-[64px] text-center truncate" style={{ color: '#5db860' }}>
                    {picked[i].name}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {currentRound < TOTAL_PICKS && (
          <div className="text-xs font-display mt-2" style={{ color: '#c9a227' }}>
            Round {currentRound + 1} of {TOTAL_PICKS} — choose one card
          </div>
        )}
      </div>

      {/* Draft options */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {options.length > 0 && currentRound < TOTAL_PICKS && (
            <motion.div
              key={round}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.28 }}
              className="flex gap-8 items-start justify-center flex-wrap"
            >
              {options.map(card => {
                const frame = TYPE_FRAME[card.type] || TYPE_FRAME.character;
                const isBeingPicked = chosen?.templateId === card.templateId;

                return (
                  <motion.div
                    key={card.templateId}
                    whileHover={{ scale: 1.07, y: -10 }}
                    animate={isBeingPicked ? { scale: 1.12, opacity: 0 } : { scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    onClick={() => !chosen && handlePick(card)}
                    className={`relative flex flex-col overflow-hidden border-2 cursor-pointer ${rarityBorder(card.rarity)}`}
                    style={{
                      background: frame.bg,
                      width: 168,
                      height: 240,
                      boxShadow: card.rarity === 'legendary'
                        ? '0 0 24px rgba(201,162,39,0.5)'
                        : card.rarity === 'secret'
                          ? '0 0 24px rgba(160,80,220,0.5)'
                          : card.rarity === 'rare'
                            ? '0 0 16px rgba(80,140,220,0.4)'
                            : 'none',
                    }}
                  >
                    {/* Name + cost bar */}
                    <div
                      className="h-9 flex items-center justify-between px-2 shrink-0"
                      style={{ background: `${frame.bar}ee` }}
                    >
                      <span className="text-[11px] font-display font-bold text-amber-100 truncate leading-tight">
                        {card.name}
                      </span>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 ml-1"
                        style={{ background: '#2a1a00', border: '1px solid #c9a227', boxShadow: '0 0 5px rgba(201,162,39,0.5)' }}
                      >
                        {card.cost}
                      </div>
                    </div>

                    {/* Art */}
                    <div className="h-24 w-full shrink-0">
                      <CardArt templateId={card.templateId} type={card.type} artTheme={(card as any).artTheme} />
                    </div>

                    {/* Type + rarity bar */}
                    <div className="h-5 flex items-center px-2" style={{ background: `${frame.bar}99` }}>
                      <span className={`text-[7px] font-display uppercase tracking-widest ${rarityLabel(card.rarity)}`}>
                        {card.type} · {card.rarity}
                        {card.atk !== undefined && ` · ${card.atk}/${card.def}`}
                      </span>
                    </div>

                    {/* Description */}
                    <div
                      className="flex-1 p-2 text-[8px] leading-tight overflow-hidden"
                      style={{ background: 'linear-gradient(180deg, #1c1508 0%, #120e06 100%)', color: '#cbb888' }}
                    >
                      {card.description}
                    </div>

                    {/* Stats footer for characters */}
                    {card.type === 'character' && (
                      <div
                        className="h-7 flex items-center justify-between px-2 shrink-0"
                        style={{ background: '#0e0a05', borderTop: '1px solid rgba(74,48,0,0.5)' }}
                      >
                        <div className="flex items-center gap-1 font-display font-bold text-[12px]" style={{ color: '#e8a030' }}>
                          <Swords size={10} />{card.atk}
                        </div>
                        <div className="flex items-center gap-1 font-display font-bold text-[12px]" style={{ color: '#5db860' }}>
                          <ShieldAlert size={10} />{card.def}
                        </div>
                      </div>
                    )}

                    {/* Select footer */}
                    <div
                      className="h-7 flex items-center justify-center text-[9px] font-display font-bold uppercase tracking-widest"
                      style={{
                        background: 'rgba(201,162,39,0.1)',
                        borderTop: '1px solid rgba(74,48,0,0.4)',
                        color: '#c9a227',
                      }}
                    >
                      ✦ SELECT
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer — picked cards summary */}
      <div
        className="shrink-0 px-4 py-3 flex items-center gap-3 flex-wrap"
        style={{ background: '#080504', borderTop: '2px solid #3a2800', minHeight: 56 }}
      >
        <span className="text-[9px] font-display uppercase tracking-widest" style={{ color: '#7a6040' }}>
          Drafted:
        </span>
        {picked.map((card, i) => {
          const frame = TYPE_FRAME[card.type] || TYPE_FRAME.character;
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 border"
              style={{ borderColor: 'rgba(93,184,96,0.5)', background: 'rgba(93,184,96,0.06)' }}
            >
              <span className="text-[9px] font-display font-bold" style={{ color: '#5db860' }}>{card.name}</span>
              <span className="text-[7px] font-display" style={{ color: 'rgba(93,184,96,0.5)' }}>✓</span>
            </div>
          );
        })}
        {picked.length === 0 && (
          <span className="text-[9px] italic" style={{ color: 'rgba(74,48,0,0.4)' }}>None drafted yet</span>
        )}
      </div>
    </div>
  );
}
