ROLE
Act as a senior React + TypeScript engineer. We are building an English exam generator. Work step by step and do ONLY what this prompt asks.

CONTEXT

- SPA in React 18 + TypeScript (strict) + Vite + Tailwind CSS. No backend for now.
- Question banks are JSON files that follow question-bank.schema.v2.json (see /docs). The first one is book1-lessons-11-20.v2.json. More will come in the same format.
- The user filters by lesson PAIRS (multi-select combo, e.g. "17-18", "19-20"), English level and difficulty, then generates an exam, answers it, and gets graded.
- Architecture: Clean Architecture (light) with ports and adapters.

TASK

1. Create the project with Vite (react-ts template), install and configure Tailwind CSS, Zod, Vitest, React Testing Library, and ESLint + Prettier.
2. Enable "strict": true in tsconfig and add path aliases: @domain, @application, @infrastructure, @presentation.
3. Create this folder structure (empty folders get a .gitkeep):
   src/domain/{entities,services,ports}
   src/application/{usecases,store}
   src/infrastructure/{repositories,schemas,storage}
   src/presentation/{pages,components,hooks}
   src/data (put the JSON banks here)
   docs (put the schema here)
4. Create .github/copilot-instructions.md with these rules:
   - Dependency rule: domain imports nothing from React or other layers; application imports only domain; infrastructure implements domain ports; presentation uses application only.
   - Domain code is pure functions and types: no side effects, no localStorage, no fetch.
   - Never use "any". Use discriminated unions for question types.
   - Components are small, typed, and contain no business logic.
   - Every pure function in domain gets unit tests (Vitest).
   - Grading is EXACT: only trim and collapse repeated whitespace; case and punctuation matter.
   - Tailwind only; no CSS-in-JS.
   - Do not install libraries that were not requested.
5. Add a minimal App that renders "Exam Generator" to verify the setup works.

ACCEPTANCE CRITERIA

- `npm run dev`, `npm run build`, `npm run lint` and `npm run test` all pass.
- Tailwind classes are applied in the App.
- The folder structure and aliases resolve correctly.

DO NOT

- Do not write entities, repositories, or UI yet.
- Do not add routing, state libraries, or extra dependencies.
- Do not modify the JSON files.

When finished, list what you created and any decision you had to make.
