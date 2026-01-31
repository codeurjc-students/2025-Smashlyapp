import React from 'react';
import styled from 'styled-components';
import { ComparisonTableItem, RacketComparisonData } from '../../types/racket';
import { FiCheckCircle, FiMinus } from 'react-icons/fi';

interface ComparisonTableProps {
  data: ComparisonTableItem[];
  metrics: RacketComparisonData[];
}

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-bottom: 3rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: white;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const Th = styled.th`
  text-align: left;
  padding: 1.25rem 1.5rem;
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  font-size: 0.95rem;
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;

  &:first-child {
    border-top-left-radius: 16px;
    width: 25%;
  }

  &:last-child {
    border-top-right-radius: 16px;
  }
`;

const Tr = styled.tr`
  &:last-child td {
    border-bottom: none;
  }

  &:nth-child(even) {
    background: #f9fafb;
  }

  transition: background 0.2s;
  &:hover {
    background: #f3f4f6;
  }
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.5;

  &:first-child {
    font-weight: 600;
    color: #1f2937;
  }
`;

const CheckMark = styled(FiCheckCircle)`
  color: #16a34a;
  margin-left: 0.5rem;
  vertical-align: middle;
`;

const EmptyMark = styled(FiMinus)`
  color: #d1d5db;
`;

const ComparisonTable: React.FC<ComparisonTableProps> = ({ data, metrics }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ color: '#16a34a', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
        Comparativa Detallada
      </h3>
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th>Característica</Th>
              {metrics.map((racket, index) => (
                <Th key={index}>
                  {racket.racketName}
                  {racket.isCertified && (
                    <span title='Datos certificados por Testea Padel'>
                      <CheckMark size={16} />
                    </span>
                  )}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <Tr key={rowIndex}>
                <Td>{row.feature}</Td>
                {metrics.map((racket, colIndex) => {
                  const cellValue = row[racket.racketName] || row[`pala_${colIndex + 1}`];
                  return <Td key={colIndex}>{cellValue || <EmptyMark />}</Td>;
                })}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ComparisonTable;
