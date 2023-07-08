use chrono::{Duration, Utc};

use crate::types::Population;

pub async fn saerro(world: i32) -> Result<Population, ()> {
    #[derive(serde::Deserialize)]
    struct World {
        pub population: Population,
    }

    #[derive(serde::Deserialize)]
    struct Data {
        pub world: World,
    }

    #[derive(serde::Deserialize)]
    struct Response {
        pub data: Data,
    }

    let url = format!(
        "https://saerro.ps2.live/graphql?query={{ world(by: {{id: {}}}) {{ population {{ nc tr vs }} }}}}",
        world
    );
    let response = reqwest::get(url)
        .await
        .unwrap()
        .json::<Response>()
        .await
        .unwrap();

    Ok(Population {
        nc: response.data.world.population.nc,
        tr: response.data.world.population.tr,
        vs: response.data.world.population.vs,
        total: response.data.world.population.total(),
    })
}

pub async fn honu(world: i32) -> Result<Population, ()> {
    #[derive(serde::Deserialize)]
    struct Response {
        pub nc: i32,
        pub tr: i32,
        pub vs: i32,
        pub ns_vs: i32,
        pub ns_nc: i32,
        pub ns_tr: i32,
    }

    let url = format!("https://wt.honu.pw/api/population/{}", world);
    let response = reqwest::get(url)
        .await
        .unwrap()
        .json::<Response>()
        .await
        .unwrap();

    Ok(Population {
        nc: response.nc + response.ns_nc,
        tr: response.tr + response.ns_tr,
        vs: response.vs + response.ns_vs,
        total: response.nc
            + response.tr
            + response.vs
            + response.ns_nc
            + response.ns_tr
            + response.ns_vs,
    })
}

pub async fn fisu(world: i32) -> Result<Population, ()> {
    #[derive(serde::Deserialize)]
    struct Root {
        pub result: Vec<Result>,
    }

    #[derive(serde::Deserialize)]
    struct Result {
        pub vs: i32,
        pub nc: i32,
        pub tr: i32,
        pub ns: i32,
    }

    let subdomain = match world {
        1000 => "ps4us.ps2",
        2000 => "ps4eu.ps2",
        _ => "ps2",
    };

    let url = format!(
        "https://{}.fisu.pw/api/population/?world={}",
        subdomain, world
    );
    let response = reqwest::get(url)
        .await
        .unwrap()
        .json::<Root>()
        .await
        .unwrap();

    Ok(Population {
        nc: response.result[0].nc,
        tr: response.result[0].tr,
        vs: response.result[0].vs,
        total: response.result[0].nc
            + response.result[0].tr
            + response.result[0].vs
            + response.result[0].ns,
    })
}

pub async fn voidwell(world: i32) -> Result<Population, ()> {
    if world == 1000 || world == 2000 {
        return Err(());
    }

    #[derive(serde::Deserialize)]
    struct Root {
        #[serde(rename = "onlineCharacters")]
        pub online_characters: i32,
        #[serde(rename = "zoneStates")]
        pub zone_states: Vec<ZoneState>,
    }

    #[derive(serde::Deserialize)]
    struct ZoneState {
        pub population: VoidwellPopulation,
    }

    #[derive(serde::Deserialize)]
    struct VoidwellPopulation {
        pub vs: i32,
        pub nc: i32,
        pub tr: i32,
        pub ns: i32,
    }

    let platform = match world {
        1000 => "ps4us",
        2000 => "ps4eu",
        _ => "pc",
    };

    let url = format!(
        "https://api.voidwell.com/ps2/worldstate/{}?platform={}",
        world, platform
    );
    let response = reqwest::get(url)
        .await
        .unwrap()
        .json::<Root>()
        .await
        .unwrap();

    let ns_avg: i32 = response
        .zone_states
        .iter()
        .map(|zone| zone.population.ns)
        .sum::<i32>()
        / 3;

    let nc = response
        .zone_states
        .iter()
        .map(|zone| zone.population.nc)
        .sum::<i32>()
        + ns_avg;

    let tr = response
        .zone_states
        .iter()
        .map(|zone| zone.population.tr)
        .sum::<i32>()
        + ns_avg;

    let vs = response
        .zone_states
        .iter()
        .map(|zone| zone.population.vs)
        .sum::<i32>()
        + ns_avg;

    Ok(Population {
        nc,
        tr,
        vs,
        total: response.online_characters,
    })
}

pub async fn sanctuary(world: i32) -> Result<Population, ()> {
    // No PS4 nor Jaeger
    if world == 1000 || world == 2000 || world == 19 {
        return Err(());
    }

    #[derive(serde::Deserialize)]
    struct Root {
        pub world_population_list: Vec<World>,
    }

    #[derive(serde::Deserialize)]
    struct World {
        pub population: SanctuaryPopulation,
        pub timestamp: i64,
    }

    #[derive(serde::Deserialize)]
    struct SanctuaryPopulation {
        #[serde(rename = "VS")]
        pub vs: i32,
        #[serde(rename = "NC")]
        pub nc: i32,
        #[serde(rename = "TR")]
        pub tr: i32,
        #[serde(rename = "NSO")]
        pub nso: i32,
    }

    let url = format!(
        "https://census.lithafalcon.cc/get/ps2/world_population?c:censusJSON=false&world_id={}",
        world
    );
    let response = reqwest::get(url)
        .await
        .unwrap()
        .json::<Root>()
        .await
        .unwrap();

    // error if over 15 minutes old
    if response.world_population_list[0].timestamp
        < (Utc::now() - Duration::minutes(15)).timestamp()
    {
        return Err(());
    }

    Ok(Population {
        nc: response.world_population_list[0].population.nc,
        tr: response.world_population_list[0].population.tr,
        vs: response.world_population_list[0].population.vs,
        total: response.world_population_list[0].population.nc
            + response.world_population_list[0].population.tr
            + response.world_population_list[0].population.vs
            + response.world_population_list[0].population.nso,
    })
}

pub async fn niumside(world: i32) -> Result<Population, ()> {
    #[derive(serde::Deserialize)]
    struct Root {
        pub pop: Vec<Pop>,
    }

    #[derive(serde::Deserialize)]
    struct Pop {
        pub zones: Vec<Zone>,
    }

    #[derive(serde::Deserialize)]
    struct Zone {
        pub factions: Vec<Faction>,
    }

    #[derive(serde::Deserialize)]
    struct Faction {
        pub faction_id: i32,
        pub teams: Vec<Team>,
    }

    #[derive(serde::Deserialize)]
    struct Team {
        pub team_id: i32,
        pub team_population: i32,
    }

    let url = format!(
        "https://niumside-poptracker.shuttleapp.rs/api/population?world={}",
        world
    );
    let response = reqwest::get(url)
        .await
        .unwrap()
        .json::<Root>()
        .await
        .unwrap();

    fn extract(root: &Root, team_id: i32) -> i32 {
        root.pop
            .iter()
            .map(|pop| {
                pop.zones
                    .iter()
                    .map(|zone| {
                        let faction = match zone.factions.iter().find(|faction| {
                            faction.faction_id == team_id || faction.faction_id == 4
                        }) {
                            Some(faction) => faction,
                            None => return 0,
                        };

                        match faction.teams.iter().find(|team| team.team_id == team_id) {
                            Some(team) => team.team_population,
                            None => 0,
                        }
                    })
                    .sum::<i32>()
            })
            .sum::<i32>()
    }

    let vs = extract(&response, 1);
    let nc = extract(&response, 2);
    let tr = extract(&response, 3);

    Ok(Population {
        nc,
        tr,
        vs,
        total: nc + tr + vs,
    })
}
