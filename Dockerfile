FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install only the required packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    g++ \
    make \
    libc6-dev && \
    rm -rf /var/lib/apt/lists/*

# Create an unprivileged user
RUN useradd \
    --create-home \
    --shell /usr/sbin/nologin \
    judge

USER judge

WORKDIR /workspace

CMD ["sleep", "infinity"]