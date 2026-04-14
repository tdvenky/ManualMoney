Fix the issue described below (or the issue I reference) in the ManualMoney project.

Steps to follow:
1. **Understand the issue** — Read the relevant source files before touching anything. Identify the root cause, not just the symptom.
2. **Check the domain model** — Does the fix need to account for balance recalculation, pay period status, or BigDecimal precision?
3. **Make a minimal fix** — Change only what's needed to fix the issue. No refactoring, no extra features.
4. **Update or add tests** — Cover the broken case. Run the relevant test suite to confirm the fix passes and nothing regresses.
5. **Review your own change** — Re-read the diff and confirm it follows the rules in `.claude/rules/`.

Issue to fix: $ARGUMENTS
