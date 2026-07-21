import React from 'react';
import { CardType } from '../../lib/cards';

interface CardArtProps {
  templateId: string;
  type: CardType;
  artTheme?: string;
  animated?: boolean;
}

// ── Theme definitions ─────────────────────────────────────────────────────
const THEMES: Record<string, { primary: string; secondary: string; accent?: string }> = {
  aether:    { primary: 'rgba(30,144,255,0.85)',  secondary: 'rgba(14,165,233,0.5)',  accent: 'rgba(160,220,255,0.3)' },
  fire:      { primary: 'rgba(239,68,68,0.85)',   secondary: 'rgba(249,115,22,0.5)',  accent: 'rgba(255,200,50,0.3)' },
  void:      { primary: 'rgba(147,51,234,0.85)',  secondary: 'rgba(76,29,149,0.5)',   accent: 'rgba(200,100,255,0.2)' },
  earth:     { primary: 'rgba(16,185,129,0.85)',  secondary: 'rgba(5,150,105,0.5)',   accent: 'rgba(80,200,100,0.3)' },
  iron:      { primary: 'rgba(148,163,184,0.85)', secondary: 'rgba(71,85,105,0.5)',  accent: 'rgba(220,220,200,0.3)' },
  water:     { primary: 'rgba(56,189,248,0.85)',  secondary: 'rgba(14,165,233,0.5)',  accent: 'rgba(100,220,255,0.3)' },
  frost:     { primary: 'rgba(186,230,253,0.85)', secondary: 'rgba(56,189,248,0.5)', accent: 'rgba(220,240,255,0.4)' },
  poison:    { primary: 'rgba(132,204,22,0.85)',  secondary: 'rgba(77,124,15,0.5)',  accent: 'rgba(180,240,50,0.3)' },
  shadow:    { primary: 'rgba(107,114,128,0.85)', secondary: 'rgba(31,41,55,0.6)',   accent: 'rgba(180,50,200,0.2)' },
  celestial: { primary: 'rgba(253,224,71,0.85)',  secondary: 'rgba(234,179,8,0.5)',  accent: 'rgba(255,255,200,0.4)' },
  dragon:    { primary: 'rgba(239,68,68,0.85)',   secondary: 'rgba(180,20,20,0.5)',  accent: 'rgba(255,120,0,0.3)' },
  storm:     { primary: 'rgba(139,92,246,0.85)',  secondary: 'rgba(109,40,217,0.5)', accent: 'rgba(200,160,255,0.3)' },
  electric:  { primary: 'rgba(234,179,8,0.9)',    secondary: 'rgba(250,204,21,0.5)', accent: 'rgba(255,240,100,0.4)' },
  huntress:  { primary: 'rgba(74,222,128,0.85)',  secondary: 'rgba(21,128,61,0.5)',  accent: 'rgba(150,255,150,0.3)' },
  unknown:   { primary: 'rgba(255,255,255,0.9)',  secondary: 'rgba(200,200,220,0.5)', accent: 'rgba(180,50,255,0.3)' },
  gold:      { primary: 'rgba(245,197,24,0.85)',  secondary: 'rgba(217,119,6,0.5)',  accent: 'rgba(255,220,60,0.3)' },
};

function getTheme(templateId: string, artTheme?: string) {
  if (artTheme && THEMES[artTheme]) return THEMES[artTheme];
  // Fallback mappings for legacy templateIds
  if (['c3','s1'].includes(templateId))    return THEMES.fire;
  if (['c5','s6','c10'].includes(templateId)) return THEMES.void;
  if (['c2','e1','a4'].includes(templateId))  return THEMES.earth;
  if (['a1','a3'].includes(templateId))        return THEMES.iron;
  if (['c4'].includes(templateId))             return THEMES.water;
  if (['c9','s4'].includes(templateId))        return THEMES.storm;
  if (['c11','c7'].includes(templateId))       return THEMES.celestial;
  if (['c6','ev_c6'].includes(templateId))     return THEMES.dragon;
  if (['h1'].includes(templateId))             return THEMES.huntress;
  if (['h2'].includes(templateId))             return THEMES.electric;
  if (['h3'].includes(templateId))             return THEMES.iron;
  if (['h4'].includes(templateId))             return THEMES.unknown;
  if (['h8','h10'].includes(templateId))       return THEMES.poison;
  if (['h7'].includes(templateId))             return THEMES.frost;
  if (['h9'].includes(templateId))             return THEMES.electric;
  return THEMES.aether;
}

