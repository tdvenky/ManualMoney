Review the code changes in this session (or the files I specify) for the ManualMoney project.

Focus on:
1. **Correctness** — Does the logic match the domain model? (zero-sum budgeting, balance recalculation chains, BigDecimal arithmetic)
2. **Code style** — Does it follow the rules in `.claude/rules/code-style.md`?
3. **API conventions** — Do any new or changed endpoints follow `.claude/rules/api-conventions.md`?
4. **Test coverage** — Are the changed code paths covered by tests? Flag anything untested.
5. **Security** — Any injection risks, exposed internals, or unsafe data handling?
6. **Regressions** — Could this change break existing behavior elsewhere in the app?

Be specific: reference file paths and line numbers. Separate blocking issues from suggestions.
