Prompt 8a: Cimientos (dominio, reductor, flujo y sesión)

ROLE
Act as a senior TypeScript + React engineer. Read .github/copilot-instructions.md first. Layer rules apply (domain pure; application imports only domain; presentation never imports infrastructure). Work in small steps; if you must stop early leave all scripts passing and list what remains. Do not skip, delete or weaken any test. Paste real command output for every acceptance item; do NOT describe screens.

CONTEXT
The exam screen is being built. This step prepares the foundations only. Read src/application/store/examSession.ts, src/application/usecases/submitExam.ts, src/presentation/hooks/useAppFlow.ts, src/domain/entities/answer.ts and src/infrastructure/schemas/attemptSchema.ts before changing anything, and keep the existing action names and types.

TASK
1. Self-check keeps the student's text (authorized small domain change, backward compatible)
   - SelfCheckAnswer gets an optional field `text?: string`.
   - attemptSchema accepts the optional `text`; attempts stored without it must still parse.
   - Reducer: new action answerSelfCheckText(questionId, value) that creates or updates a selfCheck answer keeping revealed and markedCorrect as they are (new answers start revealed false, markedCorrect null). reveal and markSelfCheck must keep an existing text.
   - isAnswerEmpty semantics do NOT change: a selfCheck with markedCorrect null is still empty even if it has text.
   - gradeQuestion does not change (it ignores text).
2. src/domain/services/parseTemplate.ts (pure)
   - parseTemplate(template: string): readonly TemplatePart[] where TemplatePart = { kind: "text"; value: string } | { kind: "blank"; id: number }. Marker format is {{n}} with n an integer >= 1. Keep text parts exactly as written (including spaces). Never produce empty text parts. A template with no marker returns one text part. Export it from the domain index.
   - Table tests: "It's half past {{1}}." ; "{{1}} sheep" ; "TUESDAY, {{1}}, THURSDAY" ; "a {{1}} and {{2}} b" ; "no markers" ; adjacent markers "{{1}}{{2}}" ; repeated spaces preserved.
3. Application: make sure the outcome type of createSubmitExam is exported from the application index as SubmitExamOutcome = { attempt: Attempt; saved: true } | { attempt: Attempt; saved: false; error: Error }. If it already exists under another name, export an alias with this name.
4. Flow (src/presentation/hooks/useAppFlow.ts)
   - Add the action examSubmitted(outcome: SubmitExamOutcome) that moves the flow to "results" and stores the outcome; backToConfig clears the exam and the outcome. Update its tests.
5. src/presentation/pages/ResultsPlaceholderPage.tsx (temporary, minimal)
   - Shows score (e.g. "Puntaje: 75"), correct / incorrect / unanswered counts, a warning with role="alert" when saved is false ("No se pudo guardar el intento en este dispositivo. Tu resultado se muestra igualmente."), and a button "Nuevo examen" that calls backToConfig. All text in src/presentation/i18n/es.ts under a `results` key. Wire it in App for the "results" screen.
6. src/presentation/hooks/useExamSession.ts
   - useExamSession(exam: Exam) wraps useReducer(examSessionReducer) and dispatches start(exam) so the session begins in_progress on mount. It returns { state, actions } where actions are typed callbacks (answerText, answerBlank, answerSelfCheckText, reveal, markSelfCheck, goTo, next, previous, markSubmitted) and derived values: currentQuestion, currentNumber, total, answeredFlags (boolean per question using the domain isAnswerEmpty), unansweredNumbers.
   - Tests with renderHook: starts in_progress at index 0; navigation clamps; answers persist across navigation; answeredFlags and unansweredNumbers update after answering (text, blanks, selfCheck marked).

TESTS
All new behavior covered as described, plus reducer tests for answerSelfCheckText and attemptSchema tests: a selfCheck answer WITH text parses; one WITHOUT text parses; a non-string text is rejected with a readable path.

ACCEPTANCE CRITERIA
- typecheck, lint, format:check, test, build pass (0 skipped; console spy active with no failures), EXCEPT tests that were already failing in ConfigPage.test.tsx before this task, which you must list by name and not touch.
- Paste: `git status --short`, the new test names with counts per file, and a search proving src/presentation has no infrastructure imports.

DO NOT build the exam screen, question renderers, results screen or history. No new libraries.

When finished, answer as a numbered list matching items 1-6 plus the decisions you made.