FROM golang:1.24.2 AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go

FROM scratch

WORKDIR /app

COPY --from=builder /src/main .

# RUN chmod +x ./main

ENV FRONTEND_URL=http://event-frontend:3000

EXPOSE 8080

CMD ["./main"]
