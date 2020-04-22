//unittest of fastjob
// Should work with unittest.html
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	jsonpb "github.com/golang/protobuf/jsonpb"
	"github.com/golang/protobuf/proto"
	_ "github.com/golang/protobuf/ptypes"
	any "github.com/golang/protobuf/ptypes/any"
	fastjob "github.com/iapyeh/fastjob"
	fastjobpy "github.com/iapyeh/fastjob-python3"
	model "github.com/iapyeh/fastjob/model"
)

type Result = model.Result
type RequestCtx = model.RequestCtx
type FileUploadCtx = model.FileUploadCtx

// Performance Test
// wrk -t 5 -c 20 -d 3 -H "Cookie: uuid=2c5a8b68-7e84-4504-a4b6-52c2dd570d32" http://localhost:2990/objsh/trace/whoami
// wrk -t 5 -c 20 -d 3 -H "Cookie: uuid=2c5a8b68-7e84-4504-a4b6-52c2dd570d32; token=83bd4d65ba5dc81e8a5e4cfdbbf53000" http://localhost:2990/objsh/pri/whoami
func whoamiHandler(ctx *RequestCtx) {
	if ctx.User != nil {
		fmt.Fprint(ctx, ctx.User.Username())
	} else {
		fmt.Fprint(ctx, "guest")
	}
}

func allHeadersHandler(ctx *RequestCtx) {
	allHeaders := make(map[string]string)
	ctx.Ctx.Request.Header.VisitAll(func(key, value []byte) {
		allHeaders[string(key)] = string(value)
	})
	// miso
	jsondata, err := json.Marshal(allHeaders)
	if err != nil {
		fmt.Fprint(ctx, err)
	} else {
		fmt.Fprint(ctx, string(jsondata))
	}

}

func downloadHandler(ctx *RequestCtx) {
	ctx.Ctx.Response.Header.Set("Content-Disposition", "attachment; filename=\"settings.json\"")
	content := `{"name": "Mizuno", "score": "87"}`
	fmt.Fprint(ctx, content)
}

func wsSampleHandler(wsCtx *model.WebsocketCtx) {
	user := wsCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}
	fmt.Fprintf(wsCtx, "Welcome %s", who)
	wsCtx.On("Close", "TokenForRemove", func() {
		log.Println("wsCtx.OnClose() called", who)
	})
	wsCtx.On("Message", "TokenForRemove", func(mesg string) {
		wsCtx.Send(who + " say: " + mesg)
		if mesg == "bye" {
			fmt.Fprintf(wsCtx, "Good-bye "+who)
			wsCtx.Close()
		}
	})
}
func wsProtobufSampleHandler(wsCtx *model.WebsocketCtx) {
	// Sample of protocol buffer
	user := wsCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}

	welcome := Result{ //defined in objshpb.pb.go
		Id:      0,
		Retcode: 0,
		Stdout:  []byte("Protobuf Welcome " + who),
		Stderr:  "",
	}
	_, err := wsCtx.SendProtobufMessage(&welcome)
	if err != nil {

	}
	wsCtx.On("Protobuf", "TokenForRemove", func(message proto.Message, err error) {
		if err != nil {
			fmt.Println("err=", err)
			return
		}
		typeName := proto.MessageName(message)
		switch typeName {
		case "objsh.Command":
			obj := message.(*model.Command)
			if obj.Name == "echo" {
				echo := Result{
					Id:      2,
					Retcode: obj.Id,
					//Stdout:  "",
					//Stderr:  "",
				}
				_, err := wsCtx.SendProtobufMessage(&echo)
				if err != nil {
					fmt.Println("err=", err)
					return
				}
			}
		}

	})
}
func wsProtobufJsonSampleHandler(wsCtx *model.WebsocketCtx) {
	// Sample of protocol buffer
	user := wsCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}

	welcome := Result{ //defined in objshpb.pb.go
		Id:      1,
		Retcode: 1,
		Stdout:  []byte("Protobuf Json Welcome 歡迎 " + who),
		Stderr:  "",
	}
	data, err := proto.Marshal(&welcome)
	if err != nil {
		fmt.Println("wsProtobufJsonSampleHandler err #1", err)
	}
	//send proto.Message object encaptured as any.Any
	anymsg := any.Any{
		TypeUrl: proto.MessageName(&welcome),
		Value:   data,
	}
	ml := jsonpb.Marshaler{}
	if false {
		//這樣會送回pb message格式的struct string, 但是找不到 js 怎麼解，可能不是給js用的
		err = ml.Marshal(wsCtx.Conn, &anymsg)
		if err != nil {
			fmt.Println("wsProtobufJsonSampleHandler err#2", err)
		}
	} else {
		//這樣會直接送出json encoded string,可是缺值或值為預設值（0,””）的欄位不會出現在json當中
		str, err := ml.MarshalToString(&anymsg)
		if err != nil {
			fmt.Println("wsProtobufJsonSampleHandler err#3", err)
		}
		wsCtx.Send(str)
	}

	wsCtx.On("Message", "TokenForRemove", func(data string) {

		anymsg := any.Any{}
		err := jsonpb.UnmarshalString(data, &anymsg)
		if err != nil {
			fmt.Println("wsProtobufJsonSampleHandler err#3", err)
		}
		switch anymsg.TypeUrl {
		case "objsh.Command":
			command := model.Command{}
			err = proto.Unmarshal(anymsg.Value, &command)
			switch command.Name {
			case "echo":
				echo := Result{
					Id:      2,
					Retcode: command.Id,
					//Stdout:  "",
					//Stderr:  "",
				}
				data, err := proto.Marshal(&echo)
				if err != nil {
					fmt.Println("wsProtobufJsonSampleHandler err #4", err)
				}
				anymsg = any.Any{
					TypeUrl: proto.MessageName(&echo),
					Value:   data,
				}
				str, err := ml.MarshalToString(&anymsg)
				if err != nil {
					fmt.Println("wsProtobufJsonSampleHandler err#5", err)
				}
				wsCtx.Send(str)
				break
			}
			break
		}
	})
}

