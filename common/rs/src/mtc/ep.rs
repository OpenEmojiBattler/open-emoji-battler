pub const INITIAL_EP: u16 = 300;
pub const EP_BANDWIDTH: u16 = 100;
pub const MAX_EP: u16 = u16::MAX;
pub const MIN_EP: u16 = 1;
pub const EP_K: f32 = 16f32;
pub const EP_UNFINISH_PENALTY: u16 = 60;

pub fn get_ep_band(ep: u16) -> u16 {
    ep / EP_BANDWIDTH
}

pub fn reduce_ep(ep: u16, minus: u16) -> u16 {
    let e = ep.saturating_sub(minus);
    if e > MIN_EP {
        e
    } else {
        MIN_EP
    }
}

#[cfg(feature = "chain")]
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

    libm::roundf(new) as u16
}

#[cfg(feature = "chain")]
fn calculate_expected(a: f32, b: f32) -> f32 {
    1.0 / (1.0 + (libm::powf(10f32, (b - a) / 400.0)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reduce_ep() {
        assert_eq!(reduce_ep(10, 0), 10);
        assert_eq!(reduce_ep(10, 5), 5);
        assert_eq!(reduce_ep(10, 10), 1);
        assert_eq!(reduce_ep(10, 11), 1);
    }
}
