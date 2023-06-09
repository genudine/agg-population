use crate::handlers::{get_all_worlds, get_one_world, get_world};
use axum::{response::Html, routing::get, Router};
use r2d2_sqlite::{rusqlite::params, SqliteConnectionManager};
use std::net::SocketAddr;
use tokio::task::JoinSet;
use tower_http::trace::TraceLayer;

mod handlers;
mod sources;
mod types;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("tower_http=trace".parse().unwrap()),
        )
        .init();

    let sqlite_manager = SqliteConnectionManager::memory();
    let pool = r2d2::Pool::new(sqlite_manager).unwrap();
    pool.get()
        .unwrap()
        .execute(
            "CREATE TABLE worlds (id INTEGER NOT NULL PRIMARY KEY, data BLOB);",
            params![],
        )
        .unwrap();

    let app = Router::new()
        .route("/", get(root))
        .route("/population", get(root))
        .route("/population/all", get(get_all_worlds))
        .route("/population/:world", get(get_one_world))
        .layer(TraceLayer::new_for_http())
        .with_state(pool.clone());

    tokio::spawn(async move {
        loop {
            let mut set = JoinSet::new();
            for world in vec![1, 10, 13, 17, 19, 40, 1000, 2000] {
                set.spawn(get_world(pool.clone(), world, true));
            }

            while let Some(_) = set.join_next().await {}

            tokio::time::sleep(tokio::time::Duration::from_secs(60 * 3)).await;
        }
    });

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::debug!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn root() -> Html<&'static str> {
    Html(include_str!("./html/index.html"))
}
