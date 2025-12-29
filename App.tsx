
import React, { useState, useEffect } from 'react';
import { 
  PatientData, 
  NerveReading, 
  NerveType, 
  NeuropathySymptom,
  AnalysisResult,
  severityLevel
} from './types';
import { DEFAULT_REFERENCES } from './constants';
import { runFullAnalysis } from './utils/analysis';

const App: React.FC = () => {
  const [patient, setPatient] = useState<PatientData>({ 
    age: 45, 
    height: 170, 
    weight: 70, 
    symptoms: NeuropathySymptom.NONE 
  });
  const [readings, setReadings] = useState<NerveReading[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  useEffect(() => {
    const initialReadings: NerveReading[] = DEFAULT_REFERENCES.map(ref => ({
      nerveName: ref.nerveName,
      type: ref.type,
      distalLatency: 0,
      peakLatency: 0,
      amplitude: 0,
      velocity: 0
    }));
    setReadings(initialReadings);
  }, []);

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatient(prev => ({ 
      ...prev, 
      [name]: (name === 'age' || name === 'height' || name === 'weight') ? Number(value) : value 
    }));
  };

  const handleReadingChange = (index: number, field: keyof NerveReading, value: string) => {
    const newReadings = [...readings];
    const upperValue = value.trim().toUpperCase();
    
    if (upperValue === 'NR' || upperValue === 'N') {
      newReadings[index] = { ...newReadings[index], [field]: upperValue };
    } else if (value === '') {
      newReadings[index] = { ...newReadings[index], [field]: '' };
    } else {
      const sanitized = value.replace(',', '.');
      if (/^-?\d*\.?\d*$/.test(sanitized)) {
        newReadings[index] = { ...newReadings[index], [field]: sanitized };
      }
    }
    setReadings(newReadings);
  };

  const handleCalculate = () => {
    setIsLoading(true);
    setTimeout(() => {
      const analysis = runFullAnalysis(readings, patient);
      setResult(analysis);
      setIsLoading(false);
    }, 500);
  };

  const handleDownloadReport = () => {
    if (!result) return;

    const report = `
REPORTE DE NEUROCONDUCCIÓN - POLINEUROPATHY-ASSISTANT PM&R
==========================================================
Fecha: ${new Date().toLocaleDateString()}

DATOS DEL PACIENTE:
------------------
Edad: ${patient.age} años
Altura: ${patient.height} cm
Peso: ${patient.weight} kg
Síntomas: ${patient.symptoms}

RESULTADOS DEL ESTUDIO (LECTURAS):
----------------------------------
${readings.map(r => `
Nervio: ${r.nerveName} (${r.type})
  - Amplitud: ${r.amplitude}
  - ${r.nerveName.includes('Sural') ? 'Latencia Pico' : 'Velocidad'}: ${r.nerveName.includes('Sural') ? r.peakLatency : r.velocity}
`).join('')}

ANÁLISIS DE SCORES:
-------------------
SCORE #2 (CONDUCCIÓN): ${result.score2.total} / 8 PTS (${result.score2.isAbnormal ? 'ANORMAL' : 'NORMAL'})
${result.score2.details.map(d => `  - ${d.nerve}: ${d.value} (P${(d.percentile * 100).toFixed(1)}) -> ${d.points} pt`).join('\n')}

SCORE #4 (AMPLITUD): ${result.score4.total} / 8 PTS (${result.score4.isAbnormal ? 'ANORMAL' : 'NORMAL'})
${result.score4.details.map(d => `  - ${d.nerve}: ${d.value} (P${(d.percentile * 100).toFixed(1)}) -> ${d.points} pt`).join('\n')}

CLASIFICACIÓN FINAL DE SEVERIDAD:
---------------------------------
${result.severityClass}

==========================================================
Reporte generado por Polineuropathy-Assistant PM&R Specialist Platform.
Uso exclusivamente profesional y académico.
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Neuroconduccion_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0">
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-6 gap-4 print:mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Polineuropathy-Assistant <span className="text-blue-600">PM&R</span></h1>
          <p className="text-slate-600 font-medium text-sm mt-1">Clasificación electrofisiológica de la severidad de la polineuropatía diabética.</p>
        </div>
        <div className="text-right hidden md:block print:block">
          <p className="text-xs font-bold text-slate-400">HERRAMIENTA PROFESIONAL</p>
          <p className="text-xs text-slate-500">Basado en Percentiles Normalizados</p>
          <p className="text-[9px] text-slate-300 mt-1 hidden print:block italic">Generado el {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
              Información del Paciente
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Edad</label>
                  <input type="number" name="age" value={patient.age} onChange={handlePatientChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Altura (cm)</label>
                  <input type="number" name="height" value={patient.height} onChange={handlePatientChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Síntomas de Polineuropatía</label>
                <select name="symptoms" value={patient.symptoms} onChange={handlePatientChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.values(NeuropathySymptom).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          <button onClick={handleCalculate} disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? "PROCESANDO..." : "CALCULAR SCORES #2 Y #4"}
          </button>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
            <h2 className="hidden print:block text-xs font-bold text-slate-500 uppercase px-6 pt-4 mb-2">Lecturas de Neuroconducción</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nervio</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Parámetro 1</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Amplitud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((r, idx) => {
                  const isSural = r.nerveName.includes('Sural');
                  const mainValue = isSural ? r.peakLatency : r.velocity;
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{r.nerveName}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{r.type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <label className="text-[9px] text-slate-400 font-bold mb-1 print:hidden">{isSural ? 'LAT. PICO (ms)' : 'VELOCIDAD (m/s)'}</label>
                          <input 
                            type="text" 
                            value={mainValue === 0 ? '' : mainValue} 
                            onChange={(e) => handleReadingChange(idx, isSural ? 'peakLatency' : 'velocity', e.target.value)} 
                            placeholder="0.0 o NR"
                            className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none uppercase print:bg-white print:border-none" 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <label className="text-[9px] text-slate-400 font-bold mb-1 print:hidden">AMP. ({isSural ? 'uV' : 'mV'})</label>
                          <input 
                            type="text" 
                            value={r.amplitude === 0 ? '' : r.amplitude} 
                            onChange={(e) => handleReadingChange(idx, 'amplitude', e.target.value)} 
                            placeholder="0.0 o NR"
                            className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none uppercase print:bg-white print:border-none" 
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden print:bg-slate-50 print:text-slate-900 print:shadow-none print:border print:border-slate-200 print:p-6">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-2 print:text-slate-500">Clasificación Final</h2>
                    <div className="text-3xl font-black mb-2 print:text-2xl">{result.severityClass.split(':')[0]}</div>
                    <p className="text-xl text-blue-300 font-medium leading-tight print:text-blue-700 print:text-lg">{result.severityClass.split(':')[1]}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 print:hidden">
                    <button 
                      onClick={handleDownloadReport}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      Descargar TXT
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                      Imprimir Informe
                    </button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full -mr-12 -mt-12 blur-3xl print:hidden"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:p-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Score #2 (Conducción)</h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${result.score2.isAbnormal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {result.score2.total} / 8 PTS
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.score2.details.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-600">{d.nerve}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-bold">{d.value === 'NR' ? 'NR' : `P${(d.percentile * 100).toFixed(1)}`}</span>
                          <span className={`font-black ${d.points > 0 ? 'text-red-500' : 'text-slate-400'}`}>{d.points} pt</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:p-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Score #4 (Amplitud)</h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${result.score4.isAbnormal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {result.score4.total} / 8 PTS
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.score4.details.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-600">{d.nerve}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-bold">{d.value === 'NR' ? 'NR' : `P${(d.percentile * 100).toFixed(1)}`}</span>
                          <span className={`font-black ${d.points > 0 ? 'text-red-500' : 'text-slate-400'}`}>{d.points} pt</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <section className="max-w-6xl mx-auto mt-12 space-y-4 print:hidden">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <button onClick={() => toggleAccordion('usage')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left">
            <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Cuando usar
            </span>
            <svg className={`w-5 h-5 transition-transform ${activeAccordion === 'usage' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {activeAccordion === 'usage' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-600 leading-relaxed">
              Aplicar en adultos de 19 a 79 años con sospecha clínica de polineuropatía diabética sensitivo motora o con antecedente de diabetes mellitus con valores de hemoglobina glicosilada mayores a 6.5%.
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <button onClick={() => toggleAccordion('references')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left">
            <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              Referencias
            </span>
            <svg className={`w-5 h-5 transition-transform ${activeAccordion === 'references' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {activeAccordion === 'references' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-600 leading-relaxed space-y-3">
              <p>1- Dyck, P. J. , Kratz, K. M. , Lehman, K. A. , Karnes, J. L. , Melton, L. J. , O'Brien, P. C. , Litchy, W. J. , Windebank, A. J. , Smith, B. E. , Low, P. A. , Service, F. J. , Rizza, R. A. & Zimmerman, B. R. (1991). The Rochester Diabetic Neuropathy Study. Neurology, 41 (6), 799-807.</p>
              <p>2- Kumbhare D, Robinson L, Buschbacher R. Buschbacher’s manual of nerve conduction studies. 3rd ed. New York: Springer Publishing Company; 2015. 1 p.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <button onClick={() => toggleAccordion('development')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left">
            <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.618.309a6 6 0 01-3.411.454l-2.387-.477a2 2 0 00-1.022.547l-1.157 1.157a2 2 0 00-.547 1.022l-.477 2.387a2 2 0 00.547 1.022l1.157 1.157a2 2 0 001.022.547l2.387.477a6 6 0 003.411-.454l.618-.309a6 6 0 013.86-.517l2.387.477a2 2 0 001.022-.547l1.157-1.157a2 2 0 00.547-1.022l.477-2.387a2 2 0 00-.547-1.022l-1.157-1.157zM12 13V4M7 8.5L12 3l5 5.5"/></svg>
              Desarrollo
            </span>
            <svg className={`w-5 h-5 transition-transform ${activeAccordion === 'development' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {activeAccordion === 'development' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-600 leading-relaxed space-y-2">
              <p>Esta herramienta se desarrolló como parte del contenido académico motivado y promovido durante la rotación de profundización en electrodiagnóstico y neurofisiología con el <strong>Dr. Fernando Ortiz</strong>.</p>
              <p>Desarrollada por <strong>Leonardo Jurado</strong> - Residente Medicina Física y Rehabilitación. Universidad Nacional de Colombia.</p>
              <p>Esta herramienta se desarrollo usando inteligencia artificial para su programacion.</p>
              <p className="font-bold italic">Aplicación sin ánimo de lucro. Ideada exclusivamente con fines académicos y de apoyo a la práctica de los médicos especialistas en medicina física y rehabilitación y neurología que realizan estudios de electrodiagnóstico.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto mt-12 py-8 border-t border-slate-200 text-center print:hidden">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2024 Polineuropathy-Assistant PM&R Specialist Platform</p>
      </footer>
    </div>
  );
};

export default App;
