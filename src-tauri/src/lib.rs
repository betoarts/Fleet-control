use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(mobile)]
            {
                if let Err(e) = app.handle().plugin(tauri_plugin_notification::init()) {
                    eprintln!("Aviso: Falha ao inicializar plugin de notificacao: {:?}", e);
                }
                if let Err(e) = app.handle().plugin(tauri_plugin_geolocation::init()) {
                    eprintln!("Aviso: Falha ao inicializar plugin de geolocalizacao: {:?}", e);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
