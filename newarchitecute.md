judge-server/
│
├── src/
│
│── index.ts                    // Entry point
│
├── scheduler/
│   ├── scheduler.ts
│   └── worker.ts
│
├── queue/
│   ├── redis.ts
│   └── queue.ts                // Queue interface
│
├── judge/
│   ├── judge.ts                // Orchestrates judging
│   ├── compiler.ts
│   ├── executor.ts
│   ├── workspace.ts
│   ├── cleanup.ts
│   └── problem-loader.ts
│
├── docker/
│   └── docker.ts               // Docker wrapper
│
├── storage/
│   └── object-storage.ts       // S3/MinIO wrapper
│
├── config/
│   └── config.ts
│
├── types/
│   ├── submission.ts
│   ├── verdict.ts
│   ├── execution.ts
│   └── worker.ts
│
└── utils/
    └── logger.ts