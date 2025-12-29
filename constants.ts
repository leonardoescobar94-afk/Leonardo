
import { ReferenceValue, NerveType } from './types';

// Valores base. Los límites reales se calculan dinámicamente en analysis.ts
export const DEFAULT_REFERENCES: ReferenceValue[] = [
  {
    nerveName: 'Tibial (Motor)',
    type: NerveType.MOTOR,
    minAmplitude: 0, // Dinámico
    minVelocity: 0   // Dinámico
  },
  {
    nerveName: 'Fibular (Motor)',
    type: NerveType.MOTOR,
    minAmplitude: 0, // Dinámico
    minVelocity: 0   // Dinámico
  },
  {
    nerveName: 'Ulnar (Motor)',
    type: NerveType.MOTOR,
    minAmplitude: 7.4, // 11.6 - (2 * 2.1)
    minVelocity: 51    // 61 - (2 * 5)
  },
  {
    nerveName: 'Sural (Sensitivo)',
    type: NerveType.SENSORY,
    maxPeakLatency: 4.4, // 3.8 + (2 * 0.3)
    minAmplitude: 0,      // 17 - (2 * 10) -> se tratará con cuidado por ser SD alta
    // Added missing minVelocity property to match ReferenceValue interface
    minVelocity: 0
  }
];
