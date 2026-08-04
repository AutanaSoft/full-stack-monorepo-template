# AGENTS

Strict rules for an agent, human or AI, to work in this repository without breaking its conventions.

If a rule in this file conflicts with an installed skill, this file prevails.

Read it completely before the first edit. Each section defines its scope and limits.

## Repository Context

Review [README.md](/README.md) before editing. It contains the repository's structure and local
conventions.

## Code Style

- When generating or editing code, follow `.editorconfig` as the primary style source and
  `.prettierrc` as the supplementary formatting configuration.
- Respect the linter and static analysis configured by the project; do not introduce warnings.
- Do not disable formatting, linting, or type rules without a localized, documented justification.

## Communication

- Respond concisely, directly, and with a neutral technical tone.
- Ask only one question at a time and wait for the response before continuing.
- Report blockers, necessary assumptions, and verifications that were not performed.

## Commits and Pushes

- Do not create or generate commits without an explicit user request.
- Do not push without an explicit user request.
- When preparing a commit, use the `commit-message` skill if it is available.

## Comments and Documentation

- Document exports when their contract is not evident; omit self-explanatory helpers and one-liners.
- Explain intent, decision, or limitation, not a literal description of the code.
- Do not keep commented-out code; Git history preserves prior versions.

## Planning and Verification

- Before any change, present a plan with scope, affected files, and steps. Do not proceed until the
  developer approves it.
- Do not invent APIs, conventions, or behaviors. Verify against official documentation, cite the URL
  and version, or ask the developer. Memory and "probably" are not evidence.
- Do not modify files outside the agreed scope without reporting the reason.
- If the user questions a technical claim, verify it before accepting or rejecting it.

## User Changes

- Treat any difference between generated code and the repository's current state as intentional.
- Do not revert, rewrite, or correct those changes without explicit confirmation.
- If you identify a potential issue, provide verifiable evidence - URL, line, or diff - and request
  confirmation before changing it.
- If the user explicitly requests reverting or adjusting a change, proceed within the stated scope.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your
training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.
Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
