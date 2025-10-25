/**
 * ReviewFilters Component
 * Componente para filtrar y ordenar reviews
 */

import styled from "styled-components";

interface ReviewFiltersProps {
  rating?: number;
  sort: "recent" | "rating_high" | "rating_low" | "most_liked";
  onRatingChange: (rating: number | undefined) => void;
  onSortChange: (
    sort: "recent" | "rating_high" | "rating_low" | "most_liked"
  ) => void;
}

export const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  rating,
  sort,
  onRatingChange,
  onSortChange,
}) => {
  return (
    <Container>
      <FilterGroup>
        <Label>Filtrar por estrellas:</Label>
        <FilterButtons>
          <FilterButton
            active={rating === undefined}
            onClick={() => onRatingChange(undefined)}
          >
            Todas
          </FilterButton>
          {[5, 4, 3, 2, 1].map((star) => (
            <FilterButton
              key={star}
              active={rating === star}
              onClick={() => onRatingChange(star)}
            >
              {star} ⭐
            </FilterButton>
          ))}
        </FilterButtons>
      </FilterGroup>

      <FilterGroup>
        <Label>Ordenar por:</Label>
        <Select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as typeof sort)}
        >
          <option value="recent">Más recientes</option>
          <option value="rating_high">Mejor valoradas</option>
          <option value="rating_low">Peor valoradas</option>
          <option value="most_liked">Más populares</option>
        </Select>
      </FilterGroup>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-width: 200px;
`;

const Label = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
`;

const FilterButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${(props) => (props.active ? "#4CAF50" : "white")};
  color: ${(props) => (props.active ? "white" : "#666")};
  border: 1px solid ${(props) => (props.active ? "#4CAF50" : "#ddd")};
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.active ? "#45a049" : "#f5f5f5")};
    border-color: ${(props) => (props.active ? "#45a049" : "#bbb")};
  }
`;

const Select = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;
