import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

const Card = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(22, 163, 74, 0.15);
    border-color: #16a34a;

    .icon-container {
      background: #16a34a;
      color: white;
      transform: scale(1.1);
    }
  }
`;

const IconContainer = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 15px;
  background: #f0fdf4;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  transition: all 0.3s ease;
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

interface QuickActionCardProps {
  icon: IconType;
  title: string;
  description: string;
  onClick: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <IconContainer className="icon-container">
        <Icon />
      </IconContainer>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Card>
  );
};
