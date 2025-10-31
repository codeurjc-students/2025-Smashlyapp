import React, { useEffect, useState } from "react";
import styled from "styled-components";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiCheck,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import RacketCRUDModal from "./RacketCRUDModal";
import { RacketService } from "../../services/racketService";
import { AdminService } from "../../services/adminService";

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

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #15803d;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
  }

  svg {
    font-size: 1.25rem;
  }
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

const Table = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr 1.5fr;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #666;
  font-size: 0.875rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr 1.5fr;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
  transition: background 0.2s ease;

  &:hover {
    background: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
  }
`;

const Cell = styled.div`
  color: #333;
  font-size: 0.875rem;
  
  @media (max-width: 1024px) {
    &:nth-child(n+4) {
      display: none;
    }
  }
`;

const BrandCell = styled(Cell)`
  font-weight: 600;
  color: #16a34a;
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

const ActionsCell = styled(Cell)`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const IconButton = styled.button<{ color?: string }>`
  padding: 0.5rem;
  background: ${(props) => props.color || "#f3f4f6"};
  color: ${(props) => (props.color ? "white" : "#666")};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.8;
    transform: translateY(-2px);
  }

  svg {
    font-size: 1rem;
  }
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #666;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: #666;
`;

interface Racket {
  id: number;
  nombre: string;
  marca: string;
  precio_actual: number;
  forma?: string;
  balance?: string;
  status?: "pending" | "approved" | "rejected";
  requester?: string;
  requestDate?: string;
}

type ViewMode = "all" | "requests";

const RacketRequestsManager: React.FC = () => {
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRacket, setEditingRacket] = useState<Racket | null>(null);

  useEffect(() => {
    loadRackets();
  }, []);

  useEffect(() => {
    filterRackets();
  }, [searchTerm, rackets, viewMode]);

  const loadRackets = async () => {
    try {
      // Cargar palas reales desde la API
      const racketsData = await RacketService.getAllRackets();
      
      // Convertir a formato esperado con status "approved" por defecto
      const formattedRackets: Racket[] = racketsData.map((racket: any) => ({
        id: racket.id,
        nombre: racket.nombre,
        marca: racket.marca || "Sin marca",
        precio_actual: racket.precio_actual || 0,
        forma: racket.forma,
        balance: racket.balance,
        status: "approved" as const, // Por ahora todas están aprobadas
      }));

      setRackets(formattedRackets);
    } catch (error) {
      console.error("Error loading rackets:", error);
      toast.error("Error al cargar las palas");
    } finally {
      setLoading(false);
    }
  };

  const filterRackets = () => {
    let filtered = rackets;

    // Filtrar por modo de vista
    if (viewMode === "requests") {
      filtered = filtered.filter((r) => r.status === "pending");
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.marca.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRackets(filtered);
  };

  const handleAddRacket = () => {
    setEditingRacket(null);
    setModalOpen(true);
  };

  const handleEditRacket = (racket: Racket) => {
    setEditingRacket(racket);
    setModalOpen(true);
  };

  const handleDeleteRacket = async (racketId: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta pala?")) {
      return;
    }

    try {
      // Llamar a la API para eliminar la pala
      await AdminService.deleteRacket(racketId);
      
      // Actualizar el estado local
      setRackets(rackets.filter((r) => r.id !== racketId));
      toast.success("Pala eliminada correctamente");
    } catch (error) {
      console.error("Error deleting racket:", error);
      toast.error("Error al eliminar la pala");
    }
  };

  const handleApproveRequest = async (racketId: number) => {
    try {
      // TODO: Implementar llamada a la API
      setRackets(
        rackets.map((r) =>
          r.id === racketId ? { ...r, status: "approved" as const } : r
        )
      );
      toast.success("Solicitud aprobada");
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Error al aprobar la solicitud");
    }
  };

  const handleRejectRequest = async (racketId: number) => {
    try {
      // TODO: Implementar llamada a la API
      setRackets(
        rackets.map((r) =>
          r.id === racketId ? { ...r, status: "rejected" as const } : r
        )
      );
      toast.success("Solicitud rechazada");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Error al rechazar la solicitud");
    }
  };

  const handleSaveRacket = async (racket: Racket) => {
    try {
      if (editingRacket) {
        // Actualizar pala existente
        await AdminService.updateRacket(racket.id, racket);
        setRackets(rackets.map((r) => (r.id === racket.id ? racket : r)));
        toast.success("Pala actualizada correctamente");
      } else {
        // Añadir nueva pala
        const newRacket = await AdminService.createRacket(racket);
        setRackets([...rackets, { ...newRacket, status: "approved" as const }]);
        toast.success("Pala añadida correctamente");
      }
      setModalOpen(false);
    } catch (error) {
      console.error("Error saving racket:", error);
      toast.error("Error al guardar la pala");
      throw error; // Re-lanzar para que el modal no se cierre en caso de error
    }
  };

  if (loading) {
    return <LoadingContainer>Cargando palas...</LoadingContainer>;
  }

  return (
    <Container>
      <TopBar>
        <SearchBar>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Buscar por nombre o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>
        <AddButton onClick={handleAddRacket}>
          <FiPlus />
          Añadir Pala
        </AddButton>
      </TopBar>

      <TabsContainer>
        <Tab active={viewMode === "all"} onClick={() => setViewMode("all")}>
          Todas las Palas
        </Tab>
        <Tab
          active={viewMode === "requests"}
          onClick={() => setViewMode("requests")}
        >
          Solicitudes Pendientes
        </Tab>
      </TabsContainer>

      <Table>
        <TableHeader>
          <Cell>ID</Cell>
          <Cell>Nombre</Cell>
          <Cell>Marca</Cell>
          <Cell>Precio</Cell>
          <Cell>Estado</Cell>
          <Cell style={{ textAlign: "right" }}>Acciones</Cell>
        </TableHeader>
        {filteredRackets.length === 0 ? (
          <EmptyState>
            {searchTerm
              ? "No se encontraron palas"
              : "No hay palas para mostrar"}
          </EmptyState>
        ) : (
          filteredRackets.map((racket) => (
            <TableRow key={racket.id}>
              <Cell>#{racket.id}</Cell>
              <Cell>{racket.nombre}</Cell>
              <BrandCell>{racket.marca}</BrandCell>
              <Cell>€{racket.precio_actual.toFixed(2)}</Cell>
              <Cell>
                {racket.status && (
                  <StatusBadge status={racket.status}>
                    {racket.status === "approved"
                      ? "Aprobada"
                      : racket.status === "rejected"
                      ? "Rechazada"
                      : "Pendiente"}
                  </StatusBadge>
                )}
              </Cell>
              <ActionsCell>
                {racket.status === "pending" && (
                  <>
                    <IconButton
                      color="#16a34a"
                      onClick={() => handleApproveRequest(racket.id)}
                      title="Aprobar"
                    >
                      <FiCheck />
                    </IconButton>
                    <IconButton
                      color="#dc2626"
                      onClick={() => handleRejectRequest(racket.id)}
                      title="Rechazar"
                    >
                      <FiX />
                    </IconButton>
                  </>
                )}
                <IconButton onClick={() => handleEditRacket(racket)} title="Editar">
                  <FiEdit2 />
                </IconButton>
                <IconButton
                  color="#ef4444"
                  onClick={() => handleDeleteRacket(racket.id)}
                  title="Eliminar"
                >
                  <FiTrash2 />
                </IconButton>
              </ActionsCell>
            </TableRow>
          ))
        )}
      </Table>

      {modalOpen && (
        <RacketCRUDModal
          racket={editingRacket}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveRacket}
        />
      )}
    </Container>
  );
};

export default RacketRequestsManager;
