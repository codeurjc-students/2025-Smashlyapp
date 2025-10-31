import React from "react";
import styled from "styled-components";
import { FiCheckCircle, FiX } from "react-icons/fi";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  position: relative;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: scaleIn 0.4s ease;

  @keyframes scaleIn {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }
`;

const Title = styled.h2`
  color: #1f2937;
  font-size: 1.75rem;
  margin: 0 0 1rem 0;
  text-align: center;
  font-weight: 700;
`;

const Message = styled.p`
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  text-align: center;
`;

const InfoBox = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoTitle = styled.h3`
  color: #15803d;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
  color: #166534;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${(props) =>
    props.variant === "secondary"
      ? `
    background: #f3f4f6;
    color: #1f2937;
    &:hover {
      background: #e5e7eb;
    }
  `
      : `
    background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
    color: white;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
    }
  `}

  &:active {
    transform: translateY(0);
  }
`;

interface StoreRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  storeName: string;
}

const StoreRequestModal: React.FC<StoreRequestModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  storeName,
}) => {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <FiX size={24} />
        </CloseButton>

        <IconContainer>
          <SuccessIcon>
            <FiCheckCircle size={48} />
          </SuccessIcon>
        </IconContainer>

        <Title>¡Solicitud Enviada!</Title>

        <Message>
          Tu solicitud de registro para <strong>{storeName}</strong> ha sido
          enviada correctamente.
        </Message>

        <InfoBox>
          <InfoTitle>📋 ¿Qué sigue?</InfoTitle>
          <InfoText>
            El equipo de Smashly revisará la información de tu tienda en las
            próximas 24-48 horas. Te notificaremos por email cuando tu tienda
            sea verificada y esté lista para usar.
          </InfoText>
        </InfoBox>

        <InfoBox>
          <InfoTitle>✉️ Confirma tu email</InfoTitle>
          <InfoText>
            Revisa tu bandeja de entrada para confirmar tu dirección de email y
            activar tu cuenta.
          </InfoText>
        </InfoBox>

        <ButtonGroup>
          <Button variant="primary" onClick={onContinue}>
            Entendido
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>
  );
};

export default StoreRequestModal;
