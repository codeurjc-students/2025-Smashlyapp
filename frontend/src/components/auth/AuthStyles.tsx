import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const FormTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  text-align: center;
`;

export const FormSubtitle = styled.p`
  color: #6b7280;
  text-align: center;
  margin-bottom: 32px;
  font-size: 0.95rem;
`;

export const TabContainer = styled.div`
  background: #f3f4f6;
  padding: 4px;
  border-radius: 99px; // Pill shape
  display: flex;
  margin-bottom: 32px;
`;

export const Tab = styled(Link)<{ $active?: boolean }>`
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 99px;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${props => (props.$active ? '#111827' : '#6b7280')};
  background: ${props => (props.$active ? 'white' : 'transparent')};
  box-shadow: ${props => (props.$active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none')};
  transition: all 0.2s ease;

  &:hover {
    color: #111827;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-left: 4px;
`;

export const InputWrapper = styled.div`
  position: relative;
`;

export const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 14px 16px;
  padding-left: 44px; // Check if we are using icons
  border: 1px solid ${props => (props.$hasError ? '#ef4444' : '#e5e7eb')};
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  outline: none;
  background: #fff;

  &:focus {
    border-color: #a3e635;
    box-shadow: 0 0 0 4px rgba(163, 230, 53, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

export const IconWrapper = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
`;

export const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;

  &:hover {
    color: #6b7280;
  }
`;

export const ErrorText = styled.span`
  color: #ef4444;
  font-size: 0.85rem;
  margin-left: 4px;
`;

export const SubmitButton = styled.button`
  width: 100%;
  background: #ccff00; // Neon Green
  color: #000;
  font-weight: 700;
  padding: 16px;
  border-radius: 99px; // Pill shape or rounded rect? Image looks like rounded rect (12px-ish) but maybe more rounded.
  // The sign in button in image looks pretty standard rounded.
  border-radius: 16px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 10px;
  box-shadow: 0 4px 12px rgba(204, 255, 0, 0.2);

  &:hover {
    background: #b3e600;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(204, 255, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 32px 0;
  color: #9ca3af;
  font-size: 0.9rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }
`;

export const SocialButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 99px; // Pill shape
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  svg {
    font-size: 1.25rem;
  }
`;

export const FooterText = styled.p`
  margin-top: 32px;
  text-align: center;
  font-size: 0.8rem;
  color: #9ca3af;

  a {
    color: #ccff00; /* Matching neon */
    color: #84cc16; /* Slightly darker for text readability on white? Image has neon green links? "Terms of Service" looks yellow/green */
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const ForgotPasswordLink = styled(Link)`
  color: #ccff00;
  color: #84cc16; // Using a readable lime green
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  align-self: flex-end;

  &:hover {
    text-decoration: underline;
  }
`;
