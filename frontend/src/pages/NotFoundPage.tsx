import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiHome, FiSearch } from 'react-icons/fi';

const Container = styled.div`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
`;

const Card = styled.div`
  background: white;
  border-radius: 24px;
  padding: clamp(2rem, 5vw, 3rem);
  max-width: 480px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(22, 163, 74, 0.08);
  border: 1px solid #dcfce7;
  position: relative;
  overflow: hidden;
`;

const Emoji = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.75rem;
`;

const Description = styled.p`
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #16a34a;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
    transform: translateY(-2px);
    text-decoration: none;
    color: white;
  }
`;

const SecondaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #374151;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;

  &:hover {
    border-color: #16a34a;
    color: #16a34a;
    transform: translateY(-2px);
    text-decoration: none;
  }
`;

export default function NotFoundPage() {
  return (
    <Container>
      <Card>
        <Emoji>🎾</Emoji>
        <Title>Página no encontrada</Title>
        <Description>
          Parece que esta pala no está en nuestro catálogo... o quizás la URL que buscas ya no
          existe.
        </Description>
        <Actions>
          <PrimaryBtn to='/'>
            <FiHome size={16} />
            Ir al inicio
          </PrimaryBtn>
          <SecondaryBtn to='/catalog'>
            <FiSearch size={16} />
            Ver catálogo
          </SecondaryBtn>
        </Actions>
      </Card>
    </Container>
  );
}
