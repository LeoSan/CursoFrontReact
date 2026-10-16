ROLE
Act as a senior React + TypeScript + Tailwind engineer. Follow .github/copilot-instructions.md strictly. ESLint layer rules apply: presentation may import domain and application, NEVER infrastructure. Only src/app/** and src/main.tsx may import infrastructure.

CONTEXT

- Application services already exist (loadExamSetup, startExam, submitExam, attemptHistory) wired in src/app/composition.ts as `appServices`.
- Domain pure services available: filterQuestions, countAvailable, getFilterCounts.
- ExamConfig = { selectedPairIds, levels, difficulties, questionCount, shuffle }. Empty levels/difficulties mean "all". Empty selectedPairIds is not allowed (the UI must force a selection).
- Lesson pairs come from the data (pairs with at least one question). Today: 11-12, 13-14, 15-16, 17-18, 19-20; more will appear when new JSON banks are added. Never hardcode pair ids.
- UI language: Spanish. Put ALL visible strings in src/presentation/i18n/es.ts (a plain typed object) so the language can change later. No i18n library. Question content stays in English.
- Styling: Tailwind CSS only, mobile-first, clean and readable, visible keyboard focus rings, good contrast.

TASK

PART A - Wiring

1. src/application/appServices.ts: export the type AppServices describing the object shape (loadExamSetup, startExam, submitExam, attemptHistory) using the return types of the existing factories. Update src/app/composition.ts to use `satisfies AppServices`.
2. src/presentation/context/appServicesContext.ts (context object + useAppServices hook that throws a clear error outside the provider) and src/presentation/context/AppServicesProvider.tsx (component only). Keep them in separate files so the react-refresh rule stays quiet.
3. src/main.tsx wraps <App /> with <AppServicesProvider services={appServices}>.
4. src/presentation/hooks/useAppFlow.ts: a small reducer-based hook for the screen flow: "config" | "exam" | "results" | "history" with the current Exam in memory. Actions: examStarted(exam), backToConfig. (Other screens come in later prompts.)
5. src/App.tsx renders the current screen. For now "exam" is a PLACEHOLDER page (ExamPlaceholderPage) showing the number of questions generated, the first question prompt, and a "Volver a configuración" button.

PART B - Configuration screen (src/presentation/pages/ConfigPage.tsx + components)
Behavior:

- On mount, call loadExamSetup. States: loading (skeleton or spinner with text), error (show a friendly message plus the full technical message in a collapsible <details> and a "Reintentar" button), ready.
- Lesson pairs: a multiple-selection dropdown (component MultiSelectPairs). A button shows the summary ("Selecciona pares de lecciones", or "17-18, 19-20", or "3 pares seleccionados"). Opening shows a panel with one checkbox per pair, label from pair.label, and the number of questions inside that pair. Include "Seleccionar todos" and "Limpiar". Close with Escape and click outside; aria-expanded, aria-controls, focus returns to the button when closing; fully keyboard operable. No external UI library.
- Levels (A1, A2, B1...) and Difficulties (Fácil/Media/Difícil mapped from Easy/Medium/Hard): chip groups (component ChipToggleGroup), multi-select, each chip shows its live count from getFilterCounts for the selected pairs. A chip with 0 questions is disabled. Helper text: "Si no eliges ninguno, se incluyen todos."
  Only offer levels that exist in the data (derive them; do not hardcode).
- Question count: number input (min 1, max = available), quick buttons 5, 10, 20 and "Todas". Default: min(10, available) and re-clamped when filters change. Show live text "Disponibles: N".
  If the requested count exceeds available, show a non-blocking note: "Solo hay N preguntas; el examen tendrá N."
- Shuffle: checkbox "Mezclar preguntas", default true.
- Generate button "Generar examen": disabled while no pair is selected or available is 0, with a hint text explaining why. While running show "Generando..." and disable it. On result:
  ok -> call examStarted(exam).
  no_questions -> inline error "No hay preguntas con estos filtros."
  invalid_count -> inline error "La cantidad debe ser un entero mayor o igual a 1."
- selectedPairIds must be sorted numerically by the first lesson number before building the config (use the order of getLessonPairs).
- All business rules come from the domain services; components contain no business logic. Form state and derived values live in src/presentation/hooks/useExamConfigForm.ts; data loading in src/presentation/hooks/useExamSetup.ts.
- Accessibility: every control has a visible label; groups use fieldset/legend; errors use role="alert"; counts and messages use aria-live="polite".

PART C - Tests (Vitest + React Testing Library; install @testing-library/user-event and set up jest-dom in the Vitest setup file if not already done; no other new libraries)
Use a fake AppServices via the provider and small inline fixtures (questions with several pairs, levels and difficulties, including one review-style question that belongs to all pairs).

- Shows loading, then the form; shows the error state with "Reintentar" which calls loadExamSetup again.
- Generate is disabled with no pair selected and the hint is visible; selecting a pair enables it.
- Pair dropdown: opens, shows per-pair counts, Escape closes and returns focus, "Seleccionar todos" and "Limpiar" work, keyboard toggling works.
- Selecting two pairs shows the UNION count (no duplicates).
- Level/difficulty chips: counts update when pairs change; a chip with 0 is disabled; clicking toggles.
- Count input: default min(10, available); re-clamped when filters reduce availability; quick buttons work; "Todas" equals available; the overflow note appears when count > available.
- Submitting calls startExam with exactly the expected ExamConfig (sorted selectedPairIds, empty arrays for "all", shuffle flag, questionCount) and on ok moves to the exam placeholder.
- no_questions result shows the inline error and stays on the config screen.

ACCEPTANCE CRITERIA

- lint, typecheck, build, test, format:check all pass, 0 skipped.
- Paste the output of a search proving src/presentation has no imports of infrastructure, and that src/domain and src/application are unchanged except for the new AppServices type.
- Report new tests per file and the total.
- Run `npm run dev` and describe in 5 lines what you see on the config screen with the real bank (pairs listed, counts for "17-18", result of generating a 10-question exam).

DO NOT

- Do not build the real exam screen, results screen, or history screen.
- Do not add routing, state libraries, UI libraries, or icon libraries (use inline SVG if an icon is needed).
- Do not hardcode pair ids, levels, or question counts.
- Do not modify domain types or the JSON files.

When finished, list the files created and the decisions you made.
