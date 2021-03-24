const MAX_COIN: u8 = 8;

pub fn get_initial_coin_by_turn(turn: u8) -> u8 {
    let coin = turn + 2;
    if coin > MAX_COIN {
        MAX_COIN
    } else {
        coin
    }
}

pub fn decrease_upgrade_coin(upgrade_coin: Option<u8>) -> Option<u8> {
    match upgrade_coin {
        Some(c) => {
            if c > 0 {
                Some(c - 1)
            } else {
                Some(0)
            }
        }
        None => None,
    }
}

pub fn get_upgrade_coin(grade: u8) -> Option<u8> {
    match grade {
        2 => Some(5),
        3 => Some(7),
        4 => Some(8),
        5 => Some(9),
        6 => Some(9),
        _ => None,
    }
}
