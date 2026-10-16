ROLE
Act as a senior TypeScript engineer practicing Clean Architecture. Follow .github/copilot-instructions.md strictly (layer rules are enforced by ESLint).

CONTEXT

- Domain types and ports exist in src/domain (Question union by gradingMode, QuestionBank, LessonPair, IQuestionRepository, etc.).
- The data contract is docs/question-bank.schema.v2.json. Sample data: src/data/book1-lessons-11-20.v2.json (60 questions: 26 exact, 15 blanks, 19 selfCheck; 5 lesson pairs).
- More JSON banks will be dropped into src/data with the same format, each with its own metadata.bookId.

TASK
Build the infrastructure data layer. Use factory functions, not classes.

1. src/infrastructure/schemas/questionBankSchema.ts
   - Zod schemas mirroring the JSON Schema: metadata, lessonPair, source, blank, media, and questions as z.discriminatedUnion on "gradingMode" (exact | blanks | selfCheck).
   - Enums exactly as in the domain literal unions.
   - Rules (use superRefine where needed):
     a) gradingMode "exact" requires non-empty acceptedAnswers.
     b) gradingMode "blanks" requires non-empty blanks; blank ids must be unique and start at 1.
     c) questionType "fill_blank" requires "template"; every {{n}} marker in the template must match an existing blank id and every blank id must appear in the template.
     d) question id must match /^[A-Z0-9]+-Q\d{3,}$/ and its prefix must equal metadata.bookId.
     e) lessonPairs ids must match /^\d+-\d+$/.
   - Add a compile-time assertion that the parsed Zod output is assignable to the domain QuestionBank type (e.g. a typed constant or `satisfies` helper), so schema and domain cannot drift.

2. src/infrastructure/schemas/validateQuestionBanks.ts
   - Cross-bank validation, returning a list of issues (not throwing):
     a) every question.sourceId exists in its bank's metadata.sources;
     b) every question lessonPair exists in its bank's metadata.lessonPairs;
     c) question ids are unique across ALL banks;
     d) bookId is unique across banks;
     e) when the same lesson pair id appears in several banks, its "lessons" array must be identical (label: first one wins);
     f) metadata.totalQuestions differing from the real count is a WARNING, not an error.
   - Each issue: { severity: "error" | "warning"; file: string; questionId?: string; path: string; message: string }.
   - Convert Zod errors into the same issue shape (file + question id when available + field path).

3. src/infrastructure/repositories/createJsonQuestionRepository.ts
   - createJsonQuestionRepository(loadRawBanks: () => Record<string, unknown>): IQuestionRepository
     (key = file path, value = raw JSON). Injecting the loader keeps it testable.
   - Parse + validate lazily on first use and cache the result (memoize the Promise).
   - If there is any "error" issue, reject with a QuestionBankLoadError (a plain Error subclass is allowed here) whose message lists ALL issues (file, question id, path, message), one per line. Warnings go to console.warn.
   - getBanks(), getAllQuestions() (flat, preserving file order), getLessonPairs():
     only pairs with at least one question, merged by id across banks,
     sorted numerically by the first lesson number.

4. src/infrastructure/repositories/bundledBanks.ts
   - Default loader using Vite: import.meta.glob('/src/data/*.json', { eager: true, import: 'default' }).
   - Export `questionRepository = createJsonQuestionRepository(loadBundledBanks)`.
   - Make sure tsconfig has resolveJsonModule enabled.

5. src/infrastructure/index.ts exporting only: createJsonQuestionRepository, questionRepository, QuestionBankLoadError.

TESTS (Vitest, in the same folders)

- Real sample file: loads 60 questions; counts by gradingMode are 26/15/19; getLessonPairs() returns exactly ["11-12","13-14","15-16","17-18","19-20"] in that order.
- Invalid cases, each producing a readable issue that names file, question id and path:
  exact question without acceptedAnswers; blanks question whose template marker has no matching blank; unknown sourceId; unknown lessonPair; duplicate question id across two banks; id prefix not matching bookId.
- totalQuestions mismatch yields a warning and still loads.
- Caching: the loader function is called only once across multiple repository calls.
- A second bank (small inline fixture with bookId "BK2" and pair "21-22") merges correctly: getLessonPairs() then ends with "21-22".

ACCEPTANCE CRITERIA

- lint, typecheck, build, test, format:check all pass.
- No file outside src/infrastructure was changed except package.json (zod), tsconfig (resolveJsonModule), and tests.
- Show the text of one sample error message produced by a failing test.

DO NOT

- Do not write filtering, exam generation, grading, state, or UI.
- Do not modify the JSON files, the schema, or domain types. If a domain type conflicts with the schema, STOP and tell me instead of changing it.

When finished, list the files created and any decision you had to make.
