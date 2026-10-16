ROLE
Act as a senior TypeScript engineer practicing Clean Architecture. Follow .github/copilot-instructions.md strictly. Everything here is PURE domain logic.

CONTEXT
Domain types exist (Question, ExamConfig, Exam, ExamQuestion, LessonPair). The question bank has 60 questions; each question has lessonPairs: string[] (e.g. ["17-18"], or all five pairs for review items).

TASK
Create pure functions in src/domain/services/ (one file per concern, plus an index.ts re-export, and export them from src/domain/index.ts).

1. random.ts
   - createSeededRandom(seed: number): () => number (deterministic PRNG, e.g. mulberry32; values in [0,1)).
   - shuffle<T>(items: readonly T[], random: () => number): T[] (Fisher-Yates on a COPY; never mutate the input).

2. filterQuestions.ts
   - filterQuestions(questions: readonly Question[], config: Pick<ExamConfig, "selectedPairIds" | "levels" | "difficulties">): Question[]
   - Rules:
     - A question matches the pairs if ANY of its lessonPairs is in selectedPairIds (union semantics).
     - Empty selectedPairIds returns an EMPTY array (the UI must force a selection).
     - Empty levels or empty difficulties means "no restriction" for that field.
     - Preserve original order.

3. availableOptions.ts (for the configuration screen)
   - countAvailable(questions, config): number
   - getFilterCounts(questions, selectedPairIds): { levels: Record<EnglishLevel, number>; difficulties: Record<Difficulty, number> }
     Counts questions inside the selected pairs only, so the UI can disable options with 0 questions.
   - Include every level/difficulty key, with 0 when absent.

4. generateExam.ts
   - Dependencies injected as a parameter object: { random: () => number; now: () => string; newId: () => string }. The domain must NOT call Math.random, Date, or crypto directly.
   - generateExam(questions, config, deps): GenerateExamResult
   - GenerateExamResult is a discriminated union:
     { ok: false; reason: "no_questions" | "invalid_count" }
     { ok: true; exam: Exam; requestedCount: number; availableCount: number; reducedToAvailable: boolean }
   - Rules:
     - questionCount must be an integer >= 1, otherwise "invalid_count".
     - Filter first; if nothing matches, "no_questions".
     - If config.shuffle is true, shuffle with deps.random; otherwise keep bank order.
     - Take the first min(questionCount, availableCount) questions; reducedToAvailable is true when fewer were available than requested.
     - Number questions 1..n (ExamQuestion.number).
     - exam.id = deps.newId(); exam.createdAt = deps.now(); exam.config is a copy of the config.

TESTS (Vitest, next to each file; use small inline fixtures built with a helper, plus one test with the real sample bank loaded from src/data/book1-lessons-11-20.v2.json)

- seeded random: same seed gives same sequence; different seeds differ.
- shuffle: does not mutate input; same elements; deterministic with a seeded random.
- filterQuestions: pair union (["17-18","19-20"] gives the union without duplicates); review questions (all five pairs) match any single pair; empty pairs gives []; level and difficulty filters combine; order preserved.
- With the real bank: pair "17-18" alone returns the expected count (assert the number by counting in the fixture, do not hardcode a guess); pair "11-12" returns only the 12 review questions.
- getFilterCounts sums are consistent with countAvailable.
- generateExam: invalid_count for 0, -1 and 2.5; no_questions; reducedToAvailable true/false; numbering 1..n; same seed gives same exam; shuffle false keeps bank order; ids and dates come from the injected deps.

ACCEPTANCE CRITERIA

- lint, typecheck, build, test, format:check all pass.
- No import of react, zod, or other layers inside src/domain; no Math.random / Date / crypto usage inside src/domain.
- Report the number of tests added and the output of the real-bank assertions.

DO NOT

- Do not implement grading, use cases, state, storage, or UI.
- Do not modify existing types unless strictly required; if so, STOP and tell me why first.

When finished, list the files created and any decisions you made.
