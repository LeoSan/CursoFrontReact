# English Exam Generator

Aplicación web para practicar inglés mediante exámenes generados a partir de un banco de preguntas. El estudiante configura el examen (libro, lecciones, tipos de pregunta y cantidad), lo responde en una pantalla accesible, lo entrega y obtiene una calificación automática por pregunta.

El banco de preguntas actual corresponde al **Libro I, Lecciones 11-20** (60 preguntas) y soporta preguntas de respuesta abierta, completar espacios, múltiples espacios, corrección de errores y autoevaluación.

## Índice

- [Tecnología usada](#tecnología-usada)
- [Arquitectura usada](#arquitectura-usada)
- [Contexto del mini proyecto](#contexto-del-mini-proyecto)

## Tecnología usada

| Área          | Herramienta                                              |
| ------------- | -------------------------------------------------------- |
| UI            | React 19                                                 |
| Lenguaje      | TypeScript 5.9 (modo `strict`, sin `any`)                |
| Estilos       | Tailwind CSS 4 (solo utilidades, sin CSS-in-JS)          |
| Build / Dev   | Vite 8                                                   |
| Validación    | Zod 4 (valida el banco de preguntas y los intentos)      |
| Pruebas       | Vitest + Testing Library + user-event + jsdom            |
| Calidad       | ESLint, Prettier                                         |
| Persistencia  | `localStorage` (con repositorio HTTP alternativo)        |

### Scripts

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo
npm run build        # typecheck + build de producción
npm run typecheck    # verificación de tipos
npm run lint         # ESLint
npm run format:check # Prettier
npm run test         # Vitest
```

## Arquitectura usada

El proyecto sigue **Clean Architecture** con capas estrictas y dependencias que apuntan siempre hacia adentro:

```
src/
├── domain/          # Entidades, servicios puros y puertos (TypeScript puro)
├── application/     # Casos de uso, estado de sesión y servicios de la app
├── infrastructure/  # Repositorios (JSON, localStorage, HTTP) y esquemas Zod
├── presentation/    # Componentes React, páginas, hooks y contexto
├── app/             # Composición: conecta las capas (único punto que ve todo)
└── data/            # Banco de preguntas en JSON (esquema v2)
```

| Capa           | Puede importar                  | Restricciones                                         |
| -------------- | ------------------------------- | ----------------------------------------------------- |
| Domain         | Nada                            | Sin React, sin `fetch`, sin `localStorage`, sin async |
| Application    | Domain                          | Sin Infrastructure ni Presentation                    |
| Infrastructure | Domain (implementa los puertos) | Sin Presentation                                      |
| Presentation   | Application                     | No accede a Infrastructure ni a las respuestas del banco |

Decisiones clave:

- **Uniones discriminadas** para los tipos de pregunta.
- **Puertos y adaptadores**: el dominio define `IQuestionRepository` e `IAttemptRepository`; la infraestructura los implementa.
- **Calificación en el dominio**: funciones puras, modo exacto (recorta y colapsa espacios, distingue mayúsculas y puntuación).
- **Accesibilidad primero**: diálogo modal propio, navegación por teclado, regiones `aria-live` y foco gestionado.
- **Pruebas por capa**, incluidas pruebas de integración contra el banco real.

## Contexto del mini proyecto

Este es un mini proyecto personal de aprendizaje con dos objetivos:

1. **Practicar inglés** con exámenes generados de forma aleatoria y calificados automáticamente.
2. **Practicar ingeniería de software** aplicando Clean Architecture, TypeScript estricto y pruebas, construyendo el proyecto por etapas guiadas mediante prompts (consultables en [`docs/prompt`](docs/prompt)): banco de preguntas, validación con Zod, servicios de dominio, calificación, capa de aplicación, configurador y pantalla de examen.

Actualmente quedan fuera de alcance: la pantalla real de resultados, el historial de intentos, un temporizador y el enrutamiento.

---

**Fecha:** 15 de octubre de 2026

**Colaboración:** este proyecto fue un trabajo conjunto entre una persona y una IA (Claude): la persona definió el rumbo, los requisitos y las decisiones; la IA ayudó a diseñar, escribir y probar el código.

**Código abierto:** es un proyecto de código abierto; puedes usarlo, estudiarlo, modificarlo y compartirlo.

> **Reflexión:** la IA acelera la escritura, pero no reemplaza el criterio. Lo que mejor funcionó fue dar prompts pequeños y precisos, exigir pruebas reales y revisar cada resultado. Construir con IA se parece menos a delegar y más a conversar: cuanto mejor se piensa la pregunta, mejor es el código que regresa.
