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
      imagenes?: string[];
    };
    user_has_liked?: boolean;
  };
  onDelete: () => void;
  onUpdate: () => void;
  showProductInfo?: boolean;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  onDelete,
  onUpdate,
  showProductInfo = true,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [likes, setLikes] = useState(review.likes_count);
  const [isLiked, setIsLiked] = useState(review.user_has_liked || false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOwner = user?.id === review.user_id;

  const handleLike = async () => {
    if (!user) {
      setErrorMsg("Inicia sesión para dar like");
      return;
    }

    try {
      setErrorMsg(null);
      const result = await reviewService.toggleLike(review.id);
      setLikes(prev => result.liked ? prev + 1 : prev - 1);
      setIsLiked(result.liked);
    } catch (error) {
      console.error("Error al dar like:", error);
      setErrorMsg("Error al procesar like");
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Seguro que quieres eliminar esta reseña?")) {
      return;
    }

    try {
      setErrorMsg(null);
      setIsDeleting(true);
      await reviewService.deleteReview(review.id);
      onDelete();
    } catch (error) {
      console.error("Error al eliminar review:", error);
      setErrorMsg("Fallo al borrar. Intenta de nuevo.");
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

  // Format date relative or absolute
  // const dateStr = new Date(review.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  
  // Calculate relative time for "2 days ago" style
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString("es-ES", { day: 'numeric', month: 'short', year: 'numeric' });
  };


  return (
    <Container>
      {/* Sección de la pala (si está disponible y activo) */}
      {showProductInfo && review.racket && (
        <RacketInfo to={`/rackets/${review.racket.id}`}>
          {review.racket.imagenes?.[0] && (
            <RacketImage
              src={review.racket.imagenes[0]}
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
                alt={review.user?.nickname || "User"}
              />
            ) : (
              <DefaultAvatar>
                {review.user?.nickname
                  ? review.user.nickname[0].toUpperCase()
                  : "U"}
              </DefaultAvatar>
            )}
          </Avatar>
          <UserMeta>
            <Username>{review.user?.nickname || "Anonymous"}</Username>
            <RatingRow>
               {[...Array(5)].map((_, i) => (
                  <SmallStar key={i} filled={i < review.rating}>★</SmallStar>
               ))}
            </RatingRow>
          </UserMeta>
        </UserInfo>
        
        <HeaderRight>
            <DateText>{getRelativeTime(review.created_at)}</DateText>
            {isOwner && (
            <DropdownActions>
                <ActionButton onClick={() => setIsEditing(true)}>Edit</ActionButton>
                <ActionButton danger onClick={handleDelete} disabled={isDeleting}>Delete</ActionButton>
            </DropdownActions>
            )}
        </HeaderRight>
      </Header>

      <Body>
          {review.title && <ReviewTitle>{review.title}</ReviewTitle>}
          <Content>{review.content}</Content>
      </Body>

      <Footer>
        <LikeButton onClick={handleLike} liked={isLiked} disabled={!user}>
          {isLiked ? "❤️" : "🤍"} {likes > 0 ? likes : "Te ha sido útil?"}
        </LikeButton>
        {errorMsg && <ErrorMessage>{errorMsg}</ErrorMessage>}
      </Footer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #F3F4F6;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    border-color: #E5E7EB;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const HeaderRight = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: #F3F4F6;

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
  background: #E0E7FF;
  color: #4F46E5;
  font-size: 1.2rem;
  font-weight: 700;
`;

const Username = styled.div`
  font-weight: 700;
  color: #111827;
  font-size: 1rem;
`;

const RatingRow = styled.div`
    display: flex;
    gap: 2px;
    font-size: 1rem;
`;

const SmallStar = styled.span<{ filled: boolean }>`
    color: ${p => p.filled ? '#FFC107' : '#E5E7EB'};
`;

const DateText = styled.div`
  font-size: 0.85rem;
  color: #9CA3AF;
`;

const DropdownActions = styled.div`
    display: flex;
    gap: 0.5rem;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  background: none;
  border: none;
  font-size: 0.75rem;
  color: ${p => p.danger ? '#EF4444' : '#6B7280'};
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  
  &:hover {
      color: ${p => p.danger ? '#DC2626' : '#374151'};
  }
`;

const Body = styled.div`
    margin-bottom: 1rem;
`;

const ReviewTitle = styled.h4`
    font-size: 1.1rem;
    font-weight: 700;
    color: #1F2937;
    margin: 0 0 0.5rem 0;
`;

const Content = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #4B5563;
  margin: 0;
  white-space: pre-wrap;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
//   border-top: 1px solid #F9FAFB;
`;

const LikeButton = styled.button<{ liked: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: ${p => p.liked ? '#FEF2F2' : 'transparent'};
  border: 1px solid ${p => p.liked ? '#FEE2E2' : '#F3F4F6'};
  border-radius: 20px;
  font-size: 0.85rem;
  color: ${p => p.liked ? '#EF4444' : '#6B7280'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.liked ? '#FEE2E2' : '#F9FAFB'};
    border-color: ${p => p.liked ? '#FECACA' : '#E5E7EB'};
  }
`;

const ErrorMessage = styled.span`
  color: #EF4444;
  font-size: 0.75rem;
  font-weight: 600;
  animation: fadeIn 0.3s ease-in;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

// Racket Info Styles (Legacy support)
const RacketInfo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: #F9FAFB;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #F3F4F6;
  }
`;

const RacketImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: contain;
`;

const RacketDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const RacketBrand = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
`;

const RacketName = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
`;