/* field 一定要大寫開頭 */
type JsonResult struct {
	Id      int    `json:"id"`
	Retcode int    `json:"retcode"`
	Stdout  string `json:"stdout"`
	Stderr  string `json:"stderr"`
}

/* field 一定要大寫開頭 */
type JsonCommand struct {
	Id   int               `json:"id"`
	Name string            `json:"name"`
	Args []string          `json:"args,omitempty"`
	Kw   map[string]string `json:"kw,omitempty"`
}

func wsJsonSampleHandler(wsCtx *model.WebsocketCtx) {
	// Sample of protocol buffer
	user := wsCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}
	welcome := JsonResult{
		Id:      1,
		Retcode: 1,
		Stdout:  "Json Welcome 歡迎 " + who,
		Stderr:  "",
	}
	data, err := json.Marshal(welcome)
	if err != nil {
		fmt.Println("wsJsonSampleHandler err #json 1", err)
	}
	wsCtx.SendBinary(data)
	wsCtx.On("BinaryMessage", "TokenForRemove", func(data []byte) {
		command := JsonCommand{}
		err := json.Unmarshal(data, &command)
		if err != nil {
			fmt.Println("wsJsonSampleHandler err #json 2", err)
		}
		switch command.Name {
		case "echo":
			echo := JsonResult{
				Id:      2,
				Retcode: command.Id,
				Stdout:  "",
				Stderr:  "",
			}
			data, err := json.Marshal(echo)
			if err != nil {
				fmt.Println("wsJsonSampleHandler err #json 2", err)
			}
			wsCtx.SendBinary(data)
			break
		}
	})
}

func uploadHandler(fuCtx *FileUploadCtx) {
	user := fuCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}
	fmt.Println("uload file name", fuCtx.Filename)
	fmt.Println("uload file size", fuCtx.Filesize)
	fuCtx.SaveTo("Uploads")
	fmt.Fprintf(fuCtx, "%s upload received", who)
}

