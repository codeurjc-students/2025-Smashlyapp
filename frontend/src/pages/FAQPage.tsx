import React, { useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiMail,
} from "react-icons/fi";
import styled from "styled-components";

// Interface for FAQ item structure
interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const Container = styled.div`
  min-height: 100vh;
  background: #f8faf8;
`;

const HeroSection = styled.div`
  padding: 3rem 1.5rem;
  text-align: center;
  background: #f8faf8;
`;

const MainTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 1rem;
  line-height: 1.2;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HighlightText = styled.span`
  color: #16a34a;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  line-height: 1.5;
  max-width: 600px;
  margin: 0 auto;
`;

const CategorySection = styled.div`
  padding: 2rem 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
`;

const CategoryContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const CategoryScrollContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;

    &:hover {
      background: #9ca3af;
    }
  }

  @media (min-width: 768px) {
    justify-content: center;
    flex-wrap: wrap;
    overflow-x: visible;
  }
`;

const CategoryButton = styled.button<{ isActive: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  background: ${(props) =>
    props.isActive
      ? "linear-gradient(135deg, #16a34a 0%, #059669 100%)"
      : "white"};
  border: 2px solid ${(props) => (props.isActive ? "#16a34a" : "#e5e7eb")};
  font-size: 0.875rem;
  font-weight: ${(props) => (props.isActive ? "600" : "500")};
  color: ${(props) => (props.isActive ? "white" : "#6b7280")};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  box-shadow: ${(props) =>
    props.isActive
      ? "0 4px 14px rgba(22, 163, 74, 0.3)"
      : "0 2px 4px rgba(0, 0, 0, 0.05)"};

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-2px);
    background: ${(props) =>
      props.isActive
        ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
        : "#f9fafb"};
    border-color: ${(props) => (props.isActive ? "#059669" : "#16a34a")};
    color: ${(props) => (props.isActive ? "white" : "#16a34a")};
    box-shadow: ${(props) =>
      props.isActive
        ? "0 8px 25px rgba(22, 163, 74, 0.4)"
        : "0 4px 12px rgba(22, 163, 74, 0.15)"};

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
    transition: transform 0.1s;
  }

  &:focus {
    outline: none;
    ring: 2px solid #16a34a;
    ring-opacity: 0.5;
  }
`;

const FAQSection = styled.div`
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
`;

const FAQItem = styled.div`
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const QuestionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  background: white;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f9fafb;
  }
`;

const QuestionText = styled.span`
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.5;
  margin-right: 0.75rem;
`;

const ChevronIcon = styled.div`
  margin-left: 0.5rem;
  color: #16a34a;
`;

const AnswerContainer = styled.div`
  padding: 1.25rem;
  padding-top: 0;
  background: #f9fafb;
`;

const CategoryBadge = styled.div`
  background: #dcfce7;
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  display: inline-block;
  margin-bottom: 0.75rem;
`;

const CategoryBadgeText = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #16a34a;
`;

const AnswerText = styled.p`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
`;

const ContactSection = styled.div`
  padding: 2.5rem 1.5rem;
  max-width: 600px;
  margin: 0 auto;
`;

const ContactCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ContactIconContainer = styled.div`
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: #f0f9ff;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 1.25rem;
`;

const ContactTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const ContactDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 1.5rem;
`;

const ContactButton = styled.button`
  background: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  margin: 0 auto;
  transition: background-color 0.2s ease;

  &:hover {
    background: #059669;
  }
`;

const ContactButtonText = styled.span`
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
`;

