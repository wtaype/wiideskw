use screenshots::Screen;

/// Captura la pantalla primaria, la reduce si hace falta, y la devuelve como JPEG.
pub fn capture_jpeg_scaled(quality: u8, max_width: u32) -> Option<Vec<u8>> {
    let screens = Screen::all().ok()?;
    let screen = screens.first()?;
    let cap = screen.capture().ok()?;

    let width = cap.width();
    let height = cap.height();
    let raw = cap.as_raw();

    // Windows BGRA -> RGB. JPEG no necesita alpha.
    let mut rgb = Vec::with_capacity((width * height * 3) as usize);
    for chunk in raw.chunks(4) {
        rgb.push(chunk[2]);
        rgb.push(chunk[1]);
        rgb.push(chunk[0]);
    }

    let (out, out_width, out_height) = if width > max_width {
        let new_height = ((height as f32) * (max_width as f32 / width as f32)).round() as u32;
        let img = image::RgbImage::from_raw(width, height, rgb)?;
        let resized = image::imageops::resize(
            &img,
            max_width,
            new_height.max(1),
            image::imageops::FilterType::Triangle,
        );
        (resized.into_raw(), max_width, new_height.max(1))
    } else {
        (rgb, width, height)
    };

    let mut buf = Vec::new();
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, quality);
    encoder
        .encode(&out, out_width, out_height, image::ExtendedColorType::Rgb8)
        .ok()?;
    Some(buf)
}
