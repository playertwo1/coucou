// No Coucou backend, Tauri plugins, agent listener, native IPC or user-data reader.
#![cfg_attr(not(test), windows_subsystem = "windows")]
use std::{
    borrow::Cow,
    time::{SystemTime, UNIX_EPOCH},
};
use tao::{
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use wry::{http::Response, NewWindowResponse, WebContext, WebViewBuilder};

include!(concat!(env!("OUT_DIR"), "/assets.rs"));

const CSP: &str = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";

fn allowed_navigation(url: &str) -> bool {
    [
        "http://coucou-synthetic.localhost",
        "coucou-synthetic://localhost",
    ]
    .iter()
    .any(|origin| {
        url == *origin
            || url
                .strip_prefix(*origin)
                .is_some_and(|tail| tail.starts_with('/'))
    })
}

fn asset(path: &str) -> Option<&'static [u8]> {
    let path = if path == "/" { "/index.html" } else { path };
    ASSETS
        .iter()
        .find(|(name, _)| *name == path)
        .map(|(_, bytes)| *bytes)
}

fn mime(path: &str) -> &'static str {
    if path == "/" || path.ends_with(".html") {
        "text/html; charset=utf-8"
    } else if path.ends_with(".js") {
        "text/javascript; charset=utf-8"
    } else if path.ends_with(".css") {
        "text/css; charset=utf-8"
    } else if path.ends_with(".svg") {
        "image/svg+xml"
    } else if path.ends_with(".woff2") {
        "font/woff2"
    } else {
        "application/octet-stream"
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let run = format!(
        "{}-{}",
        std::process::id(),
        SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos()
    );
    let profile =
        std::path::PathBuf::from(std::env::var_os("USERPROFILE").ok_or("USERPROFILE unavailable")?)
            .join(".codex/.tmp/coucou-synthetic")
            .join(run);
    std::fs::create_dir_all(profile.parent().unwrap())?;
    std::fs::create_dir(&profile)?;
    let mut context = WebContext::new(Some(profile));
    let event_loop = EventLoop::new();
    let window = WindowBuilder::new()
        .with_title("Coucou Synthetic")
        .with_inner_size(tao::dpi::LogicalSize::new(960.0, 620.0))
        .build(&event_loop)?;
    let _webview = WebViewBuilder::new_with_web_context(&mut context)
        .with_clipboard(false)
        .with_navigation_handler(|url| allowed_navigation(&url))
        .with_new_window_req_handler(|_, _| NewWindowResponse::Deny)
        .with_custom_protocol("coucou-synthetic".into(), |_, request| {
            let path = request.uri().path();
            let body = asset(path);
            Response::builder().status(if body.is_some() { 200 } else { 404 })
                .header("Content-Type", mime(path))
                .header("Content-Security-Policy", CSP)
                .header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), clipboard-read=(), clipboard-write=()")
                .body(Cow::Borrowed(body.unwrap_or(b"Not found"))).unwrap()
        })
        .with_url("coucou-synthetic://localhost/")
        .build(&window)?;
    event_loop.run(move |event, _, flow| {
        *flow = ControlFlow::Wait;
        if let Event::WindowEvent {
            event: WindowEvent::CloseRequested,
            ..
        } = event
        {
            *flow = ControlFlow::Exit;
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn assets_are_compiled_and_arbitrary_files_are_unavailable() {
        assert!(asset("/").unwrap().starts_with(b"<!doctype html>"));
        for path in [
            "/../settings.json",
            "/C:/Users/settings.json",
            "/.codex/auth.json",
            "/%2e%2e/auth.json",
        ] {
            assert!(asset(path).is_none());
        }
    }

    #[test]
    fn external_navigation_and_connections_are_denied() {
        assert!(allowed_navigation(
            "http://coucou-synthetic.localhost/index.html"
        ));
        for url in [
            "https://example.com",
            "file:///C:/Windows",
            "http://coucou-synthetic.localhost.evil/index.html",
            "http://localhost:1420",
        ] {
            assert!(!allowed_navigation(url));
        }
        assert!(CSP.contains("connect-src 'none'"));
    }
}
