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
  if (['c3','s1'].includes(templateId))         return THEMES.fire;
  if (['c5','s6','c10'].includes(templateId))   return THEMES.void;
  if (['c2','e1','a4'].includes(templateId))    return THEMES.earth;
  if (['a1','a3'].includes(templateId))          return THEMES.iron;
  if (['c4'].includes(templateId))               return THEMES.water;
  if (['c9','s4'].includes(templateId))          return THEMES.storm;
  if (['c11','c7'].includes(templateId))         return THEMES.celestial;
  if (['c6','ev_c6'].includes(templateId))       return THEMES.dragon;
  if (['h1'].includes(templateId))               return THEMES.huntress;
  if (['h2'].includes(templateId))               return THEMES.electric;
  if (['h3'].includes(templateId))               return THEMES.iron;
  if (['h4'].includes(templateId))               return THEMES.unknown;
  if (['h8','h10','c13','h15'].includes(templateId)) return THEMES.poison;
  if (['h7','h16'].includes(templateId))         return THEMES.frost;
  if (['h9'].includes(templateId))               return THEMES.electric;
  if (['h13','h19','c12'].includes(templateId))  return THEMES.fire;
  if (['h14'].includes(templateId))              return THEMES.aether;
  if (['h17'].includes(templateId))              return THEMES.iron;
  if (['h18'].includes(templateId))              return THEMES.celestial;
  if (['h20'].includes(templateId))              return THEMES.void;
  if (['c14'].includes(templateId))              return THEMES.earth;
  if (['c15'].includes(templateId))              return THEMES.shadow;
  return THEMES.aether;
}

