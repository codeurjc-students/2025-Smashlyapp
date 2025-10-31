/**
 * ReviewForm Component
 * Formulario para crear o editar reviews
 */

import { useState } from "react";
import styled from "styled-components";
import { reviewService } from "../../services/reviewService";
import type {
  Review,
  CreateReviewDTO,
  UpdateReviewDTO,
} from "../../types/review";

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
  const [title, setTitle] = useState(existingReview?.title || "");
  const [content, setContent] = useState(existingReview?.content || "");
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (title.length < 5 || title.length > 100) {
      setError("El título debe tener entre 5 y 100 caracteres");
      return;
    }

    if (content.length < 20 || content.length > 2000) {
      setError("El contenido debe tener entre 20 y 2000 caracteres");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("La valoración debe estar entre 1 y 5 estrellas");
      return;
    }

    try {
      setIsSubmitting(true);

      if (existingReview) {
        // Actualizar review existente
        const updateData: UpdateReviewDTO = { title, content, rating };
        await reviewService.updateReview(existingReview.id, updateData);
      } else {
        // Crear nueva review
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
      setError(
        err instanceof Error ? err.message : "Error al guardar la opinión"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Container onSubmit={handleSubmit}>
      <FormTitle>
        {existingReview ? "Editar opinión" : "Escribe tu opinión"}
      </FormTitle>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Rating selector */}
      <FormGroup>
        <Label>Valoración *</Label>
        <RatingSelector>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarButton
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              active={star <= (hoveredRating || rating)}
            >
              ⭐
            </StarButton>
          ))}
          <RatingText>
            {rating === 5 && "¡Excelente!"}
            {rating === 4 && "Muy buena"}
            {rating === 3 && "Buena"}
            {rating === 2 && "Regular"}
            {rating === 1 && "Mala"}
          </RatingText>
        </RatingSelector>
      </FormGroup>

      {/* Título */}
      <FormGroup>
        <Label htmlFor="title">
          Título de tu opinión *<CharCount>{title.length}/100</CharCount>
        </Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Excelente pala para principiantes"
          maxLength={100}
          required
        />
      </FormGroup>

      {/* Contenido */}
      <FormGroup>
        <Label htmlFor="content">
          Tu experiencia *<CharCount>{content.length}/2000</CharCount>
        </Label>
        <TextArea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Cuéntanos qué te parece esta pala... (mínimo 20 caracteres)"
          rows={6}
          maxLength={2000}
          required
        />
        <Hint>
          Comparte tu experiencia: ¿Qué te gusta? ¿Qué mejorarías? ¿Para qué
          nivel la recomiendas?
        </Hint>
      </FormGroup>

      {/* Botones */}
      <Actions>
        <CancelButton type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </CancelButton>
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : existingReview
            ? "Guardar cambios"
            : "Publicar opinión"}
        </SubmitButton>
      </Actions>
    </Container>
  );
};

// Styled Components
const Container = styled.form`
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  margin-bottom: 2rem;
`;

const FormTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background: #ffebee;
  color: #d32f2f;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const CharCount = styled.span`
  font-weight: 400;
  color: #666;
  font-size: 0.75rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;

const Hint = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.5rem;
`;

const RatingSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StarButton = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  opacity: ${(props) => (props.active ? 1 : 0.3)};
  transform: ${(props) => (props.active ? "scale(1.1)" : "scale(1)")};

  &:hover {
    transform: scale(1.2);
  }
`;

const RatingText = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  margin-left: 0.5rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #bbb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #45a049;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
