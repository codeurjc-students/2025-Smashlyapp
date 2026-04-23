import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiLoader, FiShield } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
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

const HeaderIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #f0fdf4;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
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
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
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

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    color: #64748b;
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
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
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

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const PasswordStrength = styled.div<{ $strength: number }>`
  height: 4px;
  width: 100%;
  background: #e2e8f0;
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => (props.$strength / 4) * 100}%;
    background: ${props => {
      if (props.$strength <= 1) return '#ef4444';
      if (props.$strength <= 2) return '#f59e0b';
      if (props.$strength <= 3) return '#3b82f6';
      return '#16a34a';
    }};
    transition: all 0.3s ease;
  }
`;

const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Supabase redirects with token in hash: #access_token=...&type=recovery
    const hash = location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const type = params.get('type');

      if (accessToken && type === 'recovery') {
        setToken(accessToken);
      } else if (!accessToken) {
        setError('El enlace de recuperación es inválido o ha expirado.');
      }
    } else {
      setError('No se ha encontrado un token de recuperación válido.');
    }
  }, [location]);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 6) score++;
    if (pass.length > 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Z0-9]/i.test(pass)) score++;
    return score;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
        setError('No tienes un token válido para realizar esta acción.');
        return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH_UPDATE_PASSWORD), {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al actualizar la contraseña');
      }

      sileo.success({
        title: '¡Contraseña actualizada!',
        description: 'Tu contraseña se ha cambiado correctamente. Ya puedes iniciar sesión.',
      });

      // Redirigir al inicio (el modal de login se puede abrir allí)
      navigate('/');
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <HeaderIcon>
          <FiShield />
        </HeaderIcon>
        
        <Title>Nueva Contraseña</Title>
        <Description>
          Introduce tu nueva contraseña a continuación. Asegúrate de que sea segura y difícil de adivinar.
        </Description>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <InputWrapper $hasError={!!error && error.includes('contraseña')}>
              <FiLock />
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                $hasError={!!error && error.includes('contraseña')}
                disabled={loading || !token}
              />
              <PasswordToggle type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </PasswordToggle>
            </InputWrapper>
            <PasswordStrength $strength={calculateStrength(newPassword)} />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
            <InputWrapper $hasError={!!error && error.includes('coinciden')}>
              <FiLock />
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                $hasError={!!error && error.includes('coinciden')}
                disabled={loading || !token}
              />
            </InputWrapper>
            {error && (
              <ErrorText>
                <FiAlertCircle size={12} /> {error}
              </ErrorText>
            )}
          </FormGroup>

          <SubmitButton type="submit" disabled={loading || !token}>
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <FiLoader />
                </motion.div>
                Actualizando...
              </>
            ) : (
              'Cambiar contraseña'
            )}
          </SubmitButton>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default UpdatePasswordPage;
