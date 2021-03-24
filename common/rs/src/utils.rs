pub fn is_view_logs_enabled() -> bool {
    cfg!(feature = "view-logs")
}

pub fn partial_bytes_to_u64(array: &[u8]) -> u64 {
    ((array[0] as u64) << 56)
        + ((array[1] as u64) << 48)
        + ((array[2] as u64) << 40)
        + ((array[3] as u64) << 32)
        + ((array[4] as u64) << 24)
        + ((array[5] as u64) << 16)
        + ((array[6] as u64) << 8)
        + (array[7] as u64)
}
