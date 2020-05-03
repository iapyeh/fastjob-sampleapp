module github.com/iapyeh/fastjob-sampleapp

go 1.13

require (
	github.com/golang/protobuf v1.4.0
	github.com/iapyeh/fastjob v0.0.0-20200416034333-6404ca71222f
	github.com/iapyeh/fastjob-python3 v0.0.0-20200225083117-70774c9a0a46
	github.com/iapyeh/go-python3 v0.0.0-20200502140543-6a69e55d2187
	github.com/tsliwowicz/go-wrk v0.0.0-20190307083600-9e85e2e35df0 // indirect
	github.com/valyala/fasthttp v1.12.0
)

// development settings
//replace github.com/iapyeh/fastjob => ../fastjob
//replace github.com/iapyeh/fastjob-python3 => ../fastjob-python3
//replace github.com/iapyeh/go-python3 => ../go-python3
