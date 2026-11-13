// Read the documented token_count records Codex keeps in its local rollouts.
// Other agents do not yet expose a supported, durable local usage format.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

const MAX_FILES: usize = 2048;
const MAX_FILE_BYTES: u64 = 16 * 1024 * 1024;
const MAX_TOTAL_BYTES: u64 = 128 * 1024 * 1024;

#[derive(Clone, Debug, Deserialize)]
struct RolloutLine {
    #[serde(rename = "type")]
    kind: Option<String>,
    timestamp: Option<String>,
    payload: Option<Payload>,
}

#[derive(Clone, Debug, Deserialize)]
struct Payload {
    #[serde(rename = "type")]
    kind: Option<String>,
    id: Option<String>,
    session_id: Option<String>,
    thread_id: Option<String>,
    cwd: Option<String>,
    model: Option<String>,
    info: Option<UsageInfo>,
}

#[derive(Clone, Debug, Deserialize)]
struct UsageInfo {
    total_token_usage: Option<TokenUsage>,
}

#[derive(Clone, Debug, Deserialize)]
struct TokenUsage {
    total_tokens: Option<u64>,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionUsage {
    pub date: String,
    pub project: Option<String>,
    pub model: Option<String>,
    pub tokens: u64,
    pub cost_usd: Option<f64>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyUsage {
    pub date: String,
    pub tokens: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectUsage {
    pub project: String,
    pub tokens: u64,
}

#[derive(Clone, Debug, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub source_available: bool,
    pub partial: bool,
    pub sessions: Vec<SessionUsage>,
    pub daily: Vec<DailyUsage>,
    pub projects: Vec<ProjectUsage>,
    pub cost_usd: Option<f64>,
}

#[derive(Default)]
struct Session {
    project: Option<(String, String)>,
    model: Option<(String, String)>,
    events: BTreeSet<(String, u64)>,
    partial: bool,
}

/// Read the local Codex rollouts; no prompt or response content is returned.
pub fn read() -> Snapshot {
    let home = std::env::var_os("CODEX_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| crate::platform::home_dir().join(".codex"));
    read_sessions(&home.join("sessions"))
}

fn read_sessions(root: &Path) -> Snapshot {
    let Ok(root_meta) = fs::symlink_metadata(root) else {
        return Snapshot::default();
    };
    if !root_meta.is_dir() {
        return Snapshot {
            partial: root_meta.file_type().is_symlink(),
            ..Snapshot::default()
        };
    }
    let mut files = Vec::new();
    let mut partial = false;
    collect_files(root, &mut files, &mut partial);
    files.sort();

    let mut total_bytes = 0u64;
    let texts = files.into_iter().filter_map(|path| {
        let Ok(meta) = fs::symlink_metadata(&path) else {
            partial = true;
            return None;
        };
        if !meta.is_file()
            || meta.len() > MAX_FILE_BYTES
            || total_bytes.saturating_add(meta.len()) > MAX_TOTAL_BYTES
        {
            partial = true;
            return None;
        }
        total_bytes += meta.len();
        let Ok(text) = fs::read_to_string(&path) else {
            partial = true;
            return None;
        };
        Some(text)
    });
    let mut snapshot = from_texts(texts);
    snapshot.partial |= partial;
    snapshot
}

fn collect_files(dir: &Path, files: &mut Vec<PathBuf>, partial: &mut bool) {
    let Ok(entries) = fs::read_dir(dir) else {
        *partial = true;
        return;
    };
    for entry in entries {
        let Ok(entry) = entry else {
            *partial = true;
            continue;
        };
        let path = entry.path();
        let Ok(kind) = entry.file_type() else {
            *partial = true;
            continue;
        };
        if kind.is_symlink() {
            continue;
        }
        if kind.is_dir() {
            collect_files(&path, files, partial);
        } else if kind.is_file() {
            if path.extension().is_some_and(|ext| ext == "zst") {
                *partial = true;
            } else if path.extension().is_some_and(|ext| ext == "jsonl") {
                if files.len() == MAX_FILES {
                    *partial = true;
                    return;
                }
                files.push(path);
            }
        }
    }
}

fn project_name(cwd: &str) -> Option<String> {
    cwd.trim_end_matches(|c| c == '\\' || c == '/')
        .rsplit(|c| c == '\\' || c == '/')
        .next()
        .filter(|name| !name.is_empty())
        .map(str::to_owned)
}

fn valid_utc_timestamp(timestamp: &str) -> bool {
    let Some(date) = timestamp.get(..10) else {
        return false;
    };
    let bytes = date.as_bytes();
    timestamp.ends_with('Z')
        && bytes.len() == 10
        && bytes[0..4].iter().all(u8::is_ascii_digit)
        && bytes[4] == b'-'
        && bytes[5..7].iter().all(u8::is_ascii_digit)
        && bytes[7] == b'-'
        && bytes[8..10].iter().all(u8::is_ascii_digit)
}

fn from_texts(rollouts: impl IntoIterator<Item = String>) -> Snapshot {
    let mut sessions = BTreeMap::<String, Session>::new();
    let mut source_available = false;
    let mut partial = false;

    for text in rollouts {
        source_available = true;
        let mut file_id = None;
        let mut file_project = None;
        let mut file_model = None;
        let mut file_events = Vec::new();
        let mut file_partial = false;

        for line in text.lines() {
            let Ok(line) = serde_json::from_str::<RolloutLine>(line) else {
                file_partial = true;
                continue;
            };
            let Some(payload) = line.payload else {
                continue;
            };
            match line.kind.as_deref() {
                Some("session_meta") => {
                    file_id = payload
                        .session_id
                        .or(payload.id)
                        .or(payload.thread_id)
                        .or(file_id);
                    if let (Some(timestamp), Some(cwd)) = (line.timestamp, payload.cwd) {
                        if valid_utc_timestamp(&timestamp) {
                            file_project = project_name(&cwd).map(|name| (timestamp, name));
                        } else {
                            file_partial = true;
                        }
                    }
                }
                Some("turn_context") => {
                    if let (Some(timestamp), Some(model)) = (line.timestamp, payload.model) {
                        if valid_utc_timestamp(&timestamp) {
                            file_model = Some((timestamp, model));
                        }
                    }
                }
                Some("event_msg") if payload.kind.as_deref() == Some("token_count") => {
                    let Some(timestamp) = line.timestamp.filter(|t| valid_utc_timestamp(t)) else {
                        file_partial = true;
                        continue;
                    };
                    if let Some(tokens) = payload
                        .info
                        .and_then(|i| i.total_token_usage)
                        .and_then(|u| u.total_tokens)
                    {
                        file_events.push((timestamp, tokens));
                    } else {
                        file_partial = true;
                    }
                }
                _ => {}
            }
        }

        let Some(id) = file_id.filter(|id| !id.is_empty()) else {
            partial = true;
            continue;
        };
        let session = sessions.entry(id).or_default();
        if file_project.as_ref().is_some_and(|candidate| {
            session
                .project
                .as_ref()
                .map_or(true, |current| candidate.0 > current.0)
        }) {
            session.project = file_project;
        }
        if file_model.as_ref().is_some_and(|candidate| {
            session
                .model
                .as_ref()
                .map_or(true, |current| candidate.0 > current.0)
        }) {
            session.model = file_model;
        }
        session.events.extend(file_events);
        session.partial |= file_partial;
    }

    let mut snapshot = Snapshot {
        source_available,
        partial,
        ..Snapshot::default()
    };
    let mut daily = BTreeMap::<String, u64>::new();
    let mut projects = BTreeMap::<String, u64>::new();

    for (_, session) in sessions {
        snapshot.partial |= session.partial;
        let mut previous = 0u64;
        let mut total = 0u64;
        let mut latest_date = String::new();
        for (timestamp, tokens) in &session.events {
            let date = &timestamp[..10];
            let delta = tokens.saturating_sub(previous);
            let daily_total = daily.entry(date.to_owned()).or_default();
            *daily_total = daily_total.saturating_add(delta);
            previous = previous.max(*tokens);
            total = total.max(*tokens);
            latest_date = date.to_owned();
        }
        if session.events.is_empty() {
            continue;
        }
        if let Some((_, name)) = &session.project {
            let project_total = projects.entry(name.clone()).or_default();
            *project_total = project_total.saturating_add(total);
        }
        snapshot.sessions.push(SessionUsage {
            date: latest_date,
            project: session.project.map(|(_, name)| name),
            model: session.model.map(|(_, model)| model),
            tokens: total,
            cost_usd: None,
        });
    }

    snapshot
        .sessions
        .sort_by(|a, b| b.date.cmp(&a.date).then_with(|| a.project.cmp(&b.project)));
    snapshot.daily = daily
        .into_iter()
        .map(|(date, tokens)| DailyUsage { date, tokens })
        .collect();
    snapshot.projects = projects
        .into_iter()
        .map(|(project, tokens)| ProjectUsage { project, tokens })
        .collect();
    snapshot.projects.sort_by(|a, b| {
        b.tokens
            .cmp(&a.tokens)
            .then_with(|| a.project.cmp(&b.project))
    });
    snapshot
}

#[cfg(test)]
mod tests {
    use super::*;

    const ROLLOUT: &str = concat!(
        r#"{"timestamp":"2026-11-12T23:59:00Z","type":"session_meta","payload":{"id":"synthetic-a","cwd":"C:\\Synthetic\\Garden","base_instructions":{"text":"must not be retained"}}}"#,
        "\n",
        r#"{"timestamp":"2026-11-12T23:59:30Z","type":"turn_context","payload":{"model":"synthetic-no-price"}}"#,
        "\n",
        r#"{"timestamp":"2026-11-12T23:59:59Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":80,"output_tokens":20,"total_tokens":100}}}}"#,
        "\n",
        r#"{"timestamp":"2026-11-13T00:01:00Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":120,"output_tokens":30,"total_tokens":150}}}}"#,
        "\n",
    );

    #[test]
    fn totals_are_deduplicated_and_daily_usage_uses_cumulative_deltas() {
        let snapshot = from_texts([ROLLOUT.into(), ROLLOUT.into()]);
        assert!(snapshot.source_available);
        assert!(!snapshot.partial);
        assert_eq!(snapshot.sessions.len(), 1);
        assert_eq!(snapshot.sessions[0].tokens, 150);
        assert_eq!(snapshot.sessions[0].project.as_deref(), Some("Garden"));
        assert_eq!(
            snapshot.sessions[0].model.as_deref(),
            Some("synthetic-no-price")
        );
        assert_eq!(snapshot.sessions[0].cost_usd, None);
        assert_eq!(
            snapshot.projects,
            [ProjectUsage {
                project: "Garden".into(),
                tokens: 150
            }]
        );
        assert_eq!(
            snapshot.daily,
            [
                DailyUsage {
                    date: "2026-11-12".into(),
                    tokens: 100
                },
                DailyUsage {
                    date: "2026-11-13".into(),
                    tokens: 50
                },
            ]
        );
    }

    #[test]
    fn truncated_lines_mark_partial_without_turning_missing_cost_into_zero() {
        let text = format!("{ROLLOUT}{{\"timestamp\":\"2026-11-13T00:02:00Z\",\"type\":");
        let snapshot = from_texts([text]);
        assert!(snapshot.partial);
        assert_eq!(snapshot.sessions[0].tokens, 150);
        assert_eq!(snapshot.sessions[0].cost_usd, None);
    }

    #[test]
    fn absent_source_or_project_stays_unknown() {
        let empty = from_texts(std::iter::empty::<String>());
        assert!(!empty.source_available);
        assert!(empty.sessions.is_empty());

        let no_project = concat!(
            r#"{"timestamp":"2026-11-13T12:00:00Z","type":"session_meta","payload":{"id":"synthetic-no-project"}}"#,
            "\n",
            r#"{"timestamp":"2026-11-13T12:01:00Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"total_tokens":7}}}}"#,
            "\n",
        );
        let snapshot = from_texts([no_project.into()]);
        assert_eq!(snapshot.sessions[0].project, None);
        assert!(snapshot.projects.is_empty());
        assert_eq!(snapshot.sessions[0].tokens, 7);
    }

    #[test]
    fn only_the_documented_local_codex_records_are_aggregated() {
        let prompt_only = r#"{"timestamp":"2026-11-13T12:00:00Z","type":"response_item","payload":{"type":"message","role":"user","content":"private synthetic prompt"}}"#;
        let snapshot = from_texts([prompt_only.into()]);
        assert!(snapshot.sessions.is_empty());
        assert!(snapshot.daily.is_empty());
    }
}
