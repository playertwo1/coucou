use std::{fmt::Write, path::Path};

fn collect(root: &Path, dir: &Path, source: &mut String) {
    for entry in std::fs::read_dir(dir).expect("run npm run synthetic:build first") {
        let entry = entry.unwrap();
        let kind = entry.file_type().unwrap();
        assert!(!kind.is_symlink(), "synthetic assets cannot be symlinks");
        let path = entry.path();
        if kind.is_dir() {
            collect(root, &path, source);
        } else {
            let key = format!(
                "/{}",
                path.strip_prefix(root)
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .replace('\\', "/")
            );
            writeln!(
                source,
                "({key:?}, include_bytes!({:?})),",
                path.to_str().unwrap()
            )
            .unwrap();
        }
    }
}

fn main() {
    let root = std::path::PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .parent()
        .unwrap()
        .join("dist");
    println!("cargo:rerun-if-changed={}", root.display());
    let mut source = String::from("pub static ASSETS: &[(&str, &[u8])] = &[\n");
    collect(&root, &root, &mut source);
    source.push_str("];\n");
    let out = std::path::PathBuf::from(std::env::var_os("OUT_DIR").unwrap()).join("assets.rs");
    std::fs::write(out, source).unwrap();
}
