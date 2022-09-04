use common::{codec_types::*, mtc::*};
use ink_prelude::{vec, vec::Vec};

pub fn get_turn_and_previous_grade_and_board(
    history: &[mtc::GradeAndBoard],
) -> (u8, u8, mtc::Board) {
    let (turn, mtc::GradeAndBoard { grade, board }) =
        finish::get_turn_and_previous_grade_and_board(history);

    assert!(turn < 40, "max turn exceeded");

    (turn, grade, board)
}

pub fn update_player_mtc_mutable_after_battle(
    player_mtc_mutable: &mut mtc::storage::PlayerMutable,
    new_seed: u64,
) {
    player_mtc_mutable.upgrade_coin =
        shop::coin::decrease_upgrade_coin(player_mtc_mutable.upgrade_coin);

    player_mtc_mutable.battle_ghost_index = battle::organizer::select_battle_ghost_index(
        &player_mtc_mutable.ghost_states,
        player_mtc_mutable.battle_ghost_index,
        new_seed,
    )
    .expect("battle ghost selection failed");
}

pub fn calc_new_ep(place: u8, old_ep: u16) -> u16 {
    if let Some(plus) = match place {
        1 => Some(70),
        2 => Some(50),
        _ => None,
    } {
        return (if old_ep > ep::INITIAL_EP {
            let x = (old_ep - ep::INITIAL_EP) / 40;
            if x < plus {
                plus - x
            } else {
                1
            }
        } else {
            plus
        })
        .saturating_add(old_ep);
    }

    let minus = match place {
        3 => 30,
        4 => 50,
        _ => panic!("unsupported place: {}", place),
    };

    ep::reduce_ep(old_ep, minus)
}

const LEADERBOARD_SIZE: u8 = 100;

pub fn update_leaderboard<A: Eq + Copy>(
    mut leaderboard: Vec<(u16, A)>,
    ep: u16,
    account: &A,
) -> Option<Vec<(u16, A)>> {
    let mut same_account_index_opt = None;
    let mut new_pos_index_opt = None;

    for (index, (iter_ep, iter_account)) in leaderboard.iter().enumerate() {
        if iter_account == account {
            same_account_index_opt = Some(index);
        }
        if new_pos_index_opt.is_none() && iter_ep <= &ep {
            new_pos_index_opt = Some(index);
        }

        if same_account_index_opt.is_some() && new_pos_index_opt.is_some() {
            break;
        }
    }

    if let Some(same_account_index) = same_account_index_opt {
        if let Some(new_pos_index) = new_pos_index_opt {
            if same_account_index < new_pos_index {
                return None;
            }
            if same_account_index == new_pos_index && leaderboard[same_account_index].0 < ep {
                leaderboard[same_account_index].0 = ep;
            } else {
                leaderboard[new_pos_index..=same_account_index].rotate_right(1);
                leaderboard[new_pos_index].0 = ep;
            }
        } else {
            return None;
        }
    } else if let Some(new_pos_index) = new_pos_index_opt {
        leaderboard.insert(new_pos_index, (ep, *account));
        leaderboard.truncate(LEADERBOARD_SIZE.into());
    } else if leaderboard.len() < LEADERBOARD_SIZE.into() {
        leaderboard.push((ep, *account));
    } else {
        return None;
    }

    Some(leaderboard)
}

pub fn build_initial_ghost_states(ep: u16) -> Vec<mtc::GhostState> {
    let health = match ep::get_ep_band(ep) {
        0 => 14,
        1 => 16,
        2 => 18,
        3 => 20,
        4 => 22,
        5 => 24,
        6 => 26,
        7 => 28,
        8.. => 30,
    };

    vec![mtc::GhostState::Active { health }; 3]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calc_new_ep() {
        assert_eq!(calc_new_ep(1, 50), 120);
        assert_eq!(calc_new_ep(2, 50), 100);
        assert_eq!(calc_new_ep(3, 50), 20);
        assert_eq!(calc_new_ep(4, 50), 1);

        assert_eq!(calc_new_ep(1, 500), 565);
        assert_eq!(calc_new_ep(2, 2700), 2701);
    }

    #[test]
    fn test_build_initial_ghost_states() {
        assert_eq!(
            build_initial_ghost_states(1),
            vec![
                mtc::GhostState::Active { health: 14 },
                mtc::GhostState::Active { health: 14 },
                mtc::GhostState::Active { health: 14 }
            ]
        );

        assert_eq!(
            build_initial_ghost_states(299)[0],
            mtc::GhostState::Active { health: 18 }
        );

        assert_eq!(
            build_initial_ghost_states(300)[0],
            mtc::GhostState::Active { health: 20 }
        );

        assert_eq!(
            build_initial_ghost_states(800)[0],
            mtc::GhostState::Active { health: 30 }
        );

        assert_eq!(
            build_initial_ghost_states(1234)[0],
            mtc::GhostState::Active { health: 30 }
        );
    }
}
