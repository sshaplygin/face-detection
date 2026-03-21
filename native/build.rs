extern crate napi_build;

fn main() {
    // Force Xcode's libclang instead of Homebrew's LLVM.
    // Homebrew LLVM 22+ has broken C++ header resolution against the macOS SDK,
    // causing opencv binding generation to fail with "didn't find libc++'s <stddef.h>".
    if std::env::var("LIBCLANG_PATH").is_err() {
        let xcode_libclang =
            "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib";
        if std::path::Path::new(xcode_libclang).join("libclang.dylib").exists() {
            std::env::set_var("LIBCLANG_PATH", xcode_libclang);
        }
    }

    // Set PKG_CONFIG_PATH for OpenCV on macOS
    // Apple Silicon: /opt/homebrew/opt/opencv/lib/pkgconfig
    // Intel Mac:     /usr/local/opt/opencv/lib/pkgconfig
    let pkg_config_paths = [
        "/opt/homebrew/opt/opencv/lib/pkgconfig",
        "/usr/local/opt/opencv/lib/pkgconfig",
    ];

    let existing: String = std::env::var("PKG_CONFIG_PATH").unwrap_or_default();
    let mut paths: Vec<&str> = if existing.is_empty() {
        vec![]
    } else {
        vec![existing.as_str()]
    };

    for p in &pkg_config_paths {
        if std::path::Path::new(p).exists() {
            paths.push(p);
        }
    }

    std::env::set_var("PKG_CONFIG_PATH", paths.join(":"));

    napi_build::setup();
}
