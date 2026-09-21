# Agent workflow

## After every change

- Complete the requested change, then run the most relevant verification available (for example, lint, type-checking, tests, or a production build).
- Review `git status` and the diff before committing.
- Commit the completed change with a concise, descriptive commit message.
- Push the commit to the current branch's configured remote.
- Report back with what changed, which files were affected, what verification passed or failed, the commit hash, and the push result.

## Safety and scope

- Preserve unrelated user changes; do not include them in a commit unless they are part of the requested change.
- Do not rewrite history, force-push, or delete branches unless the user explicitly asks.
- If a commit or push fails, report the exact failure and keep the worktree intact.
