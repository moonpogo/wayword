# Main Sync Review - 2026-05-27

## git status --short
```
?? docs/repo-hygiene/
```

## git status --branch
```
On branch main
Your branch is behind 'origin/main' by 11 commits, and can be fast-forwarded.
  (use "git pull" to update your local branch)

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/repo-hygiene/

nothing added to commit but untracked files present (use "git add" to track)
```

## git log --oneline main..origin/main
```
f26c1b7 Use cardinal anchor date labels for Season Wheel orientation
ef59fd8 Harden Season Wheel calendar truth mapping and labels
5a2ca6c Fix Season Wheel zoom, tooltip bounds, and local timestamp day bucketing
d5ce1a5 Merge pull request #13 from moonpogo/codex/smoke-first-session-entry-alignment
b472f46 Merge pull request #12 from moonpogo/cursor/critical-correctness-bugs-68db
8cec5fe Merge pull request #11 from moonpogo/cursor/critical-correctness-bugs-0689
971dc6d Merge pull request #10 from moonpogo/cursor/critical-correctness-bugs-a8c4
a225d00 Align browser smoke first-session-entry expectations with runtime
c8b47d7 Fix IME composition submit snapshot
987cc14 fix: escape patterns repeated word HTML
301d772 fix: escape patterns repeated word HTML
```

## git log --oneline origin/main..main
```
```
