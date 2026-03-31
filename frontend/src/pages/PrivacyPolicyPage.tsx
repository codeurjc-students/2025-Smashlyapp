import styled from 'styled-components';
import { Link as RouterLink } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  color: #1f2937;
  line-height: 1.6;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackLink = styled(RouterLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccff00;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0;
  color: #1f2937;
`;

const Section = styled.section`
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border-left: 4px solid #ccff00;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  color: #1f2937;
`;

const Paragraph = styled.p`
  margin: 1rem 0;
  color: #4b5563;
`;

const List = styled.ul`
  margin: 1rem 0;
  padding-left: 2rem;
  color: #4b5563;
`;

const ListItem = styled.li`
  margin: 0.75rem 0;
`;

const InlineLink = styled.a`
  color: #ccff00;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
`;

const LastUpdated = styled.div`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #9ca3af;
`;

export default function PrivacyPolicyPage() {
  return (
    <Container>
      <Header>
        <BackLink to='/'>
          <FiArrowLeft size={20} />
          Volver
        </BackLink>
      </Header>

      <Title>Política de Privacidad</Title>

      <Section>
        <SectionTitle>1. Introducción</SectionTitle>
        <Paragraph>
          En Smashlyapp, nos comprometemos a proteger su privacidad y garantizar que comprenda cómo
          utilizamos sus datos personales. Esta Política de Privacidad describe cómo recopilamos,
          utilizamos, compartimos y protegemos su información.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>2. Información que Recopilamos</SectionTitle>
        <Paragraph>Recopilamos información de las siguientes formas:</Paragraph>

        <Paragraph>
          <strong>Información que usted proporciona directamente:</strong>
        </Paragraph>
        <List>
          <ListItem>Nombre completo y correo electrónico</ListItem>
          <ListItem>Nombre de usuario (nickname)</ListItem>
          <ListItem>Contraseña (almacenada de forma segura)</ListItem>
          <ListItem>Información de perfil (foto, biografía)</ListItem>
          <ListItem>Preferencias de pádel y palas favoritas</ListItem>
          <ListItem>Datos de ubicación (opcional)</ListItem>
        </List>

        <Paragraph>
          <strong>Información recopilada automáticamente:</strong>
        </Paragraph>
        <List>
          <ListItem>Dirección IP y tipo de dispositivo</ListItem>
          <ListItem>Browser y sistema operativo</ListItem>
          <ListItem>Páginas visitadas y tiempo en la Plataforma</ListItem>
          <ListItem>Cookies y datos de sesión</ListItem>
          <ListItem>Datos de interacción con la Plataforma</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>3. Cómo Utilizamos Su Información</SectionTitle>
        <Paragraph>Utilizamos su información para:</Paragraph>
        <List>
          <ListItem>Crear y mantener su cuenta</ListItem>
          <ListItem>Proporcionar y mejorar nuestros servicios</ListItem>
          <ListItem>Personalizar su experiencia en la Plataforma</ListItem>
          <ListItem>Comunicaciones relacionadas con su cuenta</ListItem>
          <ListItem>Responder a sus consultas y soporte</ListItem>
          <ListItem>Análisis y mejora de la Plataforma</ListItem>
          <ListItem>Cumplimiento de obligaciones legales</ListItem>
          <ListItem>Prevención de fraude y abuso</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>4. Base Legal para el Procesamiento</SectionTitle>
        <Paragraph>
          Procesamos sus datos bajo las siguientes bases legales conforme al RGPD:
        </Paragraph>
        <List>
          <ListItem>
            <strong>Consentimiento:</strong> Cuando usted lo ha proporcionado explícitamente
          </ListItem>
          <ListItem>
            <strong>Contrato:</strong> Para ejecutar nuestros términos de servicio
          </ListItem>
          <ListItem>
            <strong>Obligación Legal:</strong> Cuando la ley lo requiere
          </ListItem>
          <ListItem>
            <strong>Intereses Legítimos:</strong> Para mejorar nuestros servicios
          </ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>5. Compartir Información</SectionTitle>
        <Paragraph>
          No vendemos, alquilamos ni compartimos su información personal con terceros.
        </Paragraph>
        <Paragraph>Podemos compartir información en las siguientes situaciones:</Paragraph>
        <List>
          <ListItem>
            <strong>Proveedores de Servicios:</strong> Con contratistas que nos ayudan a operar la
            Plataforma (hosting, análisis, soporte)
          </ListItem>
          <ListItem>
            <strong>Cumplimiento Legal:</strong> Cuando lo requiere la ley o autoridades competentes
          </ListItem>
          <ListItem>
            <strong>Protección de Derechos:</strong> Para proteger nuestros derechos legales y la
            seguridad de usuarios
          </ListItem>
          <ListItem>
            <strong>Transferencia de Negocio:</strong> En caso de adquisición o fusión
          </ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>6. Retención de Datos</SectionTitle>
        <Paragraph>
          Conservamos su información personal durante el tiempo que sea necesario para prestarle
          servicios. Después de la eliminación de su cuenta:
        </Paragraph>
        <List>
          <ListItem>
            Los datos personales se eliminan dentro de 90 días, salvo excepciones legales
          </ListItem>
          <ListItem>Podemos retener datos anonimizados para análisis y mejora</ListItem>
          <ListItem>Algunos datos pueden retenerse para cumplimiento legal</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>7. Derechos RGPD</SectionTitle>
        <Paragraph>
          Bajo el Reglamento General de Protección de Datos (RGPD), tiene los siguientes derechos:
        </Paragraph>
        <List>
          <ListItem>
            <strong>Derecho de Acceso:</strong> Obtener copia de sus datos personales
          </ListItem>
          <ListItem>
            <strong>Derecho de Rectificación:</strong> Corregir datos inexactos
          </ListItem>
          <ListItem>
            <strong>Derecho de Supresión:</strong> Solicitar eliminación de sus datos
          </ListItem>
          <ListItem>
            <strong>Derecho a Limitar el Procesamiento:</strong> Restringir cómo usamos sus datos
          </ListItem>
          <ListItem>
            <strong>Derecho de Portabilidad:</strong> Obtener datos en formato legible
          </ListItem>
          <ListItem>
            <strong>Derecho de Oposición:</strong> Oponerse al procesamiento de datos
          </ListItem>
        </List>
        <Paragraph>
          Para ejercer estos derechos, contacte a:{' '}
          <InlineLink href='mailto:privacy@smashlyapp.com'>privacy@smashlyapp.com</InlineLink>
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>8. Seguridad de Datos</SectionTitle>
        <Paragraph>
          Implementamos medidas técnicas y organizativas para proteger su información:
        </Paragraph>
        <List>
          <ListItem>Encriptación de datos en tránsito (HTTPS/TLS)</ListItem>
          <ListItem>Almacenamiento seguro con contraseñas hasheadas</ListItem>
          <ListItem>Acceso limitado a personal autorizado</ListItem>
          <ListItem>Auditorías de seguridad regulares</ListItem>
          <ListItem>Cumplimiento con estándares de seguridad internacionales</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>9. Cookies y Tecnologías Similares</SectionTitle>
        <Paragraph>
          Utilizamos cookies para mejorar su experiencia. Las cookies pueden ser:
        </Paragraph>
        <List>
          <ListItem>
            <strong>Esenciales:</strong> Necesarias para el funcionamiento de la Plataforma
          </ListItem>
          <ListItem>
            <strong>Funcionales:</strong> Para recordar sus preferencias
          </ListItem>
          <ListItem>
            <strong>Analíticas:</strong> Para comprender cómo usa la Plataforma
          </ListItem>
          <ListItem>
            <strong>Marketing:</strong> Para personalizar content relevante (si lo consiente)
          </ListItem>
        </List>
        <Paragraph>
          Puede controlar cookies a través de la configuración de su navegador. Tenga en cuenta que
          deshabilitarlas puede afectar la funcionalidad.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>10. Enlaces a Terceros</SectionTitle>
        <Paragraph>
          La Plataforma puede contener enlaces a sitios web de terceros. No somos responsables de
          sus prácticas de privacidad. Le recomendamos revisar sus políticas de privacidad.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>11. Menores de Edad</SectionTitle>
        <Paragraph>
          La Plataforma no está dirigida a menores de 16 años. No recopilamos información de menores
          sabiendo que es así. Si descubrimos que hemos recopilado datos de un menor, tomaremos
          medidas inmediatas para eliminarlos.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>12. Cambios en la Política</SectionTitle>
        <Paragraph>
          Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento.
          Los cambios serán efectivos inmediatamente al publicarse. Su uso continuado de la
          Plataforma constituye aceptación de los cambios.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>13. Contacto</SectionTitle>
        <Paragraph>
          Para preguntas sobre esta Política de Privacidad o para ejercer sus derechos RGPD,
          contacte a:
        </Paragraph>
        <Paragraph>
          Email:{' '}
          <InlineLink href='mailto:privacy@smashlyapp.com'>privacy@smashlyapp.com</InlineLink>
          <br />
          Por correo postal: [Dirección de oficina a completar]
        </Paragraph>
      </Section>

      <LastUpdated>
        <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
      </LastUpdated>
    </Container>
  );
}
