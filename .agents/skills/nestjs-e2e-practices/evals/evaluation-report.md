# Evaluation Report

The skill was evaluated with independent task runs using `openai/gpt-5.6-luna`. Each behavioral
prompt was run once with the skill and once without it. The triggering evaluation used OpenCode
`1.18.4` with the skill directory configured as a project skill path.

## Behavioral Evaluation

| Evaluation                               | With skill | Baseline  | Material difference                                                 |
| ---------------------------------------- | ---------- | --------- | ------------------------------------------------------------------- |
| Auth and users structure                 | 7/7        | 7/7       | Both covered the core structure; the skill made ownership explicit  |
| Forgot-password email boundary           | 5/5        | 5/5       | Both isolated transport; the skill made residual scope explicit     |
| Duplicate discovery, fixtures, contracts | 6/6        | 5/6       | The skill preserved centralized cleanup and all required assertions |
| Pure unit-test boundary                  | 1/1        | 1/1       | Both correctly avoided E2E infrastructure                           |
| **Total**                                | **19/19**  | **18/19** | The skill's main discriminator was centralized lifecycle ownership  |

The full benchmark, grading files, and static viewer are in the external workspace at
`../nestjs-e2e-practices-workspace/iteration-1/`.

## OpenCode Triggering Evaluation

The official `skill-creator` triggering scripts invoke `claude -p` and are not compatible with the
user's Codex/OpenCode workflow. A small external harness detected OpenCode's actual `skill` tool
event instead. It ran each of the 20 queries three times, for 60 total runs.

| Iteration | Description change                                          | Result |
| --------- | ----------------------------------------------------------- | ------ |
| 1         | Original description                                        | 19/20  |
| 2         | Added the source-accessible and deployed-black-box boundary | 20/20  |

The only iteration-1 false positive was a Cypress test against a deployed API without NestJS source
or database access. The final description now excludes that black-box scenario while retaining
support for source-accessible NestJS HTTP E2E work.

Triggering evidence and the OpenCode harness are in
`../nestjs-e2e-practices-workspace/triggering/opencode-iteration-2/`.

## Human Review

The user accepted the generated viewer and evaluation results, then formally accepted the final
implementation. The later description change was driven by the OpenCode triggering result and
generalized the boundary instead of adding a query-specific exception.

## Limitations

- The behavioral task runner did not expose duration or token metrics, so those fields remain
  unavailable in the behavioral benchmark.
- The triggering result measures OpenCode `1.18.4` with the configured OpenAI model; it is not a
  Claude Code or Codex triggering measurement.
- The official Claude-only optimization loop was not used because the user does not use Claude.
