# ShipStack

ShipStack is an AI startup builder that turns a plain-English product idea into a structured blueprint, a generated Next.js codebase, a live WebContainer preview, downloadable project files, and a saved workspace you can reopen later.

It combines multi-provider AI orchestration, blueprint validation, code generation, file normalization, persistence, and in-browser preview into a single product flow.

## Highlights

- Multi-step generation pipeline: prompt validation, blueprint generation, code generation, AI enhancement, file preparation, preview boot, and persistence.
- Task-aware AI orchestration across Gemini, Groq, and OpenRouter with cache, cooldowns, retries, and fallback routing.
- Editable blueprint workflow so a generated app can be refined without starting from scratch.
- Saved project workspaces backed by Prisma/PostgreSQL, including generations, blueprint metadata, and usage logs.
- In-browser live preview powered by WebContainer with preview-safe dependency rewriting and a Prisma mock layer.
- Downloadable generated projects plus standalone preview and mobile preview modes.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14 App Router, React 18, Tailwind CSS |
| Backend | Next.js Route Handlers, NextAuth |
| Database | Prisma + PostgreSQL / Supabase |
| AI | Gemini, Groq, OpenRouter |
| Preview Runtime | WebContainer |
| Utilities | JSZip, bcryptjs, TypeScript |

## Core Capabilities

- Generate a product blueprint from a startup idea.
- Validate and refine blueprint JSON before code generation.
- Generate a full-stack project with pages, APIs, config, styles, and database files.
- Normalize generated output so previews survive missing UI primitives, broken image URLs, and markdown-wrapped code.
- Save generated projects to user accounts and reopen them later.
- Preview generated apps in embedded desktop/mobile frames or a standalone preview page.
- Download generated output as a zip archive.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env` file from `.env.example` and fill in the required values.

Required:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

Optional:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`
- `GEMINI_MODEL`
- `GROQ_MODEL`
- `OPENROUTER_MODEL`
- Cache / orchestrator tuning values from `.env.example`

### 3. Sync the database schema

```bash
npm run db:push
```

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Example

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

DATABASE_URL="postgresql://postgres.your-project-ref:your-password@aws-1-your-region.pooler.supabase.com:5432/postgres"

NEXTAUTH_SECRET="generate-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

## Available Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Run `prisma generate` and build the production app |
| `npm run start` | Start the production server |
| `npm run lint` | Run Next.js linting |
| `npm run type-check` | Run TypeScript without emitting files |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:seed` | Seed the database |

## System Architecture

```mermaid
flowchart LR
    User["User"] --> UI["Next.js App Router UI"]
    UI --> Auth["NextAuth Session Layer"]
    UI --> GenerateAPI["/api/generate"]
    UI --> ChatAPI["/api/chat"]
    UI --> ProjectsAPI["/api/projects"]
    UI --> DownloadAPI["/api/download"]

    GenerateAPI --> InputValidation["Input + Blueprint Validation"]
    InputValidation --> BlueprintGen["Blueprint Generator"]
    BlueprintGen --> Orchestrator["AI Orchestrator"]

    Orchestrator --> Gemini["Gemini"]
    Orchestrator --> Groq["Groq"]
    Orchestrator --> OpenRouter["OpenRouter"]

    GenerateAPI --> CodeGen["Code Generator + AI Enhancer"]
    CodeGen --> FilePrep["Generated File Preparation"]
    FilePrep --> Preview["WebContainer Preview"]
    FilePrep --> DownloadAPI

    GenerateAPI --> ProjectService["Project Service"]
    ProjectsAPI --> ProjectService
    ChatAPI --> Orchestrator
    Auth --> ProjectService

    ProjectService --> Prisma["Prisma"]
    Prisma --> DB["PostgreSQL / Supabase"]
```

ShipStack is a single Next.js application that owns both the UI and backend route handlers. The generation route coordinates validation, AI orchestration, project assembly, persistence, and preview startup.

## AI Orchestration Flow

```mermaid
flowchart TD
    Request["AI task request"] --> Cache{"Cache hit?"}
    Cache -- Yes --> CachedResponse["Return cached response"]
    Cache -- No --> Routing["Select provider order by task"]

    Routing --> BlueprintTask["Blueprint generation<br/>Gemini -> Groq -> OpenRouter"]
    Routing --> CodeTask["Code generation<br/>Groq -> Gemini -> OpenRouter"]
    Routing --> ImproveTask["Code improvement / fix<br/>OpenRouter -> Gemini -> Groq"]

    BlueprintTask --> ProviderCall["Call provider"]
    CodeTask --> ProviderCall
    ImproveTask --> ProviderCall

    ProviderCall --> Success{"Success?"}
    Success -- Yes --> Validate["Strip fences / parse JSON when required"]
    Validate --> Usage["Log usage + cache response"]
    Usage --> Return["Return normalized output"]

    Success -- No --> Health["Record failure and cooldown provider"]
    Health --> Retry["Try next provider or global backoff retry"]
    Retry --> ProviderCall
```

Provider routing is task-specific rather than random. The orchestrator caches successful responses, skips providers under cooldown, and retries globally when every ordered provider fails.

## Request Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend UI
    participant API as /api/generate
    participant Validator as Validators
    participant Blueprint as Blueprint Generator
    participant Orch as AI Orchestrator
    participant Codegen as Code Generator
    participant ProjectSvc as Project Service
    participant Preview as WebContainer

    User->>UI: Enter startup idea
    UI->>API: POST /api/generate?mode=full&persist=true
    API->>Validator: Validate input or edited blueprint
    Validator-->>API: Sanitized input / validated blueprint
    API->>Blueprint: generateBlueprint() or refineBlueprint()
    Blueprint->>Orch: Execute BLUEPRINT_GENERATION task
    Orch-->>Blueprint: Blueprint response
    Blueprint-->>API: Valid blueprint
    API->>ProjectSvc: Create project record
    API->>Codegen: generateFullProject(blueprint)
    Codegen->>Orch: Execute CODE_GENERATION / CODE_IMPROVEMENT tasks
    Orch-->>Codegen: Generated file content
    Codegen-->>API: Files, warnings, stats
    API->>ProjectSvc: Save blueprint + generation artifacts
    API-->>UI: Blueprint, files, metadata
    UI->>Preview: Mount files and boot preview
    Preview-->>UI: Preview URL and runtime logs
```

