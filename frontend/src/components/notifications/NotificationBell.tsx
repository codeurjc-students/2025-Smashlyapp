import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiBell } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const BellContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const BellButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: white;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.05);
  }

  svg {
    font-size: 20px;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #dc2626;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 2px solid #16a34a;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const MobileBellButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #374151;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: #f3f4f6;
  }

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MobileBadge = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  background: #dc2626;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { unreadCount, fetchUnreadCount } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchUnreadCount]);

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <BellContainer ref={dropdownRef}>
      <BellButton onClick={handleBellClick} aria-label="Notificaciones">
        <FiBell />
        {unreadCount > 0 && <Badge>{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
      </BellButton>
      
      {isDropdownOpen && (
        <NotificationDropdown onClose={handleCloseDropdown} />
      )}
    </BellContainer>
  );
};

export const MobileNotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <BellContainer ref={dropdownRef}>
      <MobileBellButton onClick={() => setIsOpen(!isOpen)} aria-label="Notificaciones">
        <FiBell />
        {unreadCount > 0 && <MobileBadge>{unreadCount > 99 ? '99+' : unreadCount}</MobileBadge>}
      </MobileBellButton>
      
      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </BellContainer>
  );
};

export default NotificationBell;
