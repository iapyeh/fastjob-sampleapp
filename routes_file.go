package main
import (
	"os"
	"path/filepath"
	fastjob "github.com/iapyeh/fastjob"
)

//type Result = model.Result
//type RequestCtx = model.RequestCtx

// 插入管理與測試用的Request
// URL: http://localhost:2990/objsh/unittest/index.html
func init() {
	Router := fastjob.Router

	cwd, _ := os.Getwd()
	// Common resource library of fastjob
	Router.File("/fastjob", filepath.Join(cwd, "fastjob_static", "file"), fastjob.PublicMode)
	// Project's resources for authenticated users
	Router.File("/pri/static", filepath.Join(cwd, "static", "pri"), fastjob.ProtectMode)
	// Project's resources for public users
	Router.File("/", filepath.Join(cwd, "static", "pub"), fastjob.PublicMode)
}
