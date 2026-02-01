import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiEye,
  FiEyeOff,
  FiFileText,
  FiGlobe,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext.tsx';
import storeService from '../../services/storeService';
import { UserProfileService } from '../../services/userProfileService.ts';
import OnboardingPromptModal from '../features/OnboardingPromptModal';
import StoreRequestModal from '../features/StoreRequestModal';
import NicknamePromptModal from './NicknamePromptModal.tsx';
import {
  Form,
  FormGroup,
  Label,
  InputWrapper,
  IconWrapper,
  Input,
  PasswordToggle,
  ErrorText,
  SubmitButton,
  Divider,
  SocialButtons,
  SocialButton,
  FooterText,
} from './AuthStyles';

// Local styles for Register specific components
const RegistrationTypeSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TypeCard = styled.button<{ $isSelected: boolean }>`
  flex: 1;
  padding: 1rem;
  border: 2px solid ${props => (props.$isSelected ? '#ccff00' : '#e5e7eb')};
  border-radius: 12px;
  background: ${props => (props.$isSelected ? '#f7fee7' : 'white')};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  outline: none;

  &:hover {
    border-color: #ccff00;
    background: #f7fee7;
  }
`;

const TypeIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
`;

const TypeTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
`;

const PasswordRequirements = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  border-left: 4px solid #ccff00;
`;

const RequirementsList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

const RequirementItem = styled.li<{ $met: boolean }>`
  color: ${props => (props.$met ? '#16a34a' : '#6b7280')};
  margin: 0.25rem 0;
