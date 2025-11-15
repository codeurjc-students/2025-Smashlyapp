import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  FiEye,
  FiEyeOff,
  FiFileText,
  FiGlobe,
  FiImage,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext.tsx";
import storeService from "../services/storeService";
import StoreRequestModal from "../components/features/StoreRequestModal";

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

const RegistrationTypeSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TypeCard = styled.button<{ isSelected: boolean }>`
  flex: 1;
  padding: 1.5rem;
  border: 2px solid
    ${(props) => (props.isSelected ? "#16a34a" : "#e5e7eb")};
  border-radius: 12px;
  background: ${(props) => (props.isSelected ? "#f0fdf4" : "white")};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: #16a34a;
    background: #f0fdf4;
  }
`;

const TypeIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const TypeTitle = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

const TypeDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #16a34a;
    background: #f0fdf4;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

type RegistrationType = "player" | "store";

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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);

  // Get redirect path from URL params or default to home
  const redirectTo = searchParams.get('redirect') || '/';
  const [formData, setFormData] = useState<FormData>({
    registrationType: "player",
    fullName: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    storeName: "",
    legalName: "",
    cifNif: "",
    contactEmail: "",
    phoneNumber: "",
    websiteUrl: "",
    logoUrl: "",
    shortDescription: "",
    location: "",
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

    // Validar campos comunes
    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.nickname.trim()) {
      newErrors.nickname = "El nickname es requerido";
    } else if (formData.nickname.trim().length < 3) {
      newErrors.nickname = "El nickname debe tener al menos 3 caracteres";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.nickname)) {
      newErrors.nickname =
        "El nickname solo puede contener letras, números y guiones bajos";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (!isPasswordValid) {
      newErrors.password = "La contraseña no cumple con los requisitos";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    // Validar campos específicos de tienda
    if (formData.registrationType === "store") {
      if (!formData.storeName?.trim()) {
        newErrors.storeName = "El nombre de la tienda es requerido";
      }

      if (!formData.legalName?.trim()) {
        newErrors.legalName = "La razón social es requerida";
      }

      if (!formData.cifNif?.trim()) {
        newErrors.cifNif = "El CIF/NIF es requerido";
      } else if (!/^[A-Z0-9]{9}$/i.test(formData.cifNif.trim())) {
        newErrors.cifNif = "El CIF/NIF debe tener 9 caracteres alfanuméricos";
      }

      if (!formData.contactEmail?.trim()) {
        newErrors.contactEmail = "El email de contacto es requerido";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())
      ) {
        newErrors.contactEmail = "Ingresa un email válido";
      }

      if (!formData.phoneNumber?.trim()) {
        newErrors.phoneNumber = "El teléfono es requerido";
      } else if (!/^[+]?[\d\s-]{9,}$/.test(formData.phoneNumber.trim())) {
        newErrors.phoneNumber = "Ingresa un teléfono válido";
      }

      if (!formData.location?.trim()) {
        newErrors.location = "La ubicación es requerida";
      }

      if (formData.websiteUrl?.trim()) {
        try {
          new URL(formData.websiteUrl.trim());
        } catch {
          newErrors.websiteUrl = "Ingresa una URL válida";
        }
      }

      if (formData.logoUrl?.trim()) {
        try {
          new URL(formData.logoUrl.trim());
        } catch {
          newErrors.logoUrl = "Ingresa una URL válida";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      // Crear cuenta de usuario
      const { error, token } = await signUp(
        formData.email.trim(),
        formData.password,
        formData.nickname.trim(),
        formData.fullName.trim() || undefined
      );

      if (error) {
        toast.error(error || "Error al crear la cuenta");
        return;
      }

      if (!token) {
        toast.error("Error al obtener el token de autenticación");
        console.error("❌ No token returned from signUp");
        return;
      }

      console.log("✅ Token received from signUp:", token ? "Present" : "Missing");

      // Si es una tienda, crear también la solicitud de tienda
      if (formData.registrationType === "store") {
        try {
          console.log("🏪 Creating store request...");
          console.log("Token (first 20 chars):", token ? token.substring(0, 20) + "..." : "Missing");
          console.log("Store data:", {
            store_name: formData.storeName,
            legal_name: formData.legalName,
            cif_nif: formData.cifNif,
            contact_email: formData.contactEmail,
            phone_number: formData.phoneNumber,
            location: formData.location,
          });

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
            token
          );

          console.log("✅ Store request created successfully");
          // Mostrar modal de confirmación
          setShowStoreModal(true);
        } catch (storeError: any) {
          console.error("❌ Error creating store:", storeError);
          console.error("Error message:", storeError.message);
          console.error("Error stack:", storeError.stack);
          toast.error(
            `Cuenta creada pero error al registrar la tienda: ${storeError.message}. Revisa tu email para confirmar tu cuenta.`
          );
          // Aunque haya error en la tienda, redirigir al login después de 3 segundos
          setTimeout(() => navigate("/login"), 3000);
        }
      } else {
        toast.success(
          "¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta."
        );
        navigate(redirectTo);
      }
    } catch (error) {
      toast.error("Error inesperado. Inténtalo de nuevo.");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowStoreModal(false);
    navigate(redirectTo);
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
          <RegistrationTypeSelector>
            <TypeCard
              type="button"
              isSelected={formData.registrationType === "player"}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  registrationType: "player",
                }))
              }
            >
              <TypeIcon>👤</TypeIcon>
              <TypeTitle>Jugador</TypeTitle>
              <TypeDescription>
                Únete como jugador y descubre palas
              </TypeDescription>
            </TypeCard>
            <TypeCard
              type="button"
              isSelected={formData.registrationType === "store"}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  registrationType: "store",
                }))
              }
            >
              <TypeIcon>🏪</TypeIcon>
              <TypeTitle>Tienda</TypeTitle>
              <TypeDescription>
                Registra tu tienda de pádel
              </TypeDescription>
            </TypeCard>
          </RegistrationTypeSelector>

          {formData.registrationType === "store" && (
            <>
              <InputGroup>
                <Label htmlFor="storeName">Nombre de la Tienda *</Label>
                <InputContainer>
                  <InputIcon>
                    <FiShoppingBag size={20} />
                  </InputIcon>
                  <Input
                    id="storeName"
                    name="storeName"
                    type="text"
                    placeholder="Nombre comercial de tu tienda"
                    value={formData.storeName}
                    onChange={handleInputChange}
                  />
                </InputContainer>
                {errors.storeName && (
                  <ErrorMessage>{errors.storeName}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="legalName">Razón Social *</Label>
                <InputContainer>
                  <InputIcon>
                    <FiFileText size={20} />
                  </InputIcon>
                  <Input
                    id="legalName"
                    name="legalName"
                    type="text"
                    placeholder="Nombre legal de la empresa"
                    value={formData.legalName}
                    onChange={handleInputChange}
                  />
                </InputContainer>
                {errors.legalName && (
                  <ErrorMessage>{errors.legalName}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="cifNif">CIF/NIF *</Label>
                <InputContainer>
                  <InputIcon>
                    <FiFileText size={20} />
                  </InputIcon>
                  <Input
                    id="cifNif"
                    name="cifNif"
                    type="text"
                    placeholder="Ej: B12345678"
                    value={formData.cifNif}
                    onChange={handleInputChange}
                  />
                </InputContainer>
                {errors.cifNif && <ErrorMessage>{errors.cifNif}</ErrorMessage>}
              </InputGroup>
            </>
          )}

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

          {formData.registrationType === "store" && (
            <>
              <InputGroup>
                <Label htmlFor="contactEmail">Email de Contacto *</Label>
                <InputContainer>
                  <InputIcon>
                    <FiMail size={20} />
                  </InputIcon>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    placeholder="contacto@tutienda.com"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                  />
                </InputContainer>
                {errors.contactEmail && (
                  <ErrorMessage>{errors.contactEmail}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="phoneNumber">Teléfono *</Label>
                <InputContainer>
                  <InputIcon>
                    <FiPhone size={20} />
                  </InputIcon>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+34 XXX XXX XXX"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </InputContainer>
                {errors.phoneNumber && (
                  <ErrorMessage>{errors.phoneNumber}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="location">Ubicación *</Label>
                <InputContainer>
                  <InputIcon>
                    <FiMapPin size={20} />
                  </InputIcon>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="Ciudad, País"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </InputContainer>
                {errors.location && (
                  <ErrorMessage>{errors.location}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="websiteUrl">Sitio Web (opcional)</Label>
                <InputContainer>
                  <InputIcon>
                    <FiGlobe size={20} />
                  </InputIcon>
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="url"
                    placeholder="https://tutienda.com"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                  />
                </InputContainer>
                {errors.websiteUrl && (
                  <ErrorMessage>{errors.websiteUrl}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="logoUrl">URL del Logo (opcional)</Label>
                <InputContainer>
                  <InputIcon>
                    <FiImage size={20} />
                  </InputIcon>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    placeholder="https://ejemplo.com/logo.png"
                    value={formData.logoUrl}
                    onChange={handleInputChange}
                  />
                </InputContainer>
                {errors.logoUrl && (
                  <ErrorMessage>{errors.logoUrl}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="shortDescription">
                  Descripción Breve (opcional)
                </Label>
                <InputContainer>
                  <InputIcon>
                    <FiFileText size={20} />
                  </InputIcon>
                  <TextArea
                    id="shortDescription"
                    name="shortDescription"
                    placeholder="Describe tu tienda..."
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                  />
                </InputContainer>
                {errors.shortDescription && (
                  <ErrorMessage>{errors.shortDescription}</ErrorMessage>
                )}
              </InputGroup>
            </>
          )}

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
            ¿Ya tienes cuenta? <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`}>Inicia sesión</Link>
          </LoginText>
        </LoginLink>
      </RegisterCard>

      <StoreRequestModal
        isOpen={showStoreModal}
        onClose={handleModalClose}
        onContinue={handleModalClose}
        storeName={formData.storeName || "tu tienda"}
      />
    </Container>
  );
};

export default RegisterPage;
