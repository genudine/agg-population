use crate::{
    sources::{fisu, honu, saerro, sanctuary, voidwell},
    types::{Population, Response},
};
use axum::{
    extract::{Path, State},
    Json,
};
use tokio::task::JoinSet;

pub async fn get_one_world(State(db): State<sled::Db>, Path(world): Path<i32>) -> Json<Response> {
    Json(get_world(db, world).await)
}

pub async fn get_all_worlds(State(db): State<sled::Db>) -> Json<Vec<Response>> {
    let mut set = JoinSet::new();
    let mut worlds = vec![Response::default(); 8];

    for world in vec![1, 10, 13, 17, 19, 40, 1000, 2000] {
        set.spawn(get_world(db.clone(), world));
    }

    let mut i = 0;
    while let Some(response) = set.join_next().await {
        worlds[i] = response.unwrap_or_default();
        i += 1;
    }

    Json(worlds)
}

async fn get_world(db: sled::Db, world: i32) -> Response {
    if let Ok(data) = world_from_cache(db.clone(), world) {
        return data;
    }

    let mut response = Response::default();
    response.id = world;

    let mut populations: Vec<Population> = Vec::new();

    let mut set = JoinSet::new();
    set.spawn(async move { ("saerro", saerro(world).await) });
    set.spawn(async move { ("honu", honu(world).await) });
    set.spawn(async move { ("fisu", fisu(world).await) });
    set.spawn(async move { ("voidwell", voidwell(world).await) });
    set.spawn(async move { ("sanctuary", sanctuary(world).await) });

    while let Some(data) = set.join_next().await {
        let (service, population) = data.unwrap_or(("failed", Ok(Population::default())));
        if service == "failed" || population.is_err() {
            continue;
        }

        let population = population.unwrap();
        populations.push(population);
        response.services.insert(service.to_string(), population);
    }

    if (populations.len() as i32) == 0 {
        return response;
    }

    response.average = populations.iter().map(|p| p.total).sum::<i32>() / populations.len() as i32;
    response.factions.nc = populations.iter().map(|p| p.nc).sum::<i32>() / populations.len() as i32;
    response.factions.tr = populations.iter().map(|p| p.tr).sum::<i32>() / populations.len() as i32;
    response.factions.vs = populations.iter().map(|p| p.vs).sum::<i32>() / populations.len() as i32;
    response.cached_at = chrono::Utc::now();

    world_to_cache(db, world, &response);

    response
}

fn world_from_cache(db: sled::Db, world: i32) -> Result<Response, ()> {
    let key = format!("world:{}", world);
    let value = match db.get(key) {
        Ok(Some(value)) => value,
        _ => return Err(()),
    };

    match bincode::deserialize::<Response>(&value) {
        Ok(response) => {
            if response.cached_at + chrono::Duration::minutes(3) < chrono::Utc::now() {
                return Err(());
            }
            Ok(response)
        }
        _ => Err(()),
    }
}

fn world_to_cache(db: sled::Db, world: i32, response: &Response) {
    let key = format!("world:{}", world);
    let value = bincode::serialize(response).unwrap();
    db.insert(key, value).unwrap();
}
