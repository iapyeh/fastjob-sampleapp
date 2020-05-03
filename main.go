package main

import (
	"log"
	"os"
	"path/filepath"
    "flag"
	fastjob "github.com/iapyeh/fastjob"
    auth "github.com/iapyeh/fastjob/auth/leveldb"
)

var (
	cwd  string
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

func main() {
    fastjob.Main()
    var port = flag.Int("port",2990,"listening port")
    var serverName  = flag.String("server-name","Fastjob SampleApp","server name")
    var readTimeout = flag.Int("read-timeout",10,"read timeout in seconds,default is 10 seconds")
    var maxRequestBodySzie = flag.Int("max-body-size", 10 * 1024 * 1024,"max body size in bytes")
    flag.Parse()
    options := map[string]interface{} {
        "port":*port,
        "serverName":*serverName,
        // uploading requires more read time
        "readTimeout":*readTimeout, //in seconds
        // 10MB in bytes, default of fasthttp is 4MB
        "maxRequestBodySize":*maxRequestBodySzie,
    }
    fastjob.StartServer(options)
}
