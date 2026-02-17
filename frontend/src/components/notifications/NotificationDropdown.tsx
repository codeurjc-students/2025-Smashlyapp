import React from 'react';
import styled from 'styled-components';
import { FiBell, FiTrendingDown, FiCheckCircle, FiStar, FiAlertCircle, FiUserPlus, FiShoppingBag, FiX, FiCheck } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification, NotificationType } from '../../types/notification';
import { useNavigate } from 'react-router-dom';

const DropdownContainer = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 360px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;

  @media (max-width: 480px) {
    width: calc(100vw - 32px);
    right: -60px;
  }
`;

const DropdownHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const DropdownTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MarkAllButton = styled.button`
  background: none;
  border: none;
  color: #16a34a;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(22, 163, 74, 0.1);
  }

  &:disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const NotificationsList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
`;

const NotificationItem = styled.div<{ isRead: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
  background: ${props => props.isRead ? 'white' : '#f0fdf4'};

  &:hover {
    background: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationIcon = styled.div<{ type: NotificationType }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => {
    switch (props.type) {
      case 'price_drop':
        return '#dcfce7';
      case 'comparison_complete':
      case 'recommendation_complete':
        return '#dbeafe';
      case 'review':
        return '#fef3c7';
      case 'admin_update':
        return '#fee2e2';
      case 'new_user':
        return '#e0e7ff';
      case 'new_store':
        return '#f3e8ff';
      default:
        return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'price_drop':
        return '#16a34a';
      case 'comparison_complete':
      case 'recommendation_complete':
        return '#2563eb';
      case 'review':
        return '#d97706';
      case 'admin_update':
        return '#dc2626';
      case 'new_user':
        return '#4f46e5';
      case 'new_store':
        return '#9333ea';
      default:
        return '#6b7280';
    }
  }};
  font-size: 18px;
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.p<{ isRead: boolean }>`
  font-size: 0.875rem;
  font-weight: ${props => props.isRead ? '500' : '600'};
  color: #111827;
  margin: 0 0 4px 0;
  line-height: 1.3;
`;

const NotificationMessage = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 6px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NotificationTime = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
  flex-shrink: 0;
  margin-top: 6px;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s;

  ${NotificationItem}:hover & {
    opacity: 1;
  }

  &:hover {
    color: #dc2626;
    background: #fee2e2;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9ca3af;
  text-align: center;
`;

const EmptyIcon = styled(FiBell)`
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  margin: 0;
`;

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'price_drop':
      return <FiTrendingDown />;
    case 'comparison_complete':
    case 'recommendation_complete':
      return <FiCheckCircle />;
    case 'review':
      return <FiStar />;
    case 'admin_update':
      return <FiAlertCircle />;
    case 'new_user':
      return <FiUserPlus />;
    case 'new_store':
      return <FiShoppingBag />;
    default:
      return <FiBell />;
  }
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Ahora mismo';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} min`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} h`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} días`;
  } else {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
};

const getNotificationLink = (notification: Notification): string => {
  const { type, data } = notification;

  switch (type) {
    case 'price_drop':
      return `/rackets/${data.racketId}`;
    case 'comparison_complete':
      return `/compare-rackets`;
    case 'recommendation_complete':
      return `/best-racket`;
    case 'review':
      return `/catalog`;
    case 'admin_update':
      return `/admin`;
    case 'new_user':
      return `/admin/users`;
    case 'new_store':
      return `/admin/stores`;
    default:
      return '/';
  }
};

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    const link = getNotificationLink(notification);
    navigate(link);
    onClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <DropdownContainer>
      <DropdownHeader>
        <DropdownTitle>
          <FiBell />
          Notificaciones
          {unreadCount > 0 && (
            <span style={{ 
              background: '#16a34a', 
              color: 'white', 
              fontSize: '0.75rem', 
              padding: '2px 8px', 
              borderRadius: '12px',
              fontWeight: 600
            }}>
              {unreadCount}
            </span>
          )}
        </DropdownTitle>
        <MarkAllButton 
          onClick={handleMarkAllAsRead} 
          disabled={unreadCount === 0}
          title="Marcar todas como leídas"
        >
          <FiCheck style={{ marginRight: '4px' }} />
          Todo leído
        </MarkAllButton>
      </DropdownHeader>

      <NotificationsList>
        {notifications.length === 0 ? (
          <EmptyState>
            <EmptyIcon />
            <EmptyText>No tienes notificaciones</EmptyText>
          </EmptyState>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              isRead={notification.is_read}
              onClick={() => handleNotificationClick(notification)}
            >
              <NotificationIcon type={notification.type}>
                {getNotificationIcon(notification.type)}
              </NotificationIcon>
              <NotificationContent>
                <NotificationTitle isRead={notification.is_read}>
                  {notification.title}
                </NotificationTitle>
                <NotificationMessage>{notification.message}</NotificationMessage>
                <NotificationTime>{formatTimeAgo(notification.created_at)}</NotificationTime>
              </NotificationContent>
              {!notification.is_read && <UnreadDot />}
              <DeleteButton 
                onClick={(e) => handleDelete(e, notification.id)}
                title="Eliminar notificación"
              >
                <FiX size={14} />
              </DeleteButton>
            </NotificationItem>
          ))
        )}
      </NotificationsList>
    </DropdownContainer>
  );
};

export default NotificationDropdown;