// ── Per-hero silhouette art ───────────────────────────────────────────────
function CharacterSilhouette({ templateId, artTheme, colors }: {
  templateId: string;
  artTheme?: string;
  colors: typeof THEMES.aether;
}) {
  const theme = artTheme || 'aether';

  // Unknown / secret character
  if (templateId === 'h4') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <radialGradient id={`unk-${templateId}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity={0.9} />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* Glowing orb + question mark */}
        <circle cx="20" cy="20" r="14" fill={`url(#unk-${templateId})`} style={{ animation: 'cardArtPulse 2s ease-in-out infinite' }} />
        <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" opacity={0.9} style={{ fontFamily: 'serif' }}>?</text>
        <circle cx="20" cy="20" r="16" fill="none" stroke={colors.primary} strokeWidth="1" opacity={0.4} style={{ animation: 'cardArtRotate 6s linear infinite' }} />
      </svg>
    );
  }

  // JoBoorn — armored warrior silhouette
  if (templateId === 'h3') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 1 }}>
        <defs><linearGradient id="jb-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e2e8f0"/><stop offset="100%" stopColor="#64748b"/></linearGradient></defs>
        {/* Body armor */}
        <polygon points="20,6 28,14 28,28 20,34 12,28 12,14" fill="url(#jb-g)" stroke={colors.primary} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 3px ${colors.primary})` }} />
        {/* Helmet */}
        <polygon points="20,4 25,10 15,10" fill={colors.primary} opacity={0.9} />
        {/* Chest emblem */}
        <circle cx="20" cy="20" r="3" fill={colors.accent || 'gold'} opacity={0.7} style={{ animation: 'cardArtPulse 3s ease-in-out infinite' }} />
      </svg>
    );
  }

  // Huntress — archer silhouette
  if (templateId === 'h1') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs><linearGradient id="hunt-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.primary}/><stop offset="100%" stopColor={colors.secondary}/></linearGradient></defs>
        {/* Body */}
        <ellipse cx="20" cy="22" rx="5" ry="8" fill="url(#hunt-g)" />
        {/* Head */}
        <circle cx="20" cy="12" r="4" fill={colors.primary} />
        {/* Bow */}
        <path d="M12,10 Q8,20 12,30" fill="none" stroke={colors.primary} strokeWidth="1.5" />
        <line x1="12" y1="10" x2="12" y2="30" stroke={colors.accent || colors.secondary} strokeWidth="0.8" />
        {/* Arrow */}
        <line x1="12" y1="20" x2="28" y2="20" stroke={colors.accent || 'white'} strokeWidth="1" />
        <polygon points="28,20 25,18 25,22" fill={colors.accent || 'white'} />
      </svg>
    );
  }

  // Zip — electric hero
  if (templateId === 'h2') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <filter id="zip-glow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
        </defs>
        {/* Lightning bolt */}
        <polygon points="24,4 14,22 20,22 16,36 30,16 22,16" fill={colors.primary} filter="url(#zip-glow)"
          style={{ animation: 'cardArtPulse 0.8s ease-in-out infinite' }} />
        {/* Sparks */}
        {[{x:8,y:8},{x:32,y:12},{x:6,y:28},{x:34,y:28}].map((p,i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={colors.accent || colors.primary}
            style={{ animation: `cardArtPulse ${0.6+i*0.2}s ease-in-out infinite`, animationDelay: `${i*0.15}s` }} />
        ))}
      </svg>
    );
  }

  // Frost Guardian
  if (templateId === 'h7') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        {/* Snowflake pattern */}
        {[0,60,120].map(angle => (
          <g key={angle} transform={`rotate(${angle} 20 20)`}>
            <line x1="20" y1="4" x2="20" y2="36" stroke={colors.primary} strokeWidth="1.5" />
            <line x1="12" y1="12" x2="28" y2="28" stroke={colors.primary} strokeWidth="1" opacity={0.7} />
          </g>
        ))}
        <circle cx="20" cy="20" r="3" fill={colors.primary} style={{ animation: 'cardArtPulse 2.5s ease-in-out infinite' }} />
      </svg>
    );
  }

  // Thunder Titan
  if (templateId === 'h9') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 1 }}>
        <defs><radialGradient id="tt-g" cx="50%" cy="50%"><stop offset="0%" stopColor={colors.primary}/><stop offset="100%" stopColor={colors.secondary} stopOpacity={0}/></radialGradient></defs>
        <circle cx="20" cy="20" r="16" fill={`url(#tt-g)`} style={{ animation: 'cardArtPulse 1.5s ease-in-out infinite' }} />
        <polygon points="24,4 14,22 20,22 16,36 30,16 22,16" fill="white" opacity={0.85} />
        <circle cx="20" cy="20" r="18" fill="none" stroke={colors.primary} strokeWidth="1" strokeDasharray="4 3"
          style={{ animation: 'cardArtRotate 4s linear infinite' }} />
      </svg>
    );
  }

  // Generic character — humanoid silhouette
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
      <defs>
        <linearGradient id={`char-g-${templateId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.primary} stopOpacity={0.9} />
          <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.6} />
        </linearGradient>
      </defs>
      {/* Head */}
      <circle cx="20" cy="11" r="5" fill={`url(#char-g-${templateId})`}
        style={{ filter: `drop-shadow(0 0 4px ${colors.primary})` }} />
      {/* Body */}
      <path d="M13,18 Q11,28 12,34 L20,32 L28,34 Q29,28 27,18 Z" fill={`url(#char-g-${templateId})`} />
      {/* Arms */}
      <line x1="13" y1="20" x2="7" y2="26" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
      <line x1="27" y1="20" x2="33" y2="26" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
      {/* Glow */}
      <circle cx="20" cy="20" r="18" fill="none" stroke={colors.accent || colors.primary}
        strokeWidth="0.5" opacity={0.3} style={{ animation: 'cardArtPulse 3s ease-in-out infinite' }} />
    </svg>
  );
}

