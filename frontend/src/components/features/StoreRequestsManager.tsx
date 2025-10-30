import React, { useEffect, useState } from "react";
import styled from "styled-components";
import {
  FiSearch,
  FiCheck,
  FiX,
  FiMapPin,
  FiMail,
  FiPhone,
  FiGlobe,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { AdminService } from "../../services/adminService";
import { Store } from "../../services/storeService";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SearchBar = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.25rem;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  background: ${(props) => (props.active ? "white" : "transparent")};
  color: ${(props) => (props.active ? "#16a34a" : "#666")};
  border: none;
  border-bottom: 2px solid ${(props) => (props.active ? "#16a34a" : "transparent")};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: -2px;

  &:hover {
    color: #16a34a;
  }
`;

const RequestsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const RequestCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const StoreName = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  color: #16a34a;
  font-weight: 700;
`;

const StatusBadge = styled.span<{ status: "pending" | "approved" | "rejected" }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${(props) => {
    switch (props.status) {
      case "approved":
        return "#dcfce7";
      case "rejected":
        return "#fee2e2";
      case "pending":
        return "#fef3c7";
    }
  }};
  color: ${(props) => {
    switch (props.status) {
      case "approved":
        return "#15803d";
      case "rejected":
        return "#dc2626";
      case "pending":
        return "#d97706";
    }
  }};
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #666;
  font-size: 0.875rem;

  svg {
    color: #16a34a;
    flex-shrink: 0;
  }
`;

const RequestDate = styled.div`
  color: #999;
  font-size: 0.75rem;
  margin-bottom: 1rem;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const ActionButton = styled.button<{ variant: "approve" | "reject" }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  ${(props) =>
    props.variant === "approve"
      ? `
    background: #dcfce7;
    color: #15803d;

    &:hover {
      background: #16a34a;
      color: white;
    }
  `
      : `
    background: #fee2e2;
    color: #dc2626;

    &:hover {
      background: #dc2626;
      color: white;
    }
  `}

  svg {
    font-size: 1rem;
  }
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #666;
  background: white;
  border-radius: 12px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: #666;
`;

type ViewMode = "all" | "pending";

const StoreRequestsManager: React.FC = () => {
  const [requests, setRequests] = useState<Store[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, requests, viewMode]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      console.log("🏪 Loading store requests...");
      const storeRequests = await AdminService.getStoreRequests();
      console.log("🏪 Store requests loaded:", storeRequests);
      console.log("🏪 Number of requests:", storeRequests.length);
      setRequests(storeRequests);
    } catch (error) {
      console.error("❌ Error loading store requests:", error);
      toast.error("Error al cargar las solicitudes de tiendas");
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    console.log("🔍 Filtering requests...");
    console.log("🔍 Total requests:", requests.length);
    console.log("🔍 View mode:", viewMode);

    // Filtrar por modo de vista
    if (viewMode === "pending") {
      filtered = filtered.filter((r) => !r.verified);
      console.log("🔍 After pending filter:", filtered.length);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log("🔍 After search filter:", filtered.length);
    }

    console.log("🔍 Final filtered requests:", filtered);
    setFilteredRequests(filtered);
  };

  const handleApprove = async (requestId: string) => {
    try {
      await AdminService.verifyStore(requestId);
      // Remover de la lista de pending
      setRequests(requests.filter((r) => r.id !== requestId));
      toast.success("Solicitud de tienda aprobada");
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Error al aprobar la solicitud");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await AdminService.rejectStore(requestId);
      // Remover de la lista
      setRequests(requests.filter((r) => r.id !== requestId));
      toast.success("Solicitud de tienda rechazada");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Error al rechazar la solicitud");
    }
  };

  if (loading) {
    return <LoadingContainer>Cargando solicitudes...</LoadingContainer>;
  }

  return (
    <Container>
      <TopBar>
        <SearchBar>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>
      </TopBar>

      <TabsContainer>
        <Tab
          active={viewMode === "pending"}
          onClick={() => setViewMode("pending")}
        >
          Solicitudes Pendientes
        </Tab>
        <Tab active={viewMode === "all"} onClick={() => setViewMode("all")}>
          Todas las Solicitudes
        </Tab>
      </TabsContainer>

      {filteredRequests.length === 0 ? (
        <EmptyState>
          {searchTerm
            ? "No se encontraron solicitudes"
            : "No hay solicitudes para mostrar"}
        </EmptyState>
      ) : (
        <RequestsGrid>
          {filteredRequests.map((request) => (
            <RequestCard key={request.id}>
              <CardHeader>
                <StoreName>{request.store_name}</StoreName>
                <StatusBadge status={request.verified ? "approved" : "pending"}>
                  {request.verified ? "Verificada" : "Pendiente"}
                </StatusBadge>
              </CardHeader>

              <RequestDate>
                Solicitado el{" "}
                {new Date(request.created_at).toLocaleDateString()}
              </RequestDate>

              <InfoItem>
                <FiMapPin />
                {request.location}
              </InfoItem>

              <InfoItem>
                <FiMail />
                {request.contact_email}
              </InfoItem>

              {request.phone_number && (
                <InfoItem>
                  <FiPhone />
                  {request.phone_number}
                </InfoItem>
              )}

              {request.website_url && (
                <InfoItem>
                  <FiGlobe />
                  <a
                    href={request.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#16a34a", textDecoration: "none" }}
                  >
                    {request.website_url}
                  </a>
                </InfoItem>
              )}

              {request.short_description && (
                <InfoItem style={{ display: "block", marginTop: "0.5rem" }}>
                  <strong>Descripción:</strong> {request.short_description}
                </InfoItem>
              )}

              <InfoItem style={{ display: "block", fontSize: "0.875rem", color: "#6b7280" }}>
                <strong>Razón Social:</strong> {request.legal_name} ({request.cif_nif})
              </InfoItem>

              {!request.verified && (
                <ActionsContainer>
                  <ActionButton
                    variant="approve"
                    onClick={() => handleApprove(request.id)}
                  >
                    <FiCheck />
                    Aprobar
                  </ActionButton>
                  <ActionButton
                    variant="reject"
                    onClick={() => handleReject(request.id)}
                  >
                    <FiX />
                    Rechazar
                  </ActionButton>
                </ActionsContainer>
              )}
            </RequestCard>
          ))}
        </RequestsGrid>
      )}
    </Container>
  );
};

export default StoreRequestsManager;
