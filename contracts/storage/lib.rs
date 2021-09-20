#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod contract {
    #[ink(storage)]
    pub struct Storage {
        value: bool,
    }

    impl Storage {
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        #[ink(message)]
        pub fn flip(&mut self) {
            self.value = !self.value;
        }

        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        use ink_lang as ink;

        #[ink::test]
        fn it_works() {
            let mut storage = Storage::new(false);
            assert_eq!(storage.get(), false);
            storage.flip();
            assert_eq!(storage.get(), true);
        }
    }
}
