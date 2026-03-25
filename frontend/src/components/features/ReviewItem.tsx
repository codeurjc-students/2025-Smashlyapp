/**
 * ReviewItem Component
 * Componente para mostrar una review individual
 */

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { reviewService } from '../../services/reviewService';
import type { ReviewComment, ReviewWithUser } from '../../types/review';
import { useAuth } from '../../contexts/AuthContext';
import { ReviewForm } from './ReviewForm';

type ReviewItemData = ReviewWithUser & {
  racket?: {
    id: number;
    nombre: string;
    marca?: string;
    modelo?: string;
    imagen?: string | string[];
    imagenes?: string[];
  };
  user_has_liked?: boolean;
  comments?: ReviewComment[];
};

interface ReviewItemProps {
  review: ReviewItemData;
  onDelete: (id: string) => void;
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
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [likes, setLikes] = useState(review.likes_count);
  const [isLiked, setIsLiked] = useState(review.user_has_liked || false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados para comentarios (Hilos/Respuestas)
  const [comments, setComments] = useState<ReviewComment[]>(review.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isOwner = user?.id === review.user_id;

  // Efecto para scroll automático desde notificaciones
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const targetReviewId = searchParams.get('reviewId');

    if (targetReviewId === review.id && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Mostrar hilos automáticamente si venimos de una notificación
      if (comments.length > 0 || review.comments_count > 0) {
        handleShowComments();
      }
    }
  }, [location.search, review.id]);

