INSERT INTO users (email, password_hash, name, role) VALUES
('admin@demo.com', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO suppliers (name, country, tier, city, capabilities, capacity_utilization, export_controlled, revenue_billions, employees, founded_year, certifications, status) VALUES
('TSMC', 'Taiwan', 1, 'Hsinchu', 'Logic foundry: 2nm, 3nm, 5nm, 7nm, EUV lithography, advanced packaging CoWoS', 95.5, false, 92.0, 73000, 1987, 'ISO9001, IATF16949, AEC-Q100', 'active'),
('Samsung Foundry', 'South Korea', 1, 'Seoul', 'Logic foundry: 3nm GAA, 4nm, 5nm, 7nm, HBM memory, DRAM, NAND flash', 88.0, false, 74.0, 270000, 1969, 'ISO9001, ISO14001, IATF16949', 'active'),
('Intel Foundry', 'USA', 1, 'Santa Clara', 'Logic foundry: Intel 18A, Intel 3, Intel 4, x86 microprocessors, advanced packaging', 72.0, false, 54.2, 110000, 1968, 'ISO9001, IATF16949, DoD trusted foundry', 'active'),
('ASML', 'Netherlands', 1, 'Veldhoven', 'EUV lithography systems, DUV immersion, metrology equipment - monopoly on EUV', 99.0, true, 21.3, 43000, 1984, 'ISO9001, SEMI standards', 'active'),
('Lam Research', 'USA', 1, 'Fremont', 'Etch equipment, deposition (CVD, ALD, PVD), clean equipment for advanced nodes', 85.0, false, 17.4, 17000, 1980, 'ISO9001, SEMI standards', 'active'),
('Applied Materials', 'USA', 1, 'Santa Clara', 'Deposition, etch, CMP, thermal, inspection equipment for all semiconductor processes', 87.0, false, 26.5, 34000, 1967, 'ISO9001, ISO14001', 'active'),
('KLA Corporation', 'USA', 1, 'Milpitas', 'Inspection, metrology, process control equipment - critical for yield management', 91.0, false, 10.5, 14000, 1975, 'ISO9001, SEMI standards', 'active'),
('SK Hynix', 'South Korea', 1, 'Icheon', 'DRAM, HBM3/HBM3e, NAND flash, enterprise SSD - #2 DRAM market globally', 89.0, false, 25.1, 30000, 1983, 'ISO9001, AEC-Q100', 'active'),
('Micron Technology', 'USA', 1, 'Boise', 'DRAM, HBM, NAND flash, enterprise SSD - only US-based DRAM manufacturer', 84.0, false, 15.5, 40000, 1978, 'ISO9001, IATF16949', 'active'),
('Shin-Etsu Chemical', 'Japan', 2, 'Tokyo', 'Silicon wafers 300mm/200mm, photoresist, silicones - largest silicon wafer producer', 93.0, false, 18.2, 36000, 1926, 'ISO9001, ISO14001', 'active'),
('Tokyo Electron (TEL)', 'Japan', 1, 'Tokyo', 'Coater/developers, thermal processing, etch systems, deposition equipment', 88.0, true, 17.8, 15000, 1963, 'ISO9001, SEMI standards', 'active'),
('Entegris', 'USA', 2, 'Billerica', 'Advanced materials: CMP slurry, ultra-pure chemicals, filtration, gas purification', 82.0, false, 3.7, 9500, 1966, 'ISO9001, ISO14001', 'active'),
('Synopsys', 'USA', 2, 'Mountain View', 'EDA software: synthesis, simulation, verification, IP cores for chip design', 96.0, true, 5.8, 20000, 1986, 'ISO9001, DoD trusted EDA', 'active'),
('Cadence Design Systems', 'USA', 2, 'San Jose', 'EDA software: place & route, custom design, verification, PCB design tools', 94.0, true, 3.9, 11000, 1988, 'ISO9001, DoD trusted EDA', 'active'),
('NVIDIA', 'USA', 1, 'Santa Clara', 'GPU design, AI accelerators, networking (as design partner/major customer)', 98.0, true, 44.9, 29600, 1993, 'ISO9001, ISO14001', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO components (name, type, process_node_nm, supplier_id, lead_time_weeks, allocated_to, status, monthly_capacity_k_units, current_allocation_pct, price_usd, criticality) VALUES
('HBM3 Memory', 'memory', 5, 8, 52, 'NVIDIA, AMD, Intel', 'constrained', 180, 98.5, 2800, 'critical'),
('HBM3e Memory', 'memory', 5, 2, 48, 'NVIDIA H200, AMD MI300X', 'constrained', 120, 99.2, 3400, 'critical'),
('CoWoS-S Advanced Packaging', 'packaging', NULL, 1, 36, 'NVIDIA H100/H200, AMD', 'constrained', 85, 97.8, 800, 'critical'),
('EUV Mask Set (5nm)', 'mask', 5, 1, 24, 'Apple A18, Qualcomm X70', 'available', 200, 82.0, 1200, 'high'),
('3nm Logic Wafers', 'logic_chip', 3, 1, 52, 'Apple A17 Pro, Apple M4', 'allocated', 45, 95.5, 18000, 'critical'),
('5nm Logic Wafers', 'logic_chip', 5, 1, 48, 'NVIDIA, AMD, Qualcomm, Apple', 'constrained', 120, 94.2, 12000, 'critical'),
('EUV Lithography System', 'equipment', NULL, 4, 104, 'TSMC, Samsung, Intel', 'allocated', 5, 100.0, 180000000, 'critical'),
('Advanced Substrate (FC-BGA)', 'substrate', NULL, 10, 40, 'Intel, NVIDIA, AMD', 'constrained', 450, 91.0, 380, 'high'),
('CMP Slurry (Advanced)', 'chemical', NULL, 12, 8, 'All fabs', 'available', 5000, 72.0, 45, 'medium'),
('KrF Photoresist', 'chemical', NULL, 10, 6, 'All fabs 200mm', 'available', 8000, 65.0, 28, 'low'),
('EUV Photoresist', 'chemical', NULL, 10, 12, 'TSMC, Samsung EUV', 'constrained', 1200, 88.0, 380, 'high'),
('Ion Implanter (Advanced)', 'equipment', NULL, 5, 52, 'TSMC, Samsung Foundry', 'allocated', 12, 95.0, 2500000, 'high'),
('300mm Silicon Wafers', 'substrate', NULL, 10, 16, 'All leading fabs', 'available', 12000, 87.5, 125, 'high'),
('DRAM DDR5 16Gb', 'memory', 10, 9, 26, 'PC/server manufacturers', 'available', 28000, 78.0, 8, 'medium'),
('CoW-on-SoIC Packaging', 'packaging', NULL, 1, 52, 'Apple, MediaTek (next-gen)', 'constrained', 25, 96.0, 1500, 'critical')
ON CONFLICT DO NOTHING;

INSERT INTO allocations (component_id, customer, quantity_k_units, priority, locked_until, status, contract_value_millions, notes) VALUES
(3, 'NVIDIA', 40, 1, CURRENT_DATE + 365, 'confirmed', 3200, 'Locked for H100/H200 production through 2025. Executive-level agreement.'),
(3, 'AMD', 15, 2, CURRENT_DATE + 270, 'confirmed', 1200, 'MI300X production allocation. Renewable quarterly.'),
(5, 'Apple Inc.', 18, 1, CURRENT_DATE + 365, 'confirmed', 8100, 'A18 Pro and M4 chip production locked through 2025.'),
(6, 'NVIDIA', 45, 1, CURRENT_DATE + 180, 'confirmed', 5400, 'H100 production. Critical path for data center revenue.'),
(6, 'Qualcomm', 28, 2, CURRENT_DATE + 180, 'confirmed', 3360, 'Snapdragon X Elite and X Plus series.'),
(6, 'Apple Inc.', 25, 1, CURRENT_DATE + 270, 'confirmed', 3000, 'A17 and M-series chips, secured capacity.'),
(1, 'NVIDIA', 90, 1, CURRENT_DATE + 365, 'confirmed', 25200, 'H200/Blackwell GB200 training cluster memory.'),
(1, 'AMD', 45, 2, CURRENT_DATE + 270, 'confirmed', 12600, 'Instinct MI300X memory allocation.'),
(1, 'Google', 25, 2, CURRENT_DATE + 180, 'confirmed', 7000, 'TPUv5 memory, datacenter AI infrastructure.'),
(2, 'NVIDIA', 60, 1, CURRENT_DATE + 365, 'confirmed', 20400, 'Next-gen Blackwell B200 HBM3e requirement.'),
(7, 'TSMC', 2, 1, CURRENT_DATE + 730, 'confirmed', 360000, 'N3/N2 capacity expansion - 2 EUV systems per year.'),
(7, 'Samsung', 1, 2, CURRENT_DATE + 365, 'confirmed', 180000, '3nm GAA production expansion.'),
(8, 'NVIDIA', 180, 1, CURRENT_DATE + 270, 'confirmed', 684, 'FC-BGA substrates for GPU packages.'),
(13, 'TSMC Taiwan', 6000, 1, CURRENT_DATE + 90, 'confirmed', 750, 'Advanced node 300mm wafer supply agreement.'),
(15, 'Apple', 12, 1, CURRENT_DATE + 365, 'provisional', 1800, 'Next-gen SoIC packaging for M5 chip (unconfirmed).')
ON CONFLICT DO NOTHING;

INSERT INTO risk_alerts (component_id, supplier_id, risk_type, severity, title, description, impact, mitigation, status) VALUES
(7, 4, 'single_source', 'critical', 'ASML EUV Monopoly - No Alternative Supplier', 'ASML is the sole global supplier of EUV lithography systems. No alternative exists for sub-7nm chip production. 104-week lead time creates extreme vulnerability.', 'Any ASML disruption halts all leading-edge chip production globally. TSMC, Samsung, Intel would be unable to produce advanced chips within 2 years.', 'Maintain strategic reserve of 2+ EUV systems. Lobby for ASML production expansion. Investigate e-beam lithography as 10+ year alternative.', 'monitoring'),
(1, 8, 'capacity', 'critical', 'HBM3 Shortage - AI Demand Exceeds Supply 400%', 'AI accelerator demand for HBM3 memory has grown 4x faster than production capacity. SK Hynix and Micron are sold out through 2026.', 'NVIDIA H100/H200, AMD MI300X, and Google TPU production constrained. Data center expansion delayed by 6-12 months. $50B+ in stranded demand.', 'Lock multi-year contracts immediately. Invest in Micron capacity expansion ($2B commitment). Explore Samsung as secondary HBM supplier.', 'open'),
(5, 1, 'geopolitical', 'critical', 'Taiwan Geopolitical Risk - TSMC 3nm Single Source', 'TSMC controls 90%+ of sub-5nm chip production capacity. All located in Taiwan, subject to cross-strait tensions. Potential for rapid disruption with no fallback.', 'Loss of TSMC access would halt production of all Apple chips, most NVIDIA GPUs, Qualcomm, MediaTek chips. Estimated $500B+ annual impact to global tech industry.', 'Accelerate TSMC Arizona Fab 21 ramp. Qualify Samsung Foundry as alternative for select products. Support Intel IFS as long-term US domestic alternative.', 'monitoring'),
(NULL, 4, 'export_control', 'high', 'ASML EUV Export Controls to China', 'US/Netherlands export controls prohibit ASML EUV system sales to China. China SMIC limited to 7nm+ nodes. Risk of Chinese retaliation impacting rare earth supply.', 'China cannot access leading-edge chips. Risk of retaliatory export controls on rare earth metals (gallium, germanium) critical for semiconductor manufacturing.', 'Diversify rare earth supply. Build strategic reserves of gallium, germanium. Develop alternative compound semiconductor sources.', 'monitoring'),
(3, 1, 'capacity', 'high', 'CoWoS Packaging Bottleneck at TSMC', 'TSMC CoWoS advanced packaging capacity is severely constrained. NVIDIA H100/H200 production limited by packaging, not wafer supply.', 'NVIDIA cannot ship all ordered H100/H200 GPUs despite having wafers. AMD MI300X also affected. $5B+ quarterly revenue impact to NVIDIA.', 'TSMC expanding CoWoS capacity +60% by Q4 2025. Evaluate ASE, SPIL as alternative packaging partners. Consider in-house assembly.', 'mitigating'),
(NULL, 10, 'single_source', 'high', 'Shin-Etsu 300mm Silicon Wafer Dependency', 'Shin-Etsu + SUMCO control 60% of 300mm silicon wafer supply. Japanese export controls could disrupt supply. Wafer demand growing with AI fab expansion.', 'Wafer shortage would constrain production at all leading fabs. 16-week lead times with no short-term alternatives.', 'Qualify Siltronic (Germany) and SK Siltron (Korea) as additional wafer suppliers. Build 8-week strategic buffer inventory.', 'open'),
(NULL, 13, 'export_control', 'high', 'Synopsys/Cadence EDA Export Controls Risk', 'US EDA tools (Synopsys, Cadence) are subject to export controls. Any restrictions would prevent chip designers from using these tools. China developing alternatives.', 'Chinese chip design companies would lose access to leading EDA tools. However, US companies also face risk if China restricts access to foundries.', 'Maintain offline license backup systems. Evaluate open-source EDA alternatives for resilience.', 'monitoring'),
(2, 2, 'capacity', 'high', 'HBM3e Supply Severely Constrained Through 2026', 'Samsung and SK Hynix HBM3e capacity is 100% allocated to NVIDIA for Blackwell GPUs. No spot market availability.', 'Any new AI accelerator program cannot source HBM3e memory. AMD MI400, Google TPUv6 face memory supply risk.', 'Place 18-month advance orders with both Samsung and SK Hynix. Include penalty clauses for non-delivery. Begin Micron qualification for HBM3e.', 'open'),
(NULL, 9, 'natural_disaster', 'medium', 'Micron Boise Facility Earthquake Risk', 'Microns headquarters and primary DRAM fab in Boise, Idaho is in seismically active zone. A major earthquake could disrupt 25% of US DRAM production.', 'Loss of Boise facility would reduce US DRAM supply by 25% for 12-18 months. DRAM prices would spike 50-100%.', 'Ensure Micron Singapore and Japan fabs can absorb production. Build 6-week DRAM buffer inventory. Qualify Samsung and Hynix as dual sources.', 'monitoring'),
(6, 1, 'capacity', 'medium', 'TSMC 5nm Allocation Oversubscribed', 'Demand for TSMC 5nm capacity exceeds supply by 35%. Multiple customers competing: NVIDIA, Qualcomm, Apple, AMD, MediaTek.', 'Lower-priority customers will face allocation cuts. Qualcomm and MediaTek most at risk as Apple and NVIDIA have priority contracts.', 'Negotiate multi-year capacity reservations. Pay capacity reservation fees upfront. Qualify Samsung 4nm as fallback.', 'mitigating'),
(NULL, 12, 'financial', 'medium', 'Entegris Supply Chain Concentration Risk', 'Entegris acquired CMC Materials (2023), creating concentration in advanced process chemicals. Single supplier for many critical CMP formulations.', 'Any quality or supply issue at Entegris could halt production at multiple fabs simultaneously. Limited qualified alternatives for advanced CMP slurries.', 'Qualify Versum Materials and Fujifilm as alternative CMP suppliers. Build 12-week buffer inventory of critical chemicals.', 'open'),
(NULL, 11, 'export_control', 'medium', 'Tokyo Electron Export Controls Expansion Risk', 'US pressure on Japan to expand semiconductor equipment export controls to China. TEL has significant China revenue exposure (30%+ of sales).', 'TEL compliance costs and potential China market loss could reduce R&D investment, slowing equipment advancement. Could also cause supply prioritization issues.', 'Maintain dual-source strategy for etch and deposition equipment. Accelerate Lam Research and Applied Materials qualification as alternatives.', 'monitoring'),
(4, 1, 'capacity', 'low', 'EUV Mask Supply Lead Times Extending', 'Advanced EUV mask supply lead times increasing from 16 to 24 weeks due to mask blank shortage and defect inspection capacity limits.', 'New tape-outs and process development cycles extended. Affects time-to-market for new chip designs.', 'Build 8-week mask buffer for critical production programs. Qualify second mask supplier for non-critical masks.', 'monitoring'),
(13, 10, 'capacity', 'low', '300mm Wafer Supply Tightening Q3 2025', 'Growing fab capacity additions (Intel, TSMC Arizona, Samsung Texas) absorbing available 300mm wafer supply. Spot prices rising.', 'Non-contracted wafer purchases face 20-30% price premium. Small fabs without LTAs at risk.', 'Ensure long-term agreements cover 110% of baseline demand. Lock in Q3-Q4 2025 supply now.', 'open'),
(9, 12, 'technology', 'low', 'CMP Slurry Formulation for 2nm Nodes Delayed', 'Next-generation CMP slurry formulations for 2nm and below process nodes behind schedule. Current formulas may not meet planarization requirements.', 'Could delay TSMC N2 yield ramp by 1-2 quarters if not resolved. Impact to Apple M5 and NVIDIA next-gen GPU timeline.', 'Engage Entegris, Versum, and Fujifilm simultaneously on 2nm CMP development. Fund joint development program.', 'open')
ON CONFLICT DO NOTHING;

INSERT INTO fabs (name, operator, location, country, process_nodes, monthly_capacity_kwafers, utilization_pct, status, construction_cost_billions, opened_year, customers) VALUES
('Fab 18 (N3/N2)', 'TSMC', 'Tainan, Taiwan', 'Taiwan', '3nm, 2nm', 55, 95.0, 'operational', 20.0, 2022, 'Apple, NVIDIA, AMD, Qualcomm'),
('Fab 21 Phase 1 (N4)', 'TSMC', 'Phoenix, Arizona', 'USA', '4nm', 20, 65.0, 'operational', 12.0, 2024, 'Apple, NVIDIA, AMD'),
('Fab 21 Phase 2 (N3/N2)', 'TSMC', 'Phoenix, Arizona', 'USA', '3nm, 2nm', 0, 0.0, 'construction', 12.0, 2028, 'TBD'),
('S3 Fab (3nm GAA)', 'Samsung', 'Hwaseong, South Korea', 'South Korea', '3nm GAA, 4nm', 40, 78.0, 'operational', 15.0, 2023, 'Qualcomm, NVIDIA, IBM'),
('Taylor Fab', 'Samsung', 'Taylor, Texas', 'USA', '4nm, 2nm', 0, 0.0, 'construction', 17.0, 2026, 'TBD'),
('Fab 34 (Intel 3)', 'Intel', 'Leixlip, Ireland', 'Ireland', 'Intel 3, Intel 4', 25, 72.0, 'operational', 18.0, 2023, 'Intel products, Microsoft'),
('Fab 52/62 (Intel 18A)', 'Intel', 'Chandler, Arizona', 'USA', 'Intel 18A, Intel 3', 15, 45.0, 'expansion', 28.0, 2025, 'Amazon, Qualcomm (planned)'),
('P1K/P1T (HBM3e)', 'SK Hynix', 'Icheon, South Korea', 'South Korea', 'HBM3e, DRAM 1beta', 80, 98.0, 'operational', 8.0, 2023, 'NVIDIA, AMD, Google'),
('Manassas Fab', 'Micron', 'Manassas, Virginia', 'USA', 'DRAM 1alpha, 1beta', 35, 84.0, 'operational', 3.0, 2012, 'Enterprise, PC OEMs'),
('New Memory Campus', 'Micron', 'Boise, Idaho', 'USA', 'DRAM HBM, NAND', 0, 0.0, 'planned', 15.0, 2027, 'AI/HPC customers')
ON CONFLICT DO NOTHING;

INSERT INTO market_intelligence (title, topic, summary, impact_level, source, published_date, affected_components, analyst, action_items) VALUES
('NVIDIA Blackwell Demand Exceeds 2025 Supply Capacity', 'demand', 'NVIDIA Blackwell B200 and GB200 systems are oversold for 2025 with demand exceeding supply 3:1. CoWoS packaging and HBM3e remain bottlenecks. Hyperscalers (Microsoft, Google, AWS, Meta) have locked up capacity through contract minimums.', 'high', 'Semiconductor Digest', CURRENT_DATE - 5, 'CoWoS-S packaging, HBM3e, 5nm wafers', 'Sarah Chen', 'Lock HBM3e allocation now; evaluate CoWoS capacity expansion investment'),
('ASML EUV Backlog Reaches 2-Year High', 'supply', 'ASML EUV system backlog now stands at 40+ systems representing $7B+ in orders. Lead times extended to 24 months. TSMC and Samsung competing for priority delivery slots. ASML cannot increase production meaningfully in short term.', 'high', 'SEMI Industry Report', CURRENT_DATE - 12, 'EUV Lithography System', 'Michael Torres', 'Confirm ASML delivery schedule; evaluate impact to fab expansion timeline'),
('China Rare Earth Export Restrictions Escalate', 'geopolitics', 'China announced expanded export controls on gallium, germanium, and antimony - critical materials for compound semiconductors and chip manufacturing. Affects LED, power electronics, and RF components. US building strategic reserves.', 'high', 'Reuters', CURRENT_DATE - 3, 'All compound semiconductor components', 'Jennifer Park', 'Assess gallium/germanium exposure; build 6-month strategic reserve; qualify alternative sources'),
('TSMC Arizona Fab 21 Yield Improvement Accelerating', 'technology', 'TSMC Arizona Fab 21 Phase 1 yield rates improving ahead of schedule, now at 85% of Taiwan fab levels. TSMC expects parity by Q2 2025. This supports US domestic production ramp for Apple M4 and NVIDIA chips.', 'medium', 'TSMC Investor Day', CURRENT_DATE - 20, '4nm wafers, Apple chips, NVIDIA GPUs', 'Robert Kim', 'Update Arizona supply contribution model; increase Q3 2025 allocations from Arizona'),
('HBM Memory Market Will Remain Undersupplied Through 2026', 'supply', 'IDC and Gartner both forecast HBM memory demand will exceed supply by 35-45% through end of 2026. SK Hynix, Samsung, and Micron are all expanding HBM capacity but cannot meet AI accelerator demand growth.', 'high', 'IDC Market Report', CURRENT_DATE - 8, 'HBM3 Memory, HBM3e Memory', 'Lisa Wang', 'Secure 24-month HBM contracts; pay reservation fees; consider equity investment in Micron capacity'),
('Intel 18A Process Technology Validation Progress', 'technology', 'Intel 18A (1.8nm class) process node achieving competitive density and performance metrics. Key customer Qualcomm proceeding with test chips. If successful, Intel Foundry becomes credible TSMC alternative by 2026.', 'medium', 'Intel Foundry Update', CURRENT_DATE - 15, '18A logic wafers', 'David Martinez', 'Monitor Intel 18A yield data; evaluate as TSMC diversification option for 2026+'),
('Samsung GAA 3nm Yield Improving, Closing Gap with TSMC', 'technology', 'Samsung 3nm GAA process node yield rates have improved to within 15% of TSMC N3E. Several customers qualifying Samsung as secondary foundry. This could provide meaningful TSMC diversification within 12-18 months.', 'medium', 'EE Times', CURRENT_DATE - 25, '3nm logic wafers', 'Emily Davis', 'Accelerate Samsung 3nm qualification; target 20% of 3nm allocation to Samsung by Q4 2025'),
('Advanced Packaging Capacity Expansion Not Keeping Pace', 'capacity', 'CoWoS, SoIC, and HBM packaging capacity globally insufficient to support AI chip volume. TSMC, ASE, and Amkor all running at 95-100% utilization. Packaging is now the primary bottleneck for AI accelerator production, not wafers.', 'high', 'McKinsey Semiconductor Report', CURRENT_DATE - 18, 'CoWoS-S packaging, SoIC packaging', 'Carlos Rodriguez', 'Evaluate packaging JV with ASE; fund TSMC CoWoS expansion; qualify SPIL as alternative'),
('US CHIPS Act Funding Accelerating Domestic Fab Construction', 'regulation', 'CHIPS Act $52B allocated: Intel ($8.5B), TSMC ($6.6B), Samsung ($6.4B), Micron ($6.1B) receiving grants. US domestic advanced chip capacity to grow from 0% to 20% of leading-edge by 2030.', 'medium', 'US Department of Commerce', CURRENT_DATE - 30, '3nm/5nm wafers, DRAM, packaging', 'Patricia Lee', 'Track fab construction milestones; update 2027 domestic supply model'),
('Photoresist Supply Chain for EUV Nodes Tightening', 'supply', 'EUV photoresist supply from JSR, TOK, and Shin-Etsu cannot keep pace with demand. Japan export controls add procurement complexity. Lead times extending from 12 to 20 weeks at some grades.', 'medium', 'Chemical Week', CURRENT_DATE - 10, 'EUV Photoresist', 'Thomas Garcia', 'Increase EUV photoresist buffer to 20 weeks; qualify second supplier; engage Japan Ministry of Economy on export license'),
('AI Data Center Power Constraints Slowing Chip Deployment', 'demand', 'Data center power availability is becoming the binding constraint on AI chip deployment. Microsoft, Google, Meta building nuclear and renewable capacity. Short-term: demand moderation for chips; long-term: accelerated infrastructure build.', 'medium', 'Data Center Dynamics', CURRENT_DATE - 7, 'HBM3 Memory, CoWoS packaging, NVIDIA GPUs', 'Kevin Brown', 'Monitor hyperscaler power capacity announcements; adjust 2025 demand forecast'),
('Specialty Chemical Export Controls Expanding', 'regulation', 'BIS expanding export controls to cover additional semiconductor process chemicals including certain etchants, precursors, and cleaning agents. Compliance costs rising for global supply chain.', 'low', 'BIS Federal Register', CURRENT_DATE - 40, 'CMP Slurry, EUV Photoresist', 'Sandra Thompson', 'Review chemical supply chain for new EAR classification; ensure export license compliance'),
('300mm Silicon Wafer Demand to Exceed Supply Q2 2025', 'supply', 'Growing fab startups and expansion programs increasing 300mm wafer demand ahead of Shin-Etsu/SUMCO capacity additions. Wafer prices expected to rise 10-15% in H1 2025.', 'medium', 'IC Insights', CURRENT_DATE - 22, '300mm Silicon Wafers', 'Amy Johnson', 'Lock Q1-Q4 2025 wafer contracts immediately; build 6-week buffer inventory'),
('Samsung HBM3e Qualification at Major AI Customers Progressing', 'technology', 'Samsung HBM3e qualification at Google TPUv5 and AMD MI400 on track. This creates a second source for HBM3e beyond SK Hynix, reducing supply concentration risk for AI memory.', 'medium', 'Samsung Semiconductor', CURRENT_DATE - 35, 'HBM3e Memory', 'Marcus Chen', 'Accelerate Samsung HBM3e qualification process; target 30% Samsung / 70% SK Hynix split by Q3 2025'),
('Geopolitical Tension Triggers Chip Stockpiling by Tech Giants', 'geopolitics', 'Apple, NVIDIA, Qualcomm, and Samsung all building strategic chip and component inventories above normal levels due to geopolitical uncertainty. This is temporarily tightening supply beyond actual demand.', 'high', 'Wall Street Journal', CURRENT_DATE - 1, 'All critical components', 'Rachel Kim', 'Assess our own stockpile strategy; ensure we are not disadvantaged vs competitors; target 8-week buffer for critical items')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ECCN reference codes (real BIS Commerce Control List entries, Cat 3/4/5)
-- ============================================================================
INSERT INTO eccn_codes (code, category, product_group, description, controls, license_required_to, technical_threshold) VALUES
('3A001', 3, 'A', 'Electronic items: high-performance ICs, ADCs/DACs, microprocessors, FPGAs, microwave/MMICs, radiation-hardened devices', 'NS Column 1; AT Column 1; MT, NP, RS for select sub-paragraphs', 'China, Russia, Belarus, Iran, North Korea, Syria, Cuba (license required)', 'See 3A001.a–.b sub-thresholds (e.g., MPU with APP > 0.005 TOPS, ADC > 8 GSPS @ 10-bit)'),
('3A002', 3, 'A', 'General-purpose electronic equipment: signal analyzers, frequency synthesizers, oscilloscopes, network analyzers above thresholds', 'NS Column 2; AT Column 1', 'Russia, Belarus, Iran, NK, Syria, Cuba (license required)', 'Spectrum analyzers >43 GHz; signal generators with phase noise below threshold'),
('3A090', 3, 'A', 'Advanced computing integrated circuits: AI accelerators, GPUs, NPUs above performance thresholds (post-Oct 2022 rule)', 'NS Column 1; RS Column 1 (China-specific advanced computing controls)', 'China (PRC, HK, Macau), Russia, Belarus, Iran (license required, presumption of denial for China advanced compute)', 'Aggregate processing performance (TPP) >= 4800 or 1600 with performance density >= 5.92 (NVIDIA A100/H100/H200, AMD MI300X covered)'),
('3A991', 3, 'A', 'Electronic items n.e.s.: microprocessors and ICs not controlled by 3A001 but rated for military temperature/radiation', 'AT Column 1 only', 'Cuba, Iran, NK, Syria (license required); most other destinations EAR99-like', 'Operating temperature -54 C to +125 C military; or rated for space'),
('3A992', 3, 'A', 'General purpose electronic equipment not controlled by 3A002 (oscilloscopes, signal generators below 3A002 thresholds)', 'AT Column 1', 'Cuba, Iran, NK, Syria (license required)', 'Below 3A002 performance thresholds'),
('3B001', 3, 'B', 'Semiconductor manufacturing equipment: EUV/DUV lithography scanners, etch, deposition, ion implantation, metrology for sub-16/14nm', 'NS Column 2; AT Column 1; RS Column 1 (China advanced node SME controls)', 'China (PRC) for sub-16/14nm tools (presumption of denial); Russia, Belarus, Iran, NK, Syria, Cuba', 'EUV scanners; DUV immersion ArF for <16nm; atomic layer etch; EPI for sub-7nm'),
('3B002', 3, 'B', 'Test equipment for semiconductor wafers and devices above stated thresholds', 'NS Column 2; AT Column 1', 'China, Russia, Belarus, Iran, NK, Syria, Cuba', 'See sub-paragraph thresholds'),
('3C001', 3, 'C', 'Hetero-epitaxial materials: SiC, GaN, GaAs wafers/substrates for power and RF devices', 'NS Column 2; AT Column 1', 'Russia, Belarus, Iran, NK, Syria, Cuba', 'Resistivity, purity, defect density thresholds'),
('3C002', 3, 'C', 'Photoresists optimized for EUV/DUV lithography below stated wavelengths', 'NS Column 2; AT Column 1', 'Russia, Belarus, Iran, NK, Syria, Cuba; China (some sub-grades for advanced nodes)', 'For wavelengths <245nm; EUV (13.5nm) photoresists'),
('3D001', 3, 'D', 'Software for the development, production, or use of items controlled by 3A001, 3B001, 3B002', 'NS Column 1/2; AT Column 1; RS Column 1', 'Same destinations as underlying hardware', 'Source code or executables specifically designed for controlled hardware'),
('3D002', 3, 'D', 'Software specially designed for stored-program controlled equipment of 3B001/3B002', 'NS Column 2; AT Column 1', 'Same destinations as underlying hardware', 'SME control software'),
('3E001', 3, 'E', 'Technology for development/production of items controlled by 3A001, 3B001 (chip design IP, process recipes)', 'NS Column 1; AT Column 1; RS Column 1', 'China, Russia, Belarus, Iran, NK, Syria, Cuba', 'Technical data, blueprints, process flows for controlled items'),
('3E002', 3, 'E', 'Technology for development of microprocessor microarchitectures or microcircuit compilers using non-standard process libraries', 'NS Column 1; AT Column 1', 'China, Russia, Belarus, Iran, NK, Syria, Cuba', 'IP cores, RTL, GDSII for controlled designs'),
('3E003', 3, 'E', 'Other technology: bipolar tech, magnetic semiconductors, SOI, SiC/GaN device technology', 'NS Column 2; AT Column 1', 'Russia, Belarus, Iran, NK, Syria, Cuba', 'Process-specific knowhow'),
('4A003', 4, 'A', 'Digital computers, electronic assemblies, related equipment with APP exceeding stated thresholds (servers, supercomputers)', 'NS Column 1; AT Column 1', 'China (advanced compute), Russia, Belarus, Iran, NK, Syria, Cuba', 'Adjusted Peak Performance (APP) > 70 WT (weighted TeraFLOPS) historically; updated by Oct 2022/2023 rules'),
('4A004', 4, 'A', 'Computers and related equipment with vector/array processors; neural network accelerators above 4A003 thresholds', 'NS Column 1; AT Column 1', 'China, Russia, Belarus, Iran, NK, Syria, Cuba', 'High-bandwidth interconnect, systolic-array AI accelerators'),
('4A005', 4, 'A', 'Systems, equipment and components specially designed for intrusion software (offensive cyber)', 'NS Column 1; AT Column 1', 'Most destinations require license; very limited license exceptions', 'Items designed for generating, operating, delivering, or communicating with intrusion software'),
('4A994', 4, 'A', 'Computers and electronic assemblies not controlled by 4A001-4A005 (general commercial computers)', 'AT Column 1', 'Cuba, Iran, NK, Syria', 'EAR99-adjacent commercial servers/desktops'),
('4D001', 4, 'D', 'Software specially designed or modified for the development or production of items controlled by 4A001 or 4A003-4A005', 'NS Column 1; AT Column 1', 'China, Russia, Belarus, Iran, NK, Syria, Cuba', 'OS, firmware, simulators for controlled HPC'),
('4E001', 4, 'E', 'Technology for the development, production, or use of items controlled by 4A001, 4A003-4A005 or 4D001', 'NS Column 1; AT Column 1', 'China, Russia, Belarus, Iran, NK, Syria, Cuba', 'HPC interconnect designs, AI accelerator microarchitectures'),
('5A001', 5, 'A', 'Telecommunications systems, equipment, and components: high-data-rate radios, fiber optics, undersea cable, phased arrays', 'NS Column 2; AT Column 1; SL Column 1 (surveillance items)', 'Russia, Belarus, Iran, NK, Syria, Cuba; surveillance items broadly controlled', 'Data rate, frequency band, modulation thresholds'),
('5A002', 5, 'A', 'Information security: cryptographic items using symmetric keys >56 bits, asymmetric >512 bits, elliptic curve >112 bits', 'NS Column 2; AT Column 1; EI Column 1 (encryption)', 'Cuba, Iran, NK, Sudan, Syria (license required); mass-market may qualify for ENC license exception', 'Key length thresholds; quantum-resistant algorithms'),
('5A991', 5, 'A', 'Telecom equipment n.e.s. not controlled by 5A001', 'AT Column 1', 'Cuba, Iran, NK, Syria', 'General commercial telecom'),
('5A992', 5, 'A', 'Information security items not controlled by 5A002 (mass-market crypto, weak crypto)', 'AT Column 1', 'Cuba, Iran, NK, Sudan, Syria; mass-market exception possible', 'Symmetric <=56 bits, asymmetric <=512 bits'),
('5D001', 5, 'D', 'Software for development/production of items in 5A001 or 5B001', 'NS Column 2; AT Column 1', 'Russia, Belarus, Iran, NK, Syria, Cuba', 'Telecom development tools'),
('5D002', 5, 'D', 'Information security software using cryptography controlled in 5A002', 'NS Column 2; AT Column 1; EI Column 1', 'Cuba, Iran, NK, Sudan, Syria; ENC exception available', 'Cryptographic libraries, IPSec/TLS stacks'),
('5E001', 5, 'E', 'Technology for development, production, or use of items in 5A001 or 5D001', 'NS Column 2; AT Column 1', 'Russia, Belarus, Iran, NK, Syria, Cuba', 'Telecom design knowhow'),
('5E002', 5, 'E', 'Technology for development of items in 5A002 or 5D002 (cryptographic technology)', 'NS Column 2; AT Column 1; EI Column 1', 'Cuba, Iran, NK, Sudan, Syria; ENC technology controls', 'Cryptographic implementation knowhow'),
('EAR99', NULL, NULL, 'Items subject to the EAR but not listed on the Commerce Control List (catch-all)', 'No specific controls beyond embargoed destinations', 'Cuba, Iran, NK, Syria (comprehensive sanctions); Crimea/DNR/LNR regions', 'Low-tech consumer electronics, basic ICs, general commercial items')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- HTS reference codes (US Harmonized Tariff Schedule - semiconductor chapter 85)
-- ============================================================================
INSERT INTO hts_codes (code, description, general_rate, special_rate, unit_of_measure) VALUES
('8541.10.00', 'Diodes, other than photosensitive or light-emitting diodes (LEDs)', 'Free', 'Free', 'No.'),
('8541.21.00', 'Transistors, other than photosensitive transistors, with a dissipation rate < 1 W', 'Free', 'Free', 'No.'),
('8541.29.00', 'Other transistors, with a dissipation rate >= 1 W', 'Free', 'Free', 'No.'),
('8541.40.95', 'Photosensitive semiconductor devices including photovoltaic cells; LEDs', 'Free', 'Free', 'No.'),
('8542.31.00', 'Electronic integrated circuits: processors and controllers (CPUs, MCUs, GPUs)', 'Free', 'Free', 'No.'),
('8542.32.00', 'Electronic integrated circuits: memories (DRAM, SRAM, NAND, NOR, HBM stacks)', 'Free', 'Free', 'No.'),
('8542.33.00', 'Electronic integrated circuits: amplifiers (RF, op-amps, audio amplifiers)', 'Free', 'Free', 'No.'),
('8542.39.00', 'Electronic integrated circuits: other (FPGAs, ASICs, mixed-signal, SoCs not elsewhere specified)', 'Free', 'Free', 'No.'),
('8542.90.00', 'Parts of electronic integrated circuits (carriers, leadframes, substrate components)', 'Free', 'Free', 'No.'),
('8486.10.00', 'Machines and apparatus for the manufacture of boules or wafers', 'Free', 'Free', 'No.'),
('8486.20.00', 'Machines and apparatus for the manufacture of semiconductor devices or ICs (steppers, etchers, CVD, ALD)', 'Free', 'Free', 'No.'),
('8486.30.00', 'Machines and apparatus for the manufacture of flat panel displays', 'Free', 'Free', 'No.'),
('8486.40.00', 'Machines and apparatus for lifting, handling, loading, or unloading of boules, wafers, ICs, or flat panel displays', 'Free', 'Free', 'No.'),
('8486.90.00', 'Parts and accessories of machines and apparatus of 8486', 'Free', 'Free', 'No.'),
('3818.00.00', 'Chemical elements doped for use in electronics, in the form of discs, wafers, or similar forms (silicon wafers)', 'Free', 'Free', 'kg'),
('2804.61.00', 'Silicon containing by weight not less than 99.99% of silicon (polysilicon for semiconductors)', 'Free', 'Free', 'kg'),
('2818.10.20', 'Artificial corundum / synthetic sapphire substrates', '1.3%', 'Free (most FTA)', 'kg')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Multi-tier supplier graph relationships
-- Tier 1 (foundries / end customers) -> Tier 2 (equipment / materials) -> Tier 3 (sub-component suppliers)
-- Uses subqueries against suppliers.name so seed is order-independent.
-- Adds the additional suppliers that don't already exist in seed.
-- ============================================================================
INSERT INTO suppliers (name, country, tier, city, capabilities, capacity_utilization, export_controlled, revenue_billions, employees, founded_year, certifications, status) VALUES
('Carl Zeiss SMT', 'Germany', 3, 'Oberkochen', 'EUV optics, projection lenses, illuminators — sole supplier of EUV optical systems for ASML', 99.0, true, 2.4, 4500, 1846, 'ISO9001, ISO14001, SEMI', 'active'),
('Trumpf', 'Germany', 3, 'Ditzingen', 'EUV CO2 drive lasers — sole source of high-power lasers for ASML EUV plasma source', 95.0, true, 5.4, 18000, 1923, 'ISO9001, ISO14001', 'active'),
('ASM International', 'Netherlands', 2, 'Almere', 'ALD (atomic layer deposition), epitaxy, PEALD equipment for advanced logic and memory', 88.0, false, 3.1, 4500, 1968, 'ISO9001, SEMI', 'active'),
('Heraeus', 'Germany', 4, 'Hanau', 'Quartz glass for EUV optics, sputtering targets, precious metal precursors, bonding wire', 80.0, false, 23.9, 16400, 1851, 'ISO9001, ISO14001', 'active'),
('JSR Corporation', 'Japan', 2, 'Tokyo', 'EUV/ArF photoresists, CMP slurries, multi-layer materials', 90.0, true, 3.0, 9000, 1957, 'ISO9001, ISO14001', 'active'),
('Tokyo Ohka Kogyo (TOK)', 'Japan', 2, 'Kawasaki', 'EUV photoresists, ArF/KrF resists, photoresist ancillaries — top-3 EUV resist supplier', 92.0, true, 1.2, 2400, 1936, 'ISO9001, ISO14001', 'active'),
('Sumco', 'Japan', 2, 'Tokyo', '300mm prime silicon wafers, EPI wafers — #2 supplier behind Shin-Etsu', 91.0, false, 2.8, 9500, 1999, 'ISO9001, IATF16949', 'active'),
('Siltronic', 'Germany', 2, 'Munich', '300mm/200mm silicon wafers, EPI wafers, polished wafers for logic and memory', 87.0, false, 1.5, 4200, 1968, 'ISO9001, IATF16949', 'active'),
('ASE Technology', 'Taiwan', 2, 'Kaohsiung', 'OSAT - assembly, test, advanced packaging (flip chip, FOWLP, SiP) — world #1 OSAT', 89.0, false, 19.2, 100000, 1984, 'ISO9001, AEC-Q100', 'active'),
('Amkor Technology', 'USA', 2, 'Tempe', 'OSAT - flip chip, wafer-level packaging, advanced SiP, 2.5D/3D packaging', 85.0, false, 7.1, 30000, 1968, 'ISO9001, AEC-Q100', 'active'),
('SPIL (Siliconware Precision)', 'Taiwan', 2, 'Taichung', 'OSAT - wirebond, flip-chip BGA, fan-out packaging (now under ASE)', 86.0, false, 3.0, 24000, 1984, 'ISO9001, AEC-Q100', 'active'),
('AMD', 'USA', 1, 'Santa Clara', 'CPU/GPU/APU/AI accelerator design (MI300X/MI325X) — fabless, customer of TSMC, Samsung', 95.0, true, 22.7, 26000, 1969, 'ISO9001', 'active'),
('Broadcom', 'USA', 1, 'San Jose', 'Networking ASICs, custom TPU silicon for Google, RF front-end, infrastructure software', 96.0, true, 35.8, 20000, 1991, 'ISO9001', 'active'),
('Marvell Technology', 'USA', 1, 'Santa Clara', 'Networking ASICs, custom ASICs for hyperscalers, optical DSPs', 90.0, false, 5.5, 6500, 1995, 'ISO9001', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO supplier_relationships (parent_id, child_id, relationship_type, criticality) VALUES
-- TSMC depends on equipment makers
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='ASML'), 'lithography_equipment', 'critical'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='Applied Materials'), 'process_equipment', 'critical'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='Lam Research'), 'etch_deposition', 'critical'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='KLA Corporation'), 'metrology_inspection', 'critical'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='Tokyo Electron (TEL)'), 'process_equipment', 'critical'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='ASM International'), 'ALD_epitaxy', 'high'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='Shin-Etsu Chemical'), 'silicon_wafers', 'critical'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='Sumco'), 'silicon_wafers', 'high'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='JSR Corporation'), 'photoresist', 'high'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='Tokyo Ohka Kogyo (TOK)'), 'photoresist', 'high'),
((SELECT id FROM suppliers WHERE name='TSMC'), (SELECT id FROM suppliers WHERE name='Entegris'), 'CMP_slurry_chemicals', 'medium'),
-- ASML depends on Zeiss + Trumpf
((SELECT id FROM suppliers WHERE name='ASML'), (SELECT id FROM suppliers WHERE name='Carl Zeiss SMT'), 'EUV_optics', 'critical'),
((SELECT id FROM suppliers WHERE name='ASML'), (SELECT id FROM suppliers WHERE name='Trumpf'), 'EUV_laser_source', 'critical'),
-- Zeiss depends on Heraeus
((SELECT id FROM suppliers WHERE name='Carl Zeiss SMT'), (SELECT id FROM suppliers WHERE name='Heraeus'), 'EUV_quartz_glass', 'critical'),
-- Samsung Foundry mirrors TSMC dependencies
((SELECT id FROM suppliers WHERE name='Samsung Foundry'), (SELECT id FROM suppliers WHERE name='ASML'), 'lithography_equipment', 'critical'),
((SELECT id FROM suppliers WHERE name='Samsung Foundry'), (SELECT id FROM suppliers WHERE name='Applied Materials'), 'process_equipment', 'critical'),
((SELECT id FROM suppliers WHERE name='Samsung Foundry'), (SELECT id FROM suppliers WHERE name='Lam Research'), 'etch_deposition', 'critical'),
((SELECT id FROM suppliers WHERE name='Samsung Foundry'), (SELECT id FROM suppliers WHERE name='Tokyo Electron (TEL)'), 'process_equipment', 'critical'),
((SELECT id FROM suppliers WHERE name='Samsung Foundry'), (SELECT id FROM suppliers WHERE name='Shin-Etsu Chemical'), 'silicon_wafers', 'critical'),
((SELECT id FROM suppliers WHERE name='Samsung Foundry'), (SELECT id FROM suppliers WHERE name='Siltronic'), 'silicon_wafers', 'high'),
-- Intel Foundry
((SELECT id FROM suppliers WHERE name='Intel Foundry'), (SELECT id FROM suppliers WHERE name='ASML'), 'lithography_equipment', 'critical'),
((SELECT id FROM suppliers WHERE name='Intel Foundry'), (SELECT id FROM suppliers WHERE name='Applied Materials'), 'process_equipment', 'critical'),
((SELECT id FROM suppliers WHERE name='Intel Foundry'), (SELECT id FROM suppliers WHERE name='Lam Research'), 'etch_deposition', 'critical'),
((SELECT id FROM suppliers WHERE name='Intel Foundry'), (SELECT id FROM suppliers WHERE name='KLA Corporation'), 'metrology_inspection', 'critical'),
-- NVIDIA depends on foundry + memory + packaging
((SELECT id FROM suppliers WHERE name='NVIDIA'), (SELECT id FROM suppliers WHERE name='TSMC'), 'foundry_wafers', 'critical'),
((SELECT id FROM suppliers WHERE name='NVIDIA'), (SELECT id FROM suppliers WHERE name='SK Hynix'), 'HBM_memory', 'critical'),
((SELECT id FROM suppliers WHERE name='NVIDIA'), (SELECT id FROM suppliers WHERE name='Micron Technology'), 'HBM_memory', 'high'),
((SELECT id FROM suppliers WHERE name='NVIDIA'), (SELECT id FROM suppliers WHERE name='Samsung Foundry'), 'HBM_memory', 'high'),
((SELECT id FROM suppliers WHERE name='NVIDIA'), (SELECT id FROM suppliers WHERE name='ASE Technology'), 'OSAT_packaging', 'medium'),
((SELECT id FROM suppliers WHERE name='NVIDIA'), (SELECT id FROM suppliers WHERE name='Amkor Technology'), 'OSAT_packaging', 'medium'),
((SELECT id FROM suppliers WHERE name='NVIDIA'), (SELECT id FROM suppliers WHERE name='Synopsys'), 'EDA_tools', 'high'),
((SELECT id FROM suppliers WHERE name='NVIDIA'), (SELECT id FROM suppliers WHERE name='Cadence Design Systems'), 'EDA_tools', 'high'),
-- AMD
((SELECT id FROM suppliers WHERE name='AMD'), (SELECT id FROM suppliers WHERE name='TSMC'), 'foundry_wafers', 'critical'),
((SELECT id FROM suppliers WHERE name='AMD'), (SELECT id FROM suppliers WHERE name='Samsung Foundry'), 'HBM_memory', 'high'),
((SELECT id FROM suppliers WHERE name='AMD'), (SELECT id FROM suppliers WHERE name='SK Hynix'), 'HBM_memory', 'critical'),
((SELECT id FROM suppliers WHERE name='AMD'), (SELECT id FROM suppliers WHERE name='Amkor Technology'), 'OSAT_packaging', 'high'),
-- Broadcom
((SELECT id FROM suppliers WHERE name='Broadcom'), (SELECT id FROM suppliers WHERE name='TSMC'), 'foundry_wafers', 'critical'),
((SELECT id FROM suppliers WHERE name='Broadcom'), (SELECT id FROM suppliers WHERE name='ASE Technology'), 'OSAT_packaging', 'high'),
-- Marvell
((SELECT id FROM suppliers WHERE name='Marvell Technology'), (SELECT id FROM suppliers WHERE name='TSMC'), 'foundry_wafers', 'critical'),
((SELECT id FROM suppliers WHERE name='Marvell Technology'), (SELECT id FROM suppliers WHERE name='Samsung Foundry'), 'foundry_wafers', 'medium')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Packaging capacity (CoWoS / SoIC / EMIB / Foveros) ramp 2026
-- TSMC CoWoS monthly wafer-equivalent units ramping from ~32k -> 75k across 2026
-- ============================================================================
INSERT INTO packaging_capacity (fab_id, technology, monthly_capacity_units, quarter, reserved_pct, available_pct, notes) VALUES
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-S', 32000, '2026Q1', 95.0, 5.0, 'TSMC AP6 ramp. NVIDIA ~60%, AMD ~15%, Broadcom ~10%, others 10% — 5% spot only'),
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-S', 45000, '2026Q2', 92.0, 8.0, 'AP7 module coming online, ramping CoWoS-S capacity'),
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-S', 60000, '2026Q3', 90.0, 10.0, 'Steady expansion; NVIDIA Blackwell B200/B300 demand still high'),
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-S', 75000, '2026Q4', 88.0, 12.0, 'Full year exit run-rate'),
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-L', 8000, '2026Q1', 100.0, 0.0, 'New CoWoS-L (RDL interposer) for Rubin / B200 — sold out'),
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-L', 15000, '2026Q2', 98.0, 2.0, 'CoWoS-L ramp continues'),
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-L', 22000, '2026Q3', 95.0, 5.0, 'CoWoS-L expansion'),
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-L', 30000, '2026Q4', 93.0, 7.0, 'CoWoS-L EOY'),
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-R', 5000, '2026Q1', 90.0, 10.0, 'CoWoS-R (organic) for cost-sensitive AI'),
((SELECT id FROM fabs WHERE name='Fab 18 (N3/N2)' LIMIT 1), 'CoWoS-R', 7000, '2026Q3', 85.0, 15.0, 'CoWoS-R steady'),
((SELECT id FROM fabs WHERE name='Fab 21 Phase 1 (N4)' LIMIT 1), 'CoWoS-S', 4000, '2026Q3', 80.0, 20.0, 'TSMC Arizona CoWoS line — pilot capacity'),
((SELECT id FROM fabs WHERE name='Fab 21 Phase 1 (N4)' LIMIT 1), 'CoWoS-S', 6000, '2026Q4', 75.0, 25.0, 'Arizona CoWoS ramp'),
((SELECT id FROM fabs WHERE name='Fab 52/62 (Intel 18A)' LIMIT 1), 'Foveros', 10000, '2026Q1', 70.0, 30.0, 'Intel Foveros (3D stacking) for Meteor/Lunar Lake successors'),
((SELECT id FROM fabs WHERE name='Fab 52/62 (Intel 18A)' LIMIT 1), 'Foveros', 14000, '2026Q3', 65.0, 35.0, 'Foveros ramp'),
((SELECT id FROM fabs WHERE name='Fab 52/62 (Intel 18A)' LIMIT 1), 'EMIB', 12000, '2026Q1', 75.0, 25.0, 'Intel EMIB (2.5D bridge) for Sapphire Rapids / Granite Rapids'),
((SELECT id FROM fabs WHERE name='Fab 52/62 (Intel 18A)' LIMIT 1), 'EMIB', 16000, '2026Q3', 72.0, 28.0, 'EMIB expansion')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Packaging bookings — NVIDIA holds ~60% of CoWoS, AMD/Broadcom/Marvell hold rest
-- ============================================================================
INSERT INTO packaging_bookings (capacity_id, customer, quantity_units, delivery_quarter, contract_status, contract_value_millions) VALUES
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q1' LIMIT 1), 'NVIDIA', 19200, '2026Q1', 'locked', 1920.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q1' LIMIT 1), 'AMD', 4800, '2026Q1', 'locked', 480.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q1' LIMIT 1), 'Broadcom', 3200, '2026Q1', 'locked', 320.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q1' LIMIT 1), 'Marvell Technology', 1600, '2026Q1', 'locked', 160.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q1' LIMIT 1), 'Apple', 1600, '2026Q1', 'provisional', 160.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q2' LIMIT 1), 'NVIDIA', 27000, '2026Q2', 'locked', 2700.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q2' LIMIT 1), 'AMD', 6750, '2026Q2', 'locked', 675.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q2' LIMIT 1), 'Broadcom', 4500, '2026Q2', 'locked', 450.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q2' LIMIT 1), 'Marvell Technology', 2250, '2026Q2', 'locked', 225.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q3' LIMIT 1), 'NVIDIA', 36000, '2026Q3', 'locked', 3600.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q3' LIMIT 1), 'AMD', 9000, '2026Q3', 'locked', 900.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q3' LIMIT 1), 'Broadcom', 6000, '2026Q3', 'locked', 600.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q3' LIMIT 1), 'Marvell Technology', 3000, '2026Q3', 'provisional', 300.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q4' LIMIT 1), 'NVIDIA', 45000, '2026Q4', 'locked', 4500.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q4' LIMIT 1), 'AMD', 11250, '2026Q4', 'locked', 1125.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q4' LIMIT 1), 'Broadcom', 7500, '2026Q4', 'locked', 750.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-S' AND quarter='2026Q4' LIMIT 1), 'Google (via Broadcom)', 2250, '2026Q4', 'provisional', 225.0),
-- CoWoS-L (entirely NVIDIA-dominated for Blackwell)
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-L' AND quarter='2026Q1' LIMIT 1), 'NVIDIA', 8000, '2026Q1', 'locked', 1200.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-L' AND quarter='2026Q2' LIMIT 1), 'NVIDIA', 13500, '2026Q2', 'locked', 2025.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-L' AND quarter='2026Q2' LIMIT 1), 'AMD', 1200, '2026Q2', 'provisional', 180.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-L' AND quarter='2026Q3' LIMIT 1), 'NVIDIA', 18000, '2026Q3', 'locked', 2700.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-L' AND quarter='2026Q3' LIMIT 1), 'AMD', 2900, '2026Q3', 'locked', 435.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-L' AND quarter='2026Q4' LIMIT 1), 'NVIDIA', 24000, '2026Q4', 'locked', 3600.0),
((SELECT id FROM packaging_capacity WHERE technology='CoWoS-L' AND quarter='2026Q4' LIMIT 1), 'AMD', 3600, '2026Q4', 'locked', 540.0),
-- Intel Foveros / EMIB own captive
((SELECT id FROM packaging_capacity WHERE technology='Foveros' AND quarter='2026Q1' LIMIT 1), 'Intel (captive)', 7000, '2026Q1', 'locked', 700.0),
((SELECT id FROM packaging_capacity WHERE technology='EMIB' AND quarter='2026Q1' LIMIT 1), 'Intel (captive)', 9000, '2026Q1', 'locked', 540.0)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HBM bookings — SK Hynix dominates HBM3e for NVIDIA, Samsung HBM3 to AMD, Micron HBM3e in qual at NVIDIA
-- Quantities in GB (e.g. H200 = 141 GB; B200 = 192 GB; MI300X = 192 GB)
-- ============================================================================
INSERT INTO hbm_bookings (customer, hbm_supplier, generation, quantity_GB, delivery_quarter, contract_value_millions, locked) VALUES
-- 2025 backfill: SK Hynix HBM3e mostly booked through Q4 2025 by NVIDIA
('NVIDIA', 'SK Hynix', 'HBM3e', 14100000, '2025Q4', 4200.0, true),
('NVIDIA', 'SK Hynix', 'HBM3e', 15800000, '2026Q1', 4700.0, true),
('NVIDIA', 'SK Hynix', 'HBM3e', 18500000, '2026Q2', 5500.0, true),
('NVIDIA', 'SK Hynix', 'HBM3e', 22100000, '2026Q3', 6600.0, true),
('NVIDIA', 'SK Hynix', 'HBM3e', 26400000, '2026Q4', 7900.0, true),
('NVIDIA', 'SK Hynix', 'HBM4', 8000000, '2026Q4', 4000.0, false),
('NVIDIA', 'SK Hynix', 'HBM4', 14400000, '2027Q1', 7200.0, false),
('NVIDIA', 'SK Hynix', 'HBM4', 19200000, '2027Q2', 9600.0, false),
-- Samsung HBM3 to AMD (Samsung HBM3e qualification ongoing at NVIDIA)
('AMD', 'Samsung', 'HBM3', 5800000, '2025Q4', 1450.0, true),
('AMD', 'Samsung', 'HBM3', 6900000, '2026Q1', 1725.0, true),
('AMD', 'Samsung', 'HBM3', 7400000, '2026Q2', 1850.0, true),
('AMD', 'Samsung', 'HBM3e', 9200000, '2026Q3', 2760.0, true),
('AMD', 'Samsung', 'HBM3e', 11500000, '2026Q4', 3450.0, true),
('AMD', 'Samsung', 'HBM3e', 14000000, '2027Q1', 4200.0, false),
('AMD', 'SK Hynix', 'HBM3e', 6700000, '2026Q2', 2010.0, true),
('AMD', 'SK Hynix', 'HBM3e', 8800000, '2026Q3', 2640.0, true),
-- Micron HBM3e in qual at NVIDIA — small initial allocations, then ramping
('NVIDIA', 'Micron', 'HBM3e', 1200000, '2025Q4', 360.0, true),
('NVIDIA', 'Micron', 'HBM3e', 2400000, '2026Q1', 720.0, true),
('NVIDIA', 'Micron', 'HBM3e', 3800000, '2026Q2', 1140.0, true),
('NVIDIA', 'Micron', 'HBM3e', 5600000, '2026Q3', 1680.0, true),
('NVIDIA', 'Micron', 'HBM3e', 7400000, '2026Q4', 2220.0, true),
('NVIDIA', 'Micron', 'HBM4', 4800000, '2027Q1', 2880.0, false),
-- Google TPU
('Google', 'Samsung', 'HBM3e', 3600000, '2026Q1', 1080.0, true),
('Google', 'Samsung', 'HBM3e', 4500000, '2026Q2', 1350.0, true),
('Google', 'SK Hynix', 'HBM3e', 2200000, '2026Q3', 660.0, true),
('Google', 'SK Hynix', 'HBM3e', 3000000, '2026Q4', 900.0, true),
('Google', 'Samsung', 'HBM4', 5400000, '2027Q1', 2700.0, false),
-- Amazon Trainium (via Marvell)
('Amazon (Trainium2)', 'SK Hynix', 'HBM3e', 1800000, '2026Q2', 540.0, true),
('Amazon (Trainium2)', 'SK Hynix', 'HBM3e', 2700000, '2026Q3', 810.0, true),
('Amazon (Trainium2)', 'Micron', 'HBM3e', 1500000, '2026Q4', 450.0, false),
-- Intel Gaudi
('Intel (Gaudi 3)', 'SK Hynix', 'HBM3e', 2400000, '2026Q1', 720.0, true),
('Intel (Gaudi 3)', 'Samsung', 'HBM3e', 1800000, '2026Q2', 540.0, true),
('Intel (Gaudi 3)', 'Micron', 'HBM3e', 1200000, '2026Q3', 360.0, false),
-- Microsoft Maia
('Microsoft (Maia 100)', 'SK Hynix', 'HBM3', 1600000, '2025Q4', 400.0, true),
('Microsoft (Maia 200)', 'SK Hynix', 'HBM3e', 3200000, '2026Q3', 960.0, false),
('Microsoft (Maia 200)', 'Samsung', 'HBM3e', 2400000, '2026Q4', 720.0, false),
-- Meta MTIA
('Meta (MTIA v2)', 'Samsung', 'HBM3', 1200000, '2026Q1', 300.0, true),
('Meta (MTIA v3)', 'SK Hynix', 'HBM3e', 2600000, '2026Q4', 780.0, false),
-- Apple (limited HBM exposure - mostly LPDDR5x but some)
('Apple (server inference)', 'Samsung', 'HBM3e', 800000, '2026Q3', 240.0, false)
ON CONFLICT DO NOTHING;
