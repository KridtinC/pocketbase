FROM golang:1.22-alpine AS build
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum* ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api  ./cmd/api  \
 && CGO_ENABLED=0 GOOS=linux go build -o /out/sync ./cmd/sync

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
COPY --from=build /out/api  /usr/local/bin/api
COPY --from=build /out/sync /usr/local/bin/sync
EXPOSE 8080
CMD ["/usr/local/bin/api"]
