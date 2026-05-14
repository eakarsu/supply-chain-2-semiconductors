import { useState } from 'react';
import { Sparkles, AlertTriangle, BarChart3, TrendingUp, Shield, Cpu, Clock, Globe, Activity, FileWarning } from 'lucide-react';
import { api } from '../api';
import AIResponse from './AIResponse';

type TabId = 'risk'|'allocation'|'forecast'|'resilience'|'foundry'|'leadtime'|'geo'|'yield'|'export';

export default function AICenter() {
  const [activeTab, setActiveTab] = useState<TabId>('risk');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [componentId, setComponentId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [capacity, setCapacity] = useState('');
  const [customers, setCustomers] = useState('');
  const [priorities, setPriorities] = useState('');
  const [component, setComponent] = useState('');
  const [timeframe, setTimeframe] = useState('next 12 months');
  // foundry
  const [foundry, setFoundry] = useState('TSMC');
  const [waferStarts, setWaferStarts] = useState('');
  const [demand, setDemand] = useState('');
  const [constraints, setConstraints] = useState('');
  // lead time
  const [ltCompId, setLtCompId] = useState('');
  const [ltScenario, setLtScenario] = useState('baseline');
  // geo
  const [region, setRegion] = useState('Taiwan');
  const [geoScenario, setGeoScenario] = useState('elevated tensions');
  const [horizon, setHorizon] = useState('12 months');
  // yield
  const [ylCompId, setYlCompId] = useState('');
  const [node, setNode] = useState('');
  const [defects, setDefects] = useState('');
  // export
  const [destCountry, setDestCountry] = useState('');
  const [endUse, setEndUse] = useState('');
  const [ecCompId, setEcCompId] = useState('');
  const [ecSupplierId, setEcSupplierId] = useState('');

  const call = async (fn: () => Promise<{result: string}>) => {
    setLoading(true); setResult(null); setError(null);
    try { const d = await fn(); setResult(d.result); }
    catch (e: unknown) {
      const err = e as Error & { status?: number };
      if (err.status === 503) setError('AI service unavailable: ' + err.message);
      else setError('Error: ' + (err.message || 'Could not get AI response'));
    }
    finally { setLoading(false); }
  };

  const tabs: {id: TabId; label: string; icon: React.ComponentType<{className?: string}>}[] = [
    { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
    { id: 'allocation', label: 'Allocation Optimization', icon: BarChart3 },
    { id: 'forecast', label: 'Market Forecast', icon: TrendingUp },
    { id: 'resilience', label: 'Resilience Report', icon: Shield },
    { id: 'foundry', label: 'Foundry Allocator', icon: Cpu },
    { id: 'leadtime', label: 'Lead-Time Forecast', icon: Clock },
    { id: 'geo', label: 'Geopolitical Analyzer', icon: Globe },
    { id: 'yield', label: 'Yield-Loss Predictor', icon: Activity },
    { id: 'export', label: 'Export Compliance', icon: FileWarning },
  ];

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  const btn = "w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50";
  const sampleBtn = "px-3 py-1 text-xs font-medium bg-violet-900/40 hover:bg-violet-700/60 border border-violet-700/60 text-violet-200 rounded-md transition-colors";

  const SamplesBar = ({ samples }: { samples: { label: string; apply: () => void }[] }) => (
    <div className="flex flex-wrap gap-2 -mt-1">
      <span className="text-xs text-gray-500 self-center mr-1">Samples:</span>
      {samples.map(s => (
        <button key={s.label} type="button" onClick={s.apply} className={sampleBtn}>{s.label}</button>
      ))}
    </div>
  );

  // Risk Assessment samples
  const riskSamples = [
    { label: 'Apple A19 @ TSMC N2', apply: () => { setComponentId('1'); setSupplierId('1'); } },
    { label: 'NVIDIA HBM3e @ SK hynix', apply: () => { setComponentId('2'); setSupplierId('3'); } },
    { label: 'AMD CoWoS-L @ TSMC', apply: () => { setComponentId('3'); setSupplierId('1'); } },
  ];
  // Allocation samples
  const allocationSamples = [
    { label: 'CoWoS-L crunch', apply: () => { setCapacity('85 CoWoS-L units/month at TSMC Hsinchu AP6'); setCustomers('NVIDIA Blackwell B200: 60 units, AMD MI350: 25 units, Google TPU v6: 18 units, AWS Trainium2: 12 units'); setPriorities('Maximize revenue, protect 3-year strategic NVIDIA contract, preserve hyperscaler diversification'); } },
    { label: 'HBM3e split', apply: () => { setCapacity('120k HBM3e 8-Hi stacks/month (Samsung Pyeongtaek + SK hynix)'); setCustomers('NVIDIA H200/B200: 70k, AMD MI325X: 25k, Intel Gaudi 3: 15k, Google TPU: 10k'); setPriorities('Honor NVIDIA take-or-pay, minimize spot-market exposure, retain AMD goodwill'); } },
    { label: 'TSMC N3 wafers', apply: () => { setCapacity('100k N3E wafer starts/month at Fab 18'); setCustomers('Apple A19/M5: 55k, Qualcomm Snapdragon 8 Gen 5: 18k, MediaTek Dimensity 9500: 15k, AMD Zen 6: 12k'); setPriorities('Apple LTA priority, support Qualcomm dual-source ramp'); } },
  ];
  // Forecast samples
  const forecastSamples = [
    { label: 'HBM3e 12mo', apply: () => { setComponent('HBM3e 8-Hi stacks for AI accelerators'); setTimeframe('next 12 months'); } },
    { label: 'CoWoS-L 18mo', apply: () => { setComponent('TSMC CoWoS-L advanced packaging capacity'); setTimeframe('next 18 months'); } },
    { label: '2nm wafers 24mo', apply: () => { setComponent('TSMC N2 / Samsung SF2 2nm GAA wafers'); setTimeframe('next 24 months'); } },
  ];
  // Foundry samples
  const foundrySamples = [
    { label: 'TSMC N3 mix', apply: () => { setFoundry('TSMC'); setWaferStarts('130k wafer starts/month across N3/N3E at Fab 18 (Hsinchu)'); setDemand('Apple A19/M5 N3E: 60k, NVIDIA Blackwell N4P: 25k, AMD Zen 6 N3: 18k, Qualcomm SD 8 Gen 5 N3: 15k, MediaTek D9500 N3: 12k'); setConstraints('Reserve 8k for Apple LTA priority, hold 5k strategic buffer, maintain TSMC Arizona Phoenix N4 ramp commitment'); } },
    { label: 'Samsung SF2', apply: () => { setFoundry('Samsung Foundry'); setWaferStarts('45k wafer starts/month at Pyeongtaek S5 line on SF2 (2nm GAA)'); setDemand('Qualcomm SD: 12k, Tesla Dojo D2: 8k, Google TPU v7: 10k, Samsung LSI Exynos: 9k'); setConstraints('Yield ramping 55%->70%, prioritize Tesla automotive AEC-Q100, US CHIPS Act Taylor TX co-allocation'); } },
    { label: 'Intel 18A Arizona', apply: () => { setFoundry('Intel Foundry'); setWaferStarts('20k wafer starts/month at Fab 52 Arizona on 18A (PowerVia + RibbonFET)'); setDemand('Microsoft Azure Cobalt: 6k, Intel Panther Lake: 9k, US DoD RAMP-C: 3k, Broadcom: 2k'); setConstraints('CHIPS Act co-funding, defense end-customer set-aside, exclude PRC end-use'); } },
  ];
  // Lead-time samples
  const leadtimeSamples = [
    { label: 'Baseline N3', apply: () => { setLtCompId('1'); setLtScenario('baseline'); } },
    { label: 'EUV bottleneck', apply: () => { setLtCompId('2'); setLtScenario('EUV bottleneck'); } },
    { label: 'Geo disruption', apply: () => { setLtCompId('3'); setLtScenario('geopolitical disruption'); } },
  ];
  // Geo samples
  const geoSamples = [
    { label: 'Taiwan Strait', apply: () => { setRegion('Taiwan'); setGeoScenario('Strait blockade disrupting Hsinchu Fab 18 (TSMC N3) and Tainan Fab 14 wafer-out logistics for 60+ days'); setHorizon('12 months'); } },
    { label: 'PRC export controls', apply: () => { setRegion('China'); setGeoScenario('Expanded BIS FDPR controls on sub-14nm tools and HBM exports to SMIC, YMTC, CXMT; Entity List additions'); setHorizon('6 months'); } },
    { label: 'NL EUV restrictions', apply: () => { setRegion('Netherlands'); setGeoScenario('Dutch government revokes ASML EUV/DUV (NXT:1980Di, NXT:2050i) export licenses to China fabs'); setHorizon('24 months'); } },
  ];
  // Yield samples
  const yieldSamples = [
    { label: 'TSMC N2 ramp', apply: () => { setYlCompId('1'); setNode('2'); setDefects('Edge-die yield drop on 300mm wafers, GAA nanosheet stacking variation, EUV stochastic line-edge roughness, BEOL via opens at M3'); } },
    { label: 'Samsung SF3 GAA', apply: () => { setYlCompId('2'); setNode('3'); setDefects('Multi-bridge channel FET source/drain epi defects, gate-all-around inner spacer voids, particle defects from new EUV pellicle'); } },
    { label: 'TSMC N4P', apply: () => { setYlCompId('3'); setNode('4'); setDefects('FinFET fin-height variation, BEOL via shorts at M2-M3, parametric Vt shift on automotive AEC-Q100 lots'); } },
  ];
  // Export compliance samples
  const exportSamples = [
    { label: 'AI GPU to PRC', apply: () => { setDestCountry('China'); setEndUse('AI training cluster (LLM) at PRC hyperscaler — likely covered by 3A090 / ECCN, FDPR, Oct-2023 + 2024 BIS rules'); setEcCompId('1'); setEcSupplierId('1'); } },
    { label: 'EUV tool to UAE', apply: () => { setDestCountry('UAE'); setEndUse('ASML DUV immersion tool resale to G42 fab; check diversion risk to PRC and Entity List'); setEcCompId('2'); setEcSupplierId('2'); } },
    { label: 'HBM3e to Russia', apply: () => { setDestCountry('Russia'); setEndUse('HBM3e stacks for telecom infrastructure — OFAC/EAR sanctions, Common High-Priority List'); setEcCompId('3'); setEcSupplierId('3'); } },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">AI Center</h1><p className="text-gray-400 text-sm">AI-powered semiconductor supply chain intelligence</p></div>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setActiveTab(id); setResult(null); setError(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl">
        {activeTab === 'risk' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.riskAssessment(Number(componentId)||0, Number(supplierId)||0)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Risk Assessment</h2><p className="text-gray-400 text-sm mb-4">Get deep risk analysis for a component or supplier with mitigation strategies.</p></div>
            <SamplesBar samples={riskSamples} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Component ID (optional)</label><input value={componentId} onChange={e=>setComponentId(e.target.value)} className={inp} placeholder="e.g., 1" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Supplier ID (optional)</label><input value={supplierId} onChange={e=>setSupplierId(e.target.value)} className={inp} placeholder="e.g., 4" /></div>
            </div>
            <button type="submit" disabled={loading} className={btn}>{loading ? 'Analyzing...' : 'Assess Risk'}</button>
          </form>
        )}
        {activeTab === 'allocation' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.allocationOptimization(capacity, customers, priorities)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Allocation Optimization</h2><p className="text-gray-400 text-sm mb-4">Optimize capacity allocation across customers for maximum strategic value.</p></div>
            <SamplesBar samples={allocationSamples} />
            <div><label className="block text-sm text-gray-300 mb-1">Available Capacity</label><input value={capacity} onChange={e=>setCapacity(e.target.value)} className={inp} placeholder="e.g., 85 CoWoS-S units per month" required /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Customer Requests</label><textarea value={customers} onChange={e=>setCustomers(e.target.value)} rows={3} className={inp+" resize-none"} placeholder="NVIDIA: 60 units, AMD: 30 units, Google: 20 units" required /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Business Priorities</label><input value={priorities} onChange={e=>setPriorities(e.target.value)} className={inp} placeholder="Maximize revenue, protect strategic relationships" /></div>
            <button type="submit" disabled={loading} className={btn}>{loading ? 'Optimizing...' : 'Optimize Allocations'}</button>
          </form>
        )}
        {activeTab === 'forecast' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.marketForecast(component, timeframe)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Market Forecast</h2><p className="text-gray-400 text-sm mb-4">Get supply/demand forecasts and price trajectory for any semiconductor component.</p></div>
            <SamplesBar samples={forecastSamples} />
            <div><label className="block text-sm text-gray-300 mb-1">Component</label><input value={component} onChange={e=>setComponent(e.target.value)} className={inp} placeholder="e.g., HBM3 Memory, CoWoS-S packaging, 3nm wafers" required /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Forecast Timeframe</label><select value={timeframe} onChange={e=>setTimeframe(e.target.value)} className={inp}>
              {['next 6 months','next 12 months','next 18 months','next 24 months','next 36 months'].map(t=><option key={t}>{t}</option>)}
            </select></div>
            <button type="submit" disabled={loading} className={btn}>{loading ? 'Forecasting...' : 'Generate Forecast'}</button>
          </form>
        )}
        {activeTab === 'resilience' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.resilienceReport({})); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Resilience Report</h2><p className="text-gray-400 text-sm mb-4">Generate a comprehensive supply chain resilience report with scenario analysis and recommendations.</p></div>
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">The AI will analyze your current supply chain data including suppliers, components, active risk alerts, and fab utilization.</div>
            <button type="submit" disabled={loading} className={btn}>{loading ? 'Generating...' : 'Generate Resilience Report'}</button>
          </form>
        )}
        {activeTab === 'foundry' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.foundryAllocator(foundry, waferStarts, demand, constraints)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Foundry Capacity Allocator</h2><p className="text-gray-400 text-sm mb-4">Optimize wafer-start allocation across nodes & customers for a foundry.</p></div>
            <SamplesBar samples={foundrySamples} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Foundry</label><input value={foundry} onChange={e=>setFoundry(e.target.value)} className={inp} placeholder="TSMC, Samsung, Intel" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Total Wafer Starts</label><input value={waferStarts} onChange={e=>setWaferStarts(e.target.value)} className={inp} placeholder="e.g., 130k/mo" /></div>
            </div>
            <div><label className="block text-sm text-gray-300 mb-1">Demand Requests</label><textarea value={demand} onChange={e=>setDemand(e.target.value)} rows={3} className={inp+" resize-none"} placeholder="Apple N3: 60k, NVIDIA N4: 25k, AMD N5: 20k..." /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Strategic Constraints</label><input value={constraints} onChange={e=>setConstraints(e.target.value)} className={inp} placeholder="Reserve 10k for govt, prioritize 3yr contracts" /></div>
            <button type="submit" disabled={loading} className={btn}>{loading ? 'Allocating...' : 'Allocate Foundry Capacity'}</button>
          </form>
        )}
        {activeTab === 'leadtime' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.leadTimeForecast(Number(ltCompId)||0, ltScenario)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Lead-Time Forecaster</h2><p className="text-gray-400 text-sm mb-4">Forecast component lead-times under baseline / stress scenarios.</p></div>
            <SamplesBar samples={leadtimeSamples} />
            <div><label className="block text-sm text-gray-300 mb-1">Component ID</label><input value={ltCompId} onChange={e=>setLtCompId(e.target.value)} className={inp} placeholder="e.g., 3" required /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Scenario</label><select value={ltScenario} onChange={e=>setLtScenario(e.target.value)} className={inp}>
              {['baseline','tight capacity','recession','geopolitical disruption','EUV bottleneck'].map(s=><option key={s}>{s}</option>)}
            </select></div>
            <button type="submit" disabled={loading} className={btn}>{loading ? 'Forecasting...' : 'Forecast Lead Time'}</button>
          </form>
        )}
        {activeTab === 'geo' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.geopoliticalAnalyzer(region, geoScenario, horizon)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Geopolitical Disruption Analyzer</h2><p className="text-gray-400 text-sm mb-4">Model cascade impact of geopolitical events on the chip supply chain.</p></div>
            <SamplesBar samples={geoSamples} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Region</label><input value={region} onChange={e=>setRegion(e.target.value)} className={inp} placeholder="Taiwan, China, Korea, Netherlands" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Horizon</label><select value={horizon} onChange={e=>setHorizon(e.target.value)} className={inp}>{['3 months','6 months','12 months','24 months'].map(t=><option key={t}>{t}</option>)}</select></div>
            </div>
            <div><label className="block text-sm text-gray-300 mb-1">Scenario</label><input value={geoScenario} onChange={e=>setGeoScenario(e.target.value)} className={inp} placeholder="Strait blockade, expanded export controls, sanctions" /></div>
            <button type="submit" disabled={loading} className={btn}>{loading ? 'Analyzing...' : 'Analyze Disruption'}</button>
          </form>
        )}
        {activeTab === 'yield' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.yieldLossPredictor(Number(ylCompId)||0, Number(node)||0, defects)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Yield-Loss Predictor</h2><p className="text-gray-400 text-sm mb-4">Predict yield risk and capacity impact for advanced-node components.</p></div>
            <SamplesBar samples={yieldSamples} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Component ID</label><input value={ylCompId} onChange={e=>setYlCompId(e.target.value)} className={inp} placeholder="e.g., 5" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Process Node (nm)</label><input value={node} onChange={e=>setNode(e.target.value)} className={inp} placeholder="3, 5, 7" /></div>
            </div>
            <div><label className="block text-sm text-gray-300 mb-1">Reported Defect Signals</label><textarea value={defects} onChange={e=>setDefects(e.target.value)} rows={3} className={inp+" resize-none"} placeholder="Edge-die scaling, BEOL via shorts, particle defects..." /></div>
            <button type="submit" disabled={loading} className={btn}>{loading ? 'Predicting...' : 'Predict Yield Loss'}</button>
          </form>
        )}
        {activeTab === 'export' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.exportCompliance(destCountry, endUse, Number(ecCompId)||0, Number(ecSupplierId)||0)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Export-Control Compliance Flagger</h2><p className="text-gray-400 text-sm mb-4">Screen a transaction against EAR / FDPR / Entity List controls.</p></div>
            <SamplesBar samples={exportSamples} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Destination Country</label><input value={destCountry} onChange={e=>setDestCountry(e.target.value)} className={inp} placeholder="e.g., China, UAE" required /></div>
              <div><label className="block text-sm text-gray-300 mb-1">End Use</label><input value={endUse} onChange={e=>setEndUse(e.target.value)} className={inp} placeholder="AI training, telecom, automotive" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Component ID (optional)</label><input value={ecCompId} onChange={e=>setEcCompId(e.target.value)} className={inp} /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Supplier ID (optional)</label><input value={ecSupplierId} onChange={e=>setEcSupplierId(e.target.value)} className={inp} /></div>
            </div>
            <button type="submit" disabled={loading} className={btn}>{loading ? 'Screening...' : 'Screen Transaction'}</button>
          </form>
        )}
        {error && <div className="mt-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg p-3 text-sm">{error}</div>}
        <AIResponse result={result} loading={loading} />
      </div>
    </div>
  );
}