// ── Per-hero silhouette art ───────────────────────────────────────────────
function CharacterSilhouette({ templateId, artTheme, colors }: {
  templateId: string;
  artTheme?: string;
  colors: typeof THEMES.aether;
}) {
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
        <circle cx="20" cy="20" r="14" fill={`url(#unk-${templateId})`} style={{ animation: 'cardArtPulse 2s ease-in-out infinite' }} />
        <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" opacity={0.9} style={{ fontFamily: 'serif' }}>?</text>
        <circle cx="20" cy="20" r="16" fill="none" stroke={colors.primary} strokeWidth="1" opacity={0.4} style={{ animation: 'cardArtRotate 6s linear infinite' }} />
        <circle cx="20" cy="20" r="18" fill="none" stroke={colors.accent || colors.primary} strokeWidth="0.5" strokeDasharray="2 3" opacity={0.3} style={{ animation: 'cardArtRotate 9s linear infinite reverse' }} />
      </svg>
    );
  }

  // JoBoorn — armored warrior
  if (templateId === 'h3') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 1 }}>
        <defs>
          <linearGradient id="jb-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0"/>
            <stop offset="100%" stopColor="#64748b"/>
          </linearGradient>
        </defs>
        {/* Body armor */}
        <polygon points="20,6 28,14 28,28 20,34 12,28 12,14" fill="url(#jb-g)" stroke={colors.primary} strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 3px ${colors.primary})` }} />
        {/* Helmet */}
        <polygon points="20,4 25,10 15,10" fill={colors.primary} opacity={0.9} />
        {/* Chest emblem */}
        <circle cx="20" cy="20" r="3" fill={colors.accent || 'gold'} opacity={0.7}
          style={{ animation: 'cardArtPulse 3s ease-in-out infinite' }} />
        {/* Shoulder plates */}
        <ellipse cx="12" cy="17" rx="3" ry="2" fill={colors.primary} opacity={0.6} />
        <ellipse cx="28" cy="17" rx="3" ry="2" fill={colors.primary} opacity={0.6} />
      </svg>
    );
  }

  // Huntress — archer
  if (templateId === 'h1') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <linearGradient id="hunt-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.primary}/>
            <stop offset="100%" stopColor={colors.secondary}/>
          </linearGradient>
        </defs>
        {/* Body */}
        <ellipse cx="20" cy="23" rx="5" ry="8" fill="url(#hunt-g)" />
        {/* Head */}
        <circle cx="20" cy="12" r="4" fill={colors.primary} />
        {/* Hood */}
        <path d="M16,11 Q20,6 24,11" fill="none" stroke={colors.accent || colors.primary} strokeWidth="1.5" />
        {/* Bow */}
        <path d="M11,8 Q7,20 11,32" fill="none" stroke={colors.primary} strokeWidth="2" />
        <line x1="11" y1="8" x2="11" y2="32" stroke={colors.accent || colors.secondary} strokeWidth="0.8" />
        {/* Arrow */}
        <line x1="11" y1="20" x2="29" y2="20" stroke={colors.accent || 'white'} strokeWidth="1.2" />
        <polygon points="29,20 25,18 25,22" fill={colors.accent || 'white'} />
        {/* Quiver */}
        <rect x="25" y="16" width="3" height="8" rx="1" fill={colors.secondary} opacity={0.7} />
      </svg>
    );
  }

  // Zip — electric hero
  if (templateId === 'h2') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <filter id="zip-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        {/* Lightning bolt body */}
        <polygon points="24,4 14,22 20,22 16,36 30,16 22,16" fill={colors.primary} filter="url(#zip-glow)"
          style={{ animation: 'cardArtPulse 0.8s ease-in-out infinite' }} />
        {/* Sparks */}
        {[{x:8,y:8},{x:32,y:12},{x:6,y:28},{x:34,y:28},{x:12,y:36},{x:30,y:4}].map((p,i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={colors.accent || colors.primary}
            style={{ animation: `cardArtPulse ${0.5+i*0.15}s ease-in-out infinite`, animationDelay: `${i*0.12}s` }} />
        ))}
        {/* Arc lines */}
        <path d="M6,14 Q10,10 14,14" fill="none" stroke={colors.primary} strokeWidth="1" opacity={0.5}
          style={{ animation: 'cardArtPulse 1.2s ease-in-out infinite' }} />
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
            {/* Branch tips */}
            <line x1="17" y1="10" x2="20" y2="7" stroke={colors.primary} strokeWidth="0.8" />
            <line x1="23" y1="10" x2="20" y2="7" stroke={colors.primary} strokeWidth="0.8" />
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
        <defs>
          <radialGradient id="tt-g" cx="50%" cy="50%">
            <stop offset="0%" stopColor={colors.primary}/>
            <stop offset="100%" stopColor={colors.secondary} stopOpacity={0}/>
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="16" fill={`url(#tt-g)`} style={{ animation: 'cardArtPulse 1.5s ease-in-out infinite' }} />
        <polygon points="24,4 14,22 20,22 16,36 30,16 22,16" fill="white" opacity={0.85} />
        <circle cx="20" cy="20" r="18" fill="none" stroke={colors.primary} strokeWidth="1" strokeDasharray="4 3"
          style={{ animation: 'cardArtRotate 4s linear infinite' }} />
        <circle cx="20" cy="20" r="12" fill="none" stroke={colors.accent || colors.primary} strokeWidth="0.5" strokeDasharray="2 4"
          style={{ animation: 'cardArtRotate 7s linear infinite reverse' }} />
      </svg>
    );
  }

  // Emberwing — blazing phoenix-hawk
  if (templateId === 'h13') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <radialGradient id="ew-g" cx="50%" cy="60%">
            <stop offset="0%" stopColor="rgba(255,200,50,0.9)"/>
            <stop offset="60%" stopColor={colors.primary}/>
            <stop offset="100%" stopColor={colors.secondary} stopOpacity={0}/>
          </radialGradient>
        </defs>
        {/* Wings */}
        <path d="M20,20 Q6,10 4,22 Q10,18 20,22" fill={colors.primary} opacity={0.85}
          style={{ animation: 'cardArtPulse 1.2s ease-in-out infinite' }} />
        <path d="M20,20 Q34,10 36,22 Q30,18 20,22" fill={colors.primary} opacity={0.85}
          style={{ animation: 'cardArtPulse 1.2s ease-in-out infinite', animationDelay: '0.1s' }} />
        {/* Body */}
        <ellipse cx="20" cy="22" rx="4" ry="6" fill="url(#ew-g)" />
        {/* Head */}
        <circle cx="20" cy="15" r="3.5" fill={colors.accent || 'rgba(255,220,60,0.9)'} />
        {/* Beak */}
        <polygon points="20,14 22,17 18,17" fill={colors.primary} />
        {/* Flame trail */}
        {[0,1,2].map(i => (
          <circle key={i} cx={20 + (i-1)*4} cy={30+i*2} r={1.5-i*0.3}
            fill={colors.accent || colors.primary} opacity={0.6}
            style={{ animation: `cardArtPulse ${0.6+i*0.2}s ease-in-out infinite`, animationDelay: `${i*0.1}s` }} />
        ))}
      </svg>
    );
  }

  // Galeclaw — wind predator
  if (templateId === 'h14') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <linearGradient id="gc-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.primary}/>
            <stop offset="100%" stopColor={colors.secondary}/>
          </linearGradient>
        </defs>
        {/* Swept wings */}
        <path d="M20,18 Q4,6 2,18 Q10,14 18,22" fill="url(#gc-g)" opacity={0.8}
          style={{ animation: 'cardArtPulse 1s ease-in-out infinite' }} />
        <path d="M20,18 Q36,6 38,18 Q30,14 22,22" fill="url(#gc-g)" opacity={0.8}
          style={{ animation: 'cardArtPulse 1s ease-in-out infinite', animationDelay: '0.05s' }} />
        {/* Talon-shaped body */}
        <path d="M17,18 L20,30 L23,18 Q20,14 17,18Z" fill={colors.primary} />
        {/* Head */}
        <circle cx="20" cy="14" r="3" fill={colors.primary} />
        {/* Speed lines */}
        {[6,10,14].map((y, i) => (
          <line key={i} x1={4+i*2} y1={y} x2={8+i*2} y2={y} stroke={colors.accent || colors.primary}
            strokeWidth="0.8" opacity={0.4} style={{ animation: `cardArtPulse ${0.7+i*0.15}s ease-in-out infinite` }} />
        ))}
      </svg>
    );
  }

  // Frostbound Drake
  if (templateId === 'h16') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <linearGradient id="fd-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primary}/>
            <stop offset="100%" stopColor={colors.secondary}/>
          </linearGradient>
        </defs>
        {/* Dragon body */}
        <path d="M8,30 Q12,18 20,14 Q28,18 32,30 Q24,26 20,28 Q16,26 8,30Z" fill="url(#fd-g)" />
        {/* Wings */}
        <path d="M12,22 Q4,12 8,8 Q12,14 16,20" fill={colors.primary} opacity={0.7} />
        <path d="M28,22 Q36,12 32,8 Q28,14 24,20" fill={colors.primary} opacity={0.7} />
        {/* Head */}
        <ellipse cx="20" cy="12" rx="5" ry="4" fill={colors.primary} />
        {/* Horns */}
        <line x1="17" y1="9" x2="14" y2="5" stroke={colors.accent || colors.primary} strokeWidth="1.5" />
        <line x1="23" y1="9" x2="26" y2="5" stroke={colors.accent || colors.primary} strokeWidth="1.5" />
        {/* Ice breath */}
        <path d="M20,16 Q18,20 16,24 Q20,22 24,24 Q22,20 20,16Z" fill={colors.accent || 'rgba(200,240,255,0.6)'}
          style={{ animation: 'cardArtPulse 1.8s ease-in-out infinite' }} />
      </svg>
    );
  }

  // The Warden — iron fortress
  if (templateId === 'h17') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 1 }}>
        <defs>
          <linearGradient id="wd-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1"/>
            <stop offset="100%" stopColor="#475569"/>
          </linearGradient>
        </defs>
        {/* Shield body */}
        <path d="M20,4 L32,10 L32,26 Q20,36 20,36 Q20,36 8,26 L8,10 Z" fill="url(#wd-g)"
          stroke={colors.primary} strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 4px ${colors.primary})` }} />
        {/* Cross emblem */}
        <rect x="18" y="10" width="4" height="16" rx="0.5" fill={colors.primary} opacity={0.7} />
        <rect x="12" y="16" width="16" height="4" rx="0.5" fill={colors.primary} opacity={0.7} />
        {/* Helmet crest */}
        <polygon points="20,2 24,8 16,8" fill={colors.primary} opacity={0.8} />
        <circle cx="20" cy="20" r="2" fill={colors.accent || 'rgba(220,220,200,0.8)'}
          style={{ animation: 'cardArtPulse 3s ease-in-out infinite' }} />
      </svg>
    );
  }

  // Dawnbringer — divine warrior
  if (templateId === 'h18') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <radialGradient id="db-g" cx="50%" cy="40%">
            <stop offset="0%" stopColor="rgba(255,255,200,0.9)"/>
            <stop offset="60%" stopColor={colors.primary}/>
            <stop offset="100%" stopColor={colors.secondary} stopOpacity={0}/>
          </radialGradient>
        </defs>
        {/* Halo */}
        <circle cx="20" cy="10" r="6" fill="none" stroke={colors.accent || colors.primary} strokeWidth="1.5"
          style={{ animation: 'cardArtPulse 2s ease-in-out infinite' }} />
        {/* Wings */}
        <path d="M20,18 Q8,10 6,20 Q12,16 20,20" fill={colors.primary} opacity={0.7} />
        <path d="M20,18 Q32,10 34,20 Q28,16 20,20" fill={colors.primary} opacity={0.7} />
        {/* Armored body */}
        <rect x="16" y="18" width="8" height="12" rx="2" fill="url(#db-g)"
          style={{ filter: `drop-shadow(0 0 3px ${colors.primary})` }} />
        {/* Head */}
        <circle cx="20" cy="14" r="3.5" fill={colors.primary} />
        {/* Sword */}
        <line x1="30" y1="14" x2="30" y2="32" stroke={colors.accent || colors.primary} strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 3px ${colors.primary})` }} />
        <line x1="27" y1="20" x2="33" y2="20" stroke={colors.primary} strokeWidth="1.5" />
        {/* Light rays */}
        {[0,45,90,135,180,225,270,315].map((deg,i) => (
          <line key={i}
            x1={20 + Math.cos(deg * Math.PI/180) * 7}
            y1={10 + Math.sin(deg * Math.PI/180) * 7}
            x2={20 + Math.cos(deg * Math.PI/180) * 10}
            y2={10 + Math.sin(deg * Math.PI/180) * 10}
            stroke={colors.accent || colors.primary} strokeWidth="0.8" opacity={0.5}
            style={{ animation: `cardArtPulse ${1.5+i*0.1}s ease-in-out infinite`, animationDelay: `${i*0.08}s` }} />
        ))}
      </svg>
    );
  }

  // Blazing Titan
  if (templateId === 'h19') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 1 }}>
        <defs>
          <radialGradient id="bt-g" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(255,200,50,0.9)"/>
            <stop offset="50%" stopColor={colors.primary}/>
            <stop offset="100%" stopColor={colors.secondary} stopOpacity={0}/>
          </radialGradient>
        </defs>
        {/* Flame aura */}
        <circle cx="20" cy="20" r="17" fill={`url(#bt-g)`} opacity={0.4}
          style={{ animation: 'cardArtPulse 1s ease-in-out infinite' }} />
        {/* Titan body */}
        <polygon points="20,6 28,14 32,26 20,34 8,26 12,14" fill={colors.primary}
          style={{ filter: `drop-shadow(0 0 6px ${colors.primary})` }} />
        {/* Flame crown */}
        {[12,16,20,24,28].map((x,i) => (
          <polygon key={i} points={`${x},8 ${x-2},4 ${x+2},4`} fill={colors.accent || 'rgba(255,220,60,0.9)'}
            style={{ animation: `cardArtPulse ${0.6+i*0.1}s ease-in-out infinite`, animationDelay: `${i*0.08}s` }} />
        ))}
        {/* Core emblem */}
        <circle cx="20" cy="20" r="4" fill={colors.accent || 'rgba(255,200,50,0.8)'}
          style={{ animation: 'cardArtPulse 0.9s ease-in-out infinite' }} />
      </svg>
    );
  }

  // Ash Phantom — void stealth
  if (templateId === 'h20') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <radialGradient id="ap-g" cx="50%" cy="40%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity={0.8}/>
            <stop offset="100%" stopColor={colors.secondary} stopOpacity={0}/>
          </radialGradient>
        </defs>
        {/* Wispy trails */}
        <path d="M20,35 Q12,28 14,20 Q18,24 20,18 Q22,24 26,20 Q28,28 20,35Z" fill="url(#ap-g)"
          style={{ animation: 'cardArtPulse 1.8s ease-in-out infinite' }} />
        {/* Phantom form */}
        <ellipse cx="20" cy="18" rx="7" ry="9" fill={colors.primary} opacity={0.6} />
        {/* Eyes */}
        <ellipse cx="17" cy="16" rx="2" ry="1.5" fill={colors.accent || 'white'} opacity={0.9} />
        <ellipse cx="23" cy="16" rx="2" ry="1.5" fill={colors.accent || 'white'} opacity={0.9} />
        {/* Ash particles */}
        {[{x:8,y:14},{x:32,y:12},{x:10,y:28},{x:34,y:24},{x:14,y:6},{x:28,y:8}].map((p,i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1" fill={colors.primary} opacity={0.4}
            style={{ animation: `cardArtPulse ${1+i*0.2}s ease-in-out infinite`, animationDelay: `${i*0.15}s` }} />
        ))}
      </svg>
    );
  }

  // Cinder Hound — fire beast
  if (templateId === 'c12') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <linearGradient id="ch-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,150,30,0.9)"/>
            <stop offset="100%" stopColor={colors.primary}/>
          </linearGradient>
        </defs>
        {/* Body */}
        <ellipse cx="20" cy="24" rx="10" ry="7" fill="url(#ch-g)" />
        {/* Head */}
        <ellipse cx="28" cy="18" rx="6" ry="5" fill={colors.primary} />
        {/* Ears */}
        <polygon points="25,14 23,10 28,12" fill={colors.primary} />
        <polygon points="31,14 29,10 33,13" fill={colors.primary} />
        {/* Maw */}
        <path d="M26,20 Q28,22 31,20" fill="none" stroke="rgba(255,200,50,0.8)" strokeWidth="1" />
        {/* Legs */}
        {[12,17,22,27].map((x,i) => (
          <rect key={i} x={x} y={29} width={3} height={5} rx={1} fill={colors.primary} />
        ))}
        {/* Flame tail */}
        <path d="M10,22 Q4,18 6,12 Q10,16 12,22" fill={colors.accent || 'rgba(255,220,60,0.8)'}
          style={{ animation: 'cardArtPulse 0.8s ease-in-out infinite' }} />
      </svg>
    );
  }

  // Swamp Stalker — poison beast
  if (templateId === 'c13') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <linearGradient id="ss-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primary}/>
            <stop offset="100%" stopColor={colors.secondary}/>
          </linearGradient>
        </defs>
        {/* Crouching body */}
        <ellipse cx="20" cy="25" rx="10" ry="7" fill="url(#ss-g)" />
        {/* Head low to ground */}
        <ellipse cx="30" cy="23" rx="5" ry="4" fill={colors.primary} />
        {/* Eyes glow */}
        <circle cx="31" cy="21" r="1.5" fill={colors.accent || 'rgba(200,255,50,0.9)'}
          style={{ animation: 'cardArtPulse 1.5s ease-in-out infinite' }} />
        <circle cx="28" cy="21" r="1.5" fill={colors.accent || 'rgba(200,255,50,0.9)'}
          style={{ animation: 'cardArtPulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
        {/* Fangs */}
        <polygon points="29,25 27,28 31,26" fill="white" opacity={0.6} />
        {/* Legs */}
        {[10,14,18,22].map((x,i) => (
          <line key={i} x1={x+2} y1={29} x2={x} y2={35} stroke={colors.primary} strokeWidth={2} />
        ))}
        {/* Poison drip */}
        <circle cx="28" cy="28" r="1" fill={colors.accent || colors.primary} opacity={0.7}
          style={{ animation: 'cardArtPulse 2s ease-in-out infinite' }} />
      </svg>
    );
  }

  // Granite Sentinel — earth taunt
  if (templateId === 'c14') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <linearGradient id="gs-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(100,180,120,0.9)"/>
            <stop offset="100%" stopColor={colors.secondary}/>
          </linearGradient>
        </defs>
        {/* Rock body — wide and sturdy */}
        <polygon points="12,8 28,8 34,20 32,34 8,34 6,20" fill="url(#gs-g)"
          stroke={colors.primary} strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 3px ${colors.primary})` }} />
        {/* Rock texture lines */}
        <line x1="12" y1="15" x2="28" y2="15" stroke={colors.secondary} strokeWidth="1" opacity={0.4} />
        <line x1="10" y1="22" x2="30" y2="22" stroke={colors.secondary} strokeWidth="1" opacity={0.4} />
        {/* Eyes */}
        <circle cx="16" cy="16" r="2" fill={colors.accent || 'rgba(200,255,150,0.9)'}
          style={{ animation: 'cardArtPulse 3s ease-in-out infinite' }} />
        <circle cx="24" cy="16" r="2" fill={colors.accent || 'rgba(200,255,150,0.9)'}
          style={{ animation: 'cardArtPulse 3s ease-in-out infinite', animationDelay: '0.2s' }} />
        {/* Moss patches */}
        {[{x:14,y:26},{x:22,y:28},{x:26,y:22}].map((p,i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx="2.5" ry="1.5" fill={colors.primary} opacity={0.5} />
        ))}
      </svg>
    );
  }

  // Hollow Knight — shadow stealth
  if (templateId === 'c15') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <linearGradient id="hk-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(80,80,100,0.9)"/>
            <stop offset="100%" stopColor="rgba(20,20,30,0.8)"/>
          </linearGradient>
        </defs>
        {/* Cloaked silhouette */}
        <path d="M14,8 Q20,4 26,8 L30,30 Q20,36 10,30 Z" fill="url(#hk-g)"
          style={{ filter: `drop-shadow(0 0 4px ${colors.primary})` }} />
        {/* Hollow mask */}
        <ellipse cx="20" cy="16" rx="5" ry="6" fill="rgba(10,10,20,0.9)" />
        {/* Glowing eyes */}
        <ellipse cx="18" cy="15" rx="1.5" ry="1" fill={colors.primary}
          style={{ animation: 'cardArtPulse 2s ease-in-out infinite' }} />
        <ellipse cx="22" cy="15" rx="1.5" ry="1" fill={colors.primary}
          style={{ animation: 'cardArtPulse 2s ease-in-out infinite', animationDelay: '0.15s' }} />
        {/* Ghostly blade */}
        <line x1="28" y1="14" x2="36" y2="28" stroke={colors.primary} strokeWidth="1.5" opacity={0.7}
          style={{ animation: 'cardArtPulse 2.5s ease-in-out infinite' }} />
        <polygon points="36,28 33,25 35,22" fill={colors.primary} opacity={0.7} />
        {/* Particles */}
        {[{x:8,y:12},{x:12,y:32},{x:32,y:10}].map((p,i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1" fill={colors.primary} opacity={0.4}
            style={{ animation: `cardArtPulse ${1.5+i*0.3}s ease-in-out infinite` }} />
        ))}
      </svg>
    );
  }

  // Thornback — poison taunt
  if (templateId === 'h15') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ padding: 2 }}>
        <defs>
          <linearGradient id="tb-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primary}/>
            <stop offset="100%" stopColor={colors.secondary}/>
          </linearGradient>
        </defs>
        {/* Armored shell */}
        <ellipse cx="20" cy="22" rx="12" ry="10" fill="url(#tb-g)"
          stroke={colors.primary} strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 3px ${colors.primary})` }} />
        {/* Thorns */}
        {[{x:10,y:14,a:'-30'},{x:20,y:12,a:'0'},{x:30,y:14,a:'30'},{x:8,y:22,a:'-60'},{x:32,y:22,a:'60'}].map((t,i) => (
          <polygon key={i} points={`${t.x},${t.y} ${t.x-2},${t.y+5} ${t.x+2},${t.y+5}`}
            fill={colors.accent || colors.primary} opacity={0.8}
            transform={`rotate(${t.a} ${t.x} ${t.y+3})`} />
        ))}
        {/* Face */}
        <circle cx="16" cy="20" r="1.5" fill={colors.accent || 'rgba(200,255,50,0.9)'} />
        <circle cx="24" cy="20" r="1.5" fill={colors.accent || 'rgba(200,255,50,0.9)'} />
        {/* Poison glands */}
        <circle cx="20" cy="28" r="2" fill={colors.accent || colors.primary} opacity={0.6}
          style={{ animation: 'cardArtPulse 2s ease-in-out infinite' }} />
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
