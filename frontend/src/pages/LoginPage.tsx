import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext.tsx';

const Container = styled.div`
  min-height: 80vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
`;

const LoginCard = styled.div`
  background: white;
  padding: 3rem 2rem;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  max-width: 450px;
  width: 100%;
  border: 1px solid rgba(22, 163, 74, 0.1);

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const Logo = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const InputContainer = styled.div`
  position: relative;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid ${props => (props.hasError ? '#ef4444' : '#e5e7eb')};
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  z-index: 1;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: #374151;
  }
`;

const ErrorMessage = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
`;

const ForgotPassword = styled(Link)`
  color: #16a34a;
  font-size: 0.875rem;
  text-decoration: none;
  font-weight: 500;
  align-self: flex-end;
  margin-top: -0.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: #059669;
    text-decoration: underline;
  }
`;

const LoginButton = styled.button<{ loading?: boolean }>`
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => (props.loading ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
  opacity: ${props => (props.loading ? 0.7 : 1)};

  &:hover {
    transform: ${props => (props.loading ? 'none' : 'translateY(-2px)')};
    box-shadow: ${props =>
      props.loading ? '0 4px 14px rgba(22, 163, 74, 0.3)' : '0 8px 25px rgba(22, 163, 74, 0.4)'};
  }

  &:active {
    transform: translateY(0);
  }
`;

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const RegisterText = styled.p`
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;

  a {
    color: #16a34a;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #059669;
      text-decoration: underline;
    }
  }
`;

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get redirect path from URL params or default to home
  const redirectTo = searchParams.get('redirect') || '/';

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Iniciar sesión con Supabase usando el contexto de autenticación
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        toast.error(error);
        return;
      }

      // Login exitoso
      toast.success('¡Bienvenido a Smashly!');

      // Redirigir a la página anterior o a la página principal
      navigate(redirectTo);
    } catch (error: any) {
      console.error('Error during login:', error);
      const errorMessage = error?.message || 'Error inesperado durante el inicio de sesión';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <Header>
          <Logo>
            <FiUser size={32} color='white' />
          </Logo>
          <Title>Iniciar Sesión</Title>
          <Subtitle>
            Accede a tu cuenta para guardar tus preferencias y recibir recomendaciones
            personalizadas
          </Subtitle>
        </Header>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor='email'>Email</Label>
            <InputContainer>
              <InputIcon>
                <FiMail size={20} />
              </InputIcon>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='tu@email.com'
                value={formData.email}
                onChange={handleChange}
                hasError={!!errors.email}
                autoComplete='email'
              />
            </InputContainer>
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </InputGroup>

          <InputGroup>
            <Label htmlFor='password'>Contraseña</Label>
            <InputContainer>
              <InputIcon>
                <FiLock size={20} />
              </InputIcon>
              <Input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Tu contraseña'
                value={formData.password}
                onChange={handleChange}
                hasError={!!errors.password}
                autoComplete='current-password'
              />
              <PasswordToggle type='button' onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </PasswordToggle>
            </InputContainer>
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
          </InputGroup>

          <ForgotPassword to='/forgot-password'>¿Olvidaste tu contraseña?</ForgotPassword>

          <LoginButton type='submit' loading={loading} disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </LoginButton>
        </Form>

        <RegisterLink>
          <RegisterText>
            ¿No tienes cuenta? <Link to={`/register?redirect=${encodeURIComponent(redirectTo)}`}>Regístrate gratis</Link>
          </RegisterText>
        </RegisterLink>
      </LoginCard>
    </Container>
  );
};

export default LoginPage;