export function CardArt({ templateId, type, artTheme, animated = true }: CardArtProps) {
  const colors = getTheme(templateId, artTheme);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black/50 flex items-center justify-center border-y border-white/10">

      {/* Background gradient */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at center, ${colors.secondary} 0%, rgba(0,0,0,0.6) 100%)`,
      }} />

      {type === 'character' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <CharacterSilhouette templateId={templateId} artTheme={artTheme} colors={colors} />
        </div>
      )}

      {type === 'spell' && (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="w-10 h-10 rounded-full blur-sm absolute"
            style={{
              background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, transparent, ${colors.primary})`,
              animation: animated ? 'cardArtRotate 3s linear infinite' : 'none',
            }} />
          <div className="w-5 h-5 rounded-full z-10"
            style={{
              background: colors.primary,
              boxShadow: `0 0 12px ${colors.primary}`,
              animation: animated ? 'cardArtPulse 1.5s ease-in-out infinite' : 'none',
            }} />
        </div>
      )}

      {type === 'artifact' && (
        <div className="w-8 h-8 rotate-45 flex items-center justify-center"
          style={{
            backgroundColor: colors.primary,
            boxShadow: `0 0 12px ${colors.primary}, 0 0 24px ${colors.secondary}`,
            animation: animated ? 'cardArtPulse 2.5s ease-in-out infinite alternate' : 'none',
          }}>
          <div className="w-3 h-3 bg-white/60 rotate-45" />
        </div>
      )}

      {type === 'enchantment' && (
        <>
          <div className="absolute inset-0 opacity-70"
            style={{
              background: `linear-gradient(45deg, transparent 20%, ${colors.primary} 50%, transparent 80%)`,
              backgroundSize: '200% 200%',
              animation: animated ? 'cardArtShimmer 2s ease-in-out infinite' : 'none',
            }} />
          <div className="w-6 h-6 rounded-full border-2 z-10"
            style={{
              borderColor: colors.primary,
              boxShadow: `0 0 8px ${colors.primary}`,
              animation: animated ? 'cardArtPulse 2s ease-in-out infinite' : 'none',
            }} />
        </>
      )}

      {/* Noise overlay */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23fff' fill-opacity='0.05'/%3E%3C/svg%3E")` }} />
    </div>
  );
}
