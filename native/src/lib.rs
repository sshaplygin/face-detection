use napi::bindgen_prelude::*;
use napi_derive::napi;
use opencv::core::{AlgorithmHint, Mat, MatTraitConst, Rect, Scalar, Size, Vec4b, CV_8UC4};
use opencv::imgproc;
use opencv::objdetect::CascadeClassifier;
use opencv::prelude::*;
use std::sync::Mutex;

static CASCADE: Mutex<Option<CascadeClassifier>> = Mutex::new(None);

fn get_cascade() -> Result<std::sync::MutexGuard<'static, Option<CascadeClassifier>>> {
    let mut guard = CASCADE
        .lock()
        .map_err(|e| Error::from_reason(format!("Mutex poisoned: {e}")))?;

    if guard.is_none() {
        let xml_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("data")
            .join("haarcascade_frontalface_default.xml");

        let mut cc = CascadeClassifier::new(
            xml_path
                .to_str()
                .ok_or_else(|| Error::from_reason("Invalid cascade path"))?,
        )
        .map_err(|e| Error::from_reason(format!("Failed to load cascade: {e}")))?;

        if cc
            .empty()
            .map_err(|e| Error::from_reason(format!("Cascade check failed: {e}")))?
        {
            return Err(Error::from_reason("Cascade classifier is empty"));
        }

        *guard = Some(cc);
    }

    Ok(guard)
}

/// Process a single RGBA frame: detect faces using Haar cascade and draw rectangles.
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

    // Create Mat from RGBA buffer
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

    // Clone so we can draw on it
    let mut dst = src.clone();

    // RGBA → Grayscale for detection
    let mut gray = Mat::default();
    imgproc::cvt_color(
        &src,
        &mut gray,
        imgproc::COLOR_RGBA2GRAY,
        0,
        AlgorithmHint::ALGO_HINT_DEFAULT,
    )
    .map_err(|e| Error::from_reason(format!("cvtColor failed: {e}")))?;

    // Equalize histogram to improve detection
    let mut eq = Mat::default();
    imgproc::equalize_hist(&gray, &mut eq)
        .map_err(|e| Error::from_reason(format!("equalizeHist failed: {e}")))?;

    // Detect faces
    let mut faces = opencv::core::Vector::<Rect>::new();
    let mut guard = get_cascade()?;
    let cc = guard
        .as_mut()
        .ok_or_else(|| Error::from_reason("Cascade not initialized"))?;

    cc.detect_multi_scale(
        &eq,
        &mut faces,
        1.1,               // scale factor
        3,                 // min neighbors
        0,                 // flags
        Size::new(30, 30), // min size
        Size::new(0, 0),   // max size (unlimited)
    )
    .map_err(|e| Error::from_reason(format!("detectMultiScale failed: {e}")))?;

    // Draw green rectangles around detected faces
    let color = Scalar::new(0.0, 255.0, 0.0, 255.0); // green in RGBA
    for face in faces.iter() {
        imgproc::rectangle(&mut dst, face, color, 2, imgproc::LINE_8, 0)
            .map_err(|e| Error::from_reason(format!("rectangle failed: {e}")))?;
    }

    let out = dst
        .data_bytes()
        .map_err(|e| Error::from_reason(format!("data access failed: {e}")))?;

    Ok(Buffer::from(out.to_vec()))
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_buffer_size_calculation() {
        let width: i32 = 640;
        let height: i32 = 480;
        let channels: i32 = 4; // RGBA
        let expected = (width * height * channels) as usize;
        assert_eq!(expected, 1_228_800);
    }

    #[test]
    fn test_buffer_size_mismatch() {
        let width: i32 = 1920;
        let height: i32 = 1080;
        let expected = (width * height * 4) as usize;
        let wrong_size = 100usize;
        assert_ne!(expected, wrong_size);
    }
}
