/*
Example of communcation with protocol buffer in websocket.
*/
package main

import (
	"fmt"
	"log"

	jsonpb "github.com/golang/protobuf/jsonpb"
	"github.com/golang/protobuf/proto"
	any "github.com/golang/protobuf/ptypes/any"
	fastjob "github.com/iapyeh/fastjob"
	model "github.com/iapyeh/fastjob/model"
)

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

func init() {
	Router := fastjob.Router
	Router.Websocket("/wspb", wsProtobufSampleHandler, fastjob.PublicMode)
	Router.Websocket("/wspbjson", wsProtobufJsonSampleHandler, fastjob.PublicMode)
	//gPRC-Style
	Router.Websocket("/grpcstyle", gRPCStyleSampleHandler, fastjob.PublicMode)

}
