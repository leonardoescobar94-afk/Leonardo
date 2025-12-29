
export enum NerveType {
  MOTOR = 'Motor',
  SENSORY = 'Sensitivo'
}

export enum NeuropathySymptom {
  NONE = 'Sin signos de neuropatía',
  FEET_LEGS = 'Signos de polineuropatía en pies o piernas',
  THIGH = 'Signos de afectación en muslo'
}

export interface ReferenceValue {
  nerveName: string;
  type: NerveType;
  maxDistalLatency?: number;
  maxPeakLatency?: number;
  minAmplitude: number;
  minVelocity: number;
}

export interface NerveReading {
  nerveName: string;
  type: NerveType;
  distalLatency: number | string;
  peakLatency?: number | string;
  amplitude: number | string;
  velocity: number | string;
}

export interface PatientData {
  age: number;
  height: number;
  weight: number;
  symptoms: NeuropathySymptom;
  name?: string;
}

export enum severityLevel {
  N0 = "N0: Sin anomalías en las neuroconducciones",
  N1 = "N1: Anomalía en score #2 sin signos de neuropatía",
  N2 = "N2: Anomalía en score #2 y signos en pies o piernas",
  N3 = "N3: Anomalía en score #2 y signos de afectación del muslo"
}

export interface ScoreDetail {
  nerve: string;
  value: number | string;
  percentile: number;
  points: number;
}

export interface AnalysisResult {
  score2: { total: number; isAbnormal: boolean; details: ScoreDetail[] };
  score4: { total: number; isAbnormal: boolean; details: ScoreDetail[] };
  severityClass: severityLevel;
}
