package main

import (
	"fmt"
	"log"
	"os/signal"

	"os"
	"path/filepath"
	"time"

	"github.com/valyala/fasthttp"

	fastjob "github.com/iapyeh/fastjob"

    auth "github.com/iapyeh/fastjob/auth/leveldb"
)

var (
	cwd  string
	port int
	//Py3  *py3.Py3Interpreter
)

func init() {
	if thepath, err := os.Getwd(); err == nil {
		cwd = thepath
	} else {
		panic(err)
	}
	log.Println("Working path:", cwd)

	//初始化帳號與管理帳號
	dbpath := filepath.Join(cwd, "db")
	if _, err := os.Stat(dbpath); os.IsNotExist(err) {
		os.Mkdir(dbpath, os.ModePerm)
	}

	// You can customize token generator, like this:
	// model.SetTokenGenerator(model.SimpleTokenGenerator)

	if true {
        userManager := auth.NewDictUserManager(dbpath)
        auth.UseRouteWithPrefix("/user")
		fastjob.UseAuthentication(userManager)
		AccountProvider := userManager.GetAccountProvider()
		if userAdmin := AccountProvider.GetAppUser("admin"); userAdmin != nil {
			log.Println("Admin account existed, reset password to 1234,activated=", userAdmin.Activated())
			userAdmin.SetPassword("1234")
			AccountProvider.Serialize(userAdmin)
		} else {
			userAdmin, err := AccountProvider.CreateAppUser("admin", "1234")
			if err != nil {
				panic(err)
			}
			log.Println("Create  account admin:1234", userAdmin.Activated())
			_ = userAdmin
		}
	} else {

		// If you want to use PAM:
		// 1. go get "github.com/msteinert/pam"
		// 2. rename auth/pam.gogo to auth/pam.go
		// 3. uncomment the 3 lines below:

		/*
			log.Println("User Pam user manager")
			userManager := auth.NewPamUserManager(dbpath)
			fastjob.UseAuthentication(&userManager)
		*/

	}

	staicFolder := filepath.Join(cwd, "fastjob_static")
	fastjob.UsePlayground(staicFolder)

}

//StartServer is called for start server
func StartServer() {

	port = 2990

	log.Printf("Listen on port %v  (fasthttp)\n", port)

	router := fastjob.Router
	server := &fasthttp.Server{
		Handler: router.Handler,
		// Every response will contain 'Server: UnitTest Server' header.
		Name: "UnitTest Server",
		// Other Server settings may be set here.
	}

	//必須在listen之前設定好
	server.ReadTimeout = time.Second * 20        // 考慮上傳時需要比較多的時間
	server.MaxRequestBodySize = 10 * 1024 * 1024 //10MB,fasthttp預設是4MB

	if err := server.ListenAndServe(fmt.Sprintf(":%v", port)); err != nil {
		log.Fatalf("error in ListenAndServe: %s", err)
		panic(fmt.Sprintf("Server error:%s", err))
	}

	sigCh := make(chan os.Signal)
	signal.Notify(sigCh, os.Interrupt)
	<-sigCh
	signal.Stop(sigCh)
	signal.Reset(os.Interrupt)
	server.Shutdown()

}
func main() {
	StartServer()
}
