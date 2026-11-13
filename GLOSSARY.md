# Coucou Desktop

Terms used for agent activity and local build/test feedback.

## Local command feedback

**Agent command run**:
A single supported `npm test` or `cargo build` invocation sent by an agent in a known working directory.
_Avoid_: Build process, test session

**Run outcome**:
The observed invocation's result: passed, failed, cancelled, or unknown when the hook does not provide enough evidence.
_Avoid_: Agent turn status
