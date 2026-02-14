/**
 * ReviewForm Component
 * Professional review form for padel racket reviews
 * Redesigned with intentional hierarchy and modern UX
 */

import { useState } from 'react';
import styled from 'styled-components';
import { reviewService } from '../../services/reviewService';
import type { Review, CreateReviewDTO, UpdateReviewDTO } from '../../types/review';

interface ReviewFormProps {
  racketId: number;
  existingReview?: Review;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  racketId,
  existingReview,
  onSuccess,
  onCancel,
}) => {
  const [title, setTitle] = useState(existingReview?.title || '');
  const [content, setContent] = useState(existingReview?.content || '');
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (title.length < 5 || title.length > 100) {
      setError('El título debe tener entre 5 y 100 caracteres');
      return;
    }

    if (content.length < 20 || content.length > 2000) {
      setError('El contenido debe tener entre 20 y 2000 caracteres');
      return;
    }

    if (rating < 1 || rating > 5) {
      setError('La valoración debe estar entre 1 y 5 estrellas');
      return;
    }

    try {
      setIsSubmitting(true);

      if (existingReview) {
        const updateData: UpdateReviewDTO = { title, content, rating };
        await reviewService.updateReview(existingReview.id, updateData);
      } else {
        const createData: CreateReviewDTO = {
          racket_id: racketId,
          title,
          content,
          rating,
        };
        await reviewService.createReview(createData);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la opinión');
      setIsSubmitting(false);
    }
  };

  const ratingLabels = {
    5: '¡Excelente!',
    4: 'Muy buena',
    3: 'Buena',
    2: 'Regular',
    1: 'Mala',
  };

  return (
    <Container onSubmit={handleSubmit}>
      {error && (
        <ErrorBanner>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorText>{error}</ErrorText>
        </ErrorBanner>
      )}

      {/* Rating Section - Visual Priority */}
      <RatingSection>
        <SectionLabel>¿Cómo valorarías esta pala?</SectionLabel>
        <StarRatingContainer>
          <StarsWrapper>
            {[1, 2, 3, 4, 5].map(star => (
              <StarButton
                key={star}
                type='button'
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                $active={star <= (hoveredRating || rating)}
                $hovered={star <= hoveredRating}
              >
                ★
              </StarButton>
            ))}
          </StarsWrapper>
          <RatingLabel>{ratingLabels[rating as keyof typeof ratingLabels]}</RatingLabel>
        </StarRatingContainer>
      </RatingSection>

      {/* Title Field */}
      <FormField>
        <FieldLabel htmlFor='title'>
          Resumen de tu experiencia
          <CharCounter $warning={title.length > 90}>{title.length}/100</CharCounter>
        </FieldLabel>
        <TitleInput
          id='title'
          type='text'
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder='Ej: Perfecta para jugadores intermedios'
          maxLength={100}
          required
        />
      </FormField>

      {/* Content Field */}
      <FormField>
        <FieldLabel htmlFor='content'>
          Cuéntanos más
          <CharCounter $warning={content.length > 1800}>{content.length}/2000</CharCounter>
        </FieldLabel>
        <ContentTextarea
          id='content'
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder='¿Qué destacarías de esta pala? ¿Para qué nivel la recomiendas? ¿Cómo es el tacto, control y potencia?'
          rows={6}
          maxLength={2000}
          required
        />
        <FieldHint>
          💡 Ayuda más siendo específico: habla de control, potencia, peso, balance, y para qué
          estilo de juego la recomiendas
        </FieldHint>
      </FormField>

      {/* Action Buttons */}
      <ActionBar>
        <CancelButton type='button' onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </CancelButton>
        <SubmitButton
          type='submit'
          disabled={isSubmitting || title.length < 5 || content.length < 20}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Publicando...
            </>
          ) : existingReview ? (
            'Guardar cambios'
          ) : (
            'Publicar valoración'
          )}
        </SubmitButton>
      </ActionBar>
    </Container>
  );
};

// Styled Components

const Container = styled.form`
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border-left: 3px solid #dc2626;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const ErrorIcon = styled.span`
  font-size: 1rem;
  flex-shrink: 0;
`;

const ErrorText = styled.span`
  color: #dc2626;
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const RatingSection = styled.div`
  margin-bottom: 1.25rem;
`;

const SectionLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 0.75rem;
  text-align: center;
`;

const StarRatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StarsWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StarButton = styled.button<{ $active: boolean; $hovered: boolean }>`
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  transition: all 0.15s;
  color: ${props => (props.$active ? '#FDB022' : '#D1D5DB')};
  filter: ${props => (props.$active ? 'drop-shadow(0 1px 3px rgba(253, 176, 34, 0.3))' : 'none')};
  padding: 0.125rem;
  line-height: 1;

  &:hover {
    transform: scale(1.15);
  }

  &:active {
    transform: scale(1.05);
  }
`;

const RatingLabel = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary);
`;

const FormField = styled.div`
  margin-bottom: 1.25rem;
`;

const FieldLabel = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const CharCounter = styled.span<{ $warning?: boolean }>`
  font-weight: 600;
  font-size: 0.8rem;
  color: ${props => (props.$warning ? '#F59E0B' : 'var(--color-gray-400)')};
  font-variant-numeric: tabular-nums;
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s;
  background: white;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  &::placeholder {
    color: var(--color-gray-400);
  }
`;

const ContentTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s;
  background: white;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  &::placeholder {
    color: var(--color-gray-400);
  }
`;

const FieldHint = styled.div`
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-gray-500);
  line-height: 1.4;
`;

const ActionBar = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-gray-200);
`;

const CancelButton = styled.button`
  padding: 0.625rem 1.25rem;
  background: white;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-gray-700);
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--color-gray-50);
    border-color: var(--color-gray-400);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: 0.625rem 1.75rem;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background: #059669;
    box-shadow: 0 3px 6px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Spinner = styled.span`
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
