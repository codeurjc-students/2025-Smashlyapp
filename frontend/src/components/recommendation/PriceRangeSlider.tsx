import { useState, useCallback, useMemo, useEffect } from 'react';
import styled from 'styled-components';

const SliderContainer = styled.div`
  width: 100%;
  padding: 1rem 0 0.5rem;
`;

const SliderWrapper = styled.div`
  position: relative;
  height: 70px;
  padding: 0 12px;
`;

const SliderTrack = styled.div`
  position: absolute;
  top: 30px;
  left: 12px;
  right: 12px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 8px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SliderRange = styled.div<{ left: number; width: number }>`
  position: absolute;
  top: 30px;
  left: calc(12px + ${props => props.left}%);
  width: ${props => props.width}%;
  height: 8px;
  background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);
  transition: all 0.2s ease;
`;

const SliderInput = styled.input`
  position: absolute;
  top: 26px;
  left: 0;
  width: 100%;
  height: 8px;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
  padding: 0;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    /* Use a solid color gradient to ensure white fill */
    background: linear-gradient(#ffffff, #ffffff);
    border: 4px solid #16a34a;
    cursor: grab;
    pointer-events: auto;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    box-sizing: border-box;

    &:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
    }

    &:active {
      cursor: grabbing;
      transform: scale(1.1);
      background: linear-gradient(#f0fdf4, #f0fdf4);
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.5);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    border: 4px solid #16a34a;
    cursor: grab;
    pointer-events: auto;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    box-sizing: border-box;

    &:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
    }

    &:active {
      cursor: grabbing;
      transform: scale(1.1);
      background: #f0fdf4;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.5);
    }
  }

  &:focus {
    outline: none;
  }

  &:focus::-webkit-slider-thumb {
    box-shadow:
      0 0 0 6px rgba(22, 163, 74, 0.15),
      0 3px 8px rgba(0, 0, 0, 0.2);
  }

  &:focus::-moz-range-thumb {
    box-shadow:
      0 0 0 6px rgba(22, 163, 74, 0.15),
      0 3px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ValuesContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding: 0 4px;
`;

const ValueLabel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;

  &:last-child {
    align-items: flex-end;
  }
`;

const ValueTitle = styled.span`
  font-size: 0.7rem;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const ValueDisplay = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
  color: #16a34a;
  line-height: 1;
`;

interface PriceRangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min = 50,
  max = 500,
  step = 10,
  value,
  onChange,
}) => {
  // Initialize with fallback values to prevent NaN
  const initialMin = value?.min ?? min;
  const initialMax = value?.max ?? max;

  const [localMin, setLocalMin] = useState(initialMin);
  const [localMax, setLocalMax] = useState(initialMax);

  // Sync local state when value prop changes (e.g., form reset)
  useEffect(() => {
    if (value?.min !== undefined) setLocalMin(value.min);
    if (value?.max !== undefined) setLocalMax(value.max);
  }, [value?.min, value?.max]);

  // Calculate percentage positions for visual range
  const minPercent = useMemo(() => ((localMin - min) / (max - min)) * 100, [localMin, min, max]);

  const maxPercent = useMemo(() => ((localMax - min) / (max - min)) * 100, [localMax, min, max]);

  // Handle min slider change
  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = Math.min(Number(e.target.value), localMax - step);
      setLocalMin(newMin);
      onChange({ min: newMin, max: localMax });
    },
    [localMax, step, onChange]
  );

  // Handle max slider change
  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = Math.max(Number(e.target.value), localMin + step);
      setLocalMax(newMax);
      onChange({ min: localMin, max: newMax });
    },
    [localMin, step, onChange]
  );

  return (
    <SliderContainer>
      <SliderWrapper>
        <SliderTrack />
        <SliderRange left={minPercent} width={maxPercent - minPercent} />

        <SliderInput
          type='range'
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={handleMinChange}
          aria-label='Precio mínimo'
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localMin}
        />

        <SliderInput
          type='range'
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={handleMaxChange}
          aria-label='Precio máximo'
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localMax}
          style={{ zIndex: 4 }}
        />
      </SliderWrapper>

      <ValuesContainer>
        <ValueLabel>
          <ValueTitle>Mínimo</ValueTitle>
          <ValueDisplay>€{isNaN(localMin) ? min : localMin}</ValueDisplay>
        </ValueLabel>
        <ValueLabel>
          <ValueTitle>Máximo</ValueTitle>
          <ValueDisplay>€{isNaN(localMax) ? max : localMax}</ValueDisplay>
        </ValueLabel>
      </ValuesContainer>
    </SliderContainer>
  );
};
