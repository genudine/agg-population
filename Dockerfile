FROM rust:1.69.0-bullseye as rust-base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl clang
ARG MOLD_VERSION=1.11.0
RUN curl -sSL https://github.com/rui314/mold/releases/download/v${MOLD_VERSION}/mold-${MOLD_VERSION}-x86_64-linux.tar.gz | tar xzv && \
    mv mold-${MOLD_VERSION}-x86_64-linux/bin/mold /mold && \
    rm -rf mold-${MOLD_VERSION}-x86_64-linux
ENV CARGO_TARGET_X86_64_UNKNOWN_LINUX_GNU_LINKER=clang
ENV RUSTFLAGS="-C link-arg=-fuse-ld=/mold"

FROM rust-base as builder
COPY . .
ENV CARGO_TARGET_X86_64_UNKNOWN_LINUX_GNU_LINKER=clang
ENV RUSTFLAGS="-C link-arg=-fuse-ld=/mold"
RUN cargo build --release --bin agg-population

FROM debian:bullseye-slim as runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/agg-population /app
ENTRYPOINT ["/app"]