/*
Example of calling Tree's api internally in websocket. 

The APIs is organized in a hierarchy named "guestTree" which is implemented by branches.go.

The communication between browser and server is in protobuffer. The schema of protocol buffer
	is defined in fastjob/protobuf. It is the native protocol used by fastjob.
	Basically, users is encouraged to use fastjob's sdk.js. Here is an example only for
	demonstrating how to call tree's api functions internally.
*/
package main

import (
	"fmt"

	"github.com/golang/protobuf/proto"
	fastjob "github.com/iapyeh/fastjob"
	model "github.com/iapyeh/fastjob/model"
)

func wsAPISampleHandler(wsCtx *model.WebsocketCtx) {
	user := wsCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}
	_ = who

	fmt.Println("API handler connected")


	wsCtx.On("Protobuf", "tokenOfProtobufForRemove", func(message proto.Message, err error) {
		// This is a listener when websocket received protocol buffer style messages
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
			// Call guestTree's api internally
			callCtx := model.NewTreeCallCtx(nil, obj.Id, wsCtx, obj.Args, &obj.Kw, nil)
			guestTree.Call(obj.Name, callCtx)
		}
	})
}

func init() {
	Router := fastjob.Router
	
	// Example of authenticated or public websocket handler
	Router.Websocket("/wsapi", wsAPISampleHandler, fastjob.PublicMode)
	Router.Websocket("/pri/wsapi", wsAPISampleHandler, fastjob.ProtectMode)
}
