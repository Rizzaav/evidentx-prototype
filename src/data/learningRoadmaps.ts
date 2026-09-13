export interface RecommendedCourse {
  title: string;
  provider:
    | 'NPTEL / SWAYAM (IITs)'
    | 'AICTE FutureSkills Prime'
    | 'Meta (Coursera)'
    | 'Google (Coursera)'
    | 'IBM (Coursera / edX)'
    | 'DeepLearning.AI'
    | 'freeCodeCamp'
    | 'AWS Academy'
    | 'Harvard CS50';
  url: string;
  duration: string;
  badge: 'Govt Accredited' | 'Industry Standard' | '100% Free' | 'IIT Certified';
}

export interface SkillLearningPathway {
  skillId: string;
  skillName: string;
  matchScoreBoostEstimate: number; // estimated % match score increase once acquired
  diagnosticSummary: string;
  courses: RecommendedCourse[];
  capstoneProject: {
    title: string;
    description: string;
    deliverable: string;
  };
}

export const SKILL_LEARNING_PATHWAYS: Record<string, SkillLearningPathway> = {
  s_sql: {
    skillId: 's_sql',
    skillName: 'SQL & Relational Databases',
    matchScoreBoostEstimate: 16,
    diagnosticSummary:
      'Database querying, normalization, and relational schema modeling are foundational for modern backend and data engineering roles.',
    courses: [
      {
        title: 'Database Management System (DBMS)',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_cs23/preview',
        duration: '8 Weeks',
        badge: 'IIT Certified',
      },
      {
        title: 'Database Structures and Management with MySQL',
        provider: 'Meta (Coursera)',
        url: 'https://www.coursera.org/learn/database-structures-and-management-with-mysql',
        duration: '4 Weeks',
        badge: 'Industry Standard',
      },
      {
        title: 'Relational Database (PostgreSQL & Bash) Certification',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/learn/relational-database/',
        duration: 'Self-Paced (300 hrs)',
        badge: '100% Free',
      },
    ],
    capstoneProject: {
      title: 'PostgreSQL E-Commerce Schema & Query Engine',
      description:
        'Design a 3NF relational database schema with complex JOINs, indexes, aggregate analytics, and transaction ACID guarantees.',
      deliverable: 'GitHub repo with migration scripts, ER diagram, and query performance benchmarks.',
    },
  },

  s_node: {
    skillId: 's_node',
    skillName: 'Node.js & Backend Architecture',
    matchScoreBoostEstimate: 18,
    diagnosticSummary:
      'Asynchronous event-driven server runtime for REST APIs, microservices, and high-concurrency cloud applications.',
    courses: [
      {
        title: 'Back End Development and APIs (Node.js & Express)',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/',
        duration: 'Self-Paced',
        badge: '100% Free',
      },
      {
        title: 'Developing Cloud Applications with Node.js and React',
        provider: 'IBM (Coursera / edX)',
        url: 'https://www.coursera.org/learn/developing-backend-apps-with-nodejs-and-express',
        duration: '5 Weeks',
        badge: 'Industry Standard',
      },
      {
        title: 'Cloud Computing & Distributed Systems',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_cs17/preview',
        duration: '8 Weeks',
        badge: 'Govt Accredited',
      },
    ],
    capstoneProject: {
      title: 'RESTful API with JWT Auth & Rate Limiting',
      description:
        'Build a production-ready Express/Node service featuring JWT authentication, input validation, rate limiting, and Winston logging.',
      deliverable: 'Deployable GitHub repository with automated integration tests (Jest/Supertest).',
    },
  },

  s_docker: {
    skillId: 's_docker',
    skillName: 'Docker & Containerization',
    matchScoreBoostEstimate: 15,
    diagnosticSummary:
      'Packaging code and dependencies into portable, reproducible container images for modern CI/CD and cloud deployments.',
    courses: [
      {
        title: 'Cloud Computing & Virtualization Essentials',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_cs11/preview',
        duration: '8 Weeks',
        badge: 'IIT Certified',
      },
      {
        title: 'Docker & Kubernetes Full Course for Beginners',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news/docker-and-kubernetes-tutorial/',
        duration: 'Self-Paced (6 hrs)',
        badge: '100% Free',
      },
      {
        title: 'Introduction to Containers, Docker & Kubernetes',
        provider: 'IBM (Coursera / edX)',
        url: 'https://www.coursera.org/learn/ibm-containers-docker-kubernetes-openshift',
        duration: '3 Weeks',
        badge: 'Industry Standard',
      },
    ],
    capstoneProject: {
      title: 'Multi-Container Microservices Composition',
      description:
        'Author multi-stage Dockerfiles for a frontend and backend service orchestrating with docker-compose.yml and volume mounts.',
      deliverable: 'GitHub repo containing Dockerfile, docker-compose.yml, and healthcheck verification.',
    },
  },

  s_aws: {
    skillId: 's_aws',
    skillName: 'AWS & Cloud Architecture',
    matchScoreBoostEstimate: 17,
    diagnosticSummary:
      'Designing scalable, resilient, and cost-effective cloud services across compute, storage, and networking primitives.',
    courses: [
      {
        title: 'AWS Academy Cloud Foundations',
        provider: 'AWS Academy',
        url: 'https://aws.amazon.com/training/awsacademy/',
        duration: '4 Weeks',
        badge: 'Industry Standard',
      },
      {
        title: 'Cloud Computing Essentials',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_cs17/preview',
        duration: '12 Weeks',
        badge: 'Govt Accredited',
      },
      {
        title: 'FutureSkills Prime Cloud Infrastructure Engineer',
        provider: 'AICTE FutureSkills Prime',
        url: 'https://futureskillsprime.in/',
        duration: '60 Hours',
        badge: 'Govt Accredited',
      },
    ],
    capstoneProject: {
      title: 'Serverless REST API with S3 & CloudWatch',
      description:
        'Deploy serverless API handlers on AWS Lambda backed by S3 bucket storage, API Gateway, and CloudWatch metrics.',
      deliverable: 'Infrastructure as code (Terraform or AWS SAM) repository with architecture diagram.',
    },
  },

  s_ml: {
    skillId: 's_ml',
    skillName: 'Machine Learning',
    matchScoreBoostEstimate: 19,
    diagnosticSummary:
      'Mathematical foundations, statistical models, and feature engineering for predictive intelligence and classification systems.',
    courses: [
      {
        title: 'Machine Learning Specialization',
        provider: 'DeepLearning.AI',
        url: 'https://www.coursera.org/specializations/machine-learning-introduction',
        duration: '3 Months',
        badge: 'Industry Standard',
      },
      {
        title: 'Introduction to Machine Learning',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_cs54/preview',
        duration: '12 Weeks',
        badge: 'IIT Certified',
      },
      {
        title: 'AI & Machine Learning Foundation Track',
        provider: 'AICTE FutureSkills Prime',
        url: 'https://futureskillsprime.in/',
        duration: '80 Hours',
        badge: 'Govt Accredited',
      },
    ],
    capstoneProject: {
      title: 'End-to-End Scikit-Learn Model & Evaluation',
      description:
        'Preprocess messy real-world tabular data, perform cross-validation, hyperparameter tuning, and evaluate with Precision/Recall/ROC curves.',
      deliverable: 'Jupyter notebook or Python package with model persistence (.pkl / ONNX) and inference script.',
    },
  },

  s_dl: {
    skillId: 's_dl',
    skillName: 'Deep Learning & Neural Networks',
    matchScoreBoostEstimate: 20,
    diagnosticSummary:
      'Convolutional, recurrent, and transformer neural networks for computer vision, NLP, and representation learning.',
    courses: [
      {
        title: 'Deep Learning Specialization',
        provider: 'DeepLearning.AI',
        url: 'https://www.coursera.org/specializations/deep-learning',
        duration: '3 Months',
        badge: 'Industry Standard',
      },
      {
        title: 'Deep Learning (IIT Ropar / IIT Madras)',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_cs52/preview',
        duration: '12 Weeks',
        badge: 'IIT Certified',
      },
      {
        title: 'PyTorch for Deep Learning Bootcamp',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news/pytorch-deep-learning-course/',
        duration: 'Self-Paced (26 hrs)',
        badge: '100% Free',
      },
    ],
    capstoneProject: {
      title: 'PyTorch Vision Classifier or Language Model',
      description:
        'Train or fine-tune a deep neural network on PyTorch with data augmentation, transfer learning, and tensorboard monitoring.',
      deliverable: 'Reproducible training pipeline with model weights (.pt) and Kaggle / Weights&Biases run log.',
    },
  },

  s_react: {
    skillId: 's_react',
    skillName: 'React & Component Architecture',
    matchScoreBoostEstimate: 16,
    diagnosticSummary:
      'Declarative UI engineering, state management, hooks, and responsive front-end component systems.',
    courses: [
      {
        title: 'Meta Front-End Developer Professional Certificate',
        provider: 'Meta (Coursera)',
        url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer',
        duration: '7 Months',
        badge: 'Industry Standard',
      },
      {
        title: 'Front End Development Libraries (React & Redux)',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/',
        duration: 'Self-Paced (300 hrs)',
        badge: '100% Free',
      },
      {
        title: 'Modern Web Development & Frameworks',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/',
        duration: '8 Weeks',
        badge: 'Govt Accredited',
      },
    ],
    capstoneProject: {
      title: 'Interactive Dashboard with Async State & Context',
      description:
        'Build a multi-page React application with client-side routing, custom hooks, debounced live search, and accessible UI controls.',
      deliverable: 'Live web deployment (Vercel/Netlify) and clean GitHub repository with component tests.',
    },
  },

  s_ts: {
    skillId: 's_ts',
    skillName: 'TypeScript & Type Safety',
    matchScoreBoostEstimate: 14,
    diagnosticSummary:
      'Static typing, generics, interfaces, and compile-time correctness for large-scale JavaScript applications.',
    courses: [
      {
        title: 'TypeScript for Beginners Guide',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news/learn-typescript-beginners-guide/',
        duration: 'Self-Paced',
        badge: '100% Free',
      },
      {
        title: 'Modern JavaScript & TypeScript Full Stack',
        provider: 'Meta (Coursera)',
        url: 'https://www.coursera.org/learn/programming-with-javascript',
        duration: '5 Weeks',
        badge: 'Industry Standard',
      },
      {
        title: 'Harvard CS50 Web Programming with Python & JS',
        provider: 'Harvard CS50',
        url: 'https://cs50.harvard.edu/web/',
        duration: '12 Weeks',
        badge: 'Industry Standard',
      },
    ],
    capstoneProject: {
      title: 'Strongly-Typed Utility Library or Client SDK',
      description:
        'Write a TypeScript package using advanced generics, discriminated unions, and strict null checks with 100% test coverage.',
      deliverable: 'Compiled NPM package structure with `.d.ts` declaration maps and passing tsconfig checks.',
    },
  },

  s_ds: {
    skillId: 's_ds',
    skillName: 'Data Structures & Algorithmic Design',
    matchScoreBoostEstimate: 18,
    diagnosticSummary:
      'Fundamental computational memory structures: trees, graphs, heaps, hash maps, and asymptotic time-space analysis.',
    courses: [
      {
        title: 'Data Structures and Algorithms',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_cs47/preview',
        duration: '8 Weeks (IIT Delhi)',
        badge: 'IIT Certified',
      },
      {
        title: 'Harvard CS50: Introduction to Computer Science',
        provider: 'Harvard CS50',
        url: 'https://cs50.harvard.edu/x/',
        duration: '10 Weeks',
        badge: 'Industry Standard',
      },
      {
        title: 'JavaScript Algorithms and Data Structures',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/',
        duration: 'Self-Paced (300 hrs)',
        badge: '100% Free',
      },
    ],
    capstoneProject: {
      title: 'High-Performance Graph Traversal & Routing Engine',
      description:
        'Implement Dijkstra, A*, and topological sort on large directed graphs with benchmarked execution times.',
      deliverable: 'Clean GitHub repo with modular data structure implementations and unit test suites.',
    },
  },

  s_algo: {
    skillId: 's_algo',
    skillName: 'Advanced Algorithms & Dynamic Programming',
    matchScoreBoostEstimate: 17,
    diagnosticSummary:
      'Design paradigms including divide-and-conquer, greedy heuristics, dynamic programming, and network flow.',
    courses: [
      {
        title: 'Design and Analysis of Algorithms',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_cs48/preview',
        duration: '8 Weeks (IIT Madras)',
        badge: 'IIT Certified',
      },
      {
        title: 'Algorithms Specialization (Stanford)',
        provider: 'Google (Coursera)',
        url: 'https://www.coursera.org/specializations/algorithms',
        duration: '4 Months',
        badge: 'Industry Standard',
      },
      {
        title: 'Dynamic Programming Patterns',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news/dynamic-programming-tutorial-in-python-and-c/',
        duration: 'Self-Paced',
        badge: '100% Free',
      },
    ],
    capstoneProject: {
      title: 'Dynamic Programming & Memoization Benchmark Suite',
      description:
        'Solve and benchmark complex optimization problems (Knapsack, Matrix Chain, Longest Common Subsequence) comparing naive vs bottom-up DP.',
      deliverable: 'Documented GitHub repository with timing analysis charts and automated assertions.',
    },
  },

  s_uiux: {
    skillId: 's_uiux',
    skillName: 'UI/UX Design & User Research',
    matchScoreBoostEstimate: 15,
    diagnosticSummary:
      'Human-computer interaction principles, information architecture, wireframing, and accessibility heuristics.',
    courses: [
      {
        title: 'Google UX Design Professional Certificate',
        provider: 'Google (Coursera)',
        url: 'https://www.coursera.org/professional-certificates/google-ux-design',
        duration: '6 Months',
        badge: 'Industry Standard',
      },
      {
        title: 'Interaction Design & Ergonomics',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_de01/preview',
        duration: '8 Weeks (IIT Guwahati)',
        badge: 'IIT Certified',
      },
      {
        title: 'UI/UX Design Full Course for Beginners',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news/ui-ux-design-full-course/',
        duration: 'Self-Paced (2 hrs)',
        badge: '100% Free',
      },
    ],
    capstoneProject: {
      title: 'End-to-End Product Case Study & Wireframe',
      description:
        'Conduct usability discovery interviews, map user journey flows, and craft medium-fidelity interactive wireframes for a fintech or edtech app.',
      deliverable: 'Figma presentation link and documented PDF design case study detailing problem to solution.',
    },
  },

  s_figma: {
    skillId: 's_figma',
    skillName: 'Figma & Design Systems',
    matchScoreBoostEstimate: 14,
    diagnosticSummary:
      'Reusable components, auto-layout, design tokens, responsive breakpoints, and interactive prototypes.',
    courses: [
      {
        title: 'Figma UI/UX Masterclass & Design System Guide',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news/learn-figma-in-two-hours/',
        duration: 'Self-Paced',
        badge: '100% Free',
      },
      {
        title: 'Create High-Fidelity Designs and Prototypes in Figma',
        provider: 'Google (Coursera)',
        url: 'https://www.coursera.org/learn/high-fidelity-designs-prototypes-in-figma',
        duration: '4 Weeks',
        badge: 'Industry Standard',
      },
    ],
    capstoneProject: {
      title: 'Atomic Design System with Interactive Prototype',
      description:
        'Build a comprehensive Figma library featuring typography styles, color tokens, button states, modals, and clickable flows.',
      deliverable: 'Public Figma community file or prototype link showcasing atomic components and variant states.',
    },
  },

  s_flutter: {
    skillId: 's_flutter',
    skillName: 'Flutter & Cross-Platform Mobile',
    matchScoreBoostEstimate: 16,
    diagnosticSummary:
      'Reactive mobile application development for iOS and Android using Dart, widgets, and state management.',
    courses: [
      {
        title: 'Flutter & Dart Complete Course for Beginners',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news/learn-flutter-full-course/',
        duration: 'Self-Paced (37 hrs)',
        badge: '100% Free',
      },
      {
        title: 'Mobile Application Development',
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/noc24_cs65/preview',
        duration: '8 Weeks (IIT Madras)',
        badge: 'IIT Certified',
      },
    ],
    capstoneProject: {
      title: 'Offline-First Mobile App with Riverpod / Bloc',
      description:
        'Create a cross-platform mobile client featuring SQLite caching, dark/light theme switching, and smooth custom animations.',
      deliverable: 'GitHub repository with mobile screenshots, APK release artifact, and clean architecture directory structure.',
    },
  },

  s_git: {
    skillId: 's_git',
    skillName: 'Git & Distributed Version Control',
    matchScoreBoostEstimate: 12,
    diagnosticSummary:
      'Branching workflows, atomic commits, conflict resolution, rebase operations, and code review hygiene.',
    courses: [
      {
        title: 'Introduction to Git and GitHub',
        provider: 'Google (Coursera)',
        url: 'https://www.coursera.org/learn/introduction-git-github',
        duration: '4 Weeks',
        badge: 'Industry Standard',
      },
      {
        title: 'Git and GitHub for Beginners',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news/git-and-github-crash-course/',
        duration: 'Self-Paced',
        badge: '100% Free',
      },
    ],
    capstoneProject: {
      title: 'Multi-Branch Feature Flow with GitHub Actions CI',
      description:
        'Configure branch protection rules, write pull request templates, and implement a GitHub Action running automated linter and build tests.',
      deliverable: 'Public GitHub repo showcasing PR merges, clean commit history, and green CI/CD badge.',
    },
  },
};

