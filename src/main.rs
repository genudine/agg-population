use crate::handlers::{get_all_worlds, get_one_world, get_world};
use axum::{response::Html, routing::get, Router};
use std::net::SocketAddr;
use tokio::task::JoinSet;
use tower_http::trace::TraceLayer;

mod handlers;
mod sources;
mod types;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("tower_http=trace")
        .init();

    let db = sled::open("/tmp/agg-population").expect("open");

    let app = Router::new()
        .route("/", get(root))
        .route("/population", get(root))
        .route("/population/all", get(get_all_worlds))
        .route("/population/:world", get(get_one_world))
        .layer(TraceLayer::new_for_http())
        .with_state(db.clone());

    tokio::spawn(async move {
        loop {
            let mut set = JoinSet::new();
            for world in vec![1, 10, 13, 17, 19, 40, 1000, 2000] {
                set.spawn(get_world(db.clone(), world, true));
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
