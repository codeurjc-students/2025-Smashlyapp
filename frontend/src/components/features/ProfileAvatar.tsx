import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiCamera, FiUpload, FiX } from 'react-icons/fi';
import { sileo } from 'sileo';

const AvatarContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const AvatarWrapper = styled(motion.div)<{ $size?: number }>`
  width: ${props => props.$size || 120}px;
  height: ${props => props.$size || 120}px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #16a34a20, #16a34a10);
  border: 3px solid white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarFallback = styled.div<{ $size?: number }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => (props.$size || 120) / 2.5}px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #16a34a20, #16a34a08);
`;

const UploadButton = styled(motion.button)`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #16a34a;
  color: white;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    background: #334155;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 1rem;
`;

const ModalContent = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const PreviewImage = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 3px solid #e2e8f0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props => props.$variant === 'primary' ? `
    background: #16a34a;
    color: white;
    &:hover { background: #15803d; }
  ` : `
    background: #f1f5f9;
    color: #64748b;
    &:hover { background: #e2e8f0; }
  `}
`;

interface ProfileAvatarProps {
  currentAvatar?: string | null;
  name?: string;
  size?: number;
  onUpload: (file: File) => Promise<void>;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  currentAvatar,
  name = 'U',
  size = 120,
  onUpload,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      sileo.error({ title: 'Error', description: 'Selecciona una imagen válida' });
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      sileo.error({ title: 'Error', description: 'La imagen debe ser menor a 5MB' });
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setSelectedFile(file);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await onUpload(selectedFile);
      setShowModal(false);
      setPreview(null);
      setSelectedFile(null);
      sileo.success({ title: 'Éxito', description: 'Foto de perfil actualizada' });
    } catch (error) {
      sileo.error({ title: 'Error', description: 'Error al subir la imagen' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <>
      <AvatarContainer>
        <AvatarWrapper
          $size={size}
          whileHover={{ scale: 1.02 }}
        >
          {currentAvatar ? (
            <AvatarImage src={currentAvatar} alt="Avatar" />
          ) : (
            <AvatarFallback $size={size}>
              {getInitials(name)}
            </AvatarFallback>
          )}
        </AvatarWrapper>
        
        <UploadButton
          onClick={() => inputRef.current?.click()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiCamera size={16} />
        </UploadButton>

        <HiddenInput
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
        />
      </AvatarContainer>

      {showModal && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
        >
          <Modal
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <ModalTitle>Confirmar foto de perfil</ModalTitle>
            <ModalContent>
              {preview && (
                <PreviewImage src={preview} alt="Preview" />
              )}
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                ¿Quieres usar esta foto como imagen de perfil?
              </p>
            </ModalContent>
            <ModalActions>
              <Button onClick={handleCancel}>
                <FiX size={16} />
                Cancelar
              </Button>
              <Button $variant="primary" onClick={handleUpload} disabled={uploading}>
                <FiUpload size={16} />
                {uploading ? 'Subiendo...' : 'Confirmar'}
              </Button>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </>
  );
};

export default ProfileAvatar;
