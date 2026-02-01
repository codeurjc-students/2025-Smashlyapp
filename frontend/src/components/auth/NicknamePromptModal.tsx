import React, { useState } from 'react';
import styled from 'styled-components';
import { FiEdit2, FiCheck } from 'react-icons/fi';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const ModalDescription = styled.p`
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
`;

const NicknameSection = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid ${props => (props.$hasError ? '#ef4444' : '#e5e7eb')};
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;

  &:focus {
    border-color: ${props => (props.$hasError ? '#ef4444' : '#ccff00')};
    box-shadow: 0 0 0 3px
      ${props => (props.$hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(204, 255, 0, 0.1)')};
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const EditButton = styled.button`
  padding: 0.75rem;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ErrorText = styled.span`
  display: block;
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const SuccessText = styled.span`
  display: block;
  color: #16a34a;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props =>
    props.$variant === 'primary'
      ? `
    background: #16a34a;
    color: white;

    &:hover {
      background: #15803d;
    }

    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  `
      : `
    background: #f3f4f6;
    color: #374151;

    &:hover {
      background: #e5e7eb;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `}

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

interface NicknamePromptModalProps {
  isOpen: boolean;
  suggestedNickname: string;
  onConfirm: (nickname: string) => Promise<void>;
  onClose: () => void;
}

const NicknamePromptModal: React.FC<NicknamePromptModalProps> = ({
  isOpen,
  suggestedNickname,
  onConfirm,
  onClose,
}) => {
  const [nickname, setNickname] = useState(suggestedNickname);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const validateNickname = (value: string): boolean => {
    if (!value.trim()) {
      setError('El nickname no puede estar vacío');
      return false;
    }

    if (value.length < 3) {
      setError('El nickname debe tener al menos 3 caracteres');
      return false;
    }

    if (value.length > 20) {
      setError('El nickname no puede tener más de 20 caracteres');
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setError('El nickname solo puede contener letras, números, guiones y guiones bajos');
      return false;
    }

    setError('');
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    validateNickname(value);
  };

  const handleConfirm = async () => {
    if (!validateNickname(nickname)) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(nickname.trim());
    } catch (err: any) {
      setError(err.message || 'Error al confirmar el nickname');
      setIsLoading(false);
    }
  };

  const handleUseDefault = async () => {
    setNickname(suggestedNickname);
    setIsEditing(false);
    setError('');
    setIsLoading(true);

    try {
      await onConfirm(suggestedNickname);
    } catch (err: any) {
      setError(err.message || 'Error al confirmar el nickname');
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={e => e.target === e.currentTarget && !isLoading && onClose()}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>¡Bienvenido a Smashlyapp! 🎾</ModalTitle>
          <ModalDescription>Elige tu nickname para personalizar tu experiencia</ModalDescription>
        </ModalHeader>

        <NicknameSection>
          <Label htmlFor='nickname'>Tu Nickname</Label>
          <InputWrapper>
            <Input
              id='nickname'
              type='text'
              value={nickname}
              onChange={handleChange}
              disabled={!isEditing || isLoading}
              $hasError={!!error}
              placeholder='Elige tu nickname'
              autoFocus={isEditing}
            />
            {!isEditing && (
              <EditButton onClick={handleEdit} disabled={isLoading}>
                <FiEdit2 size={18} />
              </EditButton>
            )}
          </InputWrapper>
          {error && <ErrorText>{error}</ErrorText>}
          {!error && !isEditing && (
            <SuccessText>✓ Usando nickname sugerido de tu email</SuccessText>
          )}
        </NicknameSection>

        <ButtonGroup>
          {isEditing ? (
            <>
              <Button $variant='secondary' onClick={handleUseDefault} disabled={isLoading}>
                Usar sugerido
              </Button>
              <Button $variant='primary' onClick={handleConfirm} disabled={isLoading || !!error}>
                {isLoading ? 'Guardando...' : 'Confirmar'}
              </Button>
            </>
          ) : (
            <Button $variant='primary' onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                'Continuando...'
              ) : (
                <>
                  <FiCheck size={18} style={{ marginRight: '0.5rem' }} />
                  Continuar
                </>
              )}
            </Button>
          )}
        </ButtonGroup>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NicknamePromptModal;