/**
 * Helper to retrieve learning pathways with sensible defaults for any skill.
 */
export function getLearningPathwayForSkill(skillId: string, skillName: string): SkillLearningPathway {
  if (SKILL_LEARNING_PATHWAYS[skillId]) {
    return SKILL_LEARNING_PATHWAYS[skillId];
  }

  // Fallback dynamic pathway for any skill not explicitly mapped
  return {
    skillId,
    skillName,
    matchScoreBoostEstimate: 14,
    diagnosticSummary: `Demonstrate mastery in ${skillName} through verified academic coursework, peer-reviewed labs, and production-grade repositories.`,
    courses: [
      {
        title: `${skillName} Foundations & Engineering Principles`,
        provider: 'NPTEL / SWAYAM (IITs)',
        url: 'https://onlinecourses.nptel.ac.in/',
        duration: '8 Weeks',
        badge: 'Govt Accredited',
      },
      {
        title: `${skillName} Professional Certification`,
        provider: 'Meta (Coursera)',
        url: 'https://www.coursera.org/',
        duration: '4-6 Weeks',
        badge: 'Industry Standard',
      },
      {
        title: `${skillName} Practical Coding Bootcamp`,
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/',
        duration: 'Self-Paced',
        badge: '100% Free',
      },
    ],
    capstoneProject: {
      title: `${skillName} Applied Proof Artifact`,
      description: `Build and document an end-to-end repository demonstrating core ${skillName} concepts with automated tests and architecture notes.`,
      deliverable: 'Public GitHub repository verifiable by EvidentX SHA-256 seal.',
    },
  };
}