The user sees one product flow, but several stages run underneath: validation, blueprint generation, project generation, normalization, persistence, and preview bootstrapping.

## Preview Runtime Flow

```mermaid
flowchart TD
    Files["Prepared generated files"] --> FS["Build virtual file system tree"]
    FS --> PkgRewrite["Rewrite package.json for preview"]
    PkgRewrite --> MockPrisma["Inject Prisma mock into src/lib/prisma.ts"]
    MockPrisma --> Mount["Mount files into WebContainer"]
    Mount --> Install["npm install --legacy-peer-deps"]
    Install --> Dev["npm run dev"]
    Dev --> Ready["server-ready event"]
    Ready --> Embedded["Embedded iframe preview"]
    Ready --> Standalone["Standalone preview page"]
```

The preview environment is intentionally lighter than production. ShipStack strips server-only dependencies such as Prisma and NextAuth from the preview package, then injects a mock Prisma layer so generated apps can boot in-browser.

## Persistence Model

```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ UsageLog : produces
    Project ||--|| Blueprint : has
    Project ||--o{ Generation : records
    Project ||--o| Deployment : tracks

    User {
      string id
      string email
      string role
      string avatarUrl
    }

    Project {
      string id
      string userId
      string name
      string status
    }

    Blueprint {
      string id
      string projectId
      json data
    }

    Generation {
      string id
      string projectId
      json files
      int totalFiles
    }

    Deployment {
      string id
      string projectId
      string status
      string vercelUrl
    }

    UsageLog {
      string id
      string provider
      string task
      boolean success
    }
```

Projects are the central unit in persistence. Each saved project can own one current blueprint, many generations, optional deployment metadata, and related AI usage history through the owning user.

## Project Structure

```mermaid
flowchart TD
    Root["src"] --> App["app/"]
    Root --> AI["ai/"]
    Root --> Builder["builder/"]
    Root --> Generator["generator/"]
    Root --> Lib["lib/"]
    Root --> Validators["validators/"]
    Root --> Config["config/"]
    PrismaRoot["prisma/"] --> Schema["schema.prisma"]

    App --> Components["components/"]
    App --> Api["api/"]
    App --> Routes["route segments / pages"]

    AI --> Providers["gemini.ts, groq.ts, openrouter.ts"]
    AI --> OrchestratorFile["orchestrator.ts"]
    AI --> Health["health.ts, cache.ts, logger.ts"]

    Generator --> BlueprintFiles["blueprint.ts"]
    Generator --> CodeGenFiles["code-generator.ts, ai-enhancer.ts"]
    Generator --> Templates["templates/"]

    Builder --> FilePrepFiles["file-writer.ts"]

    Lib --> Hooks["hooks/"]
    Lib --> AuthLib["auth/"]
    Lib --> Services["services/"]
    Lib --> WebContainerLib["webcontainer.ts"]

    Validators --> InputValidator["input.validator.ts"]
    Validators --> BlueprintValidator["blueprint.validator.ts"]
```

The repo is organized by responsibility: UI and API in `app`, provider integration in `ai`, generation logic in `generator`, normalization/runtime helpers in `builder`, and reusable business logic in `lib`.

## Key Routes

| Route | Purpose |
| --- | --- |
| `POST /api/generate` | Validate input, generate blueprint, generate project files, persist results |
| `POST /api/download` | Zip generated files for download |
| `GET /api/projects` | List saved projects for the current user |
| `GET /api/projects/[id]` | Load a saved project workspace |
| `DELETE /api/projects/[id]` | Delete a saved project |
| `POST /api/auth/signup` | Create a credentials-based account |
| `/api/auth/[...nextauth]` | NextAuth session and provider handling |
| `GET /api/health` | Health snapshot |
| `GET /api/usage` | AI usage and provider telemetry |
| `POST /api/chat` | Project-aware assistant chat |

## Architecture Decisions

- Monolith by design: UI, API, auth, AI orchestration, and persistence all live inside one Next.js codebase for speed of iteration.
- Task-specific AI routing: provider order depends on the task, not a one-size-fits-all model selection.
- Normalize generated output before preview or persistence: ShipStack repairs missing support files, strips markdown wrappers, and replaces fragile image sources.
- Preview is optimized for browser execution: WebContainer receives a sandbox-safe version of the generated app with mocked Prisma access.
- Persistence stores both blueprint metadata and the latest generated files so projects can be reopened without rerunning generation.

## Known Constraints

- Provider quotas and rate limits can change generation latency and which model handles a task.
- The WebContainer preview is intentionally not identical to production because database and auth dependencies are reduced for in-browser execution.
- Production deployment still requires a real PostgreSQL database plus valid AI provider credentials.
- Generated apps may still require refinement after first output; the editable blueprint and follow-up prompt flow are part of the intended workflow.

## Recommended Local / Deployment Setup

- Local development: Next.js + Prisma + Supabase session-pooler connection string.
- Auth: NextAuth credentials by default, optional Google sign-in when Google env vars are provided.
- Deployment: Vercel + Supabase is the most natural setup for the current project structure.