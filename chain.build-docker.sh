#!/bin/sh -ex
DOCKER_BUILDKIT=1 docker build -f chain.Dockerfile -t $1 .
