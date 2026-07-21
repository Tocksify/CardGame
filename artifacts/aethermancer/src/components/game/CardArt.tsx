import React from 'react';
import { CardType } from '../../lib/cards';

interface CardArtProps {
  templateId: string;
  type: CardType;
}

export function CardArt({ templateId, type }: CardArtProps) {
  // Determine color palette based on type and templateId
  let colors = {
    primary: 'rgba(30, 144, 255, 0.8)',
    secondary: 'rgba(14, 165, 233, 0.5)'
  };
  
  if (['c3', 's1'].includes(templateId)) {
     colors = { primary: 'rgba(239, 68, 68, 0.8)', secondary: 'rgba(249, 115, 22, 0.5)' }; // Fire
  } else if (['c5', 's6', 's3', 'c10'].includes(templateId)) {
     colors = { primary: 'rgba(147, 51, 234, 0.8)', secondary: 'rgba(76, 29, 149, 0.5)' }; // Void/Shadow
  } else if (['a4', 'e1', 'c2'].includes(templateId)) {
     colors = { primary: 'rgba(16, 185, 129, 0.8)', secondary: 'rgba(5, 150, 105, 0.5)' }; // Nature/Earth
  } else if (['a1', 'a3', 'p3'].includes(templateId)) {
     colors = { primary: 'rgba(245, 197, 24, 0.8)', secondary: 'rgba(217, 119, 6, 0.5)' }; // Gold
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-black/50 flex items-center justify-center border-y border-white/10">
      {type === 'creature' && (
        <div 
          className="w-10 h-10 border-2 rounded-sm"
          style={{ 
            borderColor: colors.primary,
            boxShadow: `0 0 10px ${colors.secondary}, inset 0 0 10px ${colors.secondary}`,
            animation: 'cardArtRotate 10s linear infinite'
          }}
        >
          <div 
            className="w-full h-full border border-white/50 rotate-45"
            style={{ animation: 'cardArtPulse 2s ease-in-out infinite' }}
          />
        </div>
      )}
      
      {type === 'spell' && (
        <div 
          className="w-12 h-12 rounded-full blur-md"
          style={{ 
            background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, transparent, ${colors.primary})`,
            animation: 'cardArtRotate 4s linear infinite'
          }}
        />
      )}
      
      {type === 'artifact' && (
        <div 
          className="w-8 h-8 rotate-45 flex items-center justify-center"
          style={{ 
            backgroundColor: colors.primary,
            boxShadow: `0 0 15px ${colors.primary}`,
            animation: 'cardArtPulse 3s ease-in-out infinite alternate'
          }}
        >
          <div className="w-4 h-4 bg-white/50 rotate-45" />
        </div>
      )}
      
      {type === 'enchantment' && (
        <div 
          className="absolute inset-0 opacity-80"
          style={{ 
            background: `linear-gradient(45deg, transparent 20%, ${colors.primary} 50%, transparent 80%)`,
            backgroundSize: '200% 200%',
            animation: 'cardArtShimmer 2.5s ease-in-out infinite'
          }}
        />
      )}
      
      {/* Subtle overlay noise */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] pointer-events-none mix-blend-overlay"></div>
    </div>
  );
}
