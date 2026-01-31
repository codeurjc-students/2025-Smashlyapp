import React, { useMemo, memo } from 'react';
import styled from 'styled-components';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { RacketComparisonData } from '../../types/racket';
import { FiCheckCircle } from 'react-icons/fi';

interface RacketRadarChartProps {
  metrics: RacketComparisonData[];
}

const ChartContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin: 2rem 0;
  will-change: contents;
  transform: translateZ(0);
`;

const ChartTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  text-align: center;
`;

const ChartSubtitle = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

// Colores para hasta 3 palas
const COLORS = ['#16a34a', '#3b82f6', '#f59e0b'];

// Tooltip personalizado
const CustomTooltip = memo(({ active, payload, metrics }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      style={{
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb',
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, marginBottom: '8px' }}>{payload[0].payload.metric}</p>
      {payload.map((entry: any, index: number) => {
        const racket = metrics[index];
        return (
          <p
            key={index}
            style={{
              margin: '4px 0',
              color: entry.color,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {racket?.racketName}: <strong>{entry.value}/10</strong>
            {racket?.isCertified && <FiCheckCircle color='#16a34a' size={12} />}
          </p>
        );
      })}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

// Leyenda personalizada
const Legend = memo(({ metrics }: { metrics: RacketComparisonData[] }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        marginTop: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {metrics.map((racket, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: COLORS[index],
            }}
          />
          <span
            style={{
              fontSize: '0.875rem',
              color: '#374151',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {racket.racketName}
            {racket.isCertified && (
              <span title='Datos certificados por Testea Padel'>
                <FiCheckCircle color='#16a34a' size={14} />
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
});

Legend.displayName = 'Legend';

const RacketRadarChart: React.FC<RacketRadarChartProps> = ({ metrics }) => {
  const chartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];

    return [
      {
        metric: 'Potencia',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = racket.radarData?.potencia || 0;
          return acc;
        }, {} as any),
      },
      {
        metric: 'Control',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = racket.radarData?.control || 0;
          return acc;
        }, {} as any),
      },
      {
        metric: 'Salida de Bola',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = racket.radarData?.salidaDeBola || 0;
          return acc;
        }, {} as any),
      },
      {
        metric: 'Manejabilidad',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = racket.radarData?.manejabilidad || 0;
          return acc;
        }, {} as any),
      },
      {
        metric: 'Punto Dulce',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = racket.radarData?.puntoDulce || 0;
          return acc;
        }, {} as any),
      },
    ];
  }, [metrics]);

  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <ChartContainer>
      <ChartTitle>Análisis de Rendimiento</ChartTitle>
      <ChartSubtitle>
        <span>Puntaje 1-10</span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#16a34a',
            fontWeight: 500,
          }}
        >
          <FiCheckCircle /> Datos Testea Pádel Certificados
        </span>
      </ChartSubtitle>

      <ResponsiveContainer width='100%' height={400}>
        <RadarChart data={chartData}>
          <PolarGrid strokeDasharray='3 3' stroke='#e5e7eb' />
          <PolarAngleAxis
            dataKey='metric'
            tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip metrics={metrics} />} />
          {metrics.map((racket, index) => (
            <Radar
              key={index}
              name={racket.racketName}
              dataKey={`pala${index + 1}`}
              stroke={COLORS[index]}
              fill={COLORS[index]}
              fillOpacity={0.2}
              strokeWidth={3}
              isAnimationActive={true}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
      <Legend metrics={metrics} />
    </ChartContainer>
  );
};

export default memo(RacketRadarChart, (prev, next) => {
  return JSON.stringify(prev.metrics) === JSON.stringify(next.metrics);
});
