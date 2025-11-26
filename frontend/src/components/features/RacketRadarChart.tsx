import React from 'react';
import styled from 'styled-components';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

// Interfaz para las métricas de cada pala
export interface RacketMetrics {
  racketName: string;
  potencia: number;
  control: number;
  salidaDeBola: number;
  manejabilidad: number;
  puntoDulce: number;
}

interface RacketRadarChartProps {
  metrics: RacketMetrics[];
}

const ChartContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin: 2rem 0;
`;

const ChartTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  text-align: center;
`;

const ChartSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
`;

// Colores para hasta 3 palas
const COLORS = ['#16a34a', '#3b82f6', '#f59e0b'];

// Nombres amigables para las métricas
const METRIC_LABELS: { [key: string]: string } = {
  potencia: 'Potencia',
  control: 'Control',
  salidaDeBola: 'Salida de Bola',
  manejabilidad: 'Manejabilidad',
  puntoDulce: 'Punto Dulce',
};

const RacketRadarChart: React.FC<RacketRadarChartProps> = ({ metrics }) => {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  // Transformar los datos al formato requerido por Recharts
  const chartData = [
    {
      metric: 'Potencia',
      ...metrics.reduce((acc, racket, idx) => {
        acc[`pala${idx + 1}`] = racket.potencia;
        return acc;
      }, {} as any),
    },
    {
      metric: 'Control',
      ...metrics.reduce((acc, racket, idx) => {
        acc[`pala${idx + 1}`] = racket.control;
        return acc;
      }, {} as any),
    },
    {
      metric: 'Salida de Bola',
      ...metrics.reduce((acc, racket, idx) => {
        acc[`pala${idx + 1}`] = racket.salidaDeBola;
        return acc;
      }, {} as any),
    },
    {
      metric: 'Manejabilidad',
      ...metrics.reduce((acc, racket, idx) => {
        acc[`pala${idx + 1}`] = racket.manejabilidad;
        return acc;
      }, {} as any),
    },
    {
      metric: 'Punto Dulce',
      ...metrics.reduce((acc, racket, idx) => {
        acc[`pala${idx + 1}`] = racket.puntoDulce;
        return acc;
      }, {} as any),
    },
  ];

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
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
          <p style={{ margin: 0, fontWeight: 600, marginBottom: '8px' }}>
            {payload[0].payload.metric}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{
                margin: '4px 0',
                color: entry.color,
                fontSize: '0.875rem',
              }}
            >
              {metrics[index]?.racketName}: <strong>{entry.value}/10</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Leyenda personalizada
  const renderLegend = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
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
            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
              {racket.racketName}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ChartContainer>
      <ChartTitle>Comparación de Características</ChartTitle>
      <ChartSubtitle>
        Valores del 1 al 10 para cada métrica de rendimiento
      </ChartSubtitle>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData}>
          <PolarGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#374151', fontSize: 14, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {metrics.map((racket, index) => (
            <Radar
              key={index}
              name={racket.racketName}
              dataKey={`pala${index + 1}`}
              stroke={COLORS[index]}
              fill={COLORS[index]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
      {renderLegend()}
    </ChartContainer>
  );
};

export default RacketRadarChart;
