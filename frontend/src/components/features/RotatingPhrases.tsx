import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';

const RotatingContainer = styled.span`
  color: #fbbf24;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  min-height: 1.4em;
  position: relative;
  contain: layout paint;

  @media (max-width: 640px) {
    font-size: 0.9em;
    white-space: normal;
    max-width: 90vw;
    min-width: 140px;
  }

  @media (max-width: 480px) {
    font-size: 0.85em;
    min-width: 120px;
  }
`;

const PhraseWrapper = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 1.4em;
`;

const PhraseItem = styled(motion.span)`
  position: absolute;
  left: 0;
  top: 0;
  white-space: nowrap;
  will-change: transform, opacity;
`;

interface RotatingPhrasesProps {
  phrases: string[];
}

const RotatingPhrases: React.FC<RotatingPhrasesProps> = ({ phrases }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(id);
  }, [phrases.length, mounted]);

  const longestPhrase = useMemo(() => {
    return Math.max(...phrases.map(p => p.length));
  }, [phrases]);

  if (!mounted) {
    return (
      <RotatingContainer aria-live='polite'>
        <PhraseWrapper style={{ minWidth: `${longestPhrase * 0.6}ch` }}>
          {phrases[0]}
        </PhraseWrapper>
      </RotatingContainer>
    );
  }

  return (
    <RotatingContainer aria-live='polite'>
      <PhraseWrapper style={{ minWidth: `${longestPhrase * 0.6}ch` }}>
        <AnimatePresence mode='wait'>
          <PhraseItem
            key={phraseIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {phrases[phraseIndex]}
          </PhraseItem>
        </AnimatePresence>
      </PhraseWrapper>
    </RotatingContainer>
  );
};

export default React.memo(RotatingPhrases);
