package main

import (
	"encoding/json"
	"fmt"
	"log"

	fastjob "github.com/iapyeh/fastjob"
	model "github.com/iapyeh/fastjob/model"
)

func wsSampleHandler(wsCtx *model.WebsocketCtx) {
	// Example of a general purpose websocket handler

	// knows who is connected
	user := wsCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}
	fmt.Fprintf(wsCtx, "Welcome %s", who)

	wsCtx.On("Close", "TokenOfCloseForRemove", func() {
		// callback when client is disconnected
		// This callback can be remove by wsCtx.Off("TokenOfCloseForRemove")
		log.Println("wsCtx.OnClose() called", who)
	})

	wsCtx.On("Message", "TokenOfMessageForRemove", func(mesg string) {
		// callback when message received from client
		// This callback can be remove by wsCtx.Off("TokenOfMessageForRemove")
		wsCtx.Send(who + " say: " + mesg)
		if mesg == "bye" {
			fmt.Fprintf(wsCtx, "Good-bye "+who)
			// way to close this websocket connnection
			wsCtx.Close()
		}
	})
}

/* field should be capitalized */
type JsonResult struct {
	Id      int    `json:"id"`
	Retcode int    `json:"retcode"`
	Stdout  string `json:"stdout"`
	Stderr  string `json:"stderr"`
}

/* field should be capitalized */
type JsonCommand struct {
	Id   int               `json:"id"`
	Name string            `json:"name"`
	Args []string          `json:"args,omitempty"`
	Kw   map[string]string `json:"kw,omitempty"`
}

func wsJsonSampleHandler(wsCtx *model.WebsocketCtx) {
	// Example of sending and receiving JSON by webscoket
	user := wsCtx.User
	who := "guest"
	if user != nil {
		who = user.Username()
	}
	
	welcome := JsonResult{
		Id:      1,
		Retcode: 1,
		Stdout:  "Welcome 歡迎 " + who,
		Stderr:  "",
	}
	
	data, err := json.Marshal(welcome)
	if err != nil {
		fmt.Println("wsJsonSampleHandler err #json 1", err)
	}
	wsCtx.SendBinary(data)
	
	wsCtx.On("BinaryMessage", "TokenOfBinaryMessageForRemove", func(data []byte) {
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


func init() {
	Router := fastjob.Router
	// Example of authenticated or public websocket handler
	Router.Websocket("/ws", wsSampleHandler, fastjob.PublicMode)
	Router.Websocket("/pri/ws", wsSampleHandler, fastjob.ProtectMode)
	
	// Example of communication with JSON in websocket
	Router.Websocket("/wsjson", wsJsonSampleHandler, fastjob.PublicMode)
}
