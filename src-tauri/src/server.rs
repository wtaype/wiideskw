use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU8, AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use futures_util::{SinkExt, StreamExt};
use once_cell::sync::Lazy;
use tauri::AppHandle;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio_tungstenite::{accept_async, tungstenite::Message};

use crate::capture;
use crate::input;

static RUNNING: AtomicBool = AtomicBool::new(false);
static SERVER_TASK: Lazy<Mutex<Option<tokio::task::JoinHandle<()>>>> =
    Lazy::new(|| Mutex::new(None));

static TARGET_FRAME_MS: AtomicU64 = AtomicU64::new(16); // ~60 fps
static JPEG_QUALITY: AtomicU8 = AtomicU8::new(50);
static MAX_WIDTH: AtomicU32 = AtomicU32::new(720);

pub fn is_running() -> bool {
    RUNNING.load(Ordering::SeqCst)
}

pub fn stop() {
    RUNNING.store(false, Ordering::SeqCst);
    if let Ok(mut task) = SERVER_TASK.lock() {
        if let Some(handle) = task.take() {
            handle.abort();
        }
    }
}

pub async fn start(port: u16, _app: AppHandle) -> anyhow::Result<String> {
    if RUNNING.load(Ordering::SeqCst) {
        return Ok("Servidor ya activo".to_string());
    }

    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(&addr).await?;
    RUNNING.store(true, Ordering::SeqCst);

    let (tx, _rx) = broadcast::channel::<Vec<u8>>(2);

    let tx_capture = tx.clone();
    tokio::task::spawn_blocking(move || loop {
        let started = Instant::now();
        if !RUNNING.load(Ordering::SeqCst) {
            break;
        }

        if tx_capture.receiver_count() > 0 {
            let quality = JPEG_QUALITY.load(Ordering::Relaxed);
            let max_width = MAX_WIDTH.load(Ordering::Relaxed);
            if let Some(frame) = capture::capture_jpeg_scaled(quality, max_width) {
                let _ = tx_capture.send(frame);
            }
        }

        let frame_budget = Duration::from_millis(TARGET_FRAME_MS.load(Ordering::Relaxed));
        if let Some(remaining) = frame_budget.checked_sub(started.elapsed()) {
            std::thread::sleep(remaining);
        }
    });

    let server_task = tokio::spawn(async move {
        while RUNNING.load(Ordering::SeqCst) {
            match listener.accept().await {
                Ok((stream, addr)) => {
                    println!("[WiiDesk] Cliente conectado: {}", addr);
                    let frame_rx = tx.subscribe();
                    tokio::spawn(handle_client(stream, addr, frame_rx));
                }
                Err(e) => {
                    eprintln!("[WiiDesk] Accept error: {}", e);
                    break;
                }
            }
        }
        RUNNING.store(false, Ordering::SeqCst);
    });

    if let Ok(mut task) = SERVER_TASK.lock() {
        *task = Some(server_task);
    }

    let ip = local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "0.0.0.0".to_string());

    Ok(format!("Servidor activo en {}:{}", ip, port))
}

async fn handle_client(
    stream: tokio::net::TcpStream,
    addr: std::net::SocketAddr,
    mut frame_rx: broadcast::Receiver<Vec<u8>>,
) {
    let Ok(ws) = accept_async(stream).await else {
        eprintln!("[WiiDesk] WebSocket handshake failed for {}", addr);
        return;
    };

    let (mut write, mut read) = ws.split();

    let ip = local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "localhost".to_string());
    let hello = serde_json::json!({
        "type": "hello",
        "ip": ip,
        "version": "1.0.0"
    })
    .to_string();
    let _ = write.send(Message::Text(hello.into())).await;

    let mut fps_tick = tokio::time::interval(Duration::from_secs(1));
    let mut frames_sent: u32 = 0;

    loop {
        tokio::select! {
            frame = frame_rx.recv() => {
                match frame {
                    Ok(frame) => {
                        if write.send(Message::Binary(frame.into())).await.is_err() {
                            break;
                        }
                        frames_sent += 1;
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(_) => break,
                }
            }
            msg = read.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        let text_str = text.as_str();
                        if text_str.contains("\"ping\"") {
                            let pong = serde_json::json!({ "type": "pong" }).to_string();
                            if write.send(Message::Text(pong.into())).await.is_err() {
                                break;
                            }
                        } else if text_str.contains("\"settings\"") {
                            apply_stream_settings(text_str);
                        } else {
                            let text_owned = text_str.to_string();
                            tokio::task::spawn_blocking(move || {
                                input::handle_event(&text_owned);
                            });
                        }
                    }
                    Some(Ok(Message::Close(_))) | Some(Err(_)) | None => break,
                    _ => {}
                }
            }
            _ = fps_tick.tick() => {
                let fps = serde_json::json!({
                    "type": "fps",
                    "value": frames_sent
                }).to_string();
                frames_sent = 0;
                if write.send(Message::Text(fps.into())).await.is_err() {
                    break;
                }
            }
        }
    }

    println!("[WiiDesk] Cliente desconectado: {}", addr);
}

fn apply_stream_settings(text: &str) {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(text) else {
        return;
    };

    let fps = value["fps"].as_u64().unwrap_or(60).clamp(15, 60);
    let quality = value["quality"].as_u64().unwrap_or(55).clamp(40, 85) as u8;
    let frame_ms = (1000 / fps).max(16);
    let max_width = if fps >= 45 {
        720
    } else if fps >= 30 {
        960
    } else {
        1280
    };

    TARGET_FRAME_MS.store(frame_ms, Ordering::Relaxed);
    JPEG_QUALITY.store(quality, Ordering::Relaxed);
    MAX_WIDTH.store(max_width, Ordering::Relaxed);
}
