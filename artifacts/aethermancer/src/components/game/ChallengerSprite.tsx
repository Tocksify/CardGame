import React from 'react';

interface ChallengerSpriteProps {
  challengerId: string;
  mode?: 'face' | 'full';
  className?: string;
}

const sprites: Record<string, (mode: 'face' | 'full') => React.ReactNode> = {

  kael: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="kael-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a3a6e" />
          <stop offset="100%" stopColor="#060d1a" />
        </radialGradient>
        <radialGradient id="kael-face" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#c8a47a" />
          <stop offset="100%" stopColor="#8a6040" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#kael-bg)" />
      {/* Body/armor */}
      {mode === 'full' && <>
        <ellipse cx="80" cy="190" rx="55" ry="30" fill="#0d2244" />
        <rect x="42" y="130" width="76" height="70" rx="4" fill="#1a3a6e" />
        <rect x="42" y="128" width="76" height="8" fill="#c9a227" />
        <rect x="38" y="135" width="18" height="50" rx="3" fill="#1a3a6e" stroke="#c9a227" strokeWidth="1" />
        <rect x="104" y="135" width="18" height="50" rx="3" fill="#1a3a6e" stroke="#c9a227" strokeWidth="1" />
        {/* Sword */}
        <rect x="110" y="150" width="4" height="45" fill="#aabcc8" />
        <rect x="104" y="165" width="16" height="3" fill="#c9a227" />
      </>}
      {/* Neck */}
      <rect x="72" y="115" width="16" height="20" fill="#b8905a" />
      {/* Helmet */}
      <rect x="48" y="55" width="64" height="15" rx="3" fill="#3a5a8a" stroke="#c9a227" strokeWidth="1.5" />
      <rect x="50" y="45" width="60" height="25" rx="5" fill="#2a4a7a" />
      <rect x="55" y="30" width="50" height="30" rx="8" fill="#1e3a6e" stroke="#c9a227" strokeWidth="1" />
      {/* Visor slit */}
      <rect x="58" y="60" width="44" height="5" rx="2" fill="#4a8abf" opacity="0.8" />
      {/* Face */}
      <ellipse cx="80" cy="90" rx="26" ry="28" fill="url(#kael-face)" />
      {/* Eyes */}
      <ellipse cx="70" cy="85" rx="5" ry="5" fill="#2a4a80" />
      <ellipse cx="90" cy="85" rx="5" ry="5" fill="#2a4a80" />
      <ellipse cx="71" cy="84" rx="2" ry="2" fill="#fff" opacity="0.4" />
      <ellipse cx="91" cy="84" rx="2" ry="2" fill="#fff" opacity="0.4" />
      {/* Nose */}
      <path d="M79 90 l2 5 l-4 0" stroke="#7a5030" strokeWidth="1" fill="none" />
      {/* Mouth */}
      <path d="M71 101 q9 4 18 0" stroke="#7a5030" strokeWidth="1.5" fill="none" />
      {/* Hair at temples */}
      <path d="M54 72 q-4 8 0 20" stroke="#6a4020" strokeWidth="3" fill="none" />
      <path d="M106 72 q4 8 0 20" stroke="#6a4020" strokeWidth="3" fill="none" />
      {/* Helmet plume */}
      <path d="M75 30 q-8 -18 -5 -28 q10 5 10 0 q0 5 10 0 q3 10 -5 28 Z" fill="#4a7abf" opacity="0.9" />
    </svg>
  ),

  lyra: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lyra-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a3d1a" />
          <stop offset="100%" stopColor="#070f07" />
        </radialGradient>
        <radialGradient id="lyra-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#d4b080" />
          <stop offset="100%" stopColor="#a07840" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#lyra-bg)" />
      {/* Ambient nature glow */}
      <ellipse cx="80" cy="80" rx="70" ry="70" fill="#2a5a2a" opacity="0.15" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#0a1a0a" />
        <path d="M55 130 Q40 150 38 200 L122 200 Q120 150 105 130 Z" fill="#1a4a1a" />
        <path d="M55 130 Q50 145 45 200" stroke="#2a7a2a" strokeWidth="2" fill="none" />
        <path d="M105 130 Q110 145 115 200" stroke="#2a7a2a" strokeWidth="2" fill="none" />
        {/* Staff */}
        <rect x="22" y="120" width="5" height="85" rx="2" fill="#6a4a20" />
        <ellipse cx="24" cy="120" rx="8" ry="8" fill="#3aaa3a" opacity="0.8" />
        <ellipse cx="24" cy="120" rx="5" ry="5" fill="#5aff5a" opacity="0.5" />
      </>}
      <rect x="72" y="112" width="16" height="22" fill="#c09858" />
      {/* Flowing hair */}
      <path d="M45 75 Q30 100 35 130 Q50 135 55 125 Q50 100 58 80" fill="#8a4820" />
      <path d="M115 75 Q130 100 125 130 Q110 135 105 125 Q110 100 102 80" fill="#8a4820" />
      <path d="M50 68 Q50 40 80 35 Q110 40 110 68 Q108 90 80 95 Q52 90 50 68" fill="#9a5228" />
      {/* Leaf crown */}
      <path d="M55 52 Q50 35 62 40 Q65 32 72 42 Q78 28 80 42 Q86 28 88 42 Q95 32 98 40 Q110 35 105 52" fill="#2a8a2a" />
      <circle cx="80" cy="40" r="4" fill="#5adf5a" opacity="0.8" />
      {/* Face */}
      <ellipse cx="80" cy="85" rx="25" ry="30" fill="url(#lyra-face)" />
      {/* Elven ears */}
      <path d="M55 82 Q48 78 52 72 Q56 76 56 82" fill="#c09858" />
      <path d="M105 82 Q112 78 108 72 Q104 76 104 82" fill="#c09858" />
      {/* Eyes */}
      <ellipse cx="70" cy="82" rx="6" ry="6" fill="#1a7a2a" />
      <ellipse cx="90" cy="82" rx="6" ry="6" fill="#1a7a2a" />
      <ellipse cx="71" cy="80" rx="2" ry="2" fill="#fff" opacity="0.5" />
      <ellipse cx="91" cy="80" rx="2" ry="2" fill="#fff" opacity="0.5" />
      {/* Eyebrows */}
      <path d="M64 75 q6-3 12 0" stroke="#6a3810" strokeWidth="1.5" fill="none" />
      <path d="M84 75 q6-3 12 0" stroke="#6a3810" strokeWidth="1.5" fill="none" />
      <path d="M78 90 l2 4 l-3 0" stroke="#8a6030" strokeWidth="1" fill="none" />
      <path d="M70 100 q10 5 20 0" stroke="#8a6030" strokeWidth="1.5" fill="none" />
      {/* Floating leaf particles */}
      <path d="M30 60 Q35 55 38 62 Q33 65 30 60" fill="#4aaa4a" opacity="0.6" />
      <path d="M125 90 Q130 85 133 92 Q128 95 125 90" fill="#4aaa4a" opacity="0.6" />
    </svg>
  ),

  theron: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="theron-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#080808" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#theron-bg)" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="60" ry="25" fill="#111" />
        <rect x="35" y="130" width="90" height="75" rx="2" fill="#2a2a2a" stroke="#888" strokeWidth="2" />
        <rect x="35" y="128" width="90" height="6" fill="#aaa" />
        <rect x="28" y="132" width="20" height="60" rx="3" fill="#333" stroke="#888" strokeWidth="1.5" />
        <rect x="112" y="132" width="20" height="60" rx="3" fill="#333" stroke="#888" strokeWidth="1.5" />
        {/* Shield */}
        <path d="M116 148 L140 148 L140 180 L128 192 L116 180 Z" fill="#3a3a3a" stroke="#aaa" strokeWidth="2" />
        <path d="M128 152 L128 188" stroke="#888" strokeWidth="1" />
        <path d="M118 162 L138 162" stroke="#888" strokeWidth="1" />
      </>}
      <rect x="72" y="115" width="16" height="18" fill="#8a8a8a" />
      {/* Heavy helmet */}
      <rect x="44" y="45" width="72" height="75" rx="6" fill="#3a3a3a" stroke="#aaa" strokeWidth="2" />
      <rect x="44" y="45" width="72" height="12" rx="3" fill="#555" />
      {/* Visor */}
      <rect x="50" y="72" width="60" height="10" rx="2" fill="#1a1a1a" />
      <rect x="52" y="74" width="56" height="6" rx="1" fill="#2a3a4a" opacity="0.7" />
      {/* Cheek guards */}
      <rect x="44" y="80" width="18" height="30" rx="3" fill="#3a3a3a" stroke="#888" strokeWidth="1" />
      <rect x="98" y="80" width="18" height="30" rx="3" fill="#3a3a3a" stroke="#888" strokeWidth="1" />
      {/* Chin guard */}
      <rect x="50" y="105" width="60" height="10" rx="2" fill="#3a3a3a" stroke="#aaa" strokeWidth="1" />
      {/* Helmet crest */}
      <path d="M60 45 Q80 30 100 45" stroke="#aaa" strokeWidth="3" fill="none" />
      <rect x="77" y="20" width="6" height="28" fill="#888" />
      {/* Rivets */}
      <circle cx="50" cy="55" r="2" fill="#aaa" />
      <circle cx="110" cy="55" r="2" fill="#aaa" />
      <circle cx="50" cy="95" r="2" fill="#aaa" />
      <circle cx="110" cy="95" r="2" fill="#aaa" />
      {/* Eye glow through visor */}
      <rect x="56" y="74" width="20" height="4" rx="2" fill="#4a8abf" opacity="0.6" />
      <rect x="84" y="74" width="20" height="4" rx="2" fill="#4a8abf" opacity="0.6" />
    </svg>
  ),

  mira: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mira-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#3d2a0a" />
          <stop offset="100%" stopColor="#100a02" />
        </radialGradient>
        <radialGradient id="mira-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ddb882" />
          <stop offset="100%" stopColor="#a07840" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#mira-bg)" />
      {/* Lucky glow */}
      <ellipse cx="80" cy="80" rx="65" ry="65" fill="#c9a227" opacity="0.08" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#0a0500" />
        <path d="M55 132 Q45 155 42 200 L118 200 Q115 155 105 132 Z" fill="#2a1a04" />
        <rect x="55" y="130" width="50" height="6" fill="#c9a227" />
        {/* Coins hanging */}
        <circle cx="55" cy="160" r="6" fill="#c9a227" opacity="0.8" />
        <circle cx="70" cy="170" r="5" fill="#c9a227" opacity="0.7" />
        <circle cx="110" cy="155" r="6" fill="#c9a227" opacity="0.8" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#c09858" />
      {/* Curly hair */}
      <ellipse cx="80" cy="68" rx="40" ry="38" fill="#8a4820" />
      <path d="M45 78 Q38 95 42 115 Q52 112 55 100 Q50 88 55 75" fill="#7a3818" />
      <path d="M115 78 Q122 95 118 115 Q108 112 105 100 Q110 88 105 75" fill="#7a3818" />
      {/* Merchant cap */}
      <ellipse cx="80" cy="52" rx="38" ry="14" fill="#c9a227" />
      <rect x="50" y="38" width="60" height="16" rx="8" fill="#aa8a18" />
      <rect x="55" y="30" width="50" height="12" rx="4" fill="#c9a227" />
      <circle cx="80" cy="30" r="5" fill="#e0b83a" />
      {/* Clover */}
      <circle cx="80" cy="25" r="4" fill="#2a8a2a" />
      <circle cx="75" cy="22" r="4" fill="#2a8a2a" />
      <circle cx="85" cy="22" r="4" fill="#2a8a2a" />
      <circle cx="80" cy="19" r="4" fill="#2a8a2a" />
      {/* Face */}
      <ellipse cx="80" cy="87" rx="26" ry="28" fill="url(#mira-face)" />
      {/* Rosy cheeks */}
      <ellipse cx="64" cy="94" rx="6" ry="4" fill="#e09070" opacity="0.4" />
      <ellipse cx="96" cy="94" rx="6" ry="4" fill="#e09070" opacity="0.4" />
      {/* Eyes - happy */}
      <path d="M64 83 q6 -5 12 0" stroke="#6a3810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M84 83 q6 -5 12 0" stroke="#6a3810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Smile */}
      <path d="M68 99 q12 8 24 0" stroke="#8a5030" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  ),

  aldric: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="aldric-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#3a2800" />
          <stop offset="100%" stopColor="#0d0900" />
        </radialGradient>
        <radialGradient id="aldric-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#c8985a" />
          <stop offset="100%" stopColor="#8a6030" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#aldric-bg)" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#0a0600" />
        <path d="M52 128 Q40 155 38 200 L122 200 Q120 155 108 128 Z" fill="#2a1a00" />
        <path d="M52 128 L108 128" stroke="#c9a227" strokeWidth="2" />
        {/* Treasure bag */}
        <ellipse cx="35" cy="170" rx="15" ry="18" fill="#8a6030" />
        <path d="M28 156 Q35 150 42 156" stroke="#c9a227" strokeWidth="2" fill="none" />
        <circle cx="35" cy="165" r="5" fill="#c9a227" opacity="0.7" />
      </>}
      <rect x="73" y="113" width="14" height="18" fill="#b08548" />
      {/* Wild hair */}
      <path d="M48 72 Q35 55 42 38 Q52 48 55 55 Q60 42 65 52 Q68 35 75 48 Q80 30 85 48 Q90 35 95 52 Q100 42 105 55 Q108 48 118 38 Q125 55 112 72" fill="#c87820" />
      {/* Explorer hat */}
      <path d="M42 72 Q80 58 118 72 L115 78 Q80 65 45 78 Z" fill="#8a5020" />
      {/* Face */}
      <ellipse cx="80" cy="90" rx="27" ry="30" fill="url(#aldric-face)" />
      {/* Stubble */}
      <ellipse cx="80" cy="106" rx="18" ry="8" fill="#7a5030" opacity="0.3" />
      {/* Eyes - determined */}
      <ellipse cx="69" cy="85" rx="5.5" ry="5.5" fill="#4a3010" />
      <ellipse cx="91" cy="85" rx="5.5" ry="5.5" fill="#4a3010" />
      <ellipse cx="70" cy="83" rx="2" ry="2" fill="#fff" opacity="0.45" />
      <ellipse cx="92" cy="83" rx="2" ry="2" fill="#fff" opacity="0.45" />
      {/* Scar */}
      <path d="M62 80 l5 8" stroke="#7a4020" strokeWidth="1.5" />
      <path d="M77 90 l2 5 l-3 0" stroke="#8a5828" strokeWidth="1" fill="none" />
      <path d="M69 100 q11 5 22 0" stroke="#7a4818" strokeWidth="1.5" fill="none" />
      {/* Coins floating */}
      <circle cx="130" cy="60" r="6" fill="#c9a227" opacity="0.6" />
      <circle cx="140" cy="80" r="4" fill="#c9a227" opacity="0.5" />
      <circle cx="25" cy="75" r="5" fill="#c9a227" opacity="0.55" />
    </svg>
  ),

  sessa: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sessa-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2a0a3d" />
          <stop offset="100%" stopColor="#080010" />
        </radialGradient>
        <radialGradient id="sessa-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#d4a8c0" />
          <stop offset="100%" stopColor="#9a6888" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#sessa-bg)" />
      {/* Card sparkles */}
      <circle cx="30" cy="40" r="2" fill="#c9a227" opacity="0.7" />
      <circle cx="135" cy="60" r="2" fill="#c9a227" opacity="0.6" />
      <circle cx="20" cy="100" r="1.5" fill="#aa7aff" opacity="0.7" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#0a0010" />
        <path d="M52 130 Q42 155 40 200 L120 200 Q118 155 108 130 Z" fill="#1a0a2a" />
        {/* Floating cards */}
        <rect x="105" y="145" width="28" height="40" rx="2" fill="#2a0a4a" stroke="#aa7aff" strokeWidth="1.5" transform="rotate(15, 119, 165)" />
        <rect x="28" y="155" width="22" height="32" rx="2" fill="#2a0a4a" stroke="#c9a227" strokeWidth="1.5" transform="rotate(-10, 39, 171)" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#c09898" />
      {/* Dark flowing hair */}
      <path d="M46 72 Q30 90 32 130 Q50 128 52 115 Q48 95 55 78" fill="#1a0a2a" />
      <path d="M114 72 Q130 90 128 130 Q110 128 108 115 Q112 95 105 78" fill="#1a0a2a" />
      <ellipse cx="80" cy="68" rx="38" ry="36" fill="#1a0a2a" />
      {/* Card motif headpiece */}
      <rect x="62" y="35" width="18" height="24" rx="2" fill="#2a0a4a" stroke="#c9a227" strokeWidth="1.5" />
      <path d="M68 42 L71 48 L74 42 L71 36 Z" fill="#e05050" />
      <rect x="80" y="38" width="18" height="24" rx="2" fill="#2a0a4a" stroke="#aa7aff" strokeWidth="1.5" />
      <path d="M86 50 L89 44 L92 50 L89 56 Z" fill="#aa7aff" />
      {/* Face */}
      <ellipse cx="80" cy="88" rx="25" ry="28" fill="url(#sessa-face)" />
      {/* Mysterious eyes */}
      <ellipse cx="69" cy="84" rx="6" ry="6" fill="#5a2a7a" />
      <ellipse cx="91" cy="84" rx="6" ry="6" fill="#5a2a7a" />
      <ellipse cx="70" cy="82" rx="2.5" ry="2.5" fill="#fff" opacity="0.6" />
      <ellipse cx="92" cy="82" rx="2.5" ry="2.5" fill="#fff" opacity="0.6" />
      {/* Eyeshadow */}
      <ellipse cx="69" cy="82" rx="7" ry="3" fill="#4a1a6a" opacity="0.4" />
      <ellipse cx="91" cy="82" rx="7" ry="3" fill="#4a1a6a" opacity="0.4" />
      <path d="M78 92 l2 5 l-4 0" stroke="#9a6888" strokeWidth="1" fill="none" />
      <path d="M70 101 q10 4 20 0" stroke="#9a5878" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  vorn: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vorn-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0a1a3d" />
          <stop offset="100%" stopColor="#020408" />
        </radialGradient>
        <radialGradient id="vorn-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#b89a70" />
          <stop offset="100%" stopColor="#7a6040" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#vorn-bg)" />
      {/* Lightning ambient */}
      <path d="M20 20 L35 45 L25 45 L40 70" stroke="#4a8aff" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M130 30 L118 55 L128 55 L112 80" stroke="#4a8aff" strokeWidth="1.5" fill="none" opacity="0.4" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#030508" />
        <path d="M52 130 Q42 155 40 200 L120 200 Q118 155 108 130 Z" fill="#0a1428" />
        <path d="M52 130 L108 130" stroke="#4a8aff" strokeWidth="1.5" />
        {/* Shoulder armor with lightning */}
        <ellipse cx="42" cy="145" rx="18" ry="12" fill="#1a2a4a" stroke="#4a8aff" strokeWidth="1.5" />
        <ellipse cx="118" cy="145" rx="18" ry="12" fill="#1a2a4a" stroke="#4a8aff" strokeWidth="1.5" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#a09060" />
      {/* Shaved head */}
      <ellipse cx="80" cy="75" rx="30" ry="35" fill="#9a7848" />
      {/* Lightning scar */}
      <path d="M68 52 L76 68 L70 68 L80 85" stroke="#4a8aff" strokeWidth="2.5" fill="none" opacity="0.9" />
      {/* Stubble */}
      <ellipse cx="80" cy="105" rx="24" ry="10" fill="#5a4020" opacity="0.4" />
      {/* Face */}
      <ellipse cx="80" cy="88" rx="26" ry="28" fill="url(#vorn-face)" />
      {/* Scar re-overlay on face */}
      <path d="M72 70 L78 82 L74 82 L80 94" stroke="#4a8aff" strokeWidth="2" fill="none" opacity="0.7" />
      {/* Eyes - steely */}
      <ellipse cx="68" cy="85" rx="6" ry="5.5" fill="#1a3a6a" />
      <ellipse cx="92" cy="85" rx="6" ry="5.5" fill="#1a3a6a" />
      <ellipse cx="69" cy="83" rx="2.5" ry="2" fill="#fff" opacity="0.5" />
      <ellipse cx="93" cy="83" rx="2.5" ry="2" fill="#fff" opacity="0.5" />
      {/* Blue glow in eyes */}
      <ellipse cx="68" cy="85" rx="3" ry="3" fill="#4a8aff" opacity="0.3" />
      <ellipse cx="92" cy="85" rx="3" ry="3" fill="#4a8aff" opacity="0.3" />
      <path d="M77 93 l3 5 l-5 0" stroke="#7a5830" strokeWidth="1" fill="none" />
      <path d="M68 102 q12 4 24 0" stroke="#6a4820" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  rook: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rook-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2a1e0e" />
          <stop offset="100%" stopColor="#080503" />
        </radialGradient>
        <radialGradient id="rook-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#b8947a" />
          <stop offset="100%" stopColor="#7a5838" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#rook-bg)" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#060402" />
        <path d="M50 130 Q40 158 38 200 L122 200 Q120 158 110 130 Z" fill="#1a1206" />
        {/* Trophy/medal on chest */}
        <circle cx="80" cy="158" r="12" fill="#c9a227" opacity="0.8" />
        <circle cx="80" cy="158" r="8" fill="#aa8820" opacity="0.9" />
        <path d="M74 153 L80 148 L86 153 L84 162 L76 162 Z" fill="#c9a227" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#a88060" />
      {/* Short grey hair */}
      <ellipse cx="80" cy="68" rx="32" ry="30" fill="#666" />
      <path d="M48 72 Q40 85 42 105 Q55 108 57 95" fill="#555" />
      <path d="M112 72 Q120 85 118 105 Q105 108 103 95" fill="#555" />
      {/* Battle scars */}
      <path d="M58 75 l6 10" stroke="#6a3a1a" strokeWidth="2" opacity="0.7" />
      <path d="M100 80 l4 8" stroke="#6a3a1a" strokeWidth="1.5" opacity="0.6" />
      {/* Face - weathered */}
      <ellipse cx="80" cy="89" rx="27" ry="30" fill="url(#rook-face)" />
      {/* Wrinkles */}
      <path d="M58 82 q4-2 6 0" stroke="#8a5838" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M96 82 q4-2 6 0" stroke="#8a5838" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M62 92 q3 1 5 0" stroke="#8a5838" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Eyes - stoic */}
      <ellipse cx="68" cy="85" rx="6" ry="5.5" fill="#5a4028" />
      <ellipse cx="92" cy="85" rx="6" ry="5.5" fill="#5a4028" />
      <ellipse cx="69" cy="83" rx="2" ry="2" fill="#fff" opacity="0.4" />
      <ellipse cx="93" cy="83" rx="2" ry="2" fill="#fff" opacity="0.4" />
      {/* Beard */}
      <path d="M57 102 Q80 118 103 102 Q100 112 80 120 Q60 112 57 102" fill="#888" opacity="0.8" />
      <path d="M79 93 l2 5 l-4 0" stroke="#6a4828" strokeWidth="1" fill="none" />
    </svg>
  ),

  draela: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="draela-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0a1a2a" />
          <stop offset="100%" stopColor="#020508" />
        </radialGradient>
        <radialGradient id="draela-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#d8e8f8" />
          <stop offset="100%" stopColor="#9abaca" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#draela-bg)" />
      {/* Spirit wisps */}
      <ellipse cx="30" cy="50" rx="12" ry="18" fill="#aad8ff" opacity="0.15" />
      <ellipse cx="130" cy="70" rx="10" ry="16" fill="#aad8ff" opacity="0.15" />
      <ellipse cx="20" cy="130" rx="8" ry="14" fill="#aad8ff" opacity="0.12" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#020508" />
        <path d="M52 128 Q38 158 35 200 L125 200 Q122 158 108 128 Z" fill="#0a1420" opacity="0.9" />
        {/* Ghostly robe */}
        <path d="M52 128 Q40 160 38 200" stroke="#aad8ff" strokeWidth="1" fill="none" opacity="0.3" />
        <path d="M108 128 Q120 160 122 200" stroke="#aad8ff" strokeWidth="1" fill="none" opacity="0.3" />
        {/* Spirit orb */}
        <circle cx="32" cy="160" r="12" fill="#aad8ff" opacity="0.2" />
        <circle cx="32" cy="160" r="7" fill="#aad8ff" opacity="0.3" />
        <circle cx="32" cy="160" r="4" fill="#fff" opacity="0.4" />
      </>}
      <rect x="73" y="112" width="14" height="20" fill="#c8d8e8" />
      {/* Ethereal flowing hair */}
      <path d="M44 70 Q28 90 30 130 Q48 125 50 112 Q46 92 52 75" fill="#b8d0e8" opacity="0.7" />
      <path d="M116 70 Q132 90 130 130 Q112 125 110 112 Q114 92 108 75" fill="#b8d0e8" opacity="0.7" />
      <ellipse cx="80" cy="65" rx="36" ry="34" fill="#b8d0e8" opacity="0.8" />
      {/* Spirit crown */}
      <path d="M56 50 Q68 30 80 44 Q92 30 104 50" stroke="#aad8ff" strokeWidth="2" fill="none" opacity="0.8" />
      <circle cx="80" cy="38" r="5" fill="#aad8ff" opacity="0.7" />
      {/* Face */}
      <ellipse cx="80" cy="87" rx="26" ry="29" fill="url(#draela-face)" />
      {/* Glowing eyes */}
      <ellipse cx="69" cy="83" rx="7" ry="6.5" fill="#2a6aaa" />
      <ellipse cx="91" cy="83" rx="7" ry="6.5" fill="#2a6aaa" />
      <ellipse cx="69" cy="83" rx="5" ry="5" fill="#4a9add" opacity="0.8" />
      <ellipse cx="91" cy="83" rx="5" ry="5" fill="#4a9add" opacity="0.8" />
      <ellipse cx="70" cy="81" rx="2" ry="2" fill="#fff" opacity="0.9" />
      <ellipse cx="92" cy="81" rx="2" ry="2" fill="#fff" opacity="0.9" />
      {/* Spirit aura around eyes */}
      <ellipse cx="69" cy="83" rx="9" ry="8" fill="#4a9add" opacity="0.12" />
      <ellipse cx="91" cy="83" rx="9" ry="8" fill="#4a9add" opacity="0.12" />
      <path d="M78 92 l2 5 l-4 0" stroke="#8aaabb" strokeWidth="1" fill="none" />
      <path d="M70 101 q10 4 20 0" stroke="#8aaabb" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  nyx: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nyx-bg" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#0a0a14" />
          <stop offset="100%" stopColor="#020204" />
        </radialGradient>
        <radialGradient id="nyx-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#c8c0d8" />
          <stop offset="100%" stopColor="#888098" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#nyx-bg)" />
      {/* Shadow wisps */}
      <ellipse cx="80" cy="80" rx="70" ry="70" fill="#1a0a2a" opacity="0.3" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#020204" />
        <path d="M45 125 Q28 158 25 200 L135 200 Q132 158 115 125 Z" fill="#080810" />
        {/* Shadow tendrils */}
        <path d="M50 150 Q30 165 25 185" stroke="#4a2a6a" strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M110 155 Q130 170 135 190" stroke="#4a2a6a" strokeWidth="2" fill="none" opacity="0.5" />
      </>}
      <rect x="73" y="110" width="14" height="20" fill="#b8b0c8" />
      {/* Hood */}
      <path d="M35 72 Q35 30 80 25 Q125 30 125 72 Q120 90 110 95 L80 98 L50 95 Q40 90 35 72" fill="#0a0818" />
      {/* Hood shadow */}
      <ellipse cx="80" cy="68" rx="34" ry="28" fill="#0a0818" />
      {/* Face in shadow */}
      <ellipse cx="80" cy="86" rx="24" ry="26" fill="url(#nyx-face)" />
      {/* Moon crescent on hood */}
      <path d="M68 38 Q80 28 92 38 Q85 32 80 34 Q75 32 68 38" fill="#c0b0e0" opacity="0.6" />
      {/* Shadow tendrils from hood */}
      <path d="M46 72 Q38 80 40 92" stroke="#2a1a4a" strokeWidth="3" fill="none" opacity="0.7" />
      <path d="M114 72 Q122 80 120 92" stroke="#2a1a4a" strokeWidth="3" fill="none" opacity="0.7" />
      {/* Sharp eyes */}
      <ellipse cx="69" cy="83" rx="7" ry="5.5" fill="#2a1a4a" />
      <ellipse cx="91" cy="83" rx="7" ry="5.5" fill="#2a1a4a" />
      <ellipse cx="69" cy="83" rx="4" ry="3" fill="#9a60c0" opacity="0.9" />
      <ellipse cx="91" cy="83" rx="4" ry="3" fill="#9a60c0" opacity="0.9" />
      <ellipse cx="70" cy="82" rx="1.5" ry="1.5" fill="#fff" opacity="0.7" />
      <ellipse cx="92" cy="82" rx="1.5" ry="1.5" fill="#fff" opacity="0.7" />
      <path d="M78 91 l2 5 l-4 0" stroke="#8880a0" strokeWidth="1" fill="none" />
      <path d="M70 100 q10 3 20 0" stroke="#7070a0" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  ferrus: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ferrus-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a0a3d" />
          <stop offset="100%" stopColor="#060008" />
        </radialGradient>
        <radialGradient id="ferrus-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#c0a8e8" />
          <stop offset="100%" stopColor="#8060b0" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#ferrus-bg)" />
      {/* Aether particles */}
      <circle cx="25" cy="45" r="3" fill="#aa60ff" opacity="0.6" />
      <circle cx="138" cy="55" r="2.5" fill="#6080ff" opacity="0.7" />
      <circle cx="15" cy="110" r="2" fill="#aa60ff" opacity="0.5" />
      <circle cx="145" cy="130" r="3" fill="#6080ff" opacity="0.5" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#060008" />
        <path d="M50 128 Q38 158 35 200 L125 200 Q122 158 110 128 Z" fill="#100820" />
        {/* Aether crystal pendant */}
        <path d="M76 148 L80 140 L84 148 L80 158 Z" fill="#aa60ff" opacity="0.8" />
        <path d="M76 148 L80 140 L84 148 L80 158 Z" fill="none" stroke="#c080ff" strokeWidth="1" />
      </>}
      <rect x="73" y="112" width="14" height="20" fill="#b090d8" />
      {/* Bald head with arcane runes */}
      <ellipse cx="80" cy="72" rx="30" ry="34" fill="#b090d8" opacity="0.9" />
      {/* Rune markings */}
      <path d="M60 58 l8 4 l-4 8 l-8 -4 Z" stroke="#aa60ff" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M92 62 l8 0 l0 8 l-8 0 Z" stroke="#6080ff" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M75 42 l5 -8 l5 8 l-5 2 Z" stroke="#c080ff" strokeWidth="1.5" fill="none" opacity="0.7" />
      {/* Face */}
      <ellipse cx="80" cy="88" rx="26" ry="28" fill="url(#ferrus-face)" />
      {/* Glowing eyes */}
      <ellipse cx="68" cy="84" rx="7" ry="7" fill="#4a1a8a" />
      <ellipse cx="92" cy="84" rx="7" ry="7" fill="#4a1a8a" />
      <ellipse cx="68" cy="84" rx="5" ry="5" fill="#aa60ff" opacity="0.9" />
      <ellipse cx="92" cy="84" rx="5" ry="5" fill="#aa60ff" opacity="0.9" />
      <ellipse cx="69" cy="82" rx="2" ry="2" fill="#fff" opacity="0.8" />
      <ellipse cx="93" cy="82" rx="2" ry="2" fill="#fff" opacity="0.8" />
      {/* Aether glow */}
      <ellipse cx="68" cy="84" rx="10" ry="10" fill="#aa60ff" opacity="0.1" />
      <ellipse cx="92" cy="84" rx="10" ry="10" fill="#aa60ff" opacity="0.1" />
      <path d="M78 94 l2 5 l-4 0" stroke="#9a70c8" strokeWidth="1" fill="none" />
      <path d="M69 103 q11 4 22 0" stroke="#8060b0" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  seraph: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="seraph-bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#2a2010" />
          <stop offset="100%" stopColor="#080604" />
        </radialGradient>
        <radialGradient id="seraph-glow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#fff8e0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="seraph-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fce8c0" />
          <stop offset="100%" stopColor="#c8a870" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#seraph-bg)" />
      <ellipse cx="80" cy="60" rx="70" ry="60" fill="url(#seraph-glow)" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#060404" />
        <path d="M52 130 Q42 158 40 200 L120 200 Q118 158 108 130 Z" fill="#1a1408" />
        <path d="M52 130 L108 130" stroke="#c9a227" strokeWidth="2" />
        {/* Wings hint */}
        <path d="M40 145 Q15 130 10 155 Q20 160 40 155" fill="#fff8e0" opacity="0.2" />
        <path d="M120 145 Q145 130 150 155 Q140 160 120 155" fill="#fff8e0" opacity="0.2" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#e8c888" />
      {/* Blonde hair */}
      <path d="M46 72 Q35 88 38 115 Q54 112 56 98 Q50 82 56 70" fill="#c9a227" />
      <path d="M114 72 Q125 88 122 115 Q106 112 104 98 Q110 82 104 70" fill="#c9a227" />
      <ellipse cx="80" cy="65" rx="34" ry="33" fill="#c9a227" />
      {/* Halo */}
      <ellipse cx="80" cy="35" rx="28" ry="8" fill="none" stroke="#ffd700" strokeWidth="3" opacity="0.9" />
      <ellipse cx="80" cy="35" rx="28" ry="8" fill="none" stroke="#fff" strokeWidth="1" opacity="0.5" />
      {/* Face */}
      <ellipse cx="80" cy="87" rx="26" ry="30" fill="url(#seraph-face)" />
      {/* Serene eyes */}
      <ellipse cx="69" cy="83" rx="6.5" ry="6.5" fill="#6aaa70" />
      <ellipse cx="91" cy="83" rx="6.5" ry="6.5" fill="#6aaa70" />
      <ellipse cx="70" cy="81" rx="2.5" ry="2.5" fill="#fff" opacity="0.6" />
      <ellipse cx="92" cy="81" rx="2.5" ry="2.5" fill="#fff" opacity="0.6" />
      {/* Small smile */}
      <path d="M72 100 q8 5 16 0" stroke="#a07840" strokeWidth="1.5" fill="none" />
      <path d="M78 92 l2 5 l-4 0" stroke="#b09050" strokeWidth="1" fill="none" />
      {/* Cross symbol */}
      <path d="M78 42 L82 42 L82 32 L78 32 Z" fill="#ffd700" opacity="0.7" />
      <path d="M74 38 L86 38 L86 34 L74 34 Z" fill="#ffd700" opacity="0.7" />
    </svg>
  ),

  auren: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="auren-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2a1a2a" />
          <stop offset="100%" stopColor="#080408" />
        </radialGradient>
        <radialGradient id="auren-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#f0d0d8" />
          <stop offset="100%" stopColor="#c09090" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#auren-bg)" />
      {/* Life energy wisps */}
      <circle cx="30" cy="55" r="4" fill="#ff80aa" opacity="0.3" />
      <circle cx="132" cy="75" r="5" fill="#80ff80" opacity="0.3" />
      <circle cx="22" cy="120" r="3" fill="#ff80aa" opacity="0.25" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#060208" />
        <path d="M52 128 Q42 155 40 200 L120 200 Q118 155 108 128 Z" fill="#1a0c18" />
        {/* Flower hem */}
        <circle cx="52" cy="195" r="6" fill="#ff80aa" opacity="0.5" />
        <circle cx="80" cy="198" r="6" fill="#80ff80" opacity="0.5" />
        <circle cx="108" cy="195" r="6" fill="#ff80aa" opacity="0.5" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#d8a0b0" />
      {/* Flowing hair */}
      <path d="M46 72 Q32 90 35 125 Q52 122 54 108 Q50 88 56 72" fill="#8a4060" />
      <path d="M114 72 Q128 90 125 125 Q108 122 106 108 Q110 88 104 72" fill="#8a4060" />
      <ellipse cx="80" cy="68" rx="36" ry="35" fill="#9a4a6a" />
      {/* Flower crown */}
      <circle cx="60" cy="48" r="7" fill="#ff80aa" />
      <circle cx="70" cy="38" r="6" fill="#ffaacc" />
      <circle cx="80" cy="34" r="7" fill="#ff6090" />
      <circle cx="90" cy="38" r="6" fill="#ffaacc" />
      <circle cx="100" cy="48" r="7" fill="#ff80aa" />
      <circle cx="60" cy="48" r="3.5" fill="#fff" opacity="0.6" />
      <circle cx="80" cy="34" r="3.5" fill="#fff" opacity="0.6" />
      <circle cx="100" cy="48" r="3.5" fill="#fff" opacity="0.6" />
      {/* Leaves between flowers */}
      <path d="M65 43 Q67 35 72 38" stroke="#2a8a2a" strokeWidth="2" fill="none" />
      <path d="M95 43 Q93 35 88 38" stroke="#2a8a2a" strokeWidth="2" fill="none" />
      {/* Face */}
      <ellipse cx="80" cy="87" rx="26" ry="30" fill="url(#auren-face)" />
      {/* Kind eyes */}
      <ellipse cx="69" cy="83" rx="6.5" ry="6.5" fill="#6a3a7a" />
      <ellipse cx="91" cy="83" rx="6.5" ry="6.5" fill="#6a3a7a" />
      <ellipse cx="70" cy="81" rx="2.5" ry="2.5" fill="#fff" opacity="0.6" />
      <ellipse cx="92" cy="81" rx="2.5" ry="2.5" fill="#fff" opacity="0.6" />
      <path d="M78 92 l2 5 l-4 0" stroke="#b07080" strokeWidth="1" fill="none" />
      <path d="M70 101 q10 5 20 0" stroke="#a06070" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  zeth: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="zeth-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0a1a1a" />
          <stop offset="100%" stopColor="#030608" />
        </radialGradient>
        <radialGradient id="zeth-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#c09a6a" />
          <stop offset="100%" stopColor="#806040" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#zeth-bg)" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#030508" />
        <path d="M50 128 Q38 158 35 200 L125 200 Q122 158 110 128 Z" fill="#0a1418" />
        {/* Dagger */}
        <rect x="108" y="140" width="5" height="50" rx="2" fill="#aabbc8" transform="rotate(15 110 165)" />
        <rect x="104" y="155" width="14" height="4" rx="1" fill="#c9a227" transform="rotate(15 111 157)" />
        {/* Gold coins scattered */}
        <circle cx="38" cy="170" r="6" fill="#c9a227" opacity="0.7" />
        <circle cx="50" cy="185" r="5" fill="#c9a227" opacity="0.6" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#b08850" />
      {/* Rogue's hat/dark hair */}
      <ellipse cx="80" cy="65" rx="35" ry="30" fill="#1a1a1a" />
      <path d="M45 70 Q35 85 40 110 Q56 108 58 95" fill="#111" />
      <path d="M115 70 Q125 85 120 110 Q104 108 102 95" fill="#111" />
      {/* Bandana */}
      <rect x="46" y="62" width="68" height="14" rx="3" fill="#1a3a3a" />
      <path d="M114 68 Q125 60 128 72 Q120 72 114 68" fill="#1a3a3a" />
      {/* Face */}
      <ellipse cx="80" cy="88" rx="27" ry="29" fill="url(#zeth-face)" />
      {/* Eye patch */}
      <ellipse cx="68" cy="83" rx="9" ry="8" fill="#0a0a0a" />
      <path d="M58 78 L78 78" stroke="#5a4020" strokeWidth="2" />
      {/* Good eye */}
      <ellipse cx="92" cy="83" rx="6.5" ry="6.5" fill="#2a5a2a" />
      <ellipse cx="93" cy="81" rx="2.5" ry="2.5" fill="#fff" opacity="0.5" />
      {/* Smirk */}
      <path d="M71 101 q12 6 20 -1" stroke="#7a5020" strokeWidth="1.5" fill="none" />
      {/* Stubble */}
      <ellipse cx="80" cy="107" rx="20" ry="9" fill="#3a2010" opacity="0.4" />
      <path d="M78 93 l2 5 l-4 0" stroke="#8a6030" strokeWidth="1" fill="none" />
    </svg>
  ),

  vael: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vael-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2a1e0a" />
          <stop offset="100%" stopColor="#080504" />
        </radialGradient>
        <radialGradient id="vael-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#d4b880" />
          <stop offset="100%" stopColor="#a08040" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#vael-bg)" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#060502" />
        <path d="M50 128 Q40 158 38 200 L122 200 Q120 158 110 128 Z" fill="#1a1208" />
        {/* Scrolls */}
        <rect x="104" y="145" width="30" height="8" rx="4" fill="#d4b880" opacity="0.7" />
        <rect x="26" y="155" width="25" height="7" rx="3" fill="#d4b880" opacity="0.6" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#c4a868" />
      {/* Scholar hair - neat, graying */}
      <ellipse cx="80" cy="68" rx="33" ry="30" fill="#8a7050" />
      <path d="M47 70 Q38 83 42 105 Q56 104 58 92 Q52 80 56 70" fill="#7a6040" />
      <path d="M113 70 Q122 83 118 105 Q104 104 102 92 Q108 80 104 70" fill="#7a6040" />
      {/* Face */}
      <ellipse cx="80" cy="88" rx="27" ry="30" fill="url(#vael-face)" />
      {/* Spectacles */}
      <circle cx="68" cy="84" r="9" fill="none" stroke="#8a7050" strokeWidth="2" />
      <circle cx="92" cy="84" r="9" fill="none" stroke="#8a7050" strokeWidth="2" />
      <path d="M77 84 L83 84" stroke="#8a7050" strokeWidth="2" />
      <path d="M59 84 L58 80" stroke="#8a7050" strokeWidth="2" />
      <path d="M101 84 L102 80" stroke="#8a7050" strokeWidth="2" />
      {/* Eyes through glasses */}
      <ellipse cx="68" cy="84" rx="5" ry="5" fill="#4a3a20" />
      <ellipse cx="92" cy="84" rx="5" ry="5" fill="#4a3a20" />
      <ellipse cx="69" cy="82" rx="2" ry="2" fill="#fff" opacity="0.4" />
      <ellipse cx="93" cy="82" rx="2" ry="2" fill="#fff" opacity="0.4" />
      {/* Thoughtful expression */}
      <path d="M77 95 l2 5 l-4 0" stroke="#8a6030" strokeWidth="1" fill="none" />
      <path d="M69 103 q11 4 22 0" stroke="#8a6030" strokeWidth="1.5" fill="none" />
      {/* Scroll symbol on forehead */}
      <path d="M75 55 Q80 50 85 55 Q85 62 80 62 Q75 62 75 55" stroke="#c9a227" strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
  ),

  malachar: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="malachar-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a1028" />
          <stop offset="100%" stopColor="#040308" />
        </radialGradient>
        <radialGradient id="malachar-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#c8a8e0" />
          <stop offset="100%" stopColor="#887098" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#malachar-bg)" />
      {/* Star particles */}
      <circle cx="20" cy="30" r="2" fill="#ffd700" opacity="0.7" />
      <circle cx="140" cy="45" r="2.5" fill="#ffd700" opacity="0.6" />
      <circle cx="15" cy="90" r="1.5" fill="#ffd700" opacity="0.5" />
      <circle cx="145" cy="100" r="2" fill="#ffd700" opacity="0.6" />
      <circle cx="30" cy="150" r="1.5" fill="#ffd700" opacity="0.4" />
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#040308" />
        <path d="M50 128 Q38 158 35 200 L125 200 Q122 158 110 128 Z" fill="#100820" />
        {/* Star constellation on robe */}
        <circle cx="65" cy="158" r="2" fill="#ffd700" opacity="0.6" />
        <circle cx="80" cy="152" r="2.5" fill="#ffd700" opacity="0.7" />
        <circle cx="95" cy="160" r="2" fill="#ffd700" opacity="0.6" />
        <path d="M65 158 L80 152 L95 160" stroke="#ffd700" strokeWidth="0.8" opacity="0.4" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#b890c8" />
      {/* Dark hair with star patterns */}
      <ellipse cx="80" cy="67" rx="36" ry="34" fill="#1a0828" />
      <path d="M44 72 Q32 88 36 118 Q54 115 56 102 Q50 85 56 72" fill="#12041c" />
      <path d="M116 72 Q128 88 124 118 Q106 115 104 102 Q110 85 104 72" fill="#12041c" />
      {/* Star markings on hair */}
      <path d="M58 55 L60 50 L62 55 L57 52 L63 52 Z" fill="#ffd700" opacity="0.7" />
      <path d="M98 50 L100 45 L102 50 L97 47 L103 47 Z" fill="#ffd700" opacity="0.6" />
      {/* Face */}
      <ellipse cx="80" cy="88" rx="26" ry="29" fill="url(#malachar-face)" />
      {/* Star on cheek */}
      <path d="M97 89 L98.5 85 L100 89 L96 87 L101 87 Z" fill="#ffd700" opacity="0.6" />
      {/* Intense eyes */}
      <ellipse cx="69" cy="84" rx="7" ry="6.5" fill="#2a1840" />
      <ellipse cx="91" cy="84" rx="7" ry="6.5" fill="#2a1840" />
      <ellipse cx="69" cy="84" rx="4.5" ry="4.5" fill="#8a40e0" opacity="0.9" />
      <ellipse cx="91" cy="84" rx="4.5" ry="4.5" fill="#8a40e0" opacity="0.9" />
      <ellipse cx="70" cy="82" rx="2" ry="2" fill="#fff" opacity="0.7" />
      <ellipse cx="92" cy="82" rx="2" ry="2" fill="#fff" opacity="0.7" />
      <path d="M78 93 l2 5 l-4 0" stroke="#9070a8" strokeWidth="1" fill="none" />
      <path d="M69 102 q11 4 22 0" stroke="#8060a0" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  solaris: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="solaris-bg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#3d2800" />
          <stop offset="100%" stopColor="#0a0600" />
        </radialGradient>
        <radialGradient id="solaris-glow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#ff8800" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ff4400" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="solaris-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff0c0" />
          <stop offset="100%" stopColor="#e0c060" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#solaris-bg)" />
      <rect width="160" height="200" fill="url(#solaris-glow)" />
      {/* Solar rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
        <line key={i}
          x1="80" y1="60"
          x2={80 + 80 * Math.cos((deg - 90) * Math.PI / 180)}
          y2={60 + 80 * Math.sin((deg - 90) * Math.PI / 180)}
          stroke="#ffd700" strokeWidth="1" opacity="0.2"
        />
      ))}
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#0a0600" />
        <path d="M50 128 Q38 155 35 200 L125 200 Q122 155 110 128 Z" fill="#2a1800" />
        <path d="M50 128 L110 128" stroke="#ffd700" strokeWidth="2" />
        {/* Solar armored shoulders */}
        <ellipse cx="38" cy="143" rx="18" ry="12" fill="#3d2800" stroke="#ffd700" strokeWidth="2" />
        <ellipse cx="122" cy="143" rx="18" ry="12" fill="#3d2800" stroke="#ffd700" strokeWidth="2" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#e0c060" />
      {/* Solar crown/hair */}
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg, i) => (
        <line key={i}
          x1="80" y1="50"
          x2={80 + 35 * Math.cos((deg - 90) * Math.PI / 180)}
          y2={50 + 35 * Math.sin((deg - 90) * Math.PI / 180)}
          stroke="#ffd700" strokeWidth="3" strokeLinecap="round" opacity="0.6"
        />
      ))}
      <ellipse cx="80" cy="65" rx="30" ry="32" fill="#e0c060" />
      {/* Radiant hair */}
      <path d="M50 70 Q38 85 40 115 Q58 110 58 96 Q53 82 56 70" fill="#e0b830" />
      <path d="M110 70 Q122 85 120 115 Q102 110 102 96 Q107 82 104 70" fill="#e0b830" />
      {/* Crown */}
      <path d="M55 50 L65 35 L75 48 L80 28 L85 48 L95 35 L105 50 Q94 44 80 44 Q66 44 55 50" fill="#ffd700" />
      <circle cx="80" cy="28" r="5" fill="#fff" opacity="0.8" />
      {/* Face */}
      <ellipse cx="80" cy="87" rx="26" ry="29" fill="url(#solaris-face)" />
      {/* Golden eyes */}
      <ellipse cx="69" cy="83" rx="7" ry="7" fill="#ff8800" />
      <ellipse cx="91" cy="83" rx="7" ry="7" fill="#ff8800" />
      <ellipse cx="69" cy="83" rx="5" ry="5" fill="#ffd700" opacity="0.9" />
      <ellipse cx="91" cy="83" rx="5" ry="5" fill="#ffd700" opacity="0.9" />
      <ellipse cx="70" cy="81" rx="2" ry="2" fill="#fff" opacity="0.9" />
      <ellipse cx="92" cy="81" rx="2" ry="2" fill="#fff" opacity="0.9" />
      <path d="M78 93 l2 5 l-4 0" stroke="#c09040" strokeWidth="1" fill="none" />
      <path d="M69 102 q11 5 22 0" stroke="#c09040" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  void_herald: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="void-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#080010" />
          <stop offset="100%" stopColor="#010002" />
        </radialGradient>
        <radialGradient id="void-face" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#080018" />
          <stop offset="100%" stopColor="#020008" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#void-bg)" />
      {/* Cosmic star field */}
      {[[20,25],[140,30],[10,80],[150,90],[25,140],[135,155],[80,15],[35,170],[125,175]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i%3===0?2:i%3===1?1.5:1} fill="#fff" opacity={0.3+i%3*0.1} />
      ))}
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#010002" />
        <path d="M45 125 Q28 155 25 200 L135 200 Q132 155 115 125 Z" fill="#050010" />
        {/* Void tendrils */}
        <path d="M45 140 Q20 160 15 185" stroke="#5a00aa" strokeWidth="3" fill="none" opacity="0.6" />
        <path d="M115 140 Q140 160 145 185" stroke="#5a00aa" strokeWidth="3" fill="none" opacity="0.6" />
        <path d="M80 140 Q80 165 80 190" stroke="#5a00aa" strokeWidth="2" fill="none" opacity="0.4" />
      </>}
      <rect x="73" y="110" width="14" height="22" fill="#2a0050" />
      {/* Void robe/cloak */}
      <path d="M35 70 Q35 25 80 20 Q125 25 125 70 Q120 95 110 100 L80 108 L50 100 Q40 95 35 70" fill="#0a0020" />
      {/* Face - a void/starfield */}
      <ellipse cx="80" cy="85" rx="26" ry="30" fill="url(#void-face)" />
      {/* Stars in face void */}
      {[[68,75],[92,78],[75,90],[88,88],[80,72],[70,96],[92,95]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i%2===0?1.5:1} fill="#fff" opacity={0.4+i%3*0.15} />
      ))}
      {/* Void eyes - glowing purple */}
      <ellipse cx="68" cy="83" rx="9" ry="8" fill="#2a006a" />
      <ellipse cx="92" cy="83" rx="9" ry="8" fill="#2a006a" />
      <ellipse cx="68" cy="83" rx="6" ry="6" fill="#7a00ff" opacity="0.9" />
      <ellipse cx="92" cy="83" rx="6" ry="6" fill="#7a00ff" opacity="0.9" />
      <ellipse cx="68" cy="83" rx="10" ry="10" fill="#7a00ff" opacity="0.15" />
      <ellipse cx="92" cy="83" rx="10" ry="10" fill="#7a00ff" opacity="0.15" />
      <ellipse cx="69" cy="81" rx="2.5" ry="2.5" fill="#fff" opacity="0.8" />
      <ellipse cx="93" cy="81" rx="2.5" ry="2.5" fill="#fff" opacity="0.8" />
      {/* Void crown/horns */}
      <path d="M56 50 Q50 25 65 32 Q68 40 70 48" fill="#1a0040" stroke="#5a00aa" strokeWidth="1.5" />
      <path d="M104 50 Q110 25 95 32 Q92 40 90 48" fill="#1a0040" stroke="#5a00aa" strokeWidth="1.5" />
      <circle cx="65" cy="28" r="4" fill="#7a00ff" opacity="0.7" />
      <circle cx="95" cy="28" r="4" fill="#7a00ff" opacity="0.7" />
    </svg>
  ),

  prime: (mode) => (
    <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="prime-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a1a2a" />
          <stop offset="100%" stopColor="#050508" />
        </radialGradient>
        <linearGradient id="prime-rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6060" />
          <stop offset="25%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#60ff60" />
          <stop offset="75%" stopColor="#6080ff" />
          <stop offset="100%" stopColor="#ff60ff" />
        </linearGradient>
        <radialGradient id="prime-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#e0e8f8" />
          <stop offset="100%" stopColor="#90a0c8" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill="url(#prime-bg)" />
      {/* Prismatic rays */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i}
          x1="80" y1="70"
          x2={80 + 90 * Math.cos((deg - 90) * Math.PI / 180)}
          y2={70 + 90 * Math.sin((deg - 90) * Math.PI / 180)}
          stroke={['#ff6060','#ffd700','#60ff60','#6080ff','#ff60ff','#60ffff','#ffd700','#ff6060'][i]}
          strokeWidth="1.5" opacity="0.25"
        />
      ))}
      {mode === 'full' && <>
        <ellipse cx="80" cy="195" rx="55" ry="25" fill="#050508" />
        <path d="M50 128 Q38 155 35 200 L125 200 Q122 155 110 128 Z" fill="#0a0a18" />
        <path d="M50 128 L110 128" stroke="url(#prime-rainbow)" strokeWidth="2" />
        {/* Crystal shoulder pads */}
        <path d="M28 140 L45 132 L50 150 L35 158 Z" fill="#1a1a2a" stroke="url(#prime-rainbow)" strokeWidth="1.5" />
        <path d="M132 140 L115 132 L110 150 L125 158 Z" fill="#1a1a2a" stroke="url(#prime-rainbow)" strokeWidth="1.5" />
      </>}
      <rect x="73" y="112" width="14" height="22" fill="#b0c0e0" />
      {/* Crystal headpiece */}
      <path d="M55 55 L65 30 L72 52 L80 22 L88 52 L95 30 L105 55" fill="none" stroke="url(#prime-rainbow)" strokeWidth="2.5" />
      <circle cx="80" cy="22" r="5" fill="#fff" opacity="0.8" />
      {/* Head */}
      <ellipse cx="80" cy="75" rx="30" ry="30" fill="#b0c0e0" />
      <path d="M50 75 Q38 90 42 115 Q58 112 58 98 Q53 85 55 75" fill="#a0b0d0" />
      <path d="M110 75 Q122 90 118 115 Q102 112 102 98 Q107 85 105 75" fill="#a0b0d0" />
      {/* Crystal facets */}
      <path d="M55 60 L65 52 L75 62" stroke="url(#prime-rainbow)" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M105 60 L95 52 L85 62" stroke="url(#prime-rainbow)" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Face */}
      <ellipse cx="80" cy="88" rx="26" ry="28" fill="url(#prime-face)" />
      {/* Prismatic eyes */}
      <ellipse cx="68" cy="84" rx="7.5" ry="7.5" fill="#1a1a2a" />
      <ellipse cx="92" cy="84" rx="7.5" ry="7.5" fill="#1a1a2a" />
      {/* Rainbow iris */}
      <ellipse cx="68" cy="84" rx="5.5" ry="5.5" fill="url(#prime-rainbow)" opacity="0.9" />
      <ellipse cx="92" cy="84" rx="5.5" ry="5.5" fill="url(#prime-rainbow)" opacity="0.9" />
      <ellipse cx="69" cy="82" rx="2" ry="2" fill="#fff" opacity="0.9" />
      <ellipse cx="93" cy="82" rx="2" ry="2" fill="#fff" opacity="0.9" />
      {/* Arcane runes on face */}
      <path d="M61 78 l4 0 l0 -4" stroke="url(#prime-rainbow)" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M99 78 l-4 0 l0 -4" stroke="url(#prime-rainbow)" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M78 95 l2 5 l-4 0" stroke="#8090b8" strokeWidth="1" fill="none" />
      <path d="M68 104 q12 5 24 0" stroke="#7080a8" strokeWidth="1.5" fill="none" />
    </svg>
  ),
};

export function ChallengerSprite({ challengerId, mode = 'full', className = '' }: ChallengerSpriteProps) {
  const renderFn = sprites[challengerId];
  if (!renderFn) {
    // Fallback generic sprite
    return (
      <svg viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'} xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="160" height="200" fill="#1a1208" />
        <ellipse cx="80" cy="80" rx="30" ry="35" fill="#c9a227" opacity="0.5" />
        <text x="80" y="85" textAnchor="middle" fill="#c9a227" fontSize="24" fontFamily="serif">?</text>
      </svg>
    );
  }
  return (
    <svg
      viewBox={mode === 'face' ? '0 0 160 120' : '0 0 160 200'}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      {renderFn(mode)}
    </svg>
  );
}
