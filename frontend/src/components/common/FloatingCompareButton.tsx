import React from 'react';
import styled from 'styled-components';
import { useComparison } from '../../contexts/ComparisonContext';
import { useNavigate } from 'react-router-dom';
import { FaBalanceScale } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingButton = styled(motion.button)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #16a34a;
  color: white;
  border: none;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  z-index: 1000;
  transition: all 0.3s ease;

  &:hover {
    background: #15803d;
    box-shadow: 0 12px 32px rgba(22, 163, 74, 0.4);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
    width: 56px;
    height: 56px;
    font-size: 1.25rem;
  }
`;

const Badge = styled(motion.div)`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #dc2626;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
`;

export const FloatingCompareButton: React.FC = () => {
  const { count, rackets } = useComparison();
  const navigate = useNavigate();

  if (count === 0) {
    return null; // Don't show button if no rackets in comparison
  }

  const handleClick = () => {
    navigate('/compare', { state: { rackets } });
  };

  return (
    <AnimatePresence>
      <FloatingButton
        onClick={handleClick}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={`Comparar ${count} pala${count > 1 ? 's' : ''}`}
      >
        <FaBalanceScale />
        <Badge
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {count}
        </Badge>
      </FloatingButton>
    </AnimatePresence>
  );
};
