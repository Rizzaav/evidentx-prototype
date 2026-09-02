-- ==============================================================================
-- EVIDENTX SEED DATA FOR SUPABASE
-- Populates demo students, skills, verified evidence, opportunities, and teams
-- ==============================================================================

-- 1. Insert Skills
INSERT INTO public.skills (id, name, category) VALUES
('s_react', 'React', 'Frontend'),
('s_js', 'JavaScript', 'Frontend'),
('s_ts', 'TypeScript', 'Frontend'),
('s_node', 'Node.js', 'Backend'),
('s_express', 'Express', 'Backend'),
('s_python', 'Python', 'Languages'),
('s_sql', 'SQL', 'Database'),
('s_mongo', 'MongoDB', 'Database'),
('s_ml', 'Machine Learning', 'Data & AI'),
('s_dl', 'Deep Learning', 'Data & AI'),
('s_pandas', 'Pandas / NumPy', 'Data & AI'),
('s_uiux', 'UI/UX Design', 'Design'),
('s_figma', 'Figma', 'Design'),
('s_research', 'User Research', 'Design'),
('s_docker', 'Docker', 'DevOps'),
('s_aws', 'AWS / Cloud', 'Cloud'),
('s_gcp', 'GCP', 'Cloud'),
('s_git', 'Git', 'DevOps'),
('s_cpp', 'C++', 'Languages'),
('s_java', 'Java', 'Languages'),
('s_ds', 'Data Structures', 'Languages'),
('s_algo', 'Algorithms', 'Languages'),
('s_problem', 'Problem Solving', 'Soft Skills'),
('s_comm', 'Communication', 'Soft Skills'),
('s_team', 'Teamwork', 'Soft Skills'),
('s_flutter', 'Flutter', 'Mobile'),
('s_android', 'Android', 'Mobile')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Students
INSERT INTO public.students (id, name, email, program, year, university, bio, avatar_color, interests) VALUES
('st_aarav', 'Rishav Singh', 'rishav.s@university.edu', 'B.Tech Computer Science', '3rd Year', 'ITER SOA', 'Full-stack developer focused on building web products. Loves hackathons and shipping fast.', 'from-brand-500 to-brand-700', ARRAY['Web Development', 'Open Source', 'Hackathons']),
('st_diya', 'Diya Patel', 'diya.p@university.edu', 'B.Tech Information Technology', '4th Year', 'NIT Surat', 'ML & data science enthusiast. Built models for healthcare and sustainability projects.', 'from-accent-500 to-accent-700', ARRAY['Machine Learning', 'Research', 'Data Science']),
('st_rohan', 'Rohan Verma', 'rohan.v@university.edu', 'B.Tech Computer Science', '3rd Year', 'BITS Pilani', 'Backend systems and cloud infrastructure. Open source contributor and competitive programmer.', 'from-amber-500 to-amber-700', ARRAY['Backend Systems', 'Cloud', 'Distributed Systems']),
('st_ananya', 'Ananya Iyer', 'ananya.i@university.edu', 'B.Des Interaction Design', '4th Year', 'NID Ahmedabad', 'Product designer creating accessible, data-informed interfaces. Passionate about health-tech UX.', 'from-rose-500 to-rose-700', ARRAY['Product Design', 'User Research', 'Design Systems']),
('st_kavya', 'Kavya Nair', 'kavya.n@university.edu', 'B.Tech Electronics & Comm', '2nd Year', 'VIT Vellore', 'Mobile and IoT developer. Exploring Flutter and embedded systems for smart campus solutions.', 'from-emerald-500 to-emerald-700', ARRAY['Mobile Dev', 'IoT', 'Embedded Systems'])
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Evidence
INSERT INTO public.evidence (id, student_id, type, title, description, issuer, date, verification, strength, score, url, skills) VALUES
('ev_1', 'st_aarav', 'project', 'DevPulse: Real-Time Developer Analytics', 'Full-stack SaaS dashboard with React, Node.js, PostgreSQL and Redis. 1.2k GitHub stars.', 'GitHub / Self-Published', '2025-05-15', 'verified', 92, 'Production App', 'https://github.com/rishav/devpulse', ARRAY['s_react', 's_js', 's_ts', 's_node', 's_sql', 's_git']),
('ev_2', 'st_aarav', 'competition', 'Smart India Hackathon 2024 — 1st Place', 'Built AI-powered triage system for district hospitals. Led frontend architecture.', 'Ministry of Education', '2024-12-20', 'verified', 95, '1st Place / Gold', 'https://sih.gov.in/winner-2024', ARRAY['s_react', 's_problem', 's_team', 's_git']),
('ev_3', 'st_aarav', 'coursework', 'CS301: Advanced Database Systems', 'Semester-long lab covering query optimization, transactions, and indexing.', 'ITER SOA', '2024-11-30', 'verified', 88, 'Grade: O (94%)', NULL, ARRAY['s_sql', 's_problem']),
('ev_4', 'st_aarav', 'credential', 'AWS Certified Cloud Practitioner', 'Validation of cloud fundamentals, security, architecture, and deployment.', 'Amazon Web Services', '2025-02-10', 'verified', 85, 'Score: 840/1000', 'https://aws.amazon.com/verification', ARRAY['s_aws']),
('ev_5', 'st_aarav', 'project', 'AlgoViz: Interactive Algorithm Visualizer', 'React + Canvas visualizer for graph, tree and sorting algorithms.', 'Personal Project', '2024-08-10', 'self-reported', 70, 'Open Source', 'https://github.com/rishav/algoviz', ARRAY['s_react', 's_ds', 's_algo']),
('ev_6', 'st_diya', 'project', 'MediScan AI: Chest X-Ray Pathology Classifier', 'PyTorch CNN classifier with 94.2% AUC on CheXpert dataset. Published paper preprint.', 'arXiv / Research Project', '2025-04-20', 'verified', 94, 'Published Preprint', 'https://arxiv.org/abs/2504.mediscan', ARRAY['s_ml', 's_dl', 's_python', 's_pandas', 's_research']),
('ev_7', 'st_diya', 'competition', 'Kaggle Global Health Challenge — Top 2%', 'Silver medal in pulmonary nodule segmentation challenge (out of 1,840 teams).', 'Kaggle', '2025-01-15', 'verified', 91, 'Top 2% (Silver)', 'https://kaggle.com/c/pulmo-2025', ARRAY['s_ml', 's_dl', 's_python', 's_problem']),
('ev_8', 'st_diya', 'coursework', 'IT402: Deep Learning & Neural Networks', 'Designed RNNs, Transformers and GANs with PyTorch.', 'NIT Surat', '2024-12-10', 'verified', 90, 'Grade: AA (96%)', NULL, ARRAY['s_dl', 's_python', 's_ml']),
('ev_9', 'st_rohan', 'project', 'Distributed Task Queue (Go & Node.js)', 'High-throughput task queue with Raft consensus and PostgreSQL persistence. Handles 50k ops/sec.', 'GitHub / Open Source', '2025-06-01', 'verified', 93, 'Production Grade', 'https://github.com/rohan/dist-queue', ARRAY['s_node', 's_sql', 's_docker', 's_git']),
('ev_10', 'st_rohan', 'credential', 'Docker Certified Associate', 'Containerization, orchestration with Compose/Swarm, image security.', 'Docker / Mirantis', '2025-03-05', 'verified', 89, 'Score: 91%', 'https://docker.com/verify', ARRAY['s_docker']),
('ev_11', 'st_ananya', 'project', 'CarePath: Chronic Disease Companion App UX', 'End-to-end design from 18 patient interviews to Figma design system and tested prototype.', 'NID Graduation Project', '2025-05-30', 'verified', 96, 'Excellence Award', 'https://figma.com/@ananya/carepath', ARRAY['s_uiux', 's_figma', 's_research', 's_comm']),
('ev_12', 'st_kavya', 'project', 'SmartCamp: Campus Shuttle Tracker App', 'Flutter mobile app with live GPS tracking for 8k students.', 'VIT Hackathon', '2025-03-22', 'verified', 88, 'Best Campus App', 'https://github.com/kavya/smartcamp', ARRAY['s_flutter', 's_android', 's_git'])
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Opportunities
INSERT INTO public.opportunities (id, title, organization, location, type, duration, stipend, description, posted_by, posted_date, required_skills, preferred_skills) VALUES
('op_fe_intern', 'Frontend Developer Intern', 'TechFlow Labs', 'Bengaluru (Hybrid)', 'Internship', '6 months', '₹35,000/mo', 'Build customer-facing React applications for our SaaS analytics platform. Work with design systems and ship features used by 50k+ users.', 'TechFlow Labs', '2025-07-01', ARRAY['s_react', 's_js', 's_node', 's_sql'], ARRAY['s_ts', 's_uiux', 's_git', 's_aws']),
('op_ml_research', 'ML Research Intern — Healthcare', 'MediCore AI', 'Remote', 'Research', '4 months', '₹40,000/mo', 'Research and productionize ML models for medical imaging. Strong Python + deep learning required; healthcare domain exposure a plus.', 'MediCore AI', '2025-07-10', ARRAY['s_ml', 's_python', 's_dl', 's_pandas'], ARRAY['s_sql', 's_gcp', 's_research', 's_problem']),
('op_backend_swe', 'Backend Engineering Intern', 'PayBridge', 'Hyderabad (On-site)', 'Internship', '6 months', '₹45,000/mo', 'Architect resilient microservices for high-volume payment processing. Node.js, SQL, Docker, and distributed systems experience valued.', 'PayBridge', '2025-06-20', ARRAY['s_node', 's_sql', 's_docker', 's_git'], ARRAY['s_aws', 's_express', 's_problem', 's_ts']),
('op_ux_designer', 'Product Design Intern', 'NeoBank Design', 'Mumbai (Hybrid)', 'Internship', '3 months', '₹30,000/mo', 'Create user flows, wireframes, and high-fidelity interactive prototypes in Figma for consumer fintech products. Run user tests.', 'NeoBank Design', '2025-07-05', ARRAY['s_uiux', 's_figma', 's_research'], ARRAY['s_comm', 's_react', 's_problem']),
('op_mobile_dev', 'Mobile App Intern (Flutter)', 'QuickFleet Mobility', 'Remote', 'Internship', '4 months', '₹28,000/mo', 'Build and maintain our driver and customer mobile apps in Flutter. Integrate Google Maps APIs, state management, and offline cache.', 'QuickFleet Mobility', '2025-07-12', ARRAY['s_flutter', 's_git', 's_js'], ARRAY['s_android', 's_ts', 's_uiux'])
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Applications
INSERT INTO public.applications (id, student_id, opportunity_id, applied_date, status, match_score_at_apply, notes) VALUES
('app_1', 'st_aarav', 'op_fe_intern', '2025-07-05', 'Shortlisted', 88, 'Strong React and SQL verified project evidence.'),
('app_2', 'st_diya', 'op_ml_research', '2025-07-11', 'Interviewing', 94, 'Exceptional deep learning and medical imaging portfolio.'),
('app_3', 'st_rohan', 'op_backend_swe', '2025-06-22', 'Reviewing', 82, 'Solid Node.js and AWS background.'),
('app_4', 'st_ananya', 'op_ux_designer', '2025-07-08', 'Offered', 91, 'Stellar Figma case studies with user research.')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Teams & Roles
INSERT INTO public.teams (id, title, organization, description, required_skills, created_date) VALUES
('team_ai_health', 'AI Diagnostic Assistant Squad', 'HealthTech Innovation Labs', 'Building an offline-first diagnostic assistant for primary healthcare clinics. Needs ML expertise, robust backend and intuitive mobile UI.', ARRAY['s_ml', 's_dl', 's_python', 's_node', 's_sql', 's_flutter', 's_uiux'], '2025-07-01'),
('team_fintech_squad', 'Micro-Lending Platform Core Team', 'BharatFin Labs', 'Developing a high-throughput micro-lending API and customer web application. Strict latency and security requirements.', ARRAY['s_react', 's_ts', 's_node', 's_sql', 's_docker', 's_aws', 's_uiux'], '2025-07-08')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.team_roles (id, team_id, name, description, required_skills) VALUES
('role_ml_lead', 'team_ai_health', 'ML & Computer Vision Lead', 'Train & optimize medical image models for mobile deployment.', ARRAY['s_ml', 's_dl', 's_python']),
('role_backend', 'team_ai_health', 'Backend Systems Engineer', 'Build HIPAA-compliant sync API and local SQLite cache.', ARRAY['s_node', 's_sql', 's_docker']),
('role_mobile', 'team_ai_health', 'Mobile Flutter Developer', 'Develop cross-platform tablet interface for clinicians.', ARRAY['s_flutter', 's_uiux']),
('role_fe_lead', 'team_fintech_squad', 'Frontend Tech Lead', 'Lead React/TypeScript customer onboarding and dashboard web app.', ARRAY['s_react', 's_ts', 's_uiux']),
('role_be_fin', 'team_fintech_squad', 'Backend Microservices Engineer', 'Build payment gateway integrations and ledger accounting services.', ARRAY['s_node', 's_sql', 's_docker', 's_aws'])
ON CONFLICT (id) DO NOTHING;
