extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;

// We want to use this type for only PackedLayout.
// PackedLayout requires SpreadLayout, so leave it empty.
#[proc_macro_derive(EmptySpreadLayout)]
pub fn codec_types_empty_spread_layout_derive(input: TokenStream) -> TokenStream {
    let ast = syn::parse(input).unwrap();
    impl_empty_spread_layout_macro(&ast)
}

fn impl_empty_spread_layout_macro(ast: &syn::DeriveInput) -> TokenStream {
    let name = &ast.ident;

    let gen = quote! {
        impl ink_storage::traits::SpreadLayout for #name {
            const FOOTPRINT: u64 = 1;

            fn pull_spread(_ptr: &mut ink_storage::traits::KeyPtr) -> Self {
                unimplemented!(
                    "EmptySpreadLayout: unimplemented pull_spread: {}",
                    stringify!(#name)
                );
            }

            fn push_spread(&self, _ptr: &mut ink_storage::traits::KeyPtr) {
                unimplemented!(
                    "EmptySpreadLayout: unimplemented push_spread: {}",
                    stringify!(#name)
                );
            }

            fn clear_spread(&self, _ptr: &mut ink_storage::traits::KeyPtr) {
                unimplemented!(
                    "EmptySpreadLayout: unimplemented clear_spread: {}",
                    stringify!(#name)
                );
            }
        }
    };

    gen.into()
}
