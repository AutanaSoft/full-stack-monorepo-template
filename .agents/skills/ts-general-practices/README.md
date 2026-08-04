# TypeScript General Practices

This skill contains framework-independent TypeScript rules. Zod, framework, ORM, and workflow rules
belong to their dedicated skills.

## Structure

- `SKILL.md` - Activation and rule index.
- `references/agent-context.md` - Compiled reference guide.
- `references/ts-avoid-any-at-unknown-boundaries.md` - Active rule card.
- `references/ts-derive-types-from-runtime-values.md` - Active rule card.
- `references/ts-extract-reusable-object-shapes.md` - Active rule card.
- `references/ts-use-type-only-imports.md` - Active rule card.
- `references/ts-use-generics-and-utility-types.md` - Active rule card.

## Maintenance

1. Confirm that a proposed rule belongs to framework-independent TypeScript.
2. Create or update an atomic card under `references/`.
3. Use the reference-card contract: accepted impact, at most four tags, focused examples, and an
   official HTTPS source.
4. Update `SKILL.md`, this inventory, and the compiled guide when the rule catalog changes.
