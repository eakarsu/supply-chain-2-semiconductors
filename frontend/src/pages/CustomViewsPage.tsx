import WaferDemandChart from '../components/WaferDemandChart';
import FoundryCapacityHeatmap from '../components/FoundryCapacityHeatmap';
import SupplyChainRiskPdf from '../components/SupplyChainRiskPdf';
import QualificationRulesEditor from '../components/QualificationRulesEditor';
import { Microscope } from 'lucide-react';

export default function CustomViewsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg"><Microscope className="w-6 h-6 text-amber-400" /></div>
        <div>
          <h1 className="text-2xl font-bold text-white">Chip Supply Views</h1>
          <p className="text-gray-400 text-sm">Custom semiconductor supply chain dashboards & tools.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WaferDemandChart />
        <FoundryCapacityHeatmap />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SupplyChainRiskPdf />
        <QualificationRulesEditor />
      </div>
    </div>
  );
}