  const handleShowComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    setShowComments(true);
    if (comments.length === 0 && review.comments_count > 0) {
      loadComments();
    }
  };

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const data = await reviewService.getComments(review.id);
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const newComment = await reviewService.addComment(review.id, { content: commentText });
      setComments((prev: ReviewComment[]) => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setErrorMsg('No se pudo añadir el comentario.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      setErrorMsg('Inicia sesión para dar like');
      return;
    }

    try {
      setErrorMsg(null);
      const result = await reviewService.toggleLike(review.id);
      setLikes(prev => (result.liked ? prev + 1 : prev - 1));
      setIsLiked(result.liked);
    } catch (error) {
      console.error('Error al dar like:', error);
      setErrorMsg('Error al procesar like');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Seguro que quieres eliminar esta reseña?')) {
      return;
    }

    try {
      setErrorMsg(null);
      setIsDeleting(true);
      await reviewService.deleteReview(review.id);
      onDelete(review.id);
    } catch (error) {
      console.error('Error al eliminar review:', error);
      setErrorMsg('Fallo al borrar. Intenta de nuevo.');
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

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const racketImage = review.racket?.imagen
    ? Array.isArray(review.racket.imagen)
      ? review.racket.imagen[0]
      : review.racket.imagen
    : review.racket?.imagenes?.[0];

  return (
    <Container ref={containerRef} id={`review-${review.id}`}>
      {/* Sección de la pala (si está disponible y activo) */}
      {showProductInfo && review.racket && (
        <RacketInfo to={`/racket-detail?id=${review.racket.id}`}>
          {racketImage && <RacketImage src={racketImage} alt={review.racket.nombre} />}
          <RacketDetails>
            <RacketBrand>{review.racket.marca}</RacketBrand>
            <RacketName>{review.racket.modelo || review.racket.nombre}</RacketName>
          </RacketDetails>
        </RacketInfo>
      )}

      <Header>
        <UserInfo>
          <Avatar>
            {review.user?.avatar_url ? (
              <img src={review.user.avatar_url} alt={review.user?.nickname || 'User'} />
            ) : (
              <DefaultAvatar>
                {review.user?.nickname ? review.user.nickname[0].toUpperCase() : 'U'}
              </DefaultAvatar>
            )}
          </Avatar>
          <UserMeta>
            <Username>{review.user?.nickname || 'Anonymous'}</Username>
            <RatingRow>
              {[...Array(5)].map((_, i) => (
                <SmallStar key={i} filled={i < review.rating}>
                  ★
                </SmallStar>
              ))}
            </RatingRow>
          </UserMeta>
        </UserInfo>

        <HeaderRight>
          <DateText>{getRelativeTime(review.created_at)}</DateText>
          {isOwner && (
            <DropdownActions>
              <ActionButton onClick={() => setIsEditing(true)}>Edit</ActionButton>
              <ActionButton danger onClick={handleDelete} disabled={isDeleting}>
                Delete
              </ActionButton>
            </DropdownActions>
          )}
        </HeaderRight>
      </Header>

      <Body>
        {review.title && <ReviewTitle>{review.title}</ReviewTitle>}
        <Content>{review.content}</Content>
      </Body>

      <Footer>
        <FooterActions>
          <LikeButton onClick={handleLike} liked={isLiked} disabled={!user}>
            {isLiked ? '❤️' : '🤍'} {likes > 0 ? likes : 'Te ha sido útil?'}
          </LikeButton>

          <CommentToggleButton onClick={handleShowComments} active={showComments}>
            💬 {review.comments_count > 0 ? `${review.comments_count} Respuestas` : 'Responder'}
          </CommentToggleButton>
        </FooterActions>

        {errorMsg && <ErrorMessage>{errorMsg}</ErrorMessage>}
      </Footer>

      {/* Sección de Hilos (Respuestas) */}
      {showComments && (
        <ThreadsSection>
          {isLoadingComments && <LoadingText>Cargando respuestas...</LoadingText>}

          <CommentsList>
            {comments.map(comment => (
              <CommentItem key={comment.id}>
                <CommentAvatar>
                  {comment.user.avatar_url ? (
                    <img src={comment.user.avatar_url} alt={comment.user.nickname} />
                  ) : (
                    <SmallDefaultAvatar>
                      {comment.user.nickname[0].toUpperCase()}
                    </SmallDefaultAvatar>
                  )}
                </CommentAvatar>
                <CommentBody>
                  <CommentHeader>
                    <CommentAuthor>{comment.user.nickname}</CommentAuthor>
                    <CommentDate>{getRelativeTime(comment.created_at)}</CommentDate>
                  </CommentHeader>
                  <CommentContent>{comment.content}</CommentContent>
                </CommentBody>
              </CommentItem>
            ))}
          </CommentsList>

          {user ? (
            <ReplyForm onSubmit={handleAddComment}>
              <ReplyInput
                placeholder='Escribe una respuesta...'
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                disabled={isSubmittingComment}
              />
              <ReplySubmit type='submit' disabled={!commentText.trim() || isSubmittingComment}>
                {isSubmittingComment ? '...' : 'Enviar'}
              </ReplySubmit>
            </ReplyForm>
          ) : (
            <LoginTip>Inicia sesión para responder</LoginTip>
          )}
        </ThreadsSection>
      )}
    </Container>
  );
};

// Styled Components additions
const FooterActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const CommentToggleButton = styled.button<{ active: boolean }>`
  background: transparent;
  border: none;
  font-size: 0.85rem;
  color: ${p => (p.active ? '#4F46E5' : '#6B7280')};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  transition: all 0.2s;

  &:hover {
    background: #eef2ff;
    color: #4338ca;
  }
`;

const ThreadsSection = styled.div`
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const CommentItem = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const CommentAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #f3f4f6;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const SmallDefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0e7ff;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 700;
`;

const CommentBody = styled.div`
  flex: 1;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
`;

const CommentAuthor = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
`;

const CommentDate = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const CommentContent = styled.p`
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
`;

const ReplyForm = styled.form`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const ReplyInput = styled.input`
  flex: 1;
  padding: 0.6rem 1rem;
  border-radius: 99px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
  outline: none;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
  }
`;

const ReplySubmit = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #4338ca;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingText = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 1rem;
`;

const LoginTip = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
  text-align: center;
`;

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    border-color: #e5e7eb;
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
  background: #f3f4f6;

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
  background: #e0e7ff;
  color: #4f46e5;
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
  color: ${p => (p.filled ? '#FFC107' : '#E5E7EB')};
`;

const DateText = styled.div`
  font-size: 0.85rem;
  color: #9ca3af;
`;

const DropdownActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  background: none;
  border: none;
  font-size: 0.75rem;
  color: ${p => (p.danger ? '#EF4444' : '#6B7280')};
  cursor: pointer;
  text-decoration: underline;
  padding: 0;

  &:hover {
    color: ${p => (p.danger ? '#DC2626' : '#374151')};
  }
`;

const Body = styled.div`
  margin-bottom: 1rem;
`;

const ReviewTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const Content = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #4b5563;
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
  background: ${p => (p.liked ? '#FEF2F2' : 'transparent')};
  border: 1px solid ${p => (p.liked ? '#FEE2E2' : '#F3F4F6')};
  border-radius: 20px;
  font-size: 0.85rem;
  color: ${p => (p.liked ? '#EF4444' : '#6B7280')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => (p.liked ? '#FEE2E2' : '#F9FAFB')};
    border-color: ${p => (p.liked ? '#FECACA' : '#E5E7EB')};
  }
`;

const ErrorMessage = styled.span`
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 600;
  animation: fadeIn 0.3s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

// Racket Info Styles (Legacy support)
const RacketInfo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
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
  color: #6b7280;
  text-transform: uppercase;
`;

const RacketName = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
`;
