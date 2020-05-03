package main

import (
	"encoding/json"
	"fmt"

	fastjob "github.com/iapyeh/fastjob"
	model "github.com/iapyeh/fastjob/model"
)

type Result = model.Result
type RequestCtx = model.RequestCtx
type FileUploadCtx = model.FileUploadCtx

func whoamiHandler(ctx *RequestCtx) {
	if ctx.User != nil {
		fmt.Fprint(ctx, ctx.User.Username())
	} else {
		fmt.Fprint(ctx, "guest")
	}
}

func allHeadersHandler(ctx *RequestCtx) {
	// Examples to get all http headers and responses a json object
	allHeaders := make(map[string]string)
	ctx.Ctx.Request.Header.VisitAll(func(key, value []byte) {
		allHeaders[string(key)] = string(value)
	})

	jsondata, err := json.Marshal(allHeaders)
	if err != nil {
		fmt.Fprint(ctx, err)
	} else {
		fmt.Fprint(ctx, string(jsondata))
	}

}

func downloadHandler(ctx *RequestCtx) {
	// Example of setting response header
	ctx.Ctx.Response.Header.Set("Content-Disposition", "attachment; filename=\"settings.json\"")
	content := `{"name": "Mizuno", "score": "87"}`
	fmt.Fprint(ctx, content)
}


func uploadHandler(fuCtx *FileUploadCtx) {
	// Example of getting uploaded file
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

func init() {
	Router := fastjob.Router
	// Log in and log out
	Router.Get("/login", fastjob.LoginHandler, fastjob.PublicMode)
	Router.Get("/pri/logout", fastjob.LogoutHandler, fastjob.ProtectMode)

	// authenticated download
	Router.Get("/go/pri/download", downloadHandler, fastjob.ProtectMode)
	// authenticated upload
	Router.FileUpload("/pri/upload", uploadHandler, fastjob.ProtectMode)

	// public upload
	Router.FileUpload("/upload", uploadHandler, fastjob.PublicMode)

	// making requests in three authencation modes
	Router.Get("/whoami", whoamiHandler, fastjob.PublicMode)
	Router.Get("/trace/whoami", whoamiHandler, fastjob.TraceMode)
	Router.Get("/pri/whoami", whoamiHandler, fastjob.ProtectMode)

	// example of getting request headers
	Router.Get("/pri/allheaders", allHeadersHandler, fastjob.ProtectMode)

}
