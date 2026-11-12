use std::{
    io::Read,
    path::{Path, PathBuf},
    process::{Command, Output, Stdio},
};

use serde::Serialize;

const MAX_DIFF_BYTES: usize = 256 * 1024;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitFile {
    path: String,
    status: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatus {
    repository: bool,
    root: Option<String>,
    branch: Option<String>,
    detached: bool,
    upstream: Option<String>,
    ahead: Option<u32>,
    behind: Option<u32>,
    files: Vec<GitFile>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitDiff {
    text: String,
    truncated: bool,
}

fn run_git(path: &Path, args: &[&str]) -> Result<Output, String> {
    Command::new("git")
        .arg("-c")
        .arg("core.fsmonitor=false")
        .arg("-c")
        .arg("core.untrackedCache=false")
        .args(args)
        .current_dir(path)
        .env("GIT_OPTIONAL_LOCKS", "0")
        .env("GIT_TERMINAL_PROMPT", "0")
        .output()
        .map_err(|_| "Git is unavailable".to_owned())
}

fn repository_root(path: &Path) -> Result<Option<PathBuf>, String> {
    if !path.is_dir() {
        return Ok(None);
    }
    let output = run_git(path, &["rev-parse", "--show-toplevel"])?;
    if !output.status.success() {
        return Ok(None);
    }
    let root = String::from_utf8_lossy(&output.stdout).trim().to_owned();
    if root.is_empty() {
        Ok(None)
    } else {
        Ok(Some(PathBuf::from(root)))
    }
}

fn no_repository() -> GitStatus {
    GitStatus {
        repository: false,
        root: None,
        branch: None,
        detached: false,
        upstream: None,
        ahead: None,
        behind: None,
        files: Vec::new(),
    }
}

fn parse_count(value: &[u8], prefix: u8) -> Option<u32> {
    value
        .strip_prefix(&[prefix])?
        .iter()
        .try_fold(0u32, |n, digit| {
            if !digit.is_ascii_digit() {
                return None;
            }
            n.checked_mul(10)?.checked_add(u32::from(*digit - b'0'))
        })
}

fn field_path(record: &[u8], separators: usize) -> Option<&[u8]> {
    let mut start = 0;
    for _ in 0..separators {
        let next = record[start..].iter().position(|byte| *byte == b' ')? + start;
        start = next + 1;
    }
    Some(&record[start..])
}

fn parse_status(bytes: &[u8]) -> GitStatus {
    let mut branch = None;
    let mut upstream = None;
    let mut ahead = None;
    let mut behind = None;
    let mut files = Vec::new();
    let mut records = bytes.split(|byte| *byte == 0);

    while let Some(record) = records.next() {
        if let Some(value) = record.strip_prefix(b"# branch.head ") {
            branch = Some(String::from_utf8_lossy(value).into_owned());
        } else if let Some(value) = record.strip_prefix(b"# branch.upstream ") {
            upstream = Some(String::from_utf8_lossy(value).into_owned());
        } else if let Some(value) = record.strip_prefix(b"# branch.ab ") {
            let mut counts = value
                .split(|byte| byte.is_ascii_whitespace())
                .filter(|part| !part.is_empty());
            ahead = counts.next().and_then(|part| parse_count(part, b'+'));
            behind = counts.next().and_then(|part| parse_count(part, b'-'));
        } else if record.starts_with(b"1 ") {
            if let (Some(status), Some(path)) = (
                record.split(|byte| *byte == b' ').nth(1),
                field_path(record, 8),
            ) {
                files.push(GitFile {
                    path: String::from_utf8_lossy(path).into_owned(),
                    status: String::from_utf8_lossy(status).into_owned(),
                });
            }
        } else if record.starts_with(b"2 ") {
            if let (Some(status), Some(path)) = (
                record.split(|byte| *byte == b' ').nth(1),
                field_path(record, 9),
            ) {
                records.next();
                files.push(GitFile {
                    path: String::from_utf8_lossy(path).into_owned(),
                    status: String::from_utf8_lossy(status).into_owned(),
                });
            }
        } else if record.starts_with(b"u ") {
            if let (Some(status), Some(path)) = (
                record.split(|byte| *byte == b' ').nth(1),
                field_path(record, 10),
            ) {
                files.push(GitFile {
                    path: String::from_utf8_lossy(path).into_owned(),
                    status: String::from_utf8_lossy(status).into_owned(),
                });
            }
        } else if let Some(path) = record.strip_prefix(b"? ") {
            files.push(GitFile {
                path: String::from_utf8_lossy(path).into_owned(),
                status: "??".into(),
            });
        }
    }

    let detached = branch.as_deref() == Some("(detached)");
    GitStatus {
        repository: true,
        root: None,
        branch: if detached { None } else { branch },
        detached,
        upstream,
        ahead,
        behind,
        files,
    }
}

#[tauri::command]
pub fn git_status(path: String) -> Result<GitStatus, String> {
    let path = Path::new(&path);
    let Some(root) = repository_root(path)? else {
        return Ok(no_repository());
    };
    // shortcut: ahead/behind uses cached tracking refs; add a network refresh only if later requested.
    let output = run_git(
        &root,
        &[
            "status",
            "--porcelain=v2",
            "--branch",
            "-z",
            "--untracked-files=all",
        ],
    )?;
    if !output.status.success() {
        return Err("Could not read Git status".into());
    }
    let mut status = parse_status(&output.stdout);
    status.root = Some(root.to_string_lossy().into_owned());
    Ok(status)
}

#[tauri::command]
pub fn git_diff(path: String) -> Result<GitDiff, String> {
    let path = Path::new(&path);
    let Some(root) = repository_root(path)? else {
        return Err("No Git repository found".into());
    };
    // shortcut: untracked file contents are omitted; add per-file reads only if later needed.
    let mut child = Command::new("git")
        .arg("-c")
        .arg("core.fsmonitor=false")
        .arg("-c")
        .arg("core.untrackedCache=false")
        .args([
            "diff",
            "--no-ext-diff",
            "--no-textconv",
            "--no-color",
            "HEAD",
            "--",
        ])
        .current_dir(&root)
        .env("GIT_OPTIONAL_LOCKS", "0")
        .env("GIT_TERMINAL_PROMPT", "0")
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|_| "Git is unavailable".to_owned())?;
    let mut stdout = child.stdout.take().ok_or("Could not read Git diff")?;
    let mut bytes = Vec::with_capacity(MAX_DIFF_BYTES + 1);
    if stdout
        .by_ref()
        .take((MAX_DIFF_BYTES + 1) as u64)
        .read_to_end(&mut bytes)
        .is_err()
    {
        let _ = child.kill();
        let _ = child.wait();
        return Err("Could not read Git diff".into());
    }
    let truncated = bytes.len() > MAX_DIFF_BYTES;
    if truncated {
        let _ = child.kill();
    }
    let status = child
        .wait()
        .map_err(|_| "Could not read Git diff".to_owned())?;
    if !status.success() && !truncated {
        return Err("Could not read Git diff".into());
    }
    bytes.truncate(MAX_DIFF_BYTES);
    let text = String::from_utf8_lossy(&bytes).into_owned();
    Ok(GitDiff { text, truncated })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        sync::atomic::{AtomicU64, Ordering},
    };

    static NEXT: AtomicU64 = AtomicU64::new(0);

    struct TempRepo(PathBuf);

    impl TempRepo {
        fn new(name: &str) -> Self {
            let path = std::env::temp_dir().join(format!(
                "coucou-git-{name}-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir_all(&path).unwrap();
            git(&path, &["init", "--quiet", "--initial-branch=main"]);
            git(&path, &["config", "user.name", "Coucou Synthetic"]);
            git(
                &path,
                &["config", "user.email", "synthetic@example.invalid"],
            );
            fs::write(path.join("tracked.txt"), "initial\n").unwrap();
            git(&path, &["add", "tracked.txt"]);
            git(
                &path,
                &["commit", "--quiet", "--no-gpg-sign", "-m", "initial"],
            );
            Self(path)
        }
    }

    impl Drop for TempRepo {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn git(path: &Path, args: &[&str]) -> Output {
        let hooks = path.join("empty-hooks");
        fs::create_dir_all(&hooks).unwrap();
        let output = Command::new("git")
            .arg("-c")
            .arg(format!("core.hooksPath={}", hooks.display()))
            .args(args)
            .current_dir(path)
            .output()
            .expect("Git must be installed for its synthetic repository tests");
        assert!(
            output.status.success(),
            "git {args:?} failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        output
    }

    #[test]
    fn reads_clean_modified_untracked_and_detached_states_without_writing() {
        let repo = TempRepo::new("states");
        let head = git(&repo.0, &["rev-parse", "HEAD"]).stdout;
        let index = fs::read(repo.0.join(".git/index")).unwrap();

        let clean = git_status(repo.0.to_string_lossy().into_owned()).unwrap();
        assert!(clean.repository);
        assert_eq!(clean.branch.as_deref(), Some("main"));
        assert!(clean.files.is_empty());
        assert!(clean.upstream.is_none());
        assert_eq!(clean.ahead, None);

        fs::write(repo.0.join("tracked.txt"), "changed\n").unwrap();
        fs::write(repo.0.join("new.txt"), "untracked\n").unwrap();
        let changed = git_status(repo.0.to_string_lossy().into_owned()).unwrap();
        assert_eq!(changed.files.len(), 2);
        assert!(changed.files.iter().any(|file| file.path == "tracked.txt"));
        assert!(changed
            .files
            .iter()
            .any(|file| file.path == "new.txt" && file.status == "??"));

        let diff = git_diff(repo.0.to_string_lossy().into_owned()).unwrap();
        assert!(diff.text.contains("+changed"));
        assert!(!diff.text.contains("untracked"));
        assert_eq!(git(&repo.0, &["rev-parse", "HEAD"]).stdout, head);
        assert_eq!(fs::read(repo.0.join(".git/index")).unwrap(), index);
        assert_eq!(
            fs::read_to_string(repo.0.join("tracked.txt")).unwrap(),
            "changed\n"
        );

        git(&repo.0, &["checkout", "--quiet", "--detach", "HEAD"]);
        let detached = git_status(repo.0.to_string_lossy().into_owned()).unwrap();
        assert!(detached.detached);
        assert!(detached.branch.is_none());
    }

    #[test]
    fn reports_ahead_and_behind_from_local_tracking_refs() {
        let local = TempRepo::new("local");
        let remote = std::env::temp_dir().join(format!(
            "coucou-git-remote-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&remote).unwrap();
        git(&remote, &["init", "--quiet", "--bare"]);
        git(
            &local.0,
            &["remote", "add", "origin", remote.to_str().unwrap()],
        );
        git(
            &local.0,
            &["push", "--quiet", "--set-upstream", "origin", "main"],
        );

        let clone = remote.with_extension("clone");
        fs::create_dir_all(&clone).unwrap();
        let output = Command::new("git")
            .args(["clone", "--quiet", "--branch", "main"])
            .arg(&remote)
            .arg(&clone)
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        git(&clone, &["config", "user.name", "Coucou Synthetic"]);
        git(
            &clone,
            &["config", "user.email", "synthetic@example.invalid"],
        );
        fs::write(clone.join("remote.txt"), "remote\n").unwrap();
        git(&clone, &["add", "remote.txt"]);
        git(
            &clone,
            &["commit", "--quiet", "--no-gpg-sign", "-m", "remote"],
        );
        git(&clone, &["push", "--quiet"]);

        fs::write(local.0.join("local.txt"), "local\n").unwrap();
        git(&local.0, &["add", "local.txt"]);
        git(
            &local.0,
            &["commit", "--quiet", "--no-gpg-sign", "-m", "local"],
        );
        git(&local.0, &["fetch", "--quiet", "origin"]);

        let status = git_status(local.0.to_string_lossy().into_owned()).unwrap();
        assert_eq!(status.upstream.as_deref(), Some("origin/main"));
        assert_eq!(status.ahead, Some(1));
        assert_eq!(status.behind, Some(1));

        let _ = fs::remove_dir_all(clone);
        let _ = fs::remove_dir_all(remote);
    }

    #[test]
    fn missing_folder_and_non_repository_are_explicit() {
        let folder = std::env::temp_dir().join(format!(
            "coucou-git-empty-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&folder).unwrap();
        let empty = git_status(folder.to_string_lossy().into_owned()).unwrap();
        assert!(!empty.repository);
        assert!(empty.files.is_empty());
        fs::remove_dir_all(&folder).unwrap();

        let missing = git_status(folder.to_string_lossy().into_owned()).unwrap();
        assert!(!missing.repository);
    }

    #[test]
    fn diff_output_is_bounded_before_it_enters_memory() {
        let repo = TempRepo::new("large-diff");
        fs::write(repo.0.join("tracked.txt"), vec![b'x'; MAX_DIFF_BYTES * 2]).unwrap();

        let diff = git_diff(repo.0.to_string_lossy().into_owned()).unwrap();

        assert!(diff.truncated);
        assert_eq!(diff.text.len(), MAX_DIFF_BYTES);
    }
}
