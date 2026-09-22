# EvidentX

> **Evidence-first skill verification and explainable matching platform**

EvidentX is a skill intelligence platform that helps students turn their **projects, coursework, credentials, competitions, and other proof of work** into a structured **Skill Passport**.

The platform uses verified evidence and demonstrated proficiency to provide **transparent, explainable matching** for internships, opportunities, and multidisciplinary teams.

Built as a **Smart India Hackathon 2026 prototype**.

---

## 🚀 Live Demo

**Web App:** https://evidentx.vercel.app/

---

## 🎯 Problem

Traditional student hiring and opportunity discovery often rely heavily on resumes, self-reported skills, and broad academic signals.

This creates several challenges:

* Skills listed on resumes may not have sufficient proof.
* Students often struggle to understand why they match or do not match a role.
* Recruiters have to manually inspect large numbers of candidates.
* Students may know what they are missing, but not what to learn next.
* Team formation can overlook complementary skills and capability gaps.

EvidentX addresses these challenges through an **evidence-first, explainable matching workflow**.

---

## 💡 Solution

EvidentX creates a structured pipeline:

**Evidence → Skill Passport → Skill Proficiency → Explainable Matching → Skill Gap Analysis → Action**

Instead of treating a skill as just a self-declared label, EvidentX connects skills to supporting evidence and calculates matching results using transparent rules.

---

## ✨ Key Features

### 1. 📘 Skill Passport

Create a portable profile containing demonstrated technical and professional skills.

Skills can be supported by:

* Coursework
* Projects
* Competitions
* Credentials
* Experience
* Code and other proof artifacts

Each evidence item can contain verification status, evidence strength, associated skills, issuer, date, and supporting links.

---

### 2. 🔐 Evidence-Based Verification

Evidence is associated with a verification state:

* **Verified**
* **Pending**
* **Self-reported**

Verified evidence receives higher weight in the matching process, helping distinguish demonstrated capability from unverified claims.

---

### 3. 🎯 Explainable Skill Matching

EvidentX calculates deterministic match scores between students and opportunities.

Every match can be broken down into:

* Matched skills
* Partially matched skills
* Missing skills
* Supporting evidence
* Evidence strength
* Strengths
* Skill gaps
* Human-readable explanation

Required skills carry greater weight than preferred skills, while evidence strength contributes to the final score.

---

### 4. 📊 Skill Gap Analysis

Students can compare their current Skill Passport against a target opportunity.

The platform identifies:

* Strong skills
* Partial skills
* Missing skills
* Recommended development areas
* Priority levels

This turns a rejection or skill mismatch into an actionable learning roadmap.

---

### 5. 🔮 Interactive “What-If” Skill Simulator

Students can simulate acquiring missing or partial skills and immediately see the projected impact on their match score.

Example:

```text
Current Match      →      64%
Projected Match   →      82%
                         +18%
```

This helps students understand which skills could improve their alignment with a target opportunity.

---

### 6. 💼 Internship & Opportunity Discovery

Students can discover opportunities ranked according to their demonstrated skills.

Features include:

* Search
* Opportunity type filters
* Match-based sorting
* Recent opportunities
* Required skill visibility
* Match percentage
* Application status tracking

---

### 7. 🏢 Organization Portal

Organizations can create opportunities by defining:

* Required skills
* Preferred skills
* Opportunity details
* Role requirements

They can then inspect ranked candidates and view detailed matching explanations based on demonstrated evidence.

---

### 8. 👥 Candidate Discovery & Hiring Workflow

The organization portal supports candidate discovery through:

* Candidate ranking
* Skill and proficiency filters
* Search
* Application tracking
* Candidate comparison
* Pipeline stages
* Candidate detail views
* Bookmarks and talent discovery

The workflow is designed to make candidate evaluation more evidence-driven and inspectable.

---

### 9. 🧩 Team Builder

EvidentX can also be used to build multidisciplinary teams.

Teams can be evaluated based on:

* Role requirements
* Required skills
* Candidate-role fit
* Complementary capabilities
* Skill coverage
* Missing team capabilities

This helps identify both suitable contributors and remaining capability gaps.

---

### 10. 🌐 Public Skill Passport

Students can expose a shareable public Skill Passport through a dedicated route.

Example:

```text
/passport/:studentId
```

This allows a student's demonstrated skills and evidence to be presented in a structured format without requiring access to the complete application.

---

### 11. 🧭 Multi-Role Experience

EvidentX supports multiple platform perspectives:

**Student**

