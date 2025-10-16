import React, { useState } from "react";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext.tsx";

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
`;

const RegisterCard = styled.div`
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
  color: #1a1a1a;
  margin: 0 0 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  background: #fafafa;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    background: white;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &[type="password"] {
    padding-right: 3rem;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: #6b7280;
  z-index: 1;
  pointer-events: none;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: #16a34a;
  }
`;

const ErrorMessage = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const RegisterButton = styled.button<{ loading?: boolean }>`
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${(props) => (props.loading ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.loading ? 0.7 : 1)};
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const LoginLink = styled.div`
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const LoginText = styled.p`
  color: #6b7280;
  margin: 0;

  a {
    color: #16a34a;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s ease;

    &:hover {
      color: #059669;
      text-decoration: underline;
    }
  }
`;

const PasswordRequirements = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  border-left: 4px solid #16a34a;
`;

const RequirementsList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

const RequirementItem = styled.li<{ met: boolean }>`
  color: ${(props) => (props.met ? "#16a34a" : "#6b7280")};
  margin: 0.25rem 0;
`;

interface FormData {
  fullName: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  nickname?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre completo
    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "El nombre debe tener al menos 2 caracteres";
    }

    // Validar nickname
    if (!formData.nickname.trim()) {
      newErrors.nickname = "El nickname es requerido";
    } else if (formData.nickname.trim().length < 3) {
      newErrors.nickname = "El nickname debe tener al menos 3 caracteres";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.nickname)) {
      newErrors.nickname =
        "El nickname solo puede contener letras, números y guiones bajos";
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido";
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (!isPasswordValid) {
      newErrors.password = "La contraseña no cumple con los requisitos";
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
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
      const { data, error } = await signUp(
        formData.email.trim(),
        formData.password,
        formData.nickname.trim(),
        formData.fullName.trim() || undefined
      );

      if (error) {
        toast.error(error || "Error al crear la cuenta");
        return;
      }

      if (data) {
        toast.success(
          "¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta."
        );
        navigate("/login");
      }
    } catch (error) {
      toast.error("Error inesperado. Inténtalo de nuevo.");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <RegisterCard>
        <Header>
          <Logo>
            <FiUser size={36} color="white" />
          </Logo>
          <Title>Crear Cuenta</Title>
          <Subtitle>Únete a la comunidad de Smashly</Subtitle>
        </Header>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="fullName">Nombre Completo</Label>
            <InputContainer>
              <InputIcon>
                <FiUser size={20} />
              </InputIcon>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Ingresa tu nombre completo"
                value={formData.fullName}
                onChange={handleInputChange}
                autoComplete="name"
              />
            </InputContainer>
            {errors.fullName && <ErrorMessage>{errors.fullName}</ErrorMessage>}
          </InputGroup>

          <InputGroup>
            <Label htmlFor="nickname">Nickname</Label>
            <InputContainer>
              <InputIcon>
                <FiUser size={20} />
              </InputIcon>
              <Input
                id="nickname"
                name="nickname"
                type="text"
                placeholder="Elige un nickname único"
                value={formData.nickname}
                onChange={handleInputChange}
                autoComplete="username"
              />
            </InputContainer>
            {errors.nickname && <ErrorMessage>{errors.nickname}</ErrorMessage>}
          </InputGroup>

          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <InputContainer>
              <InputIcon>
                <FiMail size={20} />
              </InputIcon>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
              />
            </InputContainer>
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </InputGroup>

          <InputGroup>
            <Label htmlFor="password">Contraseña</Label>
            <InputContainer>
              <InputIcon>
                <FiLock size={20} />
              </InputIcon>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Crea una contraseña segura"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="new-password"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </PasswordToggle>
            </InputContainer>
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}

            {formData.password && (
              <PasswordRequirements>
                <RequirementsList>
                  <RequirementItem met={passwordRequirements.length}>
                    Al menos 8 caracteres
                  </RequirementItem>
                  <RequirementItem met={passwordRequirements.uppercase}>
                    Una letra mayúscula
                  </RequirementItem>
                  <RequirementItem met={passwordRequirements.lowercase}>
                    Una letra minúscula
                  </RequirementItem>
                  <RequirementItem met={passwordRequirements.number}>
                    Un número
                  </RequirementItem>
                  <RequirementItem met={passwordRequirements.special}>
                    Un carácter especial
                  </RequirementItem>
                </RequirementsList>
              </PasswordRequirements>
            )}
          </InputGroup>

          <InputGroup>
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <InputContainer>
              <InputIcon>
                <FiLock size={20} />
              </InputIcon>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FiEyeOff size={20} />
                ) : (
                  <FiEye size={20} />
                )}
              </PasswordToggle>
            </InputContainer>
            {errors.confirmPassword && (
              <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
            )}
          </InputGroup>

          <RegisterButton type="submit" loading={loading} disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </RegisterButton>
        </Form>

        <LoginLink>
          <LoginText>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </LoginText>
        </LoginLink>
      </RegisterCard>
    </Container>
  );
};

export default RegisterPage;