/*
 API
*/
func wsAPISampleHandler(wsCtx *model.WebsocketCtx) {
	user := wsCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}
	_ = who

	fmt.Println("API handler connected")
	wsCtx.On("Protobuf", "token", func(message proto.Message, err error) {
		if err != nil {
			fmt.Println("err=", err)
			return
		}
		typeName := proto.MessageName(message)
		fmt.Println("API handler received", typeName)
		switch typeName {
		case "objsh.Command":
			obj := message.(*model.Command)
			metadata := make(map[string]interface{})
			if user != nil {
				metadata["User"] = user
			}
			callCtx := model.NewTreeCallCtx(nil, obj.Id, wsCtx, obj.Args, &obj.Kw, nil)
			guestTree.Call(obj.Name, callCtx)
		}
	})
}

func gRPCStyleSampleHandler(wsCtx *model.WebsocketCtx) {
	// Sample of protocol buffer
	user := wsCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}
	_ = who
	wsCtx.On("Protobuf", "TokenForRemove", func(message proto.Message, err error) {
		if err != nil {
			fmt.Println("err=", err)
			return
		}
		typeName := proto.MessageName(message)
		switch typeName {
		case "grpcstyle.HelloRequest":
			request := message.(*HelloRequest)
			reply := HelloReply{
				Reply: "Thank you, " + request.GetGreeting() + " too!",
			}
			_, err := wsCtx.SendProtobufMessage(&reply)
			if err != nil {
				log.Println("gRPC-style send err=", err)
				return
			}
		}

	})
}

// 插入管理與測試用的Request
// URL: http://localhost:2990/objsh/unittest/index.html
func init() {
	Router := fastjob.Router

	Router.Get("/unittest/login", fastjob.LoginHandler, fastjob.PublicMode)
	Router.Get("/unittest/pri/logout", fastjob.LogoutHandler, fastjob.ProtectMode)

	cwd, _ := os.Getwd()
	//Router.File("/fastjob", filepath.Join(cwd, "..", "fastjob", "static", "file"), fastjob.PublicMode)
	Router.File("/fastjob", filepath.Join(cwd, "fastjob_static", "file"), fastjob.PublicMode)

	Router.Get("/go/pri/download", downloadHandler, fastjob.ProtectMode)

	//Router.File("/unittest/unittest", filepath.Join(cwd, "file"), fastjob.PublicMode)
	Router.File("/unittest/pri/static", filepath.Join(cwd, "static", "pri"), fastjob.ProtectMode)

	Router.Get("/unittest/whoami", whoamiHandler, fastjob.PublicMode)
	Router.Get("/unittest/trace/whoami", whoamiHandler, fastjob.TraceMode)
	Router.Get("/unittest/pri/whoami", whoamiHandler, fastjob.ProtectMode)
	Router.Get("/unittest/pri/allheaders", allHeadersHandler, fastjob.ProtectMode)

	Router.Websocket("/unittest/ws", wsSampleHandler, fastjob.PublicMode)
	Router.Websocket("/unittest/pri/ws", wsSampleHandler, fastjob.ProtectMode)
	Router.Websocket("/unittest/wspb", wsProtobufSampleHandler, fastjob.PublicMode)
	Router.Websocket("/unittest/wspbjson", wsProtobufJsonSampleHandler, fastjob.PublicMode)
	Router.Websocket("/unittest/wsjson", wsJsonSampleHandler, fastjob.PublicMode)
	Router.FileUpload("/unittest/upload", uploadHandler, fastjob.PublicMode)
	Router.FileUpload("/unittest/pri/upload", uploadHandler, fastjob.ProtectMode)
	Router.Websocket("/unittest/wsapi", wsAPISampleHandler, fastjob.PublicMode)
	Router.Websocket("/unittest/pri/wsapi", wsAPISampleHandler, fastjob.ProtectMode)

	//gPRC-Style
	Router.Websocket("/unittest/grpcstyle", gRPCStyleSampleHandler, fastjob.PublicMode)

	//Playground
	// Depends on "/fastjob/file" for login.html
	//Router.File("/obfastjobjsh/playground", filepath.Join(cwd, "..", "static", "playground"), false)

	//Python3
	Py3 := fastjobpy.NewPy3()
	Py3.ImportModule("py/pyroutes.py")

	Router.File("/", filepath.Join(cwd, "static", "pub"), fastjob.PublicMode)

}
