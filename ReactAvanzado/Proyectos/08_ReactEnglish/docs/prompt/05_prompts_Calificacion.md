ROLE
Act as a senior TypeScript engineer practicing Clean Architecture. Follow .github/copilot-instructions.md strictly. Everything here is PURE domain logic (no React, no Zod, no I/O, no Date).

CONTEXT
Domain types exist: Question (union by gradingMode: exact | blanks | selfCheck), UserAnswer (union by kind: text | blanks | selfCheck), QuestionResult { questionId, gradingMode, correct: boolean | null, blankResults? }, ExamResult { examId, total, correct, incorrect, unanswered, score, results }.
Grading rule decided by the product owner: EXACT. Case and punctuation matter. Only whitespace is forgiven.

TASK
Create in src/domain/services/ (plus re-exports in the services index and src/domain/index.ts):

1. normalizeAnswer.ts
   - normalizeAnswer(value: string): string
   - Apply: Unicode NFC; replace typographic apostrophes/quotes with straight ones (’ and ‘ become ', “ and ” become "); trim; collapse any run of whitespace (including non-breaking spaces) into a single space.
   - It must NOT change case, remove punctuation, or expand contractions.

2. gradeQuestion.ts
   - gradeQuestion(question: Question, answer: UserAnswer | undefined): QuestionResult
   - exact: expects answer.kind "text". Empty or whitespace-only value, or no answer: correct null. Otherwise correct is true when normalizeAnswer(value) equals normalizeAnswer(x) for ANY x in acceptedAnswers; false otherwise.
   - blanks: expects answer.kind "blanks". Grade each blank against ITS acceptedAnswers using the same normalization; fill blankResults with every blank id (true/false; a missing or empty blank is false). correct is true only if ALL blanks are correct. If NO blank has content (or no answer at all), correct is null and blankResults is omitted.
   - selfCheck: expects answer.kind "selfCheck". correct equals answer.markedCorrect (null when not marked or no answer).
   - If the answer kind does not match the question's gradingMode, treat it as unanswered (correct null). Do not throw.
   - The result always carries questionId and gradingMode of the question.

3. gradeExam.ts
   - gradeExam(exam: Exam, answers: readonly UserAnswer[]): ExamResult
   - Index answers by questionId (if duplicates, the last one wins; answers for questions not in the exam are ignored).
   - results keep the exam's question order.
   - total = number of exam questions; correct / incorrect / unanswered counted from results (correct === true / false / null).
   - score = Math.round(correct / total * 100) as an integer 0-100; total 0 gives score 0 (never NaN).
   - examId comes from exam.id.

4. isAnswerEmpty.ts
   - isAnswerEmpty(answer: UserAnswer | undefined): boolean — true when there is no answer, the text is blank after normalization, every blank is blank, or a selfCheck has markedCorrect null. The UI will use this to warn about unanswered questions before submitting.

TESTS (Vitest, next to each file; inline fixtures built with small helpers)

- normalizeAnswer: trims; collapses double spaces and tabs; NBSP; curly apostrophe equals straight; case preserved; punctuation preserved; "It’s one twenty-five." normalizes to "It's one twenty-five.".
- gradeQuestion exact: correct; wrong; different case is INCORRECT; missing final period is INCORRECT; extra inner spaces are CORRECT; second accepted answer is CORRECT; empty and undefined give null; wrong answer kind gives null.
- gradeQuestion blanks: all right; one wrong gives correct false with the right blankResults; one empty and one right gives false (not null); all empty gives null without blankResults; blank with several accepted answers (e.g. "many" and "a lot of"); multi-blank verb table with four blanks.
- gradeQuestion selfCheck: true, false, null; revealed true with markedCorrect null gives null.
- gradeExam: counts add up (correct + incorrect + unanswered = total); score rounding (2 of 3 gives 67); total 0 gives score 0; duplicate answers last wins; unknown question ids ignored; results keep exam order.
- isAnswerEmpty: each of the four answer shapes, empty and non-empty.

Add ONE integration test in src/infrastructure/repositories/realBank.grading.integration.test.ts using the real bank via questionRepository:

- BK1-Q004 graded with "It's one twenty-five." and with "It's twenty-five past one." are both correct; "its one twenty-five" is incorrect.
- BK1-Q025 graded with "It's three oh eight." and "It's three o'eight." are both correct.
- BK1-Q044 (blanks) graded with "many" and with "a lot of" are both correct.
- BK1-Q037 (multi-blank) graded with grew / grown / growing is correct; with one wrong gives the right blankResults.
- Build an exam of the whole bank with all answers missing: unanswered equals 60 and score equals 0.

ACCEPTANCE CRITERIA

- lint, typecheck, build, test, format:check all pass; 0 skipped tests.
- Domain purity proof: search src/domain (excluding tests) for Math.random, Date, crypto, localStorage, fetch, window, document, console; paste the empty output.
- Report new tests per file and the total.

DO NOT

- Do not implement use cases, state, storage, or UI.
- Do not modify existing types unless strictly required; if so, STOP and tell me why first.

When finished, list the files created and any decision you made.
