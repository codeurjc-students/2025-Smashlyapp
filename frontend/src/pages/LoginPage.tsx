import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import AuthPageLayout from '../components/auth/AuthPageLayout';
import {
  FormTitle,
  FormSubtitle,
  TabContainer,
  Tab,
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
} from '../components/auth/AuthStyles';

const LoginPage: React.FC = () => {
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
      navigate(redirectTo);
    } catch (error: any) {
      console.error('Error durante el inicio de sesión:', error);
      toast.error(error?.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
       title="Domina la Pista"
       highlightedWord="con Datos"
       description="Únete a la comunidad de pádel de más rápido crecimiento. Rastrea tu rendimiento, analiza tus golpes con IA y encuentra partidos que eleven tu juego."
       bgImage="/images/login_register_images/login_image.png"
    >
      <FormTitle>Bienvenido de nuevo</FormTitle>
      <FormSubtitle>Introduce tus datos para acceder a tu panel.</FormSubtitle>

      <TabContainer>
        <Tab to="#" $active>Iniciar Sesión</Tab>
        <Tab to={`/register?redirect=${encodeURIComponent(redirectTo)}`}>Registrarse</Tab>
      </TabContainer>

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
            <ForgotPasswordLink to="/forgot-password">¿Has olvidado tu contraseña?</ForgotPasswordLink>
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
        Al continuar, aceptas nuestros <a href="/terms">Términos de Servicio</a> y <a href="/privacy">Política de Privacidad</a>.
      </FooterText>
    </AuthPageLayout>
  );
};

export default LoginPage;
