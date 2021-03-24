use crate::{codec_types::*, utils::is_view_logs_enabled};
use sp_std::prelude::*;

impl mtc::shop::BoardLogs {
    pub fn new() -> Self {
        Self(Vec::new())
    }

    pub fn extend(&mut self, new_logs: Self) {
        if is_view_logs_enabled() {
            self.0.extend(new_logs.0);
        }
    }

    pub fn add<F>(&mut self, f: &F)
    where
        F: Fn() -> mtc::shop::BoardLog,
    {
        if is_view_logs_enabled() {
            self.0.push(f());
        }
    }
}
