import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
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
  FooterText
} from './AuthStyles';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick }) => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success('¡Bienvenido de nuevo!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (error: any) {
      console.error('Error durante el inicio de sesión:', error);
      toast.error(error?.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="email">Correo Electrónico</Label>
          <InputWrapper>
            <IconWrapper><FiMail /></IconWrapper>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="padel@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              $hasError={!!errors.email}
              autoComplete="email"
            />
          </InputWrapper>
          {errors.email && <ErrorText>{errors.email}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label htmlFor="password">Contraseña</Label>
            <ForgotPasswordLink to="/forgot-password" onClick={onSuccess}>¿Has olvidado tu contraseña?</ForgotPasswordLink>
          </div>
          <InputWrapper>
            <IconWrapper><FiLock /></IconWrapper>
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Introduce tu contraseña"
              value={formData.password}
              onChange={handleChange}
              $hasError={!!errors.password}
              autoComplete="current-password"
            />
            <PasswordToggle type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </InputWrapper>
          {errors.password && <ErrorText>{errors.password}</ErrorText>}
        </FormGroup>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </SubmitButton>

        {/* Hidden registration link for accessibility/completeness if not using tabs? 
            Actually, the design has tabs outside. 
            If inside modal, we might want a "No account? Register" link at bottom?
            The current design has tabs.
        */}
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#6b7280' }}>
           ¿No tienes cuenta? <button type="button" onClick={onRegisterClick} style={{ color: '#16a34a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Regístrate</button>
        </div>
      </Form>

      <Divider>O continúa con</Divider>

      <SocialButtons>
        <SocialButton type="button">
          <FcGoogle />
          Google
        </SocialButton>
        <SocialButton type="button">
          <FaApple />
          Apple
        </SocialButton>
      </SocialButtons>

      <FooterText>
        Al continuar, aceptas nuestros <a href="/terms" onClick={onSuccess}>Términos de Servicio</a> y <a href="/privacy" onClick={onSuccess}>Política de Privacidad</a>.
      </FooterText>
    </>
  );
};

export default LoginForm;