* Build Skill Passport
* Manage evidence
* Discover opportunities
* Analyse skill gaps
* Track applications
* Find teams
* Prepare for interviews

**Organization**

* Create opportunities
* Discover candidates
* Rank candidates
* Inspect evidence
* Manage hiring pipeline

**Team Creator**

* Define team requirements
* Discover suitable candidates
* Analyse role fit
* Evaluate skill coverage

---

## ⚖️ Fairness by Design

The matching engine is designed to use job-relevant evidence rather than demographic or unrelated personal attributes.

The matching logic explicitly focuses on:

* Demonstrated skills
* Proficiency
* Evidence strength
* Verification status
* Role requirements

The implementation excludes attributes such as gender, religion, caste, race, disability, family income, appearance, and similar protected or irrelevant characteristics from matching logic.

The platform also provides an explicit **Fairness Policy** view so users can inspect the principles behind its recommendations.

---

## 🧠 Matching Engine

The core matching system is deterministic and explainable.

### Verification weighting

```text
Verified        → 1.0
Pending         → 0.8
Self-reported   → 0.6
```

### Skill classification

```text
70+      → Matched
40–69    → Partial
<40      → Missing
```

### Matching principles

* Required skills are weighted more heavily than preferred skills.
* Partial skills receive partial credit.
* Evidence strength can contribute a bonus.
* Missing required skills reduce the score.
* Every result produces a human-readable explanation.

The implementation also uses an **inverted skill index and memoization/cache layer** to improve candidate lookup and repeated matching operations.

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      EvidentX UI     │
                    │   React + Tailwind   │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   Student Portal      Organization Portal     Team Builder
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │   Matching Engine     │
                    │ Deterministic +       │
                    │ Explainable Scoring   │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Skill Passport     Evidence        Opportunity Data
              │
              ▼
       Skill Gap Analysis
              │
              ▼
       Learning / Growth Path
```

---

## 🛠️ Tech Stack

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* Lucide React

### Backend / Data Services

* Supabase
* Supabase Authentication
* Supabase Database

### Application Architecture

* Component-based React architecture
* Route-based page organization
* Lazy-loaded pages and code splitting
* Type-safe domain models
* Deterministic matching engine
* Local state persistence for prototype workflows

---

## 📁 Project Structure

```text
evidentx-prototype/
│
├── public/
│
├── src/
│   ├── components/
│   ├── data/
│   ├── lib/
│   ├── pages/
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts
│   └── index.css
│
├── supabase/
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── vercel.json
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have:

* Node.js installed
* npm installed
* Git installed

### 1. Clone the repository

```bash
git clone https://github.com/Rizzaav/evidentx-prototype.git
cd evidentx-prototype
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file using `.env.example`.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase configuration is optional for prototype/demo usage, depending on the environment.

### 4. Start the development server

```bash
npm run dev
```

The application will be available on the local Vite development server.

---

## 🔨 Available Scripts

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint checks.

```bash
npm run typecheck
```

Runs TypeScript type checking.

---

## 🧪 Prototype Scope

EvidentX is currently a **working prototype** demonstrating the core product experience and matching workflow.

The repository includes prototype data and application flows for:

* Students
* Skills
* Evidence
* Opportunities
* Teams
* Applications
* Matching
* Skill gaps
* Candidate discovery

Some workflows may use prototype/local data rather than a fully production-scale backend implementation.

---

## 🔒 Security & Data Note

Do not commit real credentials, private API keys, or sensitive personal information to the repository.

Use environment variables for environment-specific configuration.

For production deployment, authentication, authorization, database policies, data validation, audit logging, and privacy controls should be reviewed and hardened appropriately.

---

## 🌱 Future Scope

Potential future improvements include:

* Automated evidence verification integrations
* Deeper GitHub and coding-platform verification
* Institutional credential verification
* Advanced semantic skill extraction
* More robust recommendation models
* Real-time recruiter collaboration
* Production-grade analytics
* Stronger auditability and verification workflows
* Integration with learning platforms
* Scalable multi-tenant infrastructure

---

## 🏆 Hackathon Context

**Smart India Hackathon 2026**

EvidentX was developed as a prototype focused on making skill discovery, opportunity matching, and team formation more **evidence-driven, transparent, and explainable**.

---

## 👨‍💻 Team

**Team EvidentX**

Built by a student team from **ITER SOA**.

---

## 📄 License

This repository is currently maintained as a prototype/demo project.

A formal open-source license can be added when the project's distribution and reuse terms are finalized.
