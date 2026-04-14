import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const RotatingContainer = styled.span`
  color: #fbbf24;
  display: block;
  text-align: center;
  white-space: nowrap;
  will-change: transform, opacity;

  @media (max-width: 640px) {
    font-size: 0.9em;
    white-space: normal;
    max-width: 90vw;
  }

  @media (max-width: 480px) {
    font-size: 0.85em;
  }
`;

const PhraseItem = styled(motion.span)`
  display: inline-block;
  will-change: transform, opacity;
`;

interface RotatingPhrasesProps {
  phrases: string[];
}

const RotatingPhrases: React.FC<RotatingPhrasesProps> = ({ phrases }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(id);
  }, [phrases.length]);

  return (
    <RotatingContainer aria-live='polite'>
      <AnimatePresence mode='wait'>
        <PhraseItem
          key={phrases[phraseIndex]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {phrases[phraseIndex]}
        </PhraseItem>
      </AnimatePresence>
    </RotatingContainer>
  );
};

export default React.memo(RotatingPhrases);
