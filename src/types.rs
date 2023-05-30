use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct AllResponse {
    pub worlds: Vec<Response>,
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct Response {
    pub id: i32,
    pub average: i32,
    pub factions: Factions,
    pub services: HashMap<String, Population>,
    #[serde(default)]
    pub cached_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct Factions {
    pub nc: i32,
    pub tr: i32,
    pub vs: i32,
}

#[derive(Deserialize, Serialize, Debug, Clone, Copy, Default)]
pub struct Population {
    pub nc: i32,
    pub tr: i32,
    pub vs: i32,
    #[serde(default)]
    pub total: i32,
}

impl Population {
    pub fn total(&self) -> i32 {
        self.nc + self.tr + self.vs
    }
}
