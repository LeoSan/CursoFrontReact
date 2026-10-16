ROLE
Act as a senior TypeScript engineer practicing Clean Architecture. Follow .github/copilot-instructions.md strictly. ESLint enforces layer boundaries; they must keep passing.

CONTEXT

- Domain exists: entities, ports (IQuestionRepository, IAttemptRepository), and pure services (filterQuestions, getFilterCounts, countAvailable, generateExam, gradeExam, isAnswerEmpty, createSeededRandom).
- Infrastructure has the validated JSON question repository (`questionRepository`) and Zod schemas.
- Rules: application imports only domain; infrastructure implements domain ports and must NOT import application; presentation must NOT import infrastructure; only src/app/** and src/main.tsx may import infrastructure (composition root).
- Persistence: localStorage for now, with a second adapter ready to talk to a REST endpoint later (Django REST Framework).

TASK

PART A - Application layer (src/application). Factory functions, no classes, no React, no browser APIs.

1. src/application/ports/systemDeps.ts
   - type SystemDeps = { now(): string (ISO date); newId(): string; randomSeed(): number }.
2. src/application/usecases/ (one file per use case + index.ts):
   - createLoadExamSetup({ questionRepository }) returns async () => { pairs: LessonPair[]; questions: Question[] } (used by the configuration screen for the pairs combo and the live counts).
   - createStartExam({ questionRepository, system }) returns async (config: ExamConfig) => GenerateExamResult. It builds the random function with createSeededRandom(system.randomSeed()) and calls the domain generateExam with { random, now: system.now, newId: system.newId }.
   - createSubmitExam({ attemptRepository, system }) returns async ({ exam, answers }) => Attempt. It calls gradeExam, builds Attempt { id: system.newId(), exam, answers, result, finishedAt: system.now() }, saves it through the port and returns it. If saving fails, still return the graded attempt together with the error: result type { attempt: Attempt; saved: true } | { attempt: Attempt; saved: false; error: Error } (grading must never be lost because storage failed).
   - createAttemptHistory({ attemptRepository }) returns { list, get, remove, clear }. list returns newest first (by finishedAt).
3. src/application/store/examSession.ts - PURE reducer, no React:
   - State: { exam: Exam | null; answers: Readonly<Record<string, UserAnswer>>; currentIndex: number; status: "idle" | "in_progress" | "submitted" }.
   - Actions (discriminated union): start(exam), answerText(questionId, value), answerBlank(questionId, blankId, value), reveal(questionId), markSelfCheck(questionId, correct), goTo(index), next, previous, markSubmitted, reset.
   - Rules: goTo/next/previous clamp inside [0, questions-1]; answering is ignored unless status is "in_progress"; blank answers accumulate in Record<blankId, string>; reveal sets revealed true keeping markedCorrect; markSelfCheck requires nothing else and sets revealed true as well; start resets answers and index to 0 and sets "in_progress".
   - Export selectors: selectAnswersArray(state) => UserAnswer[]; selectUnansweredNumbers(state) => number[] (question numbers, using domain isAnswerEmpty).

PART B - Infrastructure adapters (src/infrastructure; they implement IAttemptRepository and import ONLY domain + zod) 4. src/infrastructure/schemas/attemptSchema.ts

- Zod schema for Attempt (exam, config, questions, answers, result). REUSE the question schema: if the existing one depends on bank metadata for the id-prefix check, export a context-free question schema (id format only) and keep the bank-level prefix check layered on top WITHOUT changing current behavior; all existing tests must still pass.
- Compile-time assertion that parsed output is assignable to the domain Attempt type. Use the ISO datetime validator that exists in the installed Zod version.

5. src/infrastructure/storage/storageLike.ts: interface StorageLike { getItem(key): string | null; setItem(key, value): void; removeItem(key): void }.
6. src/infrastructure/repositories/createLocalStorageAttemptRepository.ts
   - createLocalStorageAttemptRepository({ storage: StorageLike; key?: string (default "english-exam:attempts"); maxAttempts?: number (default 50) }): IAttemptRepository
   - Stored as an envelope { version: 1, attempts: Attempt[] }.
   - Reads are validated with attemptSchema. Corrupt JSON, wrong shape, or unknown version: list() returns [] and console.warn is emitted; the next save() first copies the old raw value to `${key}.backup`, then writes the new envelope (never silently destroy data).
   - A single invalid attempt inside a valid envelope is skipped with a warning; the rest are kept.
   - save: add, keep only the newest maxAttempts (drop the oldest); if setItem throws (quota), throw AttemptStorageError (plain Error subclass) with a clear message.
   - list returns newest first; get returns null when missing; remove and clear work as expected.
7. src/infrastructure/repositories/createHttpAttemptRepository.ts
   - createHttpAttemptRepository({ baseUrl: string; fetchFn?: typeof fetch; getAuthToken?: () => string | null }): IAttemptRepository
   - Endpoints: GET {baseUrl}/attempts, GET {baseUrl}/attempts/{id} (404 gives null), POST {baseUrl}/attempts (JSON body), DELETE {baseUrl}/attempts/{id}, DELETE {baseUrl}/attempts.
   - Sends Authorization: Bearer <token> only when getAuthToken returns a token. Validates every response with attemptSchema. Non-2xx throws AttemptHttpError (status and endpoint in the message). No retries, no caching.
   - It is NOT wired into the app; it only exists, tested with an injected fetch.
8. Export the new factories and error classes from src/infrastructure/index.ts.

PART C - Composition root (src/app, may import infrastructure and application) 9. src/app/systemDeps.ts: browser implementation of SystemDeps (now = new Date().toISOString(); newId = crypto.randomUUID with a fallback; randomSeed = random 32-bit integer). 10. src/app/composition.ts: wires questionRepository (bundled), attemptRepository (localStorage adapter with window.localStorage), systemDeps, and exports one object `appServices` with: loadExamSetup, startExam, submitExam, attemptHistory.
Switching to the HTTP adapter later must be a one-line change here. Add a short comment saying so.
This file is not unit tested (browser wiring); keep it free of logic.

TESTS (Vitest, next to each file, using in-memory fakes of the ports)

- loadExamSetup: returns pairs and questions from a fake repository.
- startExam: same seed gives the same exam; no_questions and invalid_count pass through unchanged; the seed comes from system.randomSeed.
- submitExam: builds the attempt with injected id and date and the right score; calls save once; when save rejects, returns saved false with the attempt still graded.
- attemptHistory: list newest first; get, remove, clear delegate correctly.
- examSession reducer: every action; clamping; answering ignored when not in progress; blank answers accumulate; selectors (selectUnansweredNumbers with a mix of answered and unanswered).
- localStorage adapter with a Map-based fake storage: save/list/get/remove/clear; newest first; maxAttempts trimming; corrupt JSON gives [] and a warning; unknown version gives [] and backup on next save; one invalid attempt skipped; setItem throwing gives AttemptStorageError.
- HTTP adapter with a fake fetch: each endpoint's method, URL and body; Authorization header present only with a token; 404 on get gives null; 500 throws AttemptHttpError; invalid response body is rejected by the schema.

ACCEPTANCE CRITERIA

- lint, typecheck, build, test, format:check all pass; 0 skipped tests.
- Layer boundaries intact: application has no imports of infrastructure, presentation, or react; infrastructure has no imports of application or presentation. Paste the output of a search proving it.
- Paste the output of the domain purity search (Math.random, Date, crypto, localStorage, fetch, window, document, console; excluding tests) and also the same search over src/application (excluding tests). Both must be empty.
- Report new tests per file and the total.

DO NOT

- Do not create React components, hooks, pages, or Context providers.
- Do not install new libraries.
- Do not modify domain types; if a domain type must change, STOP and tell me why first.

When finished, list the files created and the decisions you made.
