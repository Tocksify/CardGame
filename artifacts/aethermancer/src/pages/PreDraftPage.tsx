import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { CARD_TEMPLATES, CardTemplate, drawFromPool, generateDraftOptions } from '../lib/cards';
import { generateId } from '../store/gameStore';
import { sounds } from '../lib/sounds';
import { CardArt } from '../components/game/CardArt';
import { Swords, ShieldAlert, Zap, Package, Sparkles } from 'lucide-react';

const PICK_COUNT = 3;

const TYPE_FRAME: Record<string, { bg: string; bar: string; icon: React.ReactNode }> = {
  character:   { bg: '#0e1f3d', bar: '#1a3a6e', icon: <Swords size={8} /> },
  spell:       { bg: '#2a0a0a', bar: '#6e1a1a', icon: <Zap size={8} /> },
  artifact:    { bg: '#241600', bar: '#6e4e1a', icon: <Package size={8} /> },
  enchantment: { bg: '#072210', bar: '#1a5a2e', icon: <Sparkles size={8} /> },
};

function rarityBorder(rarity?: string): string {
  if (rarity === 'secret')    return 'border-purple-400 shadow-[0_0_8px_rgba(160,80,220,0.7)]';
  if (rarity === 'legendary') return 'border-amber-400 shadow-[0_0_8px_rgba(255,180,0,0.8)]';
  if (rarity === 'rare')      return 'border-blue-400 shadow-[0_0_5px_rgba(80,140,220,0.6)]';
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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sort: legendary/secret first, then rare, then common; alphabetical within tier
  const sortedCards = [...CARD_TEMPLATES].sort((a, b) => {
    const tierOrder = { secret: 0, legendary: 1, rare: 2, common: 3 };
    const ta = tierOrder[a.rarity ?? 'common'];
    const tb = tierOrder[b.rarity ?? 'common'];
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name);
  });

  const toggleCard = (templateId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
        sounds.play('uiClick');
      } else if (next.size < PICK_COUNT) {
        next.add(templateId);
        sounds.play('draft');
      }
      return next;
    });
  };

  const handleBeginBattle = () => {
    if (selected.size !== PICK_COUNT) return;
    sounds.play('uiClick');

    const makeInst = (tpl: CardTemplate) => ({ ...tpl, instanceId: `card_${generateId()}` });

    // Give human player their picked cards
    const humanPlayer = gameState.players.find(p => p.isHuman);
    if (humanPlayer) {
      const pickedTemplates = sortedCards.filter(c => selected.has(c.templateId));
      dispatch({
        type: 'GIVE_STARTING_CARDS',
        payload: { playerId: humanPlayer.id, cards: pickedTemplates.map(makeInst) },
      });
    }

    // Auto-pick 3 random cards for each AI player
    gameState.players.filter(p => !p.isHuman).forEach(ai => {
      const aiCards = generateDraftOptions().map(makeInst);
      dispatch({ type: 'GIVE_STARTING_CARDS', payload: { playerId: ai.id, cards: aiCards } });
    });

    setLocation('/game');
  };

  const remaining = PICK_COUNT - selected.size;
  const ready = selected.size === PICK_COUNT;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden"
         style={{ fontFamily: "'IM Fell English', Georgia, serif" }}>

      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-3 flex items-start justify-between gap-4"
           style={{ background: 'linear-gradient(180deg, #100b06 0%, #0d0906 100%)', borderBottom: '2px solid #3a2800' }}>
        <div>
          <div className="text-[10px] font-display uppercase tracking-[0.5em] mb-1" style={{ color: '#7a6040' }}>
            Pre-Game
          </div>
          <h1 className="text-3xl font-display font-black" style={{ color: '#c9a227', letterSpacing: '0.08em' }}>
            DRAFT YOUR STARTING HAND
          </h1>
          <p className="text-xs mt-1" style={{ color: '#7a6040' }}>
            Choose exactly {PICK_COUNT} cards to begin with. Each turn you'll draft one more.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Pick counter */}
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: PICK_COUNT }).map((_, i) => (
              <div key={i} className="w-5 h-5 border-2 flex items-center justify-center"
                   style={{
                     borderColor: i < selected.size ? '#c9a227' : 'rgba(74,48,0,0.4)',
                     background: i < selected.size ? 'rgba(201,162,39,0.15)' : 'transparent',
                   }}>
                {i < selected.size && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#c9a227' }} />}
              </div>
            ))}
          </div>
          <div className="text-xs font-display" style={{ color: remaining > 0 ? '#c9a227' : '#5db860' }}>
            {remaining > 0 ? `Pick ${remaining} more` : 'Ready!'}
          </div>

          <AnimatePresence>
            {ready && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleBeginBattle}
                className="mt-1 px-6 py-2.5 font-display font-bold text-sm uppercase tracking-widest transition-all"
                style={{
                  background: 'linear-gradient(135deg, #c9a227, #a07018)',
                  color: '#080503',
                  border: '2px solid #e0c040',
                  boxShadow: '0 0 20px rgba(201,162,39,0.5)',
                }}
              >
                ⚔ BEGIN BATTLE
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-2"
             style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
          {sortedCards.map(card => {
            const frame = TYPE_FRAME[card.type] || TYPE_FRAME.character;
            const isSelected = selected.has(card.templateId);
            const isDisabled = !isSelected && selected.size >= PICK_COUNT;

            return (
              <motion.div
                key={card.templateId}
                whileHover={!isDisabled ? { scale: 1.08, y: -4, zIndex: 60 } : {}}
                onClick={() => !isDisabled && toggleCard(card.templateId)}
                className={`relative flex flex-col overflow-hidden border-2 transition-all duration-150
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${isSelected ? 'border-amber-400 shadow-[0_0_14px_rgba(201,162,39,0.9)]' : rarityBorder(card.rarity)}
                `}
                style={{
                  background: isSelected ? `linear-gradient(180deg, ${frame.bar}44, ${frame.bg})` : frame.bg,
                  height: 120,
                }}
              >
                {/* Selected overlay */}
                {isSelected && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                       style={{ background: 'rgba(201,162,39,0.12)' }}>
                    <div className="text-amber-400 text-lg font-display font-black"
                         style={{ textShadow: '0 0 8px rgba(201,162,39,0.8)' }}>✓</div>
                  </div>
                )}

                {/* Card type bar */}
                <div className="h-4 flex items-center justify-between px-0.5 shrink-0"
                     style={{ background: `${frame.bar}ee` }}>
                  <span className="text-[5px] font-display font-bold text-amber-100 truncate leading-none">{card.name}</span>
                  <span className="text-[5px] font-bold text-white shrink-0 ml-0.5">{card.cost}</span>
                </div>

                {/* Art */}
                <div className="h-12 w-full shrink-0">
                  <CardArt templateId={card.templateId} type={card.type} artTheme={(card as any).artTheme} />
                </div>

                {/* Description area */}
                <div className="flex-1 px-0.5 py-0.5 overflow-hidden"
                     style={{ background: 'linear-gradient(180deg, #1a1208, #120e06)' }}>
                  <div className={`text-[4.5px] font-display uppercase leading-none mb-0.5 ${rarityLabel(card.rarity)}`}>
                    {card.type} · {card.rarity}
                    {card.atk !== undefined && ` · ${card.atk}/${card.def}`}
                  </div>
                  <p className="text-[4.5px] leading-tight" style={{ color: '#a89060' }}>
                    {card.description?.slice(0, 50)}{(card.description?.length ?? 0) > 50 ? '…' : ''}
                  </p>
                </div>

                {/* Stats footer */}
                {card.type === 'character' && (
                  <div className="h-3.5 flex items-center justify-between px-0.5 shrink-0"
                       style={{ background: '#0e0a05', borderTop: '1px solid rgba(74,48,0,0.4)' }}>
                    <span className="text-[6px] font-bold" style={{ color: '#e8a030' }}>⚔{card.atk}</span>
                    <span className="text-[6px] font-bold" style={{ color: '#5db860' }}>🛡{card.def}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar: selected cards */}
      <div className="shrink-0 px-4 py-3 flex items-center gap-3 flex-wrap"
           style={{ background: '#080504', borderTop: '2px solid #3a2800' }}>
        <span className="text-[9px] font-display uppercase tracking-widest" style={{ color: '#7a6040' }}>
          Selected:
        </span>
        {sortedCards.filter(c => selected.has(c.templateId)).map(card => (
          <div key={card.templateId}
               onClick={() => toggleCard(card.templateId)}
               className="flex items-center gap-1 px-2 py-0.5 border cursor-pointer hover:opacity-70 transition-opacity"
               style={{ borderColor: 'rgba(201,162,39,0.5)', background: 'rgba(201,162,39,0.08)' }}>
            <span className="text-[9px] font-display font-bold" style={{ color: '#c9a227' }}>{card.name}</span>
            <span className="text-[7px]" style={{ color: 'rgba(180,50,50,0.7)' }}>✕</span>
          </div>
        ))}
        {selected.size === 0 && (
          <span className="text-[9px] italic" style={{ color: 'rgba(74,48,0,0.4)' }}>None selected yet</span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleBeginBattle}
            disabled={!ready}
            className="px-5 py-2 font-display font-bold text-xs uppercase tracking-widest transition-all"
            style={{
              background: ready ? 'linear-gradient(135deg, #c9a227, #a07018)' : 'rgba(74,48,0,0.3)',
              color: ready ? '#080503' : 'rgba(74,48,0,0.5)',
              border: `2px solid ${ready ? '#e0c040' : 'rgba(74,48,0,0.3)'}`,
              boxShadow: ready ? '0 0 15px rgba(201,162,39,0.4)' : 'none',
              cursor: ready ? 'pointer' : 'not-allowed',
            }}
          >
            {ready ? '⚔ Begin Battle' : `Pick ${remaining} more…`}
          </button>
        </div>
      </div>
    </div>
  );
}
