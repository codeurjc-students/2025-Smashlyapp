import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { sileo } from 'sileo';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
`;

const Card = styled(motion.div)`
  background: white;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 450px;
  border: 1px solid #f1f5f9;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 2rem;
  transition: all 0.2s ease;

  &:hover {
    color: #16a34a;
    transform: translateX(-4px);
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.75rem;
`;

const Description = styled.p`
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
`;

const InputWrapper = styled.div<{ $hasError?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 1rem;
    color: ${props => props.$hasError ? '#ef4444' : '#94a3b8'};
    transition: color 0.2s ease;
  }
`;

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border-radius: 12px;
  border: 1.5px solid ${props => props.$hasError ? '#fca5a5' : '#e2e8f0'};
  background: ${props => props.$hasError ? '#fef2f2' : 'white'};
  font-size: 1rem;
  transition: all 0.2s ease;
  color: #1e293b;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ef4444' : '#16a34a'};
    box-shadow: 0 0 0 4px ${props => props.$hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(22, 163, 74, 0.1)'};
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const SubmitButton = styled.button`
  background: #16a34a;
  color: white;
  padding: 0.875rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background: #15803d;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SuccessState = styled(motion.div)`
  text-align: center;
  padding: 1rem 0;
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f0fdf4;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.5rem;
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, indica tu correo electrónico');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH_RESET_PASSWORD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No pudimos procesar tu solicitud');
      }

      setSuccess(true);
      sileo.success({
        title: '¡Enviado!',
        description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
      });
    } catch (err: any) {
      setError(err.message);
      sileo.error({
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <BackLink to="/">
          <FiArrowLeft /> Volver al inicio
        </BackLink>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Title>¿Olvidaste tu contraseña?</Title>
              <Description>
                No te preocupes. Introduce tu correo electrónico y te enviaremos un enlace para que puedas recuperar el acceso a tu cuenta.
              </Description>

              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <InputWrapper $hasError={!!error}>
                    <FiMail />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      $hasError={!!error}
                      disabled={loading}
                    />
                  </InputWrapper>
                  {error && (
                    <ErrorText>
                      <FiAlertCircle size={12} /> {error}
                    </ErrorText>
                  )}
                </FormGroup>

                <SubmitButton type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <FiLoader />
                      </motion.div>
                      Enviando...
                    </>
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </SubmitButton>
              </Form>
            </motion.div>
          ) : (
            <SuccessState
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <SuccessIcon>
                <FiCheckCircle />
              </SuccessIcon>
              <Title>¡Revisa tu correo!</Title>
              <Description>
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>. 
                Sigue las instrucciones del mensaje para restablecer tu contraseña.
              </Description>
              <Description style={{ fontSize: '0.875rem' }}>
                ¿No has recibido nada? Revisa tu carpeta de spam o inténtalo de nuevo en unos minutos.
              </Description>
              <SubmitButton 
                as={Link} 
                to="/" 
                style={{ textDecoration: 'none', background: '#f1f5f9', color: '#475569' }}
              >
                Volver a la página principal
              </SubmitButton>
            </SuccessState>
          )}
        </AnimatePresence>
      </Card>
    </PageContainer>
  );
};

export default ForgotPasswordPage;
