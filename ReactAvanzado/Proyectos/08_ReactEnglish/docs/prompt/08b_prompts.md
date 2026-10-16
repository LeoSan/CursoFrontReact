Prompt 8b: Cómo se ve cada tipo de pregunta

ROLE
Act as a senior React + TypeScript + Tailwind engineer. Read .github/copilot-instructions.md first. Same rules as the previous prompts (small steps, stop in a green state, never weaken tests, paste real output, do not describe screens).

CONTEXT
Prompt 8a is done: parseTemplate (domain), useExamSession, the selfCheck `text` field and the answer actions exist. Build ONLY the question renderers now (components, no page shell).

Question kinds in the data (read src/domain/entities to use the exact types):
- questionType "open" with gradingMode "exact": one text answer.
- questionType "fill_blank": has `template` with {{n}} markers and `blanks`.
- questionType "multi_blank": no template; `prompt` is a heading and each blank has a `label` (e.g. "Simple Past").
- questionType "error_correction": `prompt` is a wrong sentence the student rewrites correctly.
- gradingMode "selfCheck": the student writes, reveals the model answer, then marks "Acerté" or "No acerté".
- Optional `media` ({ type: "image", name, src }) and optional `hint`.

TASK
Create in src/presentation/components/question/ (UI strings in es.ts under an `exam` key; Tailwind only; inline SVG for icons; mobile-first; visible focus rings; touch targets at least 44px high):
1. QuestionView.tsx: receives { question, number, answer, handlers } and renders by kind through small components below. It shows the instruction (smaller text), then the content, then the media and hint blocks. It never reads question.answer, question.acceptedAnswers, blanks[].acceptedAnswers or question.explanation EXCEPT inside SelfCheckBlock, which may read question.answer only after reveal.
2. OpenAnswerInput.tsx: a single-line text input with a visible label ("Tu respuesta"), autoComplete="off", spellCheck={false}, autoCapitalize="none", autoCorrect="off". Controlled by the stored answer (empty string when none).
3. InlineBlanks.tsx (fill_blank): uses parseTemplate to render text parts and inline inputs in place, wrapping naturally on small screens. Each input has aria-label "Espacio {n}" and a width proportional to the longest accepted answer of that blank (min 6ch, max 24ch) WITHOUT exposing the answer as text.
4. BlanksTable.tsx (multi_blank): the prompt as a heading and one labelled input per blank (the blank's label as visible <label>); one column on mobile, two on md.
5. ErrorCorrection.tsx: shows the wrong sentence in a visually distinct box titled "Frase incorrecta" and an input labelled "Escribe la frase corregida".
6. SelfCheckBlock.tsx: textarea "Tu respuesta" (stores via answerSelfCheckText); button "Mostrar respuesta"; once revealed (state.revealed true) show the model answer in a box titled "Respuesta modelo" (NO explanation) and two toggle buttons "Acerté" and "No acerté" with aria-pressed; marking is changeable; reveal is irreversible during the exam.
7. MediaPlaceholder.tsx: when media.src is null show a bordered box with an inline SVG image icon and the visible text "Imagen: {media.name}" (role="img" with aria-label "Imagen: {name}"); when src exists render <img> with alt = name, max-w-full, loading="lazy".
8. HintBadge.tsx: "Pista: {hint}" rounded badge, only when a hint exists.
9. Pure presentation helper src/presentation/components/question/answerShapes.ts to read the typed value from an answer by kind (text, blanks, selfCheck) safely, returning "" / {} / defaults for undefined. No casts, no "any".

TESTS (RTL + user-event; inline fixtures built with a helper, one question per kind plus one with media and src null, one with media src set, one with a hint; the fixtures contain answers like "SECRET-ANSWER" so leaks are detectable)
- Each kind renders the right controls and typing calls the right handler with the right arguments (blank id included).
- Values come from the stored answer and update when the answer prop changes.
- fill_blank with "The dog {{1}} early every day." renders the text before and after the input in order; a two-marker template renders both inputs.
- multi_blank shows each blank's label as an accessible label.
- error_correction shows the wrong sentence and an empty input.
- selfCheck: the model answer is NOT in the document before reveal; after "Mostrar respuesta" it is; explanation never appears; Acerté and No acerté toggle aria-pressed and call the handler; the typed text persists after reveal.
- For exact, fill_blank, multi_blank and error_correction fixtures, "SECRET-ANSWER" and the explanation text are never in the document, before or after typing.
- Media placeholder shows "Imagen: Clock at 7:00" style text; with src renders an img with the right alt.
- Hint badge appears only with a hint.
- Enter inside any input does not submit anything (wrap in a div, not a form).

ACCEPTANCE CRITERIA
- typecheck, lint, format:check, test, build pass (0 skipped; console spy active), except tests already failing in ConfigPage.test.tsx before this task (list by name, do not touch).
- Paste: a search over src/presentation (excluding tests) for the words acceptedAnswers, explanation and .answer — the only allowed hit for `.answer` is SelfCheckBlock.tsx; any other hit must be fixed.
- Paste new test names with counts per file and the new total.

DO NOT build the page shell, the navigator, the dialogs, or the submit flow. No new libraries. Do not modify src/domain, src/application or src/infrastructure.

When finished, answer with the list of files created and the decisions you made.