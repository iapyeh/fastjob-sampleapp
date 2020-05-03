#go clean 
port=2990
echo URL: http://localhost:$port
go run -race  *.go --port=$port
