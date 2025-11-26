import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const Percentage = styled.span<{ $percentage: number }>`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => 
    props.$percentage >= 80 ? '#16a34a' : 
    props.$percentage >= 50 ? '#f59e0b' : 
    '#ef4444'
  };
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressBarFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: ${props => 
    props.$percentage >= 80 ? '#16a34a' : 
    props.$percentage >= 50 ? '#f59e0b' : 
    '#ef4444'
  };
  width: ${props => props.$percentage}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;

const Suggestions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Suggestion = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '•';
    color: #16a34a;
    font-weight: bold;
  }
`;

const CompleteButton = styled.button`
  margin-top: 1rem;
  width: 100%;
  padding: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #16a34a;
  color: #16a34a;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dcfce7;
  }
`;

interface ProfileCompletionBarProps {
  percentage: number;
  suggestions: string[];
}

export const ProfileCompletionBar: React.FC<ProfileCompletionBarProps> = ({
  percentage,
  suggestions,
}) => {
  const navigate = useNavigate();

  return (
    <Container>
      <Header>
        <Title>Completitud del perfil</Title>
        <Percentage $percentage={percentage}>{percentage}%</Percentage>
      </Header>
      
      <ProgressBarContainer>
        <ProgressBarFill $percentage={percentage} />
      </ProgressBarContainer>

      {suggestions.length > 0 && percentage < 100 && (
        <>
          <Suggestions>
            {suggestions.map((suggestion, index) => (
              <Suggestion key={index}>{suggestion}</Suggestion>
            ))}
          </Suggestions>
          
          <CompleteButton onClick={() => navigate('/profile')}>
            Completar perfil
          </CompleteButton>
        </>
      )}

      {percentage === 100 && (
        <Suggestion style={{ color: '#16a34a', fontWeight: 600 }}>
          {suggestions[0] || '¡Tu perfil está completo!'}
        </Suggestion>
      )}
    </Container>
  );
};