const FAQPage: React.FC = () => {
  // State to track which FAQ item is currently expanded
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  // State to track active category filter
  const [activeCategory, setActiveCategory] = useState<string>("Todas");

  // Array of FAQ data with different categories
  const faqData: FAQItem[] = [
    {
      id: 1,
      question: "¿Qué es Smashly y cómo funciona?",
      answer:
        "Smashly es una plataforma web diseñada para jugadores de pádel amateur que te permite comparar palas, obtener recomendaciones personalizadas con IA y encontrar la pala perfecta para tu estilo de juego. La plataforma analiza tus preferencias y nivel para ofrecerte las mejores opciones del mercado.",
      category: "General",
    },
    {
      id: 2,
      question: "¿Es gratuita la plataforma?",
      answer:
        "Sí, Smashly es completamente gratuita para usar. Ofrecemos todas las funciones principales sin costo, incluyendo el comparador de palas, recomendaciones con IA y acceso a nuestra base de datos de productos. Nuestro objetivo es ayudar a todos los jugadores a encontrar su pala ideal.",
      category: "General",
    },
    {
      id: 3,
      question: "¿Cómo funciona el comparador de palas?",
      answer:
        "Nuestro comparador te permite seleccionar hasta 3 palas diferentes y compararlas lado a lado. Utilizamos inteligencia artificial para analizar las características técnicas, precios y especificaciones de cada pala, proporcionándote un análisis detallado para ayudarte a tomar la mejor decisión.",
      category: "Palas",
    },
    {
      id: 4,
      question: "¿Cómo obtiene Smashly los datos de las palas?",
      answer:
        "Recopilamos información de múltiples fuentes confiables incluyendo fabricantes, tiendas especializadas y sitios web de pádel. Nuestros datos incluyen especificaciones técnicas, precios actualizados, imágenes y disponibilidad en tiempo real.",
      category: "Palas",
    },
    {
      id: 5,
      question: "¿Qué información necesito para obtener recomendaciones?",
      answer:
        "Para obtener recomendaciones personalizadas, necesitamos conocer tu nivel de juego, estilo preferido, presupuesto, altura, peso y forma de pala que prefieres. Cuanta más información proporciones, más precisas serán nuestras recomendaciones.",
      category: "Recomendaciones",
    },
    {
      id: 6,
      question: "¿Puedo comprar palas directamente en Smashly?",
      answer:
        "No vendemos palas directamente, pero te dirigimos a tiendas confiables donde puedes realizar tu compra. Proporcionamos enlaces directos a los mejores precios disponibles en el mercado y te ayudamos a encontrar ofertas especiales.",
      category: "Compras",
    },
    {
      id: 7,
      question: "¿Con qué frecuencia se actualizan los precios?",
      answer:
        "Actualizamos nuestros precios semanalmente para asegurar que tengas la información más reciente. También monitoreamos ofertas especiales y descuentos para mantenerte informado de las mejores oportunidades de compra.",
      category: "Precios",
    },
    {
      id: 8,
      question: "¿Qué significa que una pala sea 'bestseller'?",
      answer:
        "Las palas marcadas como 'bestseller' son aquellas que han demostrado alta popularidad entre los usuarios y tienen excelentes valoraciones. Estos productos suelen ser opciones seguras y bien valoradas por la comunidad de jugadores.",
      category: "Palas",
    },
    {
      id: 9,
      question: "¿Puedo guardar mis palas favoritas?",
      answer:
        "Actualmente estamos desarrollando la funcionalidad de cuenta de usuario que te permitirá guardar tus palas favoritas, crear listas de deseos y acceder a un historial de comparaciones. Esta función estará disponible próximamente.",
      category: "Cuenta",
    },
    {
      id: 10,
      question: "¿Cómo puedo contactar con el equipo de soporte?",
      answer:
        "Puedes contactarnos a través del formulario de contacto en nuestra web o enviando un email directo. Nuestro equipo responde todas las consultas en un plazo máximo de 24 horas durante días laborables.",
      category: "Soporte",
    },
  ];

  // Array of categories for filtering
  const categories = [
    "Todas",
    "General",
    "Palas",
    "Recomendaciones",
    "Compras",
    "Precios",
    "Cuenta",
    "Soporte",
  ];

  // Filter FAQ items based on selected category
  const filteredFAQ =
    activeCategory === "Todas"
      ? faqData
      : faqData.filter((item) => item.category === activeCategory);

  // Function to toggle FAQ item expansion
  const toggleExpansion = (id: number) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  // Function to handle contact (you can implement modal or redirect to contact page)
  const handleContact = () => {
    // For now, open email client
    window.location.href =
      "mailto:soporte@smashly.com?subject=Consulta desde FAQ";
  };

  return (
    <Container>
      {/* Hero section */}
      <HeroSection>
        <MainTitle>
          Preguntas <HighlightText>Frecuentes</HighlightText>
        </MainTitle>
        <Subtitle>
          Encuentra respuestas a las preguntas más comunes sobre Smashly
        </Subtitle>
      </HeroSection>

      {/* Category filter section */}
      <CategorySection>
        <CategoryContainer>
          <CategoryScrollContainer>
            {categories.map((category) => (
              <CategoryButton
                key={category}
                isActive={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </CategoryButton>
            ))}
          </CategoryScrollContainer>
        </CategoryContainer>
      </CategorySection>

      {/* FAQ items section */}
      <FAQSection>
        {filteredFAQ.map((item) => (
          <FAQItem key={item.id}>
            {/* Question header - clickable to expand/collapse */}
            <QuestionHeader onClick={() => toggleExpansion(item.id)}>
              <QuestionText>{item.question}</QuestionText>
              <ChevronIcon>
                {expandedItem === item.id ? (
                  <FiChevronUp size={24} />
                ) : (
                  <FiChevronDown size={24} />
                )}
              </ChevronIcon>
            </QuestionHeader>

            {/* Answer section - only visible when expanded */}
            {expandedItem === item.id && (
              <AnswerContainer>
                <CategoryBadge>
                  <CategoryBadgeText>{item.category}</CategoryBadgeText>
                </CategoryBadge>
                <AnswerText>{item.answer}</AnswerText>
              </AnswerContainer>
            )}
          </FAQItem>
        ))}
      </FAQSection>

      {/* Contact section */}
      <ContactSection>
        <ContactCard>
          <ContactIconContainer>
            <FiHelpCircle size={32} color="#16a34a" />
          </ContactIconContainer>
          <ContactTitle>¿No encuentras lo que buscas?</ContactTitle>
          <ContactDescription>
            Nuestro equipo de soporte está aquí para ayudarte con cualquier
            pregunta adicional
          </ContactDescription>
          <ContactButton onClick={handleContact}>
            <FiMail size={16} />
            <ContactButtonText>Contactar soporte</ContactButtonText>
          </ContactButton>
        </ContactCard>
      </ContactSection>
    </Container>
  );
};

export default FAQPage;
