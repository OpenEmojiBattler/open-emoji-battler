use common::pow;
use criterion::{criterion_group, criterion_main, Criterion};
use rand::{thread_rng, Rng};

fn criterion_benchmark(c: &mut Criterion) {
    let mut rng = thread_rng();
    let mut account = [0u8; 32];

    c.bench_function("pow::solve", |b| {
        b.iter(|| {
            rng.fill(&mut account[..]);
            pow::solve(&account, rng.gen())
        })
    });
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
