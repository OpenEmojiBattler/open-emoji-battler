use blake2_rfc::blake2b::blake2b;

const THRESHOLD: u32 = 2655;

pub fn check_solution(account: &[u8; 32], count: u32, solution: u64) -> bool {
    let mut input = [0u8; 128];

    input[0..32].copy_from_slice(account);
    input[32..36].copy_from_slice(&count.to_le_bytes()[..]);
    input[36] = 123;
    input[120..].copy_from_slice(&solution.to_le_bytes()[..]);

    let result = blake2b(32, &[], &input);
    let full_hash = result.as_bytes();

    let n = u32::from_le_bytes([full_hash[0], full_hash[1], full_hash[2], full_hash[3]]);

    n < THRESHOLD
}

// works, but poor performance
pub fn solve(account: &[u8; 32], count: u32) -> u64 {
    let mut input = [0u8; 128];

    input[0..32].copy_from_slice(account);
    input[32..36].copy_from_slice(&count.to_le_bytes()[..]);
    input[36] = 123;

    let mut solution = 0u64;

    loop {
        input[120..].copy_from_slice(&solution.to_le_bytes()[..]);

        let result = blake2b(32, &[], &input);
        let full_hash = result.as_bytes();

        let n = u32::from_le_bytes([full_hash[0], full_hash[1], full_hash[2], full_hash[3]]);

        if n < THRESHOLD {
            return solution;
        }

        solution += 1;
    }
}

// fn difficulty_to_threshold(difficulty: u8) -> u32 {
//     //let d = 175.0;
//     let d = difficulty as f64;
//     2.0f64.powf((255.999-d)/8.0).floor() as u32
// }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_pow_solution() {
        let mut account = [0u8; 32];
        account[..3].copy_from_slice(&[1, 2, 3]);
        let count = 1;
        let solution = u64::from_le_bytes([0, 0, 0, 0, 94, 95, 51, 0]);
        let b = check_solution(&account, count, solution);
        assert_eq!(b, true);
    }

    #[test]
    #[ignore]
    fn test_solve() {
        let mut account = [0u8; 32];
        account[..3].copy_from_slice(&[1, 2, 3]);
        let count = 1;
        let solution = solve(&account, count);
        assert_eq!(check_solution(&account, count, solution), true);
    }
}
