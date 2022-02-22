#[cfg(feature = "error")]
pub use anyhow::{anyhow, bail, ensure, Result};

#[cfg(not(feature = "error"))]
mod noterror {
    pub type Result<T> = core::result::Result<T, ()>;

    macro_rules! anyhow {
        ($msg:literal $(,)?) => {{
            ()
        }};
    }
    pub(crate) use anyhow;

    macro_rules! bail {
        ($msg:literal $(,)?) => {
            return Err(())
        };
    }
    pub(crate) use bail;

    macro_rules! ensure {
        ($cond:expr, $msg:literal $(,)?) => {
            if !$cond {
                return Err(());
            }
        };
    }
    pub(crate) use ensure;
}
#[cfg(not(feature = "error"))]
pub use noterror::*;
