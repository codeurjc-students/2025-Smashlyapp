import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CurrentPrice = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;

  span {
    font-size: 0.875rem;
    font-weight: 600;
    color: #16a34a;
    background: #dcfce7;
    padding: 2px 8px;
    border-radius: 99px;
  }
`;

interface PricePoint {
  date: string;
  price: number;
}

interface PriceHistoryChartProps {
  currentPrice: number;
  history?: PricePoint[]; // Optional, will generate mock if missing
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ currentPrice, history }) => {
  // Generate mock history if none provided to ensure the chart looks "fluid" and alive 
  // as per user request for single data point scenario.
  const data = useMemo(() => {
    if (history && history.length > 1) return history;

    // Generate 30 days of data
    const mockData: PricePoint[] = [];
    const today = new Date();
    
    // Create a slight fluctuation for visual interest, but end on current price
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      let price = currentPrice;
      if (i > 0) {
         // Random fluctuation within 5% logic for demo purposes if no history
         // In reality this would be flat or real data.
         // For now, let's keep it mostly flat but maybe a tiny dip to look realistic?
         // User said "graph of prices... currently only one price... make it fluid"
         // Let's just make it a flat line if it's single data, maybe slightly higher before?
         // Actually, flat line is safer/more honest.
         price = currentPrice; 
      }

      mockData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: price,
      });
    }
    return mockData;
  }, [currentPrice, history]);

  const minPrice = Math.min(...data.map(d => d.price)) * 0.9;
  const maxPrice = Math.max(...data.map(d => d.price)) * 1.1;

  return (
    <ChartContainer>
      <Title>📉 Histórico de Precios</Title>
      <CurrentPrice>
        {currentPrice.toFixed(2)}€
        <span>Bajo</span>
      </CurrentPrice>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              minTickGap={30}
            />
            <YAxis 
              hide 
              domain={[minPrice, maxPrice]}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              formatter={(value: number) => [`${value.toFixed(2)}€`, 'Precio']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#16a34a" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={2000}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};
