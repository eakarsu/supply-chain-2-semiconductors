import AdvisoryWorkspace from '../components/runtime-ai/AdvisoryWorkspace';

export default function AIStudio() {
  return <AdvisoryWorkspace
    title="Supply-chain advisory"
    description="Review deidentified traceability questions. Native receiving, inspection, approval and allocation remain deterministic and require their existing saved evidence."
    endpoint="/api/runtime-ai/recommendation"
    field="prompt"
    fieldLabel="Deidentified traceability brief"
    maxLength={4000}
    minLength={1}
    examples={[{"label": "Fill all \u00b7 Operating review", "value": "Example review scope: prepare a semiconductor supply-chain traceability review. No actual lots, suppliers, inspection events or allocation records are supplied. Identify required source evidence and human verification steps without inventing authoritative records or approving any allocation."}, {"label": "Fill all \u00b7 Risk review", "value": "Example review scope: review supplier traceability, source freshness and quality-release uncertainty before planning allocation. Actual source records are not provided. Identify missing evidence, conservative options and escalation questions; never claim a lot is approved."}, {"label": "Fill all \u00b7 Action plan", "value": "Example review scope: outline the checks for receiving, inspecting and allocating semiconductor lots. Actual lot IDs, quantities, quality decisions and BOM records are unspecified. Request source evidence, separate recommendations from deterministic policy decisions and list accountable human review steps."}]}
    tokenStorage="token"
  />;
}
