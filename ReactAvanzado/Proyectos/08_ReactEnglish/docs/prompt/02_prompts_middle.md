ROLE
Act as a senior TypeScript engineer practicing Clean Architecture. Follow .github/copilot-instructions.md strictly.

CONTEXT
The project scaffolding already exists (Prompt 1). The JSON format is defined in docs/question-bank.schema.v2.json and the sample data is in src/data/book1-lessons-11-20.v2.json. Read both files before writing anything.

TASK
Create the DOMAIN layer only, inside src/domain. Types and interfaces only: no logic, no React, no I/O.

1. src/domain/entities/question.ts
   - Literal unions for: EnglishLevel, Difficulty, SkillType, QuestionType, GradingMode (values exactly as in the schema).
   - Types: Media, Blank, LessonPair, Source, QuestionBankMetadata.
   - A shared BaseQuestion type with the common fields (id, sourceId, lessonPairs, englishLevel, difficulty, topic, subtopic?, grammarFocus?, skillType, questionType, instruction, prompt, hint?, media?, answer, explanation, tags).
   - Question as a DISCRIMINATED UNION on gradingMode:
     ExactQuestion (gradingMode "exact"): acceptedAnswers: string[]
     BlanksQuestion (gradingMode "blanks"): blanks: Blank[], template?: string
     SelfCheckQuestion (gradingMode "selfCheck"): no extra fields
   - QuestionBank = { metadata, questions: Question[] }.

2. src/domain/entities/exam.ts
   - ExamConfig: selectedPairIds: string[]; levels: EnglishLevel[]; difficulties: Difficulty[]; questionCount: number; shuffle: boolean. Empty levels/difficulties mean "all".
   - ExamQuestion: { number: number; question: Question }.
   - Exam: { id: string; createdAt: string (ISO); config: ExamConfig; questions: ExamQuestion[] }.

3. src/domain/entities/answer.ts
   - UserAnswer as a discriminated union on "kind":
     { kind: "text"; questionId; value: string }
     { kind: "blanks"; questionId; values: Record<number, string> } // key = blank id
     { kind: "selfCheck"; questionId; revealed: boolean; markedCorrect: boolean | null }
   - QuestionResult: { questionId; correct: boolean | null; ... } where null means "not answered yet".
   - ExamResult: { examId; total; correct; incorrect; unanswered; score (0-100); results: QuestionResult[] }.

4. src/domain/entities/attempt.ts
   - Attempt: { id; exam: Exam; answers: UserAnswer[]; result: ExamResult; finishedAt: string }.

5. src/domain/ports/
   - QuestionRepository: getBanks(): Promise<QuestionBank[]>; getAllQuestions(): Promise<Question[]>; getLessonPairs(): Promise<LessonPair[]> (only pairs that have at least one question).
   - AttemptRepository: save(attempt), list(), getById(id), remove(id), clear(). All async (Promise-based) so a future HTTP endpoint adapter fits without changes.

6. src/domain/index.ts that re-exports everything.

CONSTRAINTS

- No classes, no enums (use string literal unions), no "any".
- Use "readonly" on arrays and properties where it makes sense.
- Add a one-line TSDoc comment on every exported type explaining its purpose.
- Add a type guard per question variant (isExactQuestion, isBlanksQuestion, isSelfCheckQuestion) in src/domain/entities/question.guards.ts. These are the only functions allowed in this step.

ACCEPTANCE CRITERIA

- `npm run build` and `npm run lint` pass.
- Narrowing works: inside `if (q.gradingMode === "exact")`, q.acceptedAnswers is accessible without casts.
- Nothing in src/domain imports from react, zod, or other layers.
- Add one Vitest file that checks the three type guards with one sample question each.

DO NOT

- Do not implement filtering, exam generation, grading, repositories, or UI.
- Do not change the JSON files or the schema.

When finished, list the files created.
