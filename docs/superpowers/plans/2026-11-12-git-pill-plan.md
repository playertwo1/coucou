# Git pill — implementation plan

1. Add the stable Windows-only catalog item and remember the last focused workspace path in transient app state.
2. Add a Rust read-only Git probe and diff command using fixed argv, local refs and no shell; cover temporary local repositories in unit tests.
3. Add bridge types and a Git card with status, explicit refresh, and an in-card text diff. Include project path in the card cache key.
4. Add translated labels and a synthetic-only mock repository/diff; test session routing and synthetic rendering.
5. Update the Phase 2 roadmap with scope and evidence, then run targeted tests, translation check, typecheck/build and Rust tests.
6. Once the stage is verified, follow the recorded owner decision to create a version and publish it to GitHub, after the repository release checklist and required Windows packaging/Defender checks.