`;

type RegistrationType = 'player' | 'store';

interface FormData {
  registrationType: RegistrationType;
  fullName: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Store-specific fields
  storeName?: string;
  legalName?: string;
  cifNif?: string;
  contactEmail?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  logoUrl?: string;
  shortDescription?: string;
  location?: string;
}

interface FormErrors {
  fullName?: string;
  nickname?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  storeName?: string;
  legalName?: string;
  cifNif?: string;
  contactEmail?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  logoUrl?: string;
  shortDescription?: string;
  location?: string;
}

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLoginClick }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Nickname modal state for Google OAuth
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [suggestedNickname, setSuggestedNickname] = useState('');

  const redirectTo = searchParams.get('redirect') || '/';
  const [formData, setFormData] = useState<FormData>({
    registrationType: 'player',
    fullName: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    legalName: '',
    cifNif: '',
    contactEmail: '',
    phoneNumber: '',
    websiteUrl: '',
    logoUrl: '',
    shortDescription: '',
    location: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const passwordRequirements = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Common fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Required';
    if (!formData.nickname.trim()) newErrors.nickname = 'Required';

    if (!formData.email.trim()) newErrors.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';

    if (!formData.password) newErrors.password = 'Required';
    else if (!isPasswordValid) newErrors.password = 'Password does not meet requirements';

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    // Store specific
    if (formData.registrationType === 'store') {
      if (!formData.storeName?.trim()) newErrors.storeName = 'Required';
      if (!formData.legalName?.trim()) newErrors.legalName = 'Required';
      if (!formData.cifNif?.trim()) newErrors.cifNif = 'Required';
      if (!formData.contactEmail?.trim()) newErrors.contactEmail = 'Required';
      if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Required';
      if (!formData.location?.trim()) newErrors.location = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const { error, token } = await signUp(
        formData.email.trim(),
        formData.password,
        formData.nickname.trim(),
        formData.fullName.trim() || undefined,
        formData.registrationType === 'store' ? 'store_owner' : 'player'
      );

      if (error) {
        toast.error(error || 'Error creating account');
        return;
      }

      if (formData.registrationType === 'store') {
        try {
          await storeService.createStoreRequest(
            {
              store_name: formData.storeName!,
              legal_name: formData.legalName!,
              cif_nif: formData.cifNif!,
              contact_email: formData.contactEmail!,
              phone_number: formData.phoneNumber!,
              website_url: formData.websiteUrl,
              logo_url: formData.logoUrl,
              short_description: formData.shortDescription,
              location: formData.location!,
            },
            token!
          );
          setShowStoreModal(true);
        } catch (storeError: any) {
          toast.error(`Account created but store registration failed: ${storeError.message}`);
          setTimeout(() => {
            if (onSuccess) onSuccess();
            else navigate('/login');
          }, 3000);
        }
      } else {
        toast.success('Account created successfully! Check your email.');
        setShowOnboardingModal(true);
      }
    } catch (error) {
      toast.error('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowStoreModal(false);
    if (onSuccess) onSuccess();
    else navigate(redirectTo);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error, isNewUser, suggestedNickname: nickname } = await signInWithGoogle();

      if (error) {
        toast.error(error);
        return;
      }

      // If it's a new user, show nickname prompt
      if (isNewUser && nickname) {
        setSuggestedNickname(nickname);
        setShowNicknameModal(true);
      } else {
        // Existing user, proceed normally
        toast.success('¡Bienvenido de nuevo!');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(redirectTo);
        }
      }
    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
      toast.error(error?.message || 'Error inesperado con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleNicknameConfirm = async (nickname: string) => {
    try {
      // Update the user's nickname
      await UserProfileService.updateUserProfile({ nickname });

      toast.success('¡Bienvenido a Smashlyapp!');
      setShowNicknameModal(false);
      setShowOnboardingModal(true); // Show onboarding for new users
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar el nickname');
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboardingModal(false);
    if (onSuccess) onSuccess();
    else navigate('/');
  };

  return (
    <>
      <OnboardingPromptModal isOpen={showOnboardingModal} onClose={handleOnboardingClose} />

      <Form onSubmit={handleSubmit}>
        <RegistrationTypeSelector>
          <TypeCard
            type='button'
            $isSelected={formData.registrationType === 'player'}
            onClick={() => setFormData(p => ({ ...p, registrationType: 'player' }))}
          >
            <TypeIcon>👤</TypeIcon>
            <TypeTitle>Jugador</TypeTitle>
          </TypeCard>
          <TypeCard
            type='button'
            $isSelected={formData.registrationType === 'store'}
            onClick={() => setFormData(p => ({ ...p, registrationType: 'store' }))}
          >
            <TypeIcon>🏪</TypeIcon>
            <TypeTitle>Tienda</TypeTitle>
          </TypeCard>
        </RegistrationTypeSelector>

        {/* Common Fields */}
        <FormGroup>
          <Label htmlFor='fullName'>Nombre Completo</Label>
          <InputWrapper>
            <IconWrapper>
              <FiUser />
            </IconWrapper>
            <Input
              id='fullName'
              name='fullName'
              type='text'
              placeholder='Tu nombre'
              value={formData.fullName}
              onChange={handleInputChange}
              $hasError={!!errors.fullName}
            />
          </InputWrapper>
          {errors.fullName && <ErrorText>{errors.fullName}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor='nickname'>Apodo</Label>
          <InputWrapper>
            <IconWrapper>
              <FiUser />
            </IconWrapper>
            <Input
              id='nickname'
              name='nickname'
              type='text'
              placeholder='Tu apodo'
              value={formData.nickname}
              onChange={handleInputChange}
              $hasError={!!errors.nickname}
            />
          </InputWrapper>
          {errors.nickname && <ErrorText>{errors.nickname}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor='email'>Correo Electrónico</Label>
          <InputWrapper>
            <IconWrapper>
              <FiMail />
            </IconWrapper>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder='tu@email.com'
              value={formData.email}
              onChange={handleInputChange}
              $hasError={!!errors.email}
            />
          </InputWrapper>
          {errors.email && <ErrorText>{errors.email}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor='password'>Contraseña</Label>
          <InputWrapper>
            <IconWrapper>
              <FiLock />
            </IconWrapper>
            <Input
              id='password'
              name='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='Contraseña'
              value={formData.password}
              onChange={handleInputChange}
              $hasError={!!errors.password}
            />
            <PasswordToggle type='button' onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </InputWrapper>
          {errors.password && <ErrorText>{errors.password}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor='confirmPassword'>Confirmar Contraseña</Label>
          <InputWrapper>
            <IconWrapper>
              <FiLock />
            </IconWrapper>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder='Repetir contraseña'
              value={formData.confirmPassword}
              onChange={handleInputChange}
              $hasError={!!errors.confirmPassword}
            />
            <PasswordToggle
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </InputWrapper>
          {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}
        </FormGroup>

        {/* Password Requirements visualization */}
        {formData.password && !isPasswordValid && (
          <PasswordRequirements>
            <RequirementsList>
              <RequirementItem $met={passwordRequirements.length}>
                Al menos 8 caracteres
              </RequirementItem>
              <RequirementItem $met={passwordRequirements.uppercase}>
                Una letra mayúscula
              </RequirementItem>
              <RequirementItem $met={passwordRequirements.lowercase}>
                Una letra minúscula
              </RequirementItem>
              <RequirementItem $met={passwordRequirements.number}>Un número</RequirementItem>
              <RequirementItem $met={passwordRequirements.special}>
                Un carácter especial
              </RequirementItem>
            </RequirementsList>
          </PasswordRequirements>
        )}

        {/* Store Specific Fields */}
        {formData.registrationType === 'store' && (
          <>
            <FormGroup>
              <Label>Nombre Tienda</Label>
              <InputWrapper>
                <IconWrapper>
                  <FiShoppingBag />
                </IconWrapper>
                <Input
                  name='storeName'
                  value={formData.storeName}
                  onChange={handleInputChange}
                  $hasError={!!errors.storeName}
                />
              </InputWrapper>
              {errors.storeName && <ErrorText>{errors.storeName}</ErrorText>}
            </FormGroup>
            <FormGroup>
              <Label>CIF/NIF</Label>
              <InputWrapper>
                <IconWrapper>
                  <FiFileText />
                </IconWrapper>
                <Input
                  name='cifNif'
                  value={formData.cifNif}
                  onChange={handleInputChange}
                  $hasError={!!errors.cifNif}
                />
              </InputWrapper>
              {errors.cifNif && <ErrorText>{errors.cifNif}</ErrorText>}
            </FormGroup>
            <FormGroup>
              <Label>Razón Social</Label>
              <InputWrapper>
                <IconWrapper>
                  <FiFileText />
                </IconWrapper>
                <Input
                  name='legalName'
                  value={formData.legalName}
                  onChange={handleInputChange}
                  $hasError={!!errors.legalName}
                />
              </InputWrapper>
              {errors.legalName && <ErrorText>{errors.legalName}</ErrorText>}
            </FormGroup>
            <FormGroup>
              <Label>Email Contacto</Label>
              <InputWrapper>
                <IconWrapper>
                  <FiMail />
                </IconWrapper>
                <Input
                  name='contactEmail'
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  $hasError={!!errors.contactEmail}
                />
              </InputWrapper>
              {errors.contactEmail && <ErrorText>{errors.contactEmail}</ErrorText>}
            </FormGroup>
            <FormGroup>
              <Label>Teléfono</Label>
              <InputWrapper>
                <IconWrapper>
                  <FiPhone />
                </IconWrapper>
                <Input
                  name='phoneNumber'
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  $hasError={!!errors.phoneNumber}
                />
              </InputWrapper>
              {errors.phoneNumber && <ErrorText>{errors.phoneNumber}</ErrorText>}
            </FormGroup>
            <FormGroup>
              <Label>Ubicación</Label>
              <InputWrapper>
                <IconWrapper>
                  <FiMapPin />
                </IconWrapper>
                <Input
                  name='location'
                  value={formData.location}
                  onChange={handleInputChange}
                  $hasError={!!errors.location}
                />
              </InputWrapper>
              {errors.location && <ErrorText>{errors.location}</ErrorText>}
            </FormGroup>
            <FormGroup>
              <Label>Sitio Web</Label>
              <InputWrapper>
                <IconWrapper>
                  <FiGlobe />
                </IconWrapper>
                <Input
                  name='websiteUrl'
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  $hasError={!!errors.websiteUrl}
                />
              </InputWrapper>
              {errors.websiteUrl && <ErrorText>{errors.websiteUrl}</ErrorText>}
            </FormGroup>
          </>
        )}

        <SubmitButton type='submit' disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </SubmitButton>

        <div
          style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#6b7280' }}
        >
          ¿Ya tienes cuenta?{' '}
          <button
            type='button'
            onClick={onLoginClick}
            style={{
              color: '#16a34a',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Inicia sesión
          </button>
        </div>
      </Form>

      <Divider>O continúa con</Divider>

      <SocialButtons>
        <SocialButton type='button' onClick={handleGoogleSignIn} disabled={googleLoading}>
          <FcGoogle />
          {googleLoading ? 'Conectando...' : 'Google'}
        </SocialButton>
      </SocialButtons>

      {formData.registrationType === 'store' && (
        <p
          style={{
            fontSize: '0.8rem',
            color: '#6b7280',
            textAlign: 'center',
            marginTop: '-0.5rem',
          }}
        >
          Al registrarte con Google serás registrado como Jugador
        </p>
      )}

      <NicknamePromptModal
        isOpen={showNicknameModal}
        suggestedNickname={suggestedNickname}
        onConfirm={handleNicknameConfirm}
        onClose={() => setShowNicknameModal(false)}
      />

      <FooterText>
        Al continuar, aceptas nuestros{' '}
        <Link to='/terms' onClick={onSuccess}>
          Términos de Servicio
        </Link>{' '}
        y{' '}
        <Link to='/privacy' onClick={onSuccess}>
          Política de Privacidad
        </Link>
        .
      </FooterText>

      <StoreRequestModal
        isOpen={showStoreModal}
        onClose={handleModalClose}
        onContinue={handleModalClose}
        storeName={formData.storeName || 'tu tienda'}
      />
    </>
  );
};

export default RegisterForm;
