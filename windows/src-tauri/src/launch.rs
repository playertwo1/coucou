// A new Claude Code session from the island, and a file dropped on a session —
// ports of LaunchScript.swift, SessionLauncher.swift and SessionDrop.swift.
//
// Launch: the user's terminal opens in the project with the selected CLI and
// prompt. The prompt is never part of a shell script:
// - Linux: it travels in COUCOU_PROMPT, set on the terminal's process, and the
//   user's login shell runs `claude "$COUCOU_PROMPT"` (as the Mac's script).
// - Windows: the native executable starts in a fresh console with argv built by Rust.
//   Npm `.cmd` shims resolve to their JS entry point and node.exe, so neither
//   cmd.exe nor a shell handles the prompt.
// The session then shows in the island like any other, through the hooks.
//
// Drop: the session's window comes forward (the same lookup as "Open
// terminal", session_window.rs) and the paths are pasted with Flow's paste
// (flow/paste.rs), escaped as a drag onto that terminal would write them.
//
// The command lines are built by the pure functions below, tested here; the
// spawning and the OS calls are the few lines after them.

use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use crate::{flow, herdr, platform, session_window};

/// What to start: a program, its arguments, extra environment, its folder.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Spawn {
    pub program: String,
    pub args: Vec<String>,
    pub env: Vec<(String, String)>,
    pub dir: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum LaunchAgent {
    Claude,
    Codex,
    Antigravity,
    Hermes,
}

