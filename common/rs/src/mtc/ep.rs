use libm::{powf, roundf};

pub const INITIAL_EP: u16 = 1000;
pub const EP_BANDWIDTH: u16 = 100;
pub const MAX_EP: u16 = u16::MAX;
pub const MIN_EP: u16 = 1;
pub const EP_K: f32 = 16f32;
pub const EP_UNFINISH_PENALTY: u16 = 30;

pub fn calculate_new_ep(player_ep: u16, player_place: u8, sorted_ghost_eps: &[u16]) -> u16 {
    let player_ep: f32 = player_ep.into();
    let mut diff = 0f32;

    for (&ep, i) in sorted_ghost_eps.iter().zip(0u8..) {
        let s = if player_place - 1 <= i { 1f32 } else { 0f32 };
        diff += EP_K * (s - calculate_expected(player_ep, ep.into()));
    }

    let new = player_ep + diff;

    if new >= MAX_EP as f32 {
        return MAX_EP;
    }
    if new <= MIN_EP as f32 {
        return MIN_EP;
    }

    roundf(new) as u16
}

fn calculate_expected(a: f32, b: f32) -> f32 {
    1.0 / (1.0 + (powf(10f32, (b - a) / 400.0)))
}

pub fn get_ep_band(ep: u16) -> u16 {
    ep / EP_BANDWIDTH
}
