FROM paritytech/ci-linux:production as builder

WORKDIR /oeb

RUN mkdir /oeb/chain
RUN mkdir -p /oeb/common/rs

COPY ./chain /oeb/chain
COPY ./common/rs /oeb/common/rs

RUN cd /oeb/chain && cargo build --release

# ===== SECOND STAGE ======

FROM debian:buster-slim

COPY --from=builder /oeb/chain/target/release/open-emoji-battler /usr/bin

RUN useradd -m -u 1000 -U -s /bin/sh -d /oeb oeb
USER oeb

EXPOSE 30333 9933 9944
VOLUME ["/oeb"]

ENTRYPOINT ["/usr/bin/open-emoji-battler"]
