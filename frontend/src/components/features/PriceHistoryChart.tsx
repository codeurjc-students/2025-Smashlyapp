import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styled from 'styled-components';
import { RacketService, PriceHistoryResult } from '../../services/racketService';

// ── Styled components ────────────────────────────────────────────────────────

const ChartContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

const CurrentPrice = styled.span`
  font-size: 1.75rem;
  font-weight: 800;
  color: #1f2937;
`;

const PriceBadge = styled.span<{ variant: 'low' | 'neutral' | 'high' }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  background: ${({ variant }) =>
    variant === 'low' ? '#dcfce7' : variant === 'high' ? '#fee2e2' : '#f3f4f6'};
  color: ${({ variant }) =>
    variant === 'low' ? '#16a34a' : variant === 'high' ? '#dc2626' : '#6b7280'};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const PillButton = styled.button<{ active?: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 99px;
  border: 1.5px solid ${({ active }) => (active ? '#16a34a' : '#e5e7eb')};
  background: ${({ active }) => (active ? '#dcfce7' : 'white')};
  color: ${({ active }) => (active ? '#16a34a' : '#6b7280')};
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: #16a34a;
    color: #16a34a;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #9ca3af;
  font-size: 0.875rem;
  gap: 0.5rem;
`;

// ── Colores por tienda ────────────────────────────────────────────────────────

const STORE_COLORS: Record<string, string> = {
  padelmarket:  '#16a34a',
  padelnuestro: '#2563eb',
  padelproshop: '#d97706',
};

const STORE_LABELS: Record<string, string> = {
  padelmarket:  'Padel Market',
  padelnuestro: 'Padel Nuestro',
  padelproshop: 'Padel Pro Shop',
};

const DAY_OPTIONS = [30, 60, 90, 180];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

function getPriceBadgeVariant(
  current: number,
  min: number | null,
  max: number | null
): 'low' | 'neutral' | 'high' {
  if (min === null || max === null || min === max) return 'neutral';
  const range = max - min;
  if (current <= min + range * 0.25) return 'low';
  if (current >= max - range * 0.25) return 'high';
  return 'neutral';
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PriceHistoryChartProps {
  racketId: number;
  currentPrice: number;
}

// ── Componente ────────────────────────────────────────────────────────────────

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  racketId,
  currentPrice,
}) => {
  const [days, setDays] = useState(90);
  const [historyData, setHistoryData] = useState<PriceHistoryResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch al montar y cuando cambie la ventana de días
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    RacketService.getPriceHistory(racketId, days).then(data => {
      if (!cancelled) {
        setHistoryData(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [racketId, days]);

  // Determinar el precio más bajo y más alto globales para el badge
  const { globalMin, globalMax } = useMemo(() => {
    if (!historyData || historyData.combined.length === 0) {
      return { globalMin: null, globalMax: null };
    }
    const prices = historyData.combined.map(p => p.price);
    return { globalMin: Math.min(...prices), globalMax: Math.max(...prices) };
  }, [historyData]);

  // Construir datos para Recharts: un punto por fecha con precio de cada tienda
  const chartData = useMemo(() => {
    if (!historyData || historyData.stores.length === 0) return null;

    // Combinar todos los timestamps únicos
    const allDates = new Set<string>();
    historyData.stores.forEach(s => s.history.forEach(p => allDates.add(p.date)));
    const sortedDates = Array.from(allDates).sort();

    // Para cada fecha, obtener el precio de cada tienda (o null si no hay dato)
    return sortedDates.map(date => {
      const point: Record<string, any> = { date: formatDate(date) };
      historyData.stores.forEach(s => {
        const match = s.history.find(p => p.date === date);
        point[s.store] = match ? match.price : undefined;
      });
      return point;
    });
  }, [historyData]);

  const hasRealData = chartData && chartData.length > 1;
  const badgeVariant = getPriceBadgeVariant(currentPrice, globalMin, globalMax);
  const badgeLabel = badgeVariant === 'low' ? 'Precio bajo' : badgeVariant === 'high' ? 'Precio alto' : 'Precio actual';

  return (
    <ChartContainer>
      <Header>
        <div>
          <Title>📉 Historial de Precios</Title>
          <PriceRow>
            <CurrentPrice>{currentPrice.toFixed(2)}€</CurrentPrice>
            <PriceBadge variant={badgeVariant}>{badgeLabel}</PriceBadge>
          </PriceRow>
          {globalMin !== null && globalMax !== null && globalMin !== globalMax && (
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
              Mín: <strong>{globalMin.toFixed(2)}€</strong>
              {' · '}
              Máx: <strong>{globalMax.toFixed(2)}€</strong>
            </div>
          )}
        </div>

        <Controls>
          {DAY_OPTIONS.map(d => (
            <PillButton key={d} active={days === d} onClick={() => setDays(d)}>
              {d}d
            </PillButton>
          ))}
        </Controls>
      </Header>

      {loading && (
        <EmptyState>
          <span>Cargando historial...</span>
        </EmptyState>
      )}

      {!loading && !hasRealData && (
        <EmptyState>
          <span style={{ fontSize: '1.5rem' }}>📊</span>
          <span>Aún no hay historial de precios acumulado.</span>
          <span style={{ fontSize: '0.75rem' }}>
            Se registrará automáticamente con cada actualización del catálogo.
          </span>
        </EmptyState>
      )}

      {!loading && hasRealData && historyData && (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                {historyData.stores.map(s => (
                  <linearGradient key={s.store} id={`grad-${s.store}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={STORE_COLORS[s.store] || '#6b7280'} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={STORE_COLORS[s.store] || '#6b7280'} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                minTickGap={30}
              />
              <YAxis
                hide
                domain={[
                  (min: number) => Math.floor(min * 0.95),
                  (max: number) => Math.ceil(max * 1.05),
                ]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  fontSize: '0.8rem',
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}€`,
                  STORE_LABELS[name] || name,
                ]}
              />
              <Legend
                formatter={(value) => STORE_LABELS[value] || value}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }}
              />

              {historyData.stores.map(s => (
                <Area
                  key={s.store}
                  type="monotone"
                  dataKey={s.store}
                  stroke={STORE_COLORS[s.store] || '#6b7280'}
                  strokeWidth={2.5}
                  fill={`url(#grad-${s.store})`}
                  fillOpacity={1}
                  dot={false}
                  connectNulls
                  animationDuration={800}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartContainer>
  );
};
