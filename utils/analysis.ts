
import { NerveReading, PatientData, NeuropathySymptom, severityLevel, ScoreDetail, AnalysisResult, NerveType } from '../types';

/**
 * Función de Distribución Acumulada (CDF) para la distribución normal estándar.
 */
const normCDF = (x: number): number => {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.3302744))));
  return x >= 0 ? 1 - p : p;
};

const getZScore = (value: number, mean: number, sd: number) => (value - mean) / sd;

const calculatePoints = (percentile: number, isLatency: boolean = false): number => {
  if (isLatency) {
    if (percentile > 0.99) return 2;
    if (percentile > 0.95) return 1;
    return 0;
  } else {
    if (percentile < 0.01) return 2;
    if (percentile < 0.05) return 1;
    return 0;
  }
};

const parseInputValue = (val: string | number): number | 'NR' => {
  if (typeof val === 'string' && val.trim().toUpperCase() === 'NR') return 'NR';
  const parsed = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  return isNaN(parsed) ? 0 : parsed;
};

const getTibialStats = (patient: PatientData) => {
  const { age, height } = patient;
  let amp = { mean: 12.9, sd: 4.8 };
  let vel = { mean: 47, sd: 6 };

  if (age >= 19 && age <= 29) amp = { mean: 15.3, sd: 4.5 };
  else if (age >= 30 && age <= 59) amp = { mean: 12.9, sd: 4.5 };
  else if (age >= 60 && age <= 79) amp = { mean: 9.8, sd: 4.8 };

  if (age >= 19 && age <= 49) {
    if (height < 160) vel = { mean: 51, sd: 4 };
    else if (height >= 160 && height <= 169) vel = { mean: 49, sd: 6 };
    else if (height >= 170) vel = { mean: 47, sd: 5 };
  } else if (age >= 50 && age <= 79) {
    if (height < 160) vel = { mean: 49, sd: 5 };
    else if (height >= 160 && height <= 169) vel = { mean: 45, sd: 5 };
    else if (height >= 170) vel = { mean: 47, sd: 6 };
  }
  return { amp, vel };
};

const getFibularStats = (patient: PatientData) => {
  const { age, height } = patient;
  let amp = { mean: 5.9, sd: 2.6 };
  let vel = { mean: 57, sd: 9 };

  if (age >= 19 && age <= 39) amp = { mean: 6.8, sd: 2.5 };
  else if (age >= 40 && age <= 79) amp = { mean: 5.1, sd: 2.5 };

  if (height < 170) {
    if (age >= 19 && age <= 39) vel = { mean: 49, sd: 4 };
    else if (age >= 40 && age <= 79) vel = { mean: 47, sd: 5 };
  } else {
    if (age >= 19 && age <= 39) vel = { mean: 46, sd: 4 };
    else if (age >= 40 && age <= 79) vel = { mean: 44, sd: 4 };
  }
  return { amp, vel };
};

export const runFullAnalysis = (readings: NerveReading[], patient: PatientData): AnalysisResult => {
  const score2Details: ScoreDetail[] = [];
  const score4Details: ScoreDetail[] = [];

  const tibialStats = getTibialStats(patient);
  const fibularStats = getFibularStats(patient);
  const ulnarStats = { amp: { mean: 11.6, sd: 2.1 }, vel: { mean: 61, sd: 5 } };
  const suralStats = { lat: { mean: 3.8, sd: 0.3 }, amp: { mean: 17, sd: 10 } };

  readings.forEach(r => {
    let stats: any;
    if (r.nerveName.includes('Tibial')) stats = tibialStats;
    else if (r.nerveName.includes('Fibular')) stats = fibularStats;
    else if (r.nerveName.includes('Ulnar')) stats = ulnarStats;
    else if (r.nerveName.includes('Sural')) stats = suralStats;

    if (!stats) return;

    const vVal = parseInputValue(r.velocity);
    const aVal = parseInputValue(r.amplitude);
    const pVal = r.peakLatency ? parseInputValue(r.peakLatency) : 0;

    // Score #2
    if (r.type === NerveType.MOTOR) {
      if (vVal === 'NR') {
        score2Details.push({ nerve: r.nerveName, value: 'NR', percentile: 0.001, points: 2 });
      } else if (vVal > 0) {
        const z = getZScore(vVal, stats.vel.mean, stats.vel.sd);
        const p = normCDF(z);
        score2Details.push({ nerve: r.nerveName, value: vVal, percentile: p, points: calculatePoints(p) });
      }
    } else if (r.nerveName.includes('Sural')) {
      if (pVal === 'NR') {
        score2Details.push({ nerve: 'Sural (Latencia)', value: 'NR', percentile: 0.999, points: 2 });
      } else if (pVal > 0) {
        const z = getZScore(pVal, stats.lat.mean, stats.lat.sd);
        const p = normCDF(z);
        score2Details.push({ nerve: 'Sural (Latencia)', value: pVal, percentile: p, points: calculatePoints(p, true) });
      }
    }

    // Score #4
    if (aVal === 'NR') {
      score4Details.push({ nerve: r.nerveName, value: 'NR', percentile: 0.001, points: 2 });
    } else if (aVal > 0) {
      const z = getZScore(aVal, stats.amp.mean, stats.amp.sd);
      const p = normCDF(z);
      score4Details.push({ nerve: r.nerveName, value: aVal, percentile: p, points: calculatePoints(p) });
    }
  });

  const s2Total = score2Details.reduce((acc, curr) => acc + curr.points, 0);
  const s4Total = score4Details.reduce((acc, curr) => acc + curr.points, 0);
  
  const s2Abnormal = s2Total >= 2;
  const s4Abnormal = s4Total >= 2;

  let severity: severityLevel = severityLevel.N0;
  if (s2Abnormal) {
    if (patient.symptoms === NeuropathySymptom.NONE) severity = severityLevel.N1;
    else if (patient.symptoms === NeuropathySymptom.FEET_LEGS) severity = severityLevel.N2;
    else if (patient.symptoms === NeuropathySymptom.THIGH) severity = severityLevel.N3;
  }

  return {
    score2: { total: s2Total, isAbnormal: s2Abnormal, details: score2Details },
    score4: { total: s4Total, isAbnormal: s4Abnormal, details: score4Details },
    severityClass: severity
  };
};
