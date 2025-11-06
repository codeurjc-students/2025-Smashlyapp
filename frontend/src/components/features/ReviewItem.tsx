/**
 * ReviewItem Component
 * Componente para mostrar una review individual
 */

import { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { reviewService } from "../../services/reviewService";
import type { ReviewWithUser } from "../../types/review";
import { useAuth } from "../../contexts/AuthContext";
import { ReviewForm } from "./ReviewForm";

interface ReviewItemProps {
  review: ReviewWithUser & {
    racket?: {
      id: number;
      nombre: string;
      marca?: string;
      modelo?: string;
      imagen?: string;
    };
  };
  onDelete: () => void;
  onUpdate: () => void;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  onDelete,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [likes, setLikes] = useState(review.likes_count);
  const [isLiked, setIsLiked] = useState(false); // TODO: Obtener del backend
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === review.user_id;

  const handleLike = async () => {
    if (!user) {
      alert("Debes iniciar sesión para dar me gusta");
      return;
    }

    try {
      const result = await reviewService.toggleLike(review.id);
      setLikes(result.likes_count);
      setIsLiked(result.liked);
    } catch (error) {
      console.error("Error al dar like:", error);
      alert("Error al dar me gusta");
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta opinión?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await reviewService.deleteReview(review.id);
      onDelete();
    } catch (error) {
      console.error("Error al eliminar review:", error);
      alert("Error al eliminar la opinión");
      setIsDeleting(false);
    }
  };

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    onUpdate();
  };

  if (isEditing) {
    return (
      <ReviewForm
        racketId={review.racket_id}
        existingReview={review}
        onSuccess={handleUpdateSuccess}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Container>
      {/* Sección de la pala (si está disponible) */}
      {review.racket && (
        <RacketInfo to={`/rackets/${review.racket.id}`}>
          {review.racket.imagen && (
            <RacketImage
              src={review.racket.imagen}
              alt={review.racket.nombre}
            />
          )}
          <RacketDetails>
            <RacketBrand>{review.racket.marca}</RacketBrand>
            <RacketName>
              {review.racket.modelo || review.racket.nombre}
            </RacketName>
          </RacketDetails>
        </RacketInfo>
      )}

      <Header>
        <UserInfo>
          <Avatar>
            {review.user?.avatar_url ? (
              <img
                src={review.user.avatar_url}
                alt={review.user?.nickname || "Usuario"}
              />
            ) : (
              <DefaultAvatar>
                {review.user?.nickname
                  ? review.user.nickname[0].toUpperCase()
                  : "U"}
              </DefaultAvatar>
            )}
          </Avatar>
          <UserDetails>
            <Username>{review.user?.nickname || "Usuario"}</Username>
            <DateText>
              {new window.Date(review.created_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DateText>
          </UserDetails>
        </UserInfo>

        {isOwner && (
          <Actions>
            <ActionButton onClick={() => setIsEditing(true)}>
              ✏️ Editar
            </ActionButton>
            <ActionButton danger onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "..." : "🗑️ Eliminar"}
            </ActionButton>
          </Actions>
        )}
      </Header>

      <Rating>
        {[...Array(5)].map((_, i) => (
          <Star key={i} filled={i < review.rating}>
            ⭐
          </Star>
        ))}
      </Rating>

      <Title>{review.title}</Title>
      <Content>{review.content}</Content>

      <Footer>
        <LikeButton onClick={handleLike} liked={isLiked} disabled={!user}>
          {isLiked ? "❤️" : "🤍"} {likes}
        </LikeButton>

        {review.comments_count > 0 && (
          <CommentsCount>
            💬 {review.comments_count} comentario
            {review.comments_count !== 1 ? "s" : ""}
          </CommentsCount>
        )}

        {review.created_at !== review.updated_at && (
          <EditedTag>(editada)</EditedTag>
        )}
      </Footer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const RacketInfo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 100%);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
  }
`;

const RacketImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 4px;
  background: white;
  padding: 0.25rem;
`;

const RacketDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const RacketBrand = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
`;

const RacketName = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Username = styled.div`
  font-weight: 600;
  color: #1a1a1a;
  font-size: 1rem;
`;

const DateText = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${(props) => (props.danger ? "#ffebee" : "#f5f5f5")};
  color: ${(props) => (props.danger ? "#d32f2f" : "#333")};
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) => (props.danger ? "#ffcdd2" : "#e0e0e0")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Rating = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
`;

const Star = styled.span<{ filled: boolean }>`
  opacity: ${(props) => (props.filled ? 1 : 0.3)};
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
`;

const Content = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
  margin-bottom: 1rem;
  white-space: pre-wrap;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
`;

const LikeButton = styled.button<{ liked: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${(props) => (props.liked ? "#fff0f0" : "#f5f5f5")};
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) => (props.liked ? "#ffe0e0" : "#e0e0e0")};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CommentsCount = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const EditedTag = styled.div`
  font-size: 0.75rem;
  color: #999;
  font-style: italic;
  margin-left: auto;
`;
