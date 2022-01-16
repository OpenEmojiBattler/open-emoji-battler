extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;

// layout for packed, one-cell storage items, to support recursive types with boxes
#[proc_macro_derive(SpreadLayoutOneStorageCell)]
pub fn codec_types_empty_spread_layout_derive(input: TokenStream) -> TokenStream {
    let ast = syn::parse(input).unwrap();
    impl_empty_spread_layout_macro(&ast)
}

fn impl_empty_spread_layout_macro(ast: &syn::DeriveInput) -> TokenStream {
    let name = &ast.ident;

    let gen = quote! {
        impl ink_storage::traits::SpreadLayout for #name {
            const FOOTPRINT: u64 = 1;
            const REQUIRES_DEEP_CLEAN_UP: bool = false;


            fn pull_spread(ptr: &mut ink_storage::traits::KeyPtr) -> Self {
                ink_storage::traits::forward_pull_packed::<Self>(ptr)
            }

            fn push_spread(&self, ptr: &mut ink_storage::traits::KeyPtr) {
                ink_storage::traits::forward_push_packed::<Self>(self, ptr)
            }

            fn clear_spread(&self, ptr: &mut ink_storage::traits::KeyPtr) {
                ink_storage::traits::forward_clear_packed::<Self>(self, ptr)
            }
        }
    };

    gen.into()
}
