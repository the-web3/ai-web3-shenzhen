FROM golang:1.24-alpine3.21 as builder

RUN apk add --no-cache make ca-certificates gcc musl-dev linux-headers git jq bash

COPY ./go.mod /app/go.mod
COPY ./go.sum /app/go.sum

WORKDIR /app

RUN go mod download

ARG CONFIG=oracle-node.yml

# build oracle-node with the shared go.mod & go.sum files
COPY . /app/oracle-node

WORKDIR /app/oracle-node

RUN make

FROM alpine:3.18

COPY --from=builder /app/oracle-node/oracle-node /usr/local/bin
COPY --from=builder /app/oracle-node/${CONFIG} /app/oracle-node/${CONFIG}

WORKDIR /app/oracle-node

ENTRYPOINT ["oracle-node"]
