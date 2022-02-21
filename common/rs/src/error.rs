#[cfg(not(feature = "ink"))]
mod notink {
    pub type Result<T> = core::result::Result<T, &'static str>;

    macro_rules! anyhow {
        ($msg:literal $(,)?) => {{
            $msg
        }};
    }
    pub(crate) use anyhow;

    macro_rules! bail {
        ($msg:literal $(,)?) => {
            return Err($msg)
        };
    }
    pub(crate) use bail;

    macro_rules! ensure {
        ($cond:expr, $msg:literal $(,)?) => {
            if !$cond {
                return Err($msg);
            }
        };
    }
    pub(crate) use ensure;
}
#[cfg(not(feature = "ink"))]
pub use notink::*;

#[cfg(feature = "ink")]
mod ink {
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
#[cfg(feature = "ink")]
pub use ink::*;
