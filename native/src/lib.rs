use napi::bindgen_prelude::*;
use napi_derive::napi;
use opencv::core::{AlgorithmHint, Mat, MatTraitConst, Point, Scalar, Vec4b, CV_8UC4};
use opencv::imgproc;
use opencv::prelude::MatTraitConstManual;

/// Process a single RGBA frame: convert to grayscale and back to RGBA.
/// `input` is raw RGBA pixel data, `width`/`height` are frame dimensions.
#[napi]
pub fn process_frame(input: Buffer, width: i32, height: i32) -> Result<Buffer> {
    let data = input.as_ref();
    let expected_len = (width * height * 4) as usize;

    if data.len() != expected_len {
        return Err(Error::from_reason(format!(
            "Buffer size mismatch: expected {} bytes ({}x{}x4), got {}",
            expected_len,
            width,
            height,
            data.len()
        )));
    }

    // Create Mat from RGBA buffer (no copy — borrows the slice)
    let src = unsafe {
        Mat::new_rows_cols_with_data_unsafe(
            height,
            width,
            CV_8UC4,
            data.as_ptr() as *mut std::ffi::c_void,
            opencv::core::Mat_AUTO_STEP,
        )
    }
    .map_err(|e| Error::from_reason(format!("Failed to create Mat: {e}")))?;

    // RGBA → Grayscale
    let mut gray = Mat::default();
    imgproc::cvt_color(
        &src,
        &mut gray,
        imgproc::COLOR_RGBA2GRAY,
        0,
        AlgorithmHint::ALGO_HINT_DEFAULT,
    )
    .map_err(|e| Error::from_reason(format!("cvtColor RGBA2GRAY failed: {e}")))?;

    // Apply Gaussian blur for a visible effect
    let mut blurred = Mat::default();
    imgproc::gaussian_blur(
        &gray,
        &mut blurred,
        opencv::core::Size::new(7, 7),
        1.5,
        1.5,
        opencv::core::BORDER_DEFAULT,
        AlgorithmHint::ALGO_HINT_DEFAULT,
    )
    .map_err(|e| Error::from_reason(format!("GaussianBlur failed: {e}")))?;

    // Grayscale → RGBA (so the renderer can display it)
    let mut dst = Mat::default();
    imgproc::cvt_color(
        &blurred,
        &mut dst,
        imgproc::COLOR_GRAY2RGBA,
        0,
        AlgorithmHint::ALGO_HINT_DEFAULT,
    )
    .map_err(|e| Error::from_reason(format!("cvtColor GRAY2RGBA failed: {e}")))?;

    imgproc::circle(
        &mut dst,
        Point::new(width / 2, height / 2),
        50,
        Scalar::new(255.0, 0.0, 0.0, 255.0),
        3,
        imgproc::LINE_8,
        0,
    )
    .map_err(|e| Error::from_reason(format!("circle LINE_8 failed: {e}")))?;

    // Copy output pixels into a Vec<u8>
    let data = dst
        .data_bytes()
        .map_err(|e| Error::from_reason(format!("data access failed: {e}")))?;

    Ok(Buffer::from(data.to_vec()))
}
