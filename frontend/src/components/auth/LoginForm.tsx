import React, { useState } from 'react';
import { sileo } from 'sileo';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import NicknamePromptModal from './NicknamePromptModal.tsx';
import { UserProfileService } from '../../services/userProfileService.ts';
import {
  Form,
  FormGroup,
  Label,
  InputWrapper,
  IconWrapper,
  Input,
  PasswordToggle,
  ErrorText,
  ForgotPasswordLink,
  SubmitButton,
  Divider,
  SocialButtons,
  SocialButton,
  FooterText,
} from './AuthStyles';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick }) => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Nickname modal state
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [suggestedNickname, setSuggestedNickname] = useState('');

  // Get redirect path from URL params or default to home
  const redirectTo = searchParams.get('redirect') || '/';

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const { error, errorCode } = await signIn(formData.email, formData.password);
      if (error) {
        if (errorCode === 'USER_NOT_FOUND') {
          sileo.warning({ 
            title: 'Cuenta no encontrada', 
            description: error 
          });
        } else if (errorCode === 'INVALID_PASSWORD') {
          sileo.error({ title: 'Error', description: error });
        } else {
          sileo.error({ title: 'Error', description: error });
        }
        return;
      }
      sileo.success({ title: 'Éxito', description: '¡Bienvenido de nuevo!' });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (error: any) {
      console.error('Error durante el inicio de sesión:', error);
      sileo.error({ title: 'Error', description: error?.message || 'Error inesperado' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error, isNewUser, suggestedNickname: nickname } = await signInWithGoogle();

      if (error) {
        sileo.error({ title: 'Error', description: error });
        return;
      }

      // If it's a new user, show nickname prompt
      if (isNewUser && nickname) {
        setSuggestedNickname(nickname);
        setShowNicknameModal(true);
      } else {
        // Existing user, proceed normally
        sileo.success({ title: 'Éxito', description: '¡Bienvenido de nuevo!' });
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(redirectTo);
        }
      }
    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
      sileo.error({ title: 'Error', description: error?.message || 'Error inesperado con Google' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleNicknameConfirm = async (nickname: string) => {
    try {
      // Update the user's nickname
      await UserProfileService.updateUserProfile({ nickname });

      sileo.success({ title: 'Éxito', description: '¡Bienvenido a Smashlyapp!' });
      setShowNicknameModal(false);

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar el nickname');
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
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
              placeholder='padel@ejemplo.com'
              value={formData.email}
              onChange={handleChange}
              $hasError={!!errors.email}
              autoComplete='email'
            />
          </InputWrapper>
          {errors.email && <ErrorText>{errors.email}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label htmlFor='password'>Contraseña</Label>
            <ForgotPasswordLink to='/forgot-password' onClick={onSuccess}>
              ¿Has olvidado tu contraseña?
            </ForgotPasswordLink>
          </div>
          <InputWrapper>
            <IconWrapper>
              <FiLock />
            </IconWrapper>
            <Input
              id='password'
              name='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='Introduce tu contraseña'
              value={formData.password}
              onChange={handleChange}
              $hasError={!!errors.password}
              autoComplete='current-password'
            />
            <PasswordToggle type='button' onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </InputWrapper>
          {errors.password && <ErrorText>{errors.password}</ErrorText>}
        </FormGroup>

        <SubmitButton type='submit' disabled={loading}>
          {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </SubmitButton>

        {/* Hidden registration link for accessibility/completeness if not using tabs? 
            Actually, the design has tabs outside. 
            If inside modal, we might want a "No account? Register" link at bottom?
            The current design has tabs.
        */}
        <div
          style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#6b7280' }}
        >
          ¿No tienes cuenta?{' '}
          <button
            type='button'
            onClick={onRegisterClick}
            style={{
              color: '#16a34a',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Regístrate
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

      <NicknamePromptModal
        isOpen={showNicknameModal}
        suggestedNickname={suggestedNickname}
        onConfirm={handleNicknameConfirm}
        onClose={() => setShowNicknameModal(false)}
      />

      <FooterText>
        Al continuar, aceptas nuestros{' '}
        <a href='/terms' onClick={onSuccess}>
          Términos de Servicio
        </a>{' '}
        y{' '}
        <a href='/privacy' onClick={onSuccess}>
          Política de Privacidad
        </a>
        .
      </FooterText>
    </>
  );
};

export default LoginForm;
