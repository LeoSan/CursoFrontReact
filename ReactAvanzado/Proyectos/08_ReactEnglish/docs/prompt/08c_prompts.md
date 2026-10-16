Prompt 8c: La pantalla completa, la entrega y la prueba con el banco real

ROLE
Act as a senior React + TypeScript + Tailwind engineer. Read .github/copilot-instructions.md first. Same rules as before (small steps, stop in a green state, never weaken tests, paste real output, do not describe screens).

CONTEXT
Done already: useExamSession, QuestionView and its renderers, useAppFlow with examSubmitted and backToConfig, ResultsPlaceholderPage, appServices (submitExam). Now assemble the exam screen.

TASK
1. src/presentation/components/ConfirmDialog.tsx: hand-built accessible modal (NOT the native <dialog>): role="dialog", aria-modal, aria-labelledby/aria-describedby, initial focus on the safe action, Tab trapped inside, Escape closes, focus returns to the element that opened it, backdrop click closes, body scroll locked while open. Props: title, description (ReactNode), actions.
2. src/presentation/components/ExamProgress.tsx: "Pregunta {n} de {total}" and a bar with role="progressbar" (aria-valuemin, aria-valuemax, aria-valuenow = answered count, aria-label "Preguntas respondidas"). Also show "Respondidas: x / total".
3. src/presentation/components/QuestionNavigator.tsx: one numbered button per question. Accessible names: "Pregunta 3, actual", "Pregunta 3, respondida", "Pregunta 3, sin responder". Current has aria-current="step". Layout: below the question on mobile inside a toggle button "Ver todas las preguntas" (collapsed by default, aria-expanded/aria-controls); from the lg breakpoint it is a fixed side column always visible. Includes the "Entregar examen" button.
4. src/presentation/pages/ExamPage.tsx
   - Props: { exam: Exam; onSubmitted(outcome: SubmitExamOutcome): void; onExit(): void }. Uses useExamSession and useAppServices (never infrastructure).
   - Layout: header (title, "Salir", progress), question card (QuestionView), navigator, and on mobile a sticky bottom bar with "Anterior" and "Siguiente" (safe-area padding; content gets bottom padding so nothing is hidden). Anterior is disabled on the first question. On the last question "Siguiente" becomes "Entregar".
   - On every question change: move focus to the question heading (tabIndex -1), scroll to top, and announce "Pregunta {n} de {total}" in a visually-hidden aria-live="polite" region.
   - Submit: if there are unanswered questions, open ConfirmDialog listing their numbers as buttons ("Ir a la pregunta {n}", which closes the dialog and goes there) with actions "Seguir respondiendo" (default focus) and "Entregar de todos modos". If none, submit directly without confirmation.
   - Submitting: call services.submitExam({ exam, answers: selectAnswersArray(state) }); while pending show "Entregando..." and disable all controls (a second click must not call it twice). On success dispatch markSubmitted and call onSubmitted(outcome). On an unexpected rejection show a role="alert" message "No se pudo entregar el examen. Inténtalo de nuevo." and re-enable.
   - Exit: "Salir" opens ConfirmDialog ("Perderás tus respuestas"); confirming calls onExit.
   - While status is in_progress, register a beforeunload warning and remove it on unmount or after submit.
5. Wire it in App.tsx replacing ExamPlaceholderPage for the "exam" screen (keep the placeholder file deleted). onSubmitted -> examSubmitted(outcome); onExit -> backToConfig.
6. All strings in es.ts.

TESTS (RTL + user-event; fake AppServices; inline fixtures with one question of each kind)
- Renders question 1 of N; progress text and progressbar attributes update as answers are given.
- Navigation: Siguiente / Anterior, Anterior disabled on first, last shows Entregar; numbered buttons jump; accessible names reflect current/answered/unanswered and update after typing.
- Answers persist when moving away and back (text, blanks, selfCheck text and mark).
- Focus moves to the question heading when the question changes; the live region announces it.
- Mobile toggle: navigator collapsed by default and aria-expanded toggles.
- Submit with unanswered questions: dialog lists the right numbers; "Seguir respondiendo" closes it and returns focus to the button; a number button jumps and closes; "Entregar de todos modos" calls submitExam once with { exam, answers } whose shapes are correct per kind (text, blanks with record by blank id, selfCheck with text, revealed and markedCorrect).
- Submit with everything answered: no dialog; submitExam called once; while pending (deferred promise) button shows "Entregando..." and controls are disabled; double click calls once; on success onSubmitted receives the outcome.
- Rejection path shows the alert and re-enables the button.
- Exit: cancel stays; confirm calls onExit.
- Escape closes dialogs; Tab stays trapped in the dialog.
- Enter inside any input neither navigates nor submits.
- beforeunload listener is added while in progress and removed afterwards.
- App-level test: config -> generate -> answer -> submit shows the results placeholder with the score and the unsaved warning when outcome.saved is false.

REAL-BANK END-TO-END TEST (src/app/examPage.realBank.test.tsx; src/app may import infrastructure; use the REAL questionRepository, the REAL use cases and a fake in-memory attempt repository; mock nothing in domain)
- Build an Exam by hand from these real questions: BK1-Q001 (blanks "7 o'clock", has media "Clock at 7:00"), BK1-Q003 (blanks "one"), BK1-Q004 (exact), BK1-Q037 (multi_blank grew / grown / growing), BK1-Q006 (selfCheck). Render ExamPage.
- Q001 shows the visible text "Imagen: Clock at 7:00".
- Answer all five correctly (typing "7 o'clock", "one", "It's one twenty-five.", "grew", "grown", "growing"; for Q006 type anything, reveal, press "Acerté") and submit: no confirmation dialog; the saved attempt has result.correct 5, total 5, score 100.
- Second test: same exam, but Q004 typed as "its one twenty-five" and Q006 marked "No acerté": score 60 (3 of 5), with the right per-question results (Q004 correct false, Q006 correct false).
- Third test: leave Q006 unmarked: the dialog lists question 5; "Entregar de todos modos" gives unanswered 1 and the score computed over 5 questions.
- During the exam none of the real answers ("It's one twenty-five.", "grew") appears in the document before the student types them.

ACCEPTANCE CRITERIA
- typecheck, lint, format:check, test, build pass (0 skipped; console spy active with no failures), except tests already failing in ConfigPage.test.tsx before this task (list by name, do not touch).
- Paste: the search for acceptedAnswers, explanation and .answer in src/presentation (excluding tests; only SelfCheckBlock.tsx may use .answer); the search proving src/presentation has no infrastructure imports; `git status --short`; new test names with counts per file and the new total.
- If you reach your budget, stop at a green state and list exactly what remains.

DO NOT build the real results screen, the history screen, a timer, routing, or add libraries. Do not modify src/domain, src/application or src/infrastructure.

When finished, answer as a numbered list matching items 1-6, plus the decisions you made.