impl LaunchAgent {
    fn binary(self) -> &'static str {
        match self {
            Self::Claude => "claude",
            Self::Codex => "codex",
            Self::Antigravity => "agy",
            Self::Hermes => "hermes",
        }
    }

    fn label(self) -> &'static str {
        match self {
            Self::Claude => "Claude Code",
            Self::Codex => "Codex",
            Self::Antigravity => "Antigravity",
            Self::Hermes => "Hermes",
        }
    }

    fn prompt_flags(self) -> &'static [&'static str] {
        match self {
            Self::Claude | Self::Codex => &[],
            Self::Antigravity => &["-i"],
            Self::Hermes => &["chat", "-q"],
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct LaunchProgram {
    executable: PathBuf,
    prefix_args: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchAgentStatus {
    pub agent: LaunchAgent,
    pub available: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum LaunchError {
    InvalidFolder,
    InvalidPrompt,
    AgentUnavailable,
    TerminalStartFailed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchResult {
    pub ok: bool,
    pub error: Option<LaunchError>,
}

fn launch_args(agent: LaunchAgent, prompt: Option<&str>) -> Vec<String> {
    let Some(prompt) = prompt else { return Vec::new() };
    agent.prompt_flags().iter().map(|arg| (*arg).to_string()).chain([prompt.to_string()]).collect()
}

fn resume_codex_args(session_id: &str) -> Vec<String> {
    vec!["resume".into(), session_id.into()]
}

#[cfg(windows)]
fn npm_entrypoint(shim: &Path) -> Option<PathBuf> {
    let body = std::fs::read_to_string(shim).ok()?;
    let parent = shim.parent()?;
    for line in body.lines().filter(|line| line.contains("%_prog%")) {
        let Some((_, suffix)) = ["%dp0%", "%~dp0"].into_iter().find_map(|marker| line.find(marker).map(|at| (marker, &line[at + marker.len()..]))) else {
            continue;
        };
        let relative = suffix.split('"').next()?.trim_start_matches('\\').trim_start_matches('/');
        if !relative.to_ascii_lowercase().starts_with("node_modules\\") || relative.split(|c| c == '\\' || c == '/').any(|part| part == "..") {
            continue;
        }
        let extension = Path::new(relative).extension()?.to_str()?;
        if !["js", "cjs", "mjs"].iter().any(|allowed| extension.eq_ignore_ascii_case(allowed)) {
            continue;
        }
        let relative = relative.replace('\\', std::path::MAIN_SEPARATOR_STR);
        let entrypoint = parent.join(relative);
        if entrypoint.is_file() {
            return Some(entrypoint);
        }
    }
    None
}

fn launch_program(agent: LaunchAgent) -> Option<LaunchProgram> {
    let candidates = platform::cli_candidates(agent.binary());
    #[cfg(not(windows))]
    {
        return Some(LaunchProgram { executable: candidates.into_iter().next()?, prefix_args: Vec::new() });
    }
    #[cfg(windows)]
    {
    if let Some(executable) = candidates.iter().find(|path| path.extension().is_some_and(|ext| ext.eq_ignore_ascii_case("exe"))) {
        return Some(LaunchProgram { executable: executable.clone(), prefix_args: Vec::new() });
    }
    if let (Some(shim), Some(node)) = (
        candidates.iter().find(|path| path.extension().is_some_and(|ext| ext.eq_ignore_ascii_case("cmd"))),
        platform::cli_candidates("node").into_iter().find(|path| path.extension().is_some_and(|ext| ext.eq_ignore_ascii_case("exe"))),
    ) {
        if let Some(entrypoint) = npm_entrypoint(shim) {
            return Some(LaunchProgram { executable: node, prefix_args: vec![entrypoint.to_string_lossy().into_owned()] });
        }
    }
    None
    }
}

#[tauri::command]
pub fn launch_agents() -> Vec<LaunchAgentStatus> {
    [LaunchAgent::Claude, LaunchAgent::Codex, LaunchAgent::Antigravity, LaunchAgent::Hermes]
        .into_iter()
        .map(|agent| LaunchAgentStatus { agent, available: launch_program(agent).is_some() })
        .collect()
}

/// Keep prompt text literal; line breaks and surrounding whitespace are data.
pub fn clean_prompt(prompt: &str) -> String {
    prompt.to_string()
}

/// A folder a session may start in: an existing folder given by its full path.
pub fn valid_folder(folder: &str) -> bool {
    let p = Path::new(folder);
    !folder.is_empty() && p.is_absolute() && p.is_dir()
}

// ── Linux ─────────────────────────────────────────────────────────────────────

/// The shell's single quotes, only where needed: 'it'\''s' for it's.
#[cfg_attr(windows, allow(dead_code))]
pub fn sh_quote(s: &str) -> String {
    let plain = !s.is_empty() && s.chars().all(|c| c.is_ascii_alphanumeric() || "/._-+=:@,".contains(c));
    if plain {
        s.to_string()
    } else {
        format!("'{}'", s.replace('\'', r"'\''"))
    }
}

/// What the terminal runs: the user's login shell (so `claude` is found as in
/// any terminal), Claude Code with the prompt from COUCOU_PROMPT, then the
/// shell again in the project once Claude Code quits.
#[cfg_attr(windows, allow(dead_code))]
pub fn shell_command(shell: &str, has_prompt: bool) -> Vec<String> {
    let run = if has_prompt { r#"claude "$COUCOU_PROMPT""# } else { "claude" };
    vec![shell.to_string(), "-lic".to_string(), format!("{run}; exec {} -l", sh_quote(shell))]
}

#[cfg_attr(windows, allow(dead_code))]
fn agent_shell_command(shell: &str, agent: LaunchAgent, program: &LaunchProgram, has_prompt: bool) -> Vec<String> {
    let executable = sh_quote(&program.executable.to_string_lossy());
    let prefix_args = program.prefix_args.iter().map(|arg| sh_quote(arg)).collect::<Vec<_>>().join(" ");
    let executable = if prefix_args.is_empty() { executable } else { format!("{executable} {prefix_args}") };
    let args = if has_prompt {
        let prefix = agent.prompt_flags().join(" ");
        if prefix.is_empty() {
            format!("{executable} \"$COUCOU_PROMPT\"")
        } else {
            format!("{executable} {prefix} \"$COUCOU_PROMPT\"")
        }
    } else {
        executable
    };
    vec![shell.to_string(), "-lic".to_string(), format!("{args}; exec {} -l", sh_quote(shell))]
}

/// The terminals we know how to hand a command and a folder to, best first
/// after $TERMINAL: the desktop's own default (Debian's x-terminal-emulator),
/// then the usual ones.
#[cfg_attr(windows, allow(dead_code))]
pub const LINUX_TERMINALS: &[&str] = &[
    "x-terminal-emulator", "gnome-terminal", "ptyxis", "konsole", "kitty", "alacritty", "wezterm", "foot", "xterm",
];

/// The terminals to try, in order: $TERMINAL's program first, if set.
#[cfg_attr(windows, allow(dead_code))]
pub fn linux_candidates(env_terminal: Option<&str>) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    if let Some(first) = env_terminal.and_then(|t| t.split_whitespace().next()) {
        out.push(first.to_string());
    }
    for t in LINUX_TERMINALS {
        if !out.iter().any(|o| o == t) {
            out.push(t.to_string());
        }
    }
    out
}

/// The arguments that make `terminal` open a window in `dir` running `command`.
/// Unknown terminals get the common `-e` (as x-terminal-emulator must take).
/// konsole and wezterm are asked for a process of their own, so the window
/// gets this environment (COUCOU_PROMPT) and not the one of a running copy.
#[cfg_attr(windows, allow(dead_code))]
pub fn linux_terminal_args(terminal: &str, dir: &str, command: &[String]) -> Vec<String> {
    let name = Path::new(terminal).file_name().and_then(|n| n.to_str()).unwrap_or(terminal);
    let mut args: Vec<String> = match name {
        "gnome-terminal" => vec![format!("--working-directory={dir}"), "--".into()],
        "ptyxis" => vec!["--new-window".into(), "-d".into(), dir.into(), "--".into()],
        "konsole" => vec!["--separate".into(), "--workdir".into(), dir.into(), "-e".into()],
        "kitty" => vec!["--directory".into(), dir.into()],
        "alacritty" => vec!["--working-directory".into(), dir.into(), "-e".into()],
        "wezterm" => vec!["start".into(), "--always-new-process".into(), "--cwd".into(), dir.into(), "--".into()],
        "foot" => vec![format!("--working-directory={dir}")],
        _ => vec!["-e".into()],
    };
    args.extend(command.iter().cloned());
    args
}

/// The whole launch on Linux, `terminal` being the one found.
#[cfg_attr(windows, allow(dead_code))]
pub fn linux_spawn(terminal: &str, shell: &str, folder: &str, prompt: &str) -> Spawn {
    let prompt = clean_prompt(prompt);
    let has_prompt = !prompt.trim().is_empty();
    let command = shell_command(shell, has_prompt);
    let env = if has_prompt { vec![("COUCOU_PROMPT".to_string(), prompt)] } else { Vec::new() };
    Spawn { program: terminal.to_string(), args: linux_terminal_args(terminal, folder, &command), env, dir: folder.to_string() }
}

#[cfg_attr(windows, allow(dead_code))]
fn linux_agent_spawn(terminal: &str, shell: &str, folder: &str, prompt: &str, agent: LaunchAgent, program: &LaunchProgram) -> Spawn {
    let prompt = clean_prompt(prompt);
    let has_prompt = !prompt.trim().is_empty();
    let command = agent_shell_command(shell, agent, program, has_prompt);
    let env = if has_prompt { vec![("COUCOU_PROMPT".to_string(), prompt)] } else { Vec::new() };
    Spawn { program: terminal.to_string(), args: linux_terminal_args(terminal, folder, &command), env, dir: folder.to_string() }
}

// ── Windows ───────────────────────────────────────────────────────────────────

fn windows_agent_spawn(folder: &str, agent: LaunchAgent, program: &LaunchProgram, prompt: &str) -> Spawn {
    Spawn {
        program: program.executable.to_string_lossy().into_owned(),
        args: program.prefix_args.iter().cloned()
            .chain(launch_args(agent, (!prompt.trim().is_empty()).then_some(prompt)))
            .collect(),
        env: Vec::new(),
        dir: folder.to_string(),
    }
}

// ── Drop ──────────────────────────────────────────────────────────────────────

/// What a file dropped on a session types into its prompt: the paths as a
/// terminal writes them when files are dragged onto it, then a space. Claude
/// Code takes them as files, an image path as the image. Windows Terminal
/// puts a path with a space in double quotes (a backslash is a separator
/// there); a Linux terminal, like the Mac's, puts a backslash before spaces
/// and shell characters.
pub fn drop_text(paths: &[String], windows: bool) -> String {
    let escaped: Vec<String> = paths
        .iter()
        .map(|path| {
            if windows {
                if path.chars().any(|c| c == ' ' || "&()[]{}^=;!'+,`~".contains(c)) {
                    format!("\"{path}\"")
                } else {
                    path.clone()
                }
            } else {
                let special = " ()'\"\\&;|<>*?[]{}$`!#~";
                path.chars().map(|c| if special.contains(c) { format!("\\{c}") } else { c.to_string() }).collect()
            }
        })
        .collect();
    format!("{} ", escaped.join(" "))
}

// ── Commands ──────────────────────────────────────────────────────────────────

fn start(spawn: &Spawn, new_console: bool) -> std::io::Result<()> {
    let mut cmd = Command::new(&spawn.program);
    cmd.args(&spawn.args).current_dir(&spawn.dir);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // PowerShell on its own needs a console window to show in; wt.exe
        // opens its own window and must not flash one.
        const CREATE_NEW_CONSOLE: u32 = 0x0000_0010;
        if new_console {
            cmd.creation_flags(CREATE_NEW_CONSOLE);
        } else {
            platform::no_console(&mut cmd);
        }
    }
    #[cfg(not(windows))]
    {
        let _ = new_console;
        // Coucou's own GDK settings stay out of the terminal (platform/linux.rs).
        platform::no_console(&mut cmd);
    }
    for (k, v) in &spawn.env {
        cmd.env(k, v);
    }
    cmd.spawn().map(|_| ())
}

#[cfg(target_os = "linux")]
fn launch_here(folder: &str, prompt: &str, agent: LaunchAgent) -> Result<String, LaunchError> {
    let program = launch_program(agent).ok_or(LaunchError::AgentUnavailable)?;
    let shell = std::env::var("SHELL").ok().filter(|s| Path::new(s).is_absolute()).unwrap_or_else(|| "/bin/bash".into());
    let env_terminal = std::env::var("TERMINAL").ok();
    for candidate in linux_candidates(env_terminal.as_deref()) {
        let Some(path) = (if Path::new(&candidate).is_absolute() {
            Some(std::path::PathBuf::from(&candidate)).filter(|p| p.is_file())
        } else {
            platform::find_on_path(&candidate)
        }) else {
            continue;
        };
        let spawn = linux_agent_spawn(&path.to_string_lossy(), &shell, folder, prompt, agent, &program);
        match start(&spawn, false) {
            Ok(()) => return Ok(candidate),
            Err(err) => crate::log::line(format!("launch: {candidate} didn't start: {err}")),
        }
    }
    Err(LaunchError::TerminalStartFailed)
}

#[cfg(windows)]
fn launch_here(folder: &str, prompt: &str, agent: LaunchAgent) -> Result<String, LaunchError> {
    let program = launch_program(agent).ok_or(LaunchError::AgentUnavailable)?;
    let spawn = windows_agent_spawn(folder, agent, &program, prompt);
    start(&spawn, true).map(|_| "console".into()).map_err(|err| {
        crate::log::line(format!("launch: couldn't start {}: {err}", agent.label()));
        LaunchError::TerminalStartFailed
    })
}

/// Opens the user's terminal in `folder` with the selected agent and prompt.
#[tauri::command]
pub fn launch_session(folder: String, prompt: String, agent: LaunchAgent) -> LaunchResult {
    if !valid_folder(&folder) {
        crate::log::line(format!("launch: {} is not an existing folder", session_window::folder_name(&folder)));
        return LaunchResult { ok: false, error: Some(LaunchError::InvalidFolder) };
    }
    if prompt.contains('\0') {
        return LaunchResult { ok: false, error: Some(LaunchError::InvalidPrompt) };
    }
    let name = session_window::folder_name(&folder).to_string();
    match launch_here(&folder, &prompt, agent) {
        Ok(terminal) => {
            crate::log::line(format!("launch: {} in {name} with {terminal}", agent.label()));
            LaunchResult { ok: true, error: None }
        }
        Err(err) => {
            crate::log::line(format!("launch: couldn't start {} in {name}: {err:?}", agent.label()));
            LaunchResult { ok: false, error: Some(err) }
        }
    }
}

/// Resume a saved local Codex conversation after an explicit history-row click.
#[tauri::command]
pub fn open_codex_session(session_id: String) -> bool {
    let Some(folder) = crate::agent_usage::session_directory(&session_id) else { return false };
    let Some(program) = launch_program(LaunchAgent::Codex) else { return false };
    let mut args = program.prefix_args;
    args.extend(resume_codex_args(&session_id));
    let spawn = Spawn {
        program: program.executable.to_string_lossy().into_owned(),
        args,
        env: Vec::new(),
        dir: folder.to_string_lossy().into_owned(),
    };
    #[cfg(windows)]
    {
        let opened = start(&spawn, true).is_ok();
        crate::log::line(format!("session history: Codex resume {}", if opened { "started" } else { "failed" }));
        opened
    }
    #[cfg(not(windows))]
    {
        let _ = spawn;
        false
    }
}

/// "Choose a folder…": the system's folder picker, `start` open in it.
#[tauri::command]
pub async fn pick_folder(app: tauri::AppHandle, start: Option<String>) -> Option<String> {
    let title = crate::i18n::t("Choose a folder…");
    let start = start.filter(|s| valid_folder(s));
    tauri::async_runtime::spawn_blocking(move || platform::pick_folder(&app, start.as_deref(), &title))
        .await
        .ok()
        .flatten()
        .filter(|p| valid_folder(p))
}

/// Brings the session's window forward and pastes the paths into it.
/// "pasted"; "copied" when they could only be put on the clipboard (the
/// window wasn't found, or the keystroke was refused); "failed".
#[tauri::command]
pub async fn drop_into_session(session_id: String, path: Option<String>, paths: Vec<String>) -> String {
    let paths: Vec<String> = paths.into_iter().filter(|p| Path::new(p).is_absolute()).take(32).collect();
    if paths.is_empty() {
        return "failed".into();
    }
    let text = drop_text(&paths, cfg!(windows));
    let folder = path.as_deref().map(session_window::folder_name).unwrap_or_default().to_string();
    tauri::async_runtime::spawn_blocking(move || {
        let in_herdr = herdr::focus(&session_id);
        let owners = session_window::lookup(&session_id);
        #[cfg(windows)]
        let focused = match owners.as_deref() {
            Some(owners) => {
                let terminal_focus = platform::focus_session_window_for_drop(owners, &folder);
                if terminal_focus == platform::DropSessionFocus::NotWindowsTerminal {
                    platform::focus_session_window(owners, &folder) || in_herdr
                } else {
                    terminal_focus.safe_to_paste()
                }
            }
            None => in_herdr,
        };
        #[cfg(not(windows))]
        let focused = owners.as_deref().is_some_and(|owners| platform::focus_session_window(owners, &folder)) || in_herdr;
        crate::log::line(format!("drop: {} file(s) into a session, target selected: {focused}", paths.len()));
        if !focused {
            return if flow::paste::copy(&text) { "copied" } else { "failed" }.to_string();
        }
        // The window takes a moment to come forward and take the keyboard.
        std::thread::sleep(Duration::from_millis(250));
        // A Linux terminal pastes with Ctrl+Shift+V (VS Code's terminal too);
        // Windows Terminal, VS Code and the console with Ctrl+V.
        match flow::paste::paste(&text, cfg!(target_os = "linux")) {
            flow::paste::Outcome::Pasted => "pasted",
            flow::paste::Outcome::Copied => "copied",
            flow::paste::Outcome::Failed => "failed",
        }
        .to_string()
    })
    .await
    .unwrap_or_else(|_| "failed".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn s(v: &[&str]) -> Vec<String> {
        v.iter().map(|x| x.to_string()).collect()
    }

    #[test]
    fn prompt_text_keeps_line_breaks_and_surrounding_whitespace() {
        assert_eq!(clean_prompt("  fix the bug \n\r\n and test it  "), "  fix the bug \n\r\n and test it  ");
        assert_eq!(clean_prompt("   "), "   ");
    }

    #[test]
    fn each_cli_gets_its_initial_prompt_as_a_separate_literal_argument() {
        let prompt = "first: \"quote\"; & safe\r\nsecond: á你好";
        assert_eq!(launch_args(LaunchAgent::Claude, Some(prompt)), vec![prompt]);
        assert_eq!(launch_args(LaunchAgent::Codex, Some(prompt)), vec![prompt]);
        assert_eq!(launch_args(LaunchAgent::Antigravity, Some(prompt)), s(&["-i", prompt]));
        assert_eq!(launch_args(LaunchAgent::Hermes, Some(prompt)), s(&["chat", "-q", prompt]));
        for agent in [LaunchAgent::Claude, LaunchAgent::Codex, LaunchAgent::Antigravity, LaunchAgent::Hermes] {
            assert!(launch_args(agent, None).is_empty());
        }
    }

    #[test]
    fn codex_resume_uses_only_a_validated_session_id_as_a_literal_argument() {
        assert_eq!(resume_codex_args("synthetic-session-1"), s(&["resume", "synthetic-session-1"]));
        assert!(!open_codex_session("--help".into()));
    }

    #[test]
    fn launch_agent_names_are_stable_for_the_bridge() {
        assert_eq!(serde_json::to_string(&LaunchAgent::Claude).unwrap(), "\"claude\"");
        assert_eq!(serde_json::to_string(&LaunchAgent::Codex).unwrap(), "\"codex\"");
        assert_eq!(serde_json::to_string(&LaunchAgent::Antigravity).unwrap(), "\"antigravity\"");
        assert_eq!(serde_json::to_string(&LaunchAgent::Hermes).unwrap(), "\"hermes\"");
    }

    #[cfg(windows)]
    #[test]
    fn npm_cmd_fixture_resolves_its_javascript_entry_without_running_the_shim() {
        let dir = std::env::temp_dir().join(format!("coucou-launch-shim-{}", std::process::id()));
        let module_dir = dir.join("node_modules").join("@synthetic").join("agent");
        std::fs::create_dir_all(&module_dir).unwrap();
        let shim = dir.join("agent.cmd");
        let entry = module_dir.join("cli.js");
        std::fs::write(&entry, "// synthetic entrypoint").unwrap();
        std::fs::write(
            &shim,
            "@echo off\r\nSET \"dp0=%~dp0\"\r\n\"%_prog%\" \"%dp0%\\node_modules\\@synthetic\\agent\\cli.js\" %*\r\n",
        )
        .unwrap();

        let resolved = npm_entrypoint(&shim);
        let matched = resolved.as_deref() == Some(entry.as_path());
        let _ = std::fs::remove_file(&entry);
        let _ = std::fs::remove_file(&shim);
        let _ = std::fs::remove_dir(&module_dir);
        let _ = std::fs::remove_dir(module_dir.parent().unwrap());
        let _ = std::fs::remove_dir(module_dir.parent().unwrap().parent().unwrap());
        let _ = std::fs::remove_dir(dir.join("node_modules"));
        let _ = std::fs::remove_dir(&dir);
        assert!(matched, "synthetic npm shim entrypoint was not resolved");
    }

    #[cfg(windows)]
    #[test]
    fn native_spawn_preserves_prompt_as_one_argument_for_every_agent() {
        let dir = std::env::temp_dir().join(format!("coucou-launch-{}-{}", std::process::id(), std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        std::fs::create_dir(&dir).unwrap();
        let capture = dir.join("capture.js");
        let output = dir.join("argv.json");
        let fixture = "quote: \"double\"; shell: ; & | ^ %PATH% $HOME ` $(synthetic)\nunicode: áé你好";
        std::fs::write(
            &capture,
            "require('node:fs').writeFileSync(process.env.COUCOU_LAUNCH_ARGV, JSON.stringify(process.argv.slice(2)), 'utf8');",
        )
        .unwrap();
        let node = platform::find_on_path("node").expect("synthetic Windows build provides node.exe");
        let program = LaunchProgram { executable: node, prefix_args: vec![capture.to_string_lossy().into_owned()] };
        let expected_args = [
            (LaunchAgent::Claude, vec![fixture.to_string()]),
            (LaunchAgent::Codex, vec![fixture.to_string()]),
            (LaunchAgent::Antigravity, vec!["-i".to_string(), fixture.to_string()]),
            (LaunchAgent::Hermes, vec!["chat".to_string(), "-q".to_string(), fixture.to_string()]),
        ];
        for (agent, expected) in expected_args {
            let spawn = windows_agent_spawn(&dir.to_string_lossy(), agent, &program, fixture);
            let result = Command::new(&spawn.program)
                .args(&spawn.args)
                .current_dir(&spawn.dir)
                .env("COUCOU_LAUNCH_ARGV", &output)
                .output()
                .unwrap();
            let actual = std::fs::read(&output).ok().and_then(|bytes| serde_json::from_slice::<Vec<String>>(&bytes).ok());
            let matched = actual.as_ref().is_some_and(|args| args == &expected);
            let _ = std::fs::remove_file(&output);
            assert!(result.status.success(), "synthetic native launch failed for {}", agent.label());
            assert!(matched, "native argv did not preserve the synthetic prompt for {}", agent.label());
        }
        let _ = std::fs::remove_file(&capture);
        let _ = std::fs::remove_dir(&dir);
    }

    #[test]
    fn invalid_synthetic_input_is_rejected_before_any_process_is_started() {
        let result = launch_session("relative/not-a-folder".into(), "request".into(), LaunchAgent::Claude);
        assert_eq!(result, LaunchResult { ok: false, error: Some(LaunchError::InvalidFolder) });

        let folder = std::env::temp_dir().to_string_lossy().into_owned();
        let result = launch_session(folder, "bad\0prompt".into(), LaunchAgent::Claude);
        assert_eq!(result, LaunchResult { ok: false, error: Some(LaunchError::InvalidPrompt) });
    }

    #[test]
    fn only_an_existing_absolute_folder_is_a_project() {
        let dir = std::env::temp_dir();
        assert!(valid_folder(&dir.to_string_lossy()));
        assert!(!valid_folder(""));
        assert!(!valid_folder("relative/path"));
        assert!(!valid_folder("/no/such/folder/coucou-xyz"));
        let file = dir.join("coucou-launch-test-file.txt");
        std::fs::write(&file, "x").unwrap();
        assert!(!valid_folder(&file.to_string_lossy()), "a file is not a folder");
        let _ = std::fs::remove_file(file);
    }

    #[test]
    fn sh_quote_leaves_plain_paths_and_quotes_the_rest() {
        assert_eq!(sh_quote("/usr/bin/zsh"), "/usr/bin/zsh");
        assert_eq!(sh_quote("it's"), r"'it'\''s'");
        assert_eq!(sh_quote("/opt/my shell/fish"), "'/opt/my shell/fish'");
        assert_eq!(sh_quote(""), "''");
    }

    #[test]
    fn the_shell_runs_claude_with_the_variable_never_the_prompt() {
        assert_eq!(
            shell_command("/bin/zsh", true),
            s(&["/bin/zsh", "-lic", r#"claude "$COUCOU_PROMPT"; exec /bin/zsh -l"#])
        );
        assert_eq!(shell_command("/usr/bin/fish", false), s(&["/usr/bin/fish", "-lic", "claude; exec /usr/bin/fish -l"]));
    }

    #[test]
    fn terminal_is_tried_first_then_the_known_ones_without_duplicates() {
        let list = linux_candidates(Some("kitty -1"));
        assert_eq!(list[0], "kitty");
        assert_eq!(list.iter().filter(|t| *t == "kitty").count(), 1);
        assert_eq!(list[1], "x-terminal-emulator");
        assert_eq!(linux_candidates(None), s(LINUX_TERMINALS));
        assert_eq!(linux_candidates(Some("  ")), s(LINUX_TERMINALS));
    }

    #[test]
    fn each_terminal_gets_the_folder_and_the_command_its_way() {
        let cmd = s(&["/bin/bash", "-lic", "claude; exec /bin/bash -l"]);
        let dir = "/home/me/My Project";
        let with = |t: &str| linux_terminal_args(t, dir, &cmd);
        let tail = |args: Vec<String>, head: &[&str]| {
            let mut want = s(head);
            want.extend(cmd.iter().cloned());
            assert_eq!(args, want);
        };
        tail(with("/usr/bin/gnome-terminal"), &["--working-directory=/home/me/My Project", "--"]);
        tail(with("ptyxis"), &["--new-window", "-d", dir, "--"]);
        tail(with("konsole"), &["--separate", "--workdir", dir, "-e"]);
        tail(with("kitty"), &["--directory", dir]);
        tail(with("alacritty"), &["--working-directory", dir, "-e"]);
        tail(with("wezterm"), &["start", "--always-new-process", "--cwd", dir, "--"]);
        tail(with("foot"), &["--working-directory=/home/me/My Project"]);
        tail(with("x-terminal-emulator"), &["-e"]);
        tail(with("/opt/st/st"), &["-e"]);
    }

    #[test]
    fn linux_hands_the_prompt_in_the_environment_only() {
        let nasty = r#"fix the "login" bug; rm -rf / && echo $HOME `id` $(id)"#;
        let spawn = linux_spawn("/usr/bin/kitty", "/bin/zsh", "/home/me/p", nasty);
        assert_eq!(spawn.program, "/usr/bin/kitty");
        assert_eq!(spawn.dir, "/home/me/p");
        assert_eq!(spawn.env, vec![("COUCOU_PROMPT".to_string(), nasty.to_string())]);
        assert!(spawn.args.iter().all(|a| !a.contains("login") && !a.contains("rm -rf")), "{:?}", spawn.args);
        assert_eq!(spawn.args.last().unwrap(), r#"claude "$COUCOU_PROMPT"; exec /bin/zsh -l"#);

        let empty = linux_spawn("kitty", "/bin/zsh", "/home/me/p", "  \n ");
        assert!(empty.env.is_empty());
        assert_eq!(empty.args.last().unwrap(), "claude; exec /bin/zsh -l");
    }

    #[test]
    fn dropped_paths_are_written_as_a_terminal_drag_writes_them() {
        assert_eq!(
            drop_text(&s(&["/tmp/Screenshot 2026-11-06 at 14.03.22.png"]), false),
            r"/tmp/Screenshot\ 2026-11-06\ at\ 14.03.22.png "
        );
        assert_eq!(drop_text(&s(&["/a/b.txt", "/c/it's (1).md"]), false), r"/a/b.txt /c/it\'s\ \(1\).md ");
        assert_eq!(drop_text(&s(&[r"C:\Users\me\a.png"]), true), r"C:\Users\me\a.png ");
        assert_eq!(
            drop_text(&s(&[r"C:\Users\me\My Shots\a.png", r"D:\x.txt"]), true),
            r#""C:\Users\me\My Shots\a.png" D:\x.txt "#
        );
    }
}
