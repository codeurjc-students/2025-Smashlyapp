import React, { useState } from 'react';
import styled from 'styled-components';
import EditUpdateModal from './EditUpdateModal';

interface PendingUpdate {
  id: number;
  racket_id: number | null;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  proposed_data: any;
  current_data: any;
  changes_summary: any;
  source_scraper: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface UpdateReviewCardProps {
  update: PendingUpdate;
  onApprove: () => void;
  onReject: () => void;
  onUpdate?: (updatedUpdate: PendingUpdate) => void;
}

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div<{ actionType: string }>`
  padding: 1.5rem;
  background: #f8f9fa;
  border-left: 4px solid
    ${props => {
      switch (props.actionType) {
        case 'CREATE':
          return '#6c757d';
        case 'UPDATE':
          return '#495057';
        case 'DELETE':
          return '#343a40';
        default:
          return '#adb5bd';
      }
    }};
  color: #212529;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e9ecef;
`;

const ActionBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
`;

const Metadata = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
`;

const CardBody = styled.div`
  padding: 1.5rem;
`;

const RacketName = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ComparisonColumn = styled.div`
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
`;

const ColumnTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FieldRow = styled.div<{ changed?: boolean }>`
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  background: ${props => (props.changed ? '#e9ecef' : 'transparent')};
  margin: 0 -0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;

  &:last-child {
    border-bottom: none;
  }
`;

const FieldLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const FieldValue = styled.div`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
`;

const ChangesSection = styled.div`
  background: #f8f9fa;
  border-left: 4px solid #6c757d;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
`;

const ChangesTitle = styled.div`
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const ChangeItem = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  padding: 0.25rem 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ variant: 'approve' | 'reject' | 'details' | 'edit' }>`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  ${props => {
    switch (props.variant) {
      case 'approve':
        return `
          background: #28a745;
          color: white;
          &:hover { background: #218838; }
        `;
      case 'reject':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      case 'edit':
        return `
          background: #495057;
          color: white;
          &:hover { background: #343a40; }
        `;
      case 'details':
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover { background: #e5e7eb; }
        `;
    }
  }}
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.5rem 0;
  font-weight: 500;

  &:hover {
    color: #495057;
    text-decoration: underline;
  }
`;

const UpdateReviewCard: React.FC<UpdateReviewCardProps> = ({
  update,
  onApprove,
  onReject,
  onUpdate,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUpdate, setCurrentUpdate] = useState(update);

  const handleSaveEdit = (updatedData: PendingUpdate) => {
    setCurrentUpdate(updatedData);
    if (onUpdate) {
      onUpdate(updatedData);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return '🆕';
      case 'UPDATE':
        return '🔄';
      case 'DELETE':
        return '🗑️';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return `${price.toFixed(2)}€`;
  };

  const renderFieldComparison = (label: string, field: string, isPrice = false) => {
    const currentValue = update.current_data?.[field];
    const proposedValue = update.proposed_data?.[field];
    const hasChanged = update.changes_summary?.[field];

    if (update.action_type === 'CREATE') {
      return (
        <FieldRow>
          <FieldLabel>{label}</FieldLabel>
          <FieldValue>{isPrice ? formatPrice(proposedValue) : proposedValue || 'N/A'}</FieldValue>
        </FieldRow>
      );
    }

    return (
      <FieldRow changed={hasChanged}>
        <FieldLabel>{label}</FieldLabel>
        <FieldValue>
          {isPrice ? formatPrice(currentValue) : currentValue || 'N/A'}
          {hasChanged && ' → '}
          {hasChanged && (isPrice ? formatPrice(proposedValue) : proposedValue)}
        </FieldValue>
      </FieldRow>
    );
  };

  const renderChanges = () => {
    if (!update.changes_summary || Object.keys(update.changes_summary).length === 0) {
      return null;
    }

    return (
      <ChangesSection>
        <ChangesTitle>📝 Cambios detectados:</ChangesTitle>
        {Object.entries(update.changes_summary).map(([field, change]: [string, any]) => (
          <ChangeItem key={field}>
            <strong>{field}:</strong> {String(change.old || 'N/A')} → {String(change.new || 'N/A')}
          </ChangeItem>
        ))}
      </ChangesSection>
    );
  };

  return (
    <Card>
      <CardHeader actionType={update.action_type}>
        <ActionBadge>
          <span>{getActionIcon(update.action_type)}</span>
          <span>{update.action_type}</span>
        </ActionBadge>
        <Metadata>
          {update.source_scraper} | {formatDate(update.created_at)}
        </Metadata>
      </CardHeader>

      <CardBody>
        <RacketName>{update.proposed_data?.name || 'Sin nombre'}</RacketName>

        {renderChanges()}

        {update.action_type === 'UPDATE' && !expanded && (
          <ExpandButton onClick={() => setExpanded(true)}>Ver comparación completa ▼</ExpandButton>
        )}

        {(update.action_type === 'CREATE' || expanded) && (
          <ComparisonGrid>
            {update.action_type === 'UPDATE' && (
              <ComparisonColumn>
                <ColumnTitle>⏮️ Antes</ColumnTitle>
                {renderFieldComparison('Marca', 'brand')}
                {renderFieldComparison('Modelo', 'model')}
                {renderFieldComparison('Precio PadelNuestro', 'padelnuestro_actual_price', true)}
                {renderFieldComparison('Precio PadelMarket', 'padelmarket_actual_price', true)}
                {renderFieldComparison('En oferta', 'on_offer')}
              </ComparisonColumn>
            )}

            <ComparisonColumn>
              <ColumnTitle>
                {update.action_type === 'UPDATE' ? '⏭️ Después' : '🆕 Nuevos datos'}
              </ColumnTitle>
              <FieldRow>
                <FieldLabel>Marca</FieldLabel>
                <FieldValue>{update.proposed_data?.brand || 'N/A'}</FieldValue>
              </FieldRow>
              <FieldRow>
                <FieldLabel>Modelo</FieldLabel>
                <FieldValue>{update.proposed_data?.model || 'N/A'}</FieldValue>
              </FieldRow>
              <FieldRow>
                <FieldLabel>Precio PadelNuestro</FieldLabel>
                <FieldValue>
                  {formatPrice(update.proposed_data?.padelnuestro_actual_price)}
                </FieldValue>
              </FieldRow>
              <FieldRow>
                <FieldLabel>Precio PadelMarket</FieldLabel>
                <FieldValue>
                  {formatPrice(update.proposed_data?.padelmarket_actual_price)}
                </FieldValue>
              </FieldRow>
              <FieldRow>
                <FieldLabel>En oferta</FieldLabel>
                <FieldValue>{update.proposed_data?.on_offer ? 'Sí' : 'No'}</FieldValue>
              </FieldRow>
            </ComparisonColumn>
          </ComparisonGrid>
        )}

        {expanded && (
          <ExpandButton onClick={() => setExpanded(false)}>Ocultar detalles ▲</ExpandButton>
        )}

        <ActionButtons>
          <Button variant='edit' onClick={() => setShowEditModal(true)}>
            ✏️ Editar
          </Button>
          <Button variant='approve' onClick={onApprove}>
            ✓ Aprobar
          </Button>
          <Button variant='reject' onClick={onReject}>
            ✗ Rechazar
          </Button>
        </ActionButtons>
      </CardBody>

      {showEditModal && (
        <EditUpdateModal
          update={currentUpdate}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}
    </Card>
  );
};

export default UpdateReviewCard;
