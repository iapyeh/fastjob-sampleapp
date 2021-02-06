module github.com/iapyeh/fastjob-sampleapp

go 1.15

require (
	github.com/dgrr/fastws v1.0.3
	github.com/fasthttp/router v1.3.4
	github.com/gobwas/ws v1.0.4
	github.com/golang/protobuf v1.4.3
	github.com/golang/snappy v0.0.2
	github.com/iapyeh/fastjob v1.1.6
	github.com/iapyeh/fastjob-python3 v0.0.0-20200503143808-f1285d793f8d
	github.com/iapyeh/go-python3 v0.0.0-20200726030521-3962d9f7c333
	nhooyr.io/websocket v1.8.6
)

// development settings
//replace github.com/iapyeh/fastjob => ../fastjob
//replace github.com/iapyeh/fastjob-python3 => ../fastjob-python3
//replace github.com/iapyeh/go-python3 => ../go-python3
