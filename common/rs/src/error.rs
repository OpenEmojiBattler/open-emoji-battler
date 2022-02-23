#[cfg(feature = "error")]
pub use anyhow::{bail, ensure, format_err, Result};

#[cfg(not(feature = "error"))]
mod not_error {
    pub type Result<T> = core::result::Result<T, ()>;

    macro_rules! format_err {
        ($msg:literal $(,)?) => {{
            ()
        }};
        ($fmt:expr, $($arg:tt)*) => {
            ()
        };
    }
    pub(crate) use format_err;

    macro_rules! bail {
        ($msg:literal $(,)?) => {
            return Err(())
        };
        ($fmt:expr, $($arg:tt)*) => {
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
        ($cond:expr, $fmt:expr, $($arg:tt)*) => {
            if !$cond {
                return Err(());
            }
        };
    }
    pub(crate) use ensure;
}
#[cfg(not(feature = "error"))]
pub use not_error::*;
