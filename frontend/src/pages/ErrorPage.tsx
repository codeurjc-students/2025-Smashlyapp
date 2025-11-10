import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const ErrorCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const ErrorCode = styled.h1`
  font-size: 6rem;
  margin: 0;
  color: #667eea;
  font-weight: 700;
`;

const ErrorTitle = styled.h2`
  font-size: 1.8rem;
  margin: 1rem 0;
  color: #2d3748;
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  color: #4a5568;
  margin: 1.5rem 0;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
  ` : `
    background: #e2e8f0;
    color: #2d3748;

    &:hover {
      background: #cbd5e0;
    }
  `}
`;

interface ErrorInfo {
  code: string;
  title: string;
  message: string;
}

const errorTypes: Record<string, ErrorInfo> = {
  '403': {
    code: '403',
    title: 'Acceso Denegado',
    message: 'Lo sentimos, no tienes permisos para acceder a esta página. Si crees que esto es un error, contacta con el administrador.',
  },
  '404': {
    code: '404',
    title: 'Página No Encontrada',
    message: 'La página que buscas no existe o ha sido movida. Verifica la URL o regresa a la página principal.',
  },
  '500': {
    code: '500',
    title: 'Error del Servidor',
    message: 'Ha ocurrido un error en el servidor. Nuestro equipo ha sido notificado y está trabajando para solucionarlo.',
  },
  'unauthorized': {
    code: '401',
    title: 'No Autorizado',
    message: 'Debes iniciar sesión para acceder a esta página.',
  },
  'default': {
    code: 'ERROR',
    title: 'Ha Ocurrido un Error',
    message: 'Algo salió mal. Por favor, intenta nuevamente más tarde.',
  },
};

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorType = searchParams.get('type') || 'default';
  const customMessage = searchParams.get('message');

  const error = errorTypes[errorType] || errorTypes['default'];

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <ErrorContainer>
      <ErrorCard>
        <ErrorCode>{error.code}</ErrorCode>
        <ErrorTitle>{error.title}</ErrorTitle>
        <ErrorMessage>
          {customMessage || error.message}
        </ErrorMessage>
        <ButtonGroup>
          {errorType === 'unauthorized' ? (
            <>
              <Button variant="primary" onClick={handleLogin}>
                Iniciar Sesión
              </Button>
              <Button variant="secondary" onClick={handleGoHome}>
                Ir a Inicio
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={handleGoHome}>
                Ir a Inicio
              </Button>
              <Button variant="secondary" onClick={handleGoBack}>
                Volver Atrás
              </Button>
            </>
          )}
        </ButtonGroup>
      </ErrorCard>
    </ErrorContainer>
  );
};

export default ErrorPage;
