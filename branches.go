package main

import (
	"fmt"
	"log"
	"strconv"
    "time"
    "os/exec"
	objsh "github.com/iapyeh/fastjob"
	objshpy "github.com/iapyeh/fastjob-python3"
	model "github.com/iapyeh/fastjob/model"
)

type BaseBranch = objsh.BaseBranch
type TreeRoot = objsh.TreeRoot
type TreeCallCtx = objsh.TreeCallCtx
type User = objsh.User

type TestBranch struct {
	BaseBranch
}

func (self *TestBranch) BeReady(treeroot *TreeRoot) {
	self.InitBaseBranch()
	self.Export(
		self.Sleep,
		self.Hello,
		self.Progress,
		self.Clock,
		self.ClockBgRun,
        self.InternalCall,
        self.Benchmark,
        self.SubprocessTest)
	treeroot.SureReady(self)
}

func (self *TestBranch) Hello(callCtx *TreeCallCtx) {
	who := "guest"
	user := callCtx.WsCtx.GetUser()
	if user != nil {
		who = user.Username()
	}
	out := []string{self.Name() + ":say hello " + who}
	if args := callCtx.Args; args != nil {
		for i, arg := range args {
			out = append(out, fmt.Sprintf("arg%d='%s'", i, arg))
		}
	}
	out = append(out, callCtx.Kw.String())
	callCtx.Resolve(&out)
}

func (self *TestBranch) Sleep(callCtx *TreeCallCtx) {
	who := "guest"

	user := callCtx.WsCtx.GetUser()
	if user != nil {
		who = user.Username()
	}
	duration, err1 := callCtx.Kw.GetUint("duration")
	if err1 == nil {
		time.Sleep(time.Second * time.Duration(duration))
	}
	out := []string{"Sleeping called by " + who}
	if args := callCtx.Args; args != nil {
		for i, arg := range args {
			out = append(out, fmt.Sprintf("arg%d='%s'", i, arg))
		}
	}
	out = append(out, callCtx.Kw.String())
	callCtx.Resolve(&out)
}
func (self *TestBranch) Progress(callCtx *TreeCallCtx) {
	who := "guest"

	user := callCtx.WsCtx.GetUser()
	if user != nil {
		who = user.Username()
	}

	interval := int(1)
	times := int(1)

	if _interval, err := callCtx.Kw.GetUint("interval"); err == nil {
		interval = _interval
	}
	if _times, err2 := callCtx.Kw.GetUint("times"); err2 == nil {
		times = _times
	}

	out := []string{"Tree.UnitTest.Progress called by " + who}
	if args := callCtx.Args; args != nil {
		for i, arg := range args {
			out = append(out, fmt.Sprintf("arg%d='%s'", i, arg))
		}
	}
	out = append(out, callCtx.Kw.String())
	send := func(times int) {
		out = append(out, fmt.Sprintf("#%d", times))
		if times == 0 {
			callCtx.Resolve(&out)
		} else {
			callCtx.Notify(&out)
		}
	}
	var progress func(int)
	progress = func(times int) {
		send(times)
		if times > 0 {
			objsh.SetTimeout(func() {
				progress(times - 1)
			}, uint(interval))
		}
	}

	// Protobuf from browser
	if *callCtx.Message != nil {
		req := (*callCtx.Message).(*HelloRequest)
		fmt.Println("Thank for your greeting:", req.Greeting)
	}

	go progress(times)
}

// There are 3 methods to stop an interval when lost connection.
// All 3 methods can avoid data-race problem
func (self *TestBranch) Clock(callCtx *TreeCallCtx) {
	var interval int64 //1 second
	if len(callCtx.Args) > 0 {
		if v, err := strconv.ParseInt((callCtx.Args)[0], 10, 64); err == nil {
			interval = v
		} else {
			interval = 1000
		}

	} else {
		interval = 1000
	}

	/*
		//method 1
		objsh.SetInterval(func(stop *chan bool) {
			if callCtx.IsClosed() {
				*stop <- true
				return
			}
			currentTime := time.Now().Format("15:04:05")
			fmt.Println(currentTime)
			callCtx.Notify(&currentTime)
		}, 100)
	*/

	// Method 2
	reply := func(s *chan bool) {
		currentTime := time.Now().Format("15:04:05.999")
		fmt.Println(currentTime)
		callCtx.Notify(&currentTime)
	}
	stop := objsh.SetInterval(reply, interval)
	/*
		callCtx.WsCtx.On("Close", "TokenToRemove", func() {
			// should "off" this callback
			defer callCtx.WsCtx.Off("Close", "TokenToRemove")
			log.Println("Clock() stopped because connection closed")
			*stop <- true
		})
	*/
	callCtx.On("Kill", func() { //Will be called both on ctx cancelled or ctx's websocket lost connection
		log.Println("Clock() stopped because of cancell been called")
		*stop <- true
	})
	reply(nil)

	/*
		//Method 3 by SetTimeout
		token := "123444"
		var stop *chan bool
		var issue func()
		m := sync.Mutex{}
		issue = func() {
			m.Lock()
			stop = objsh.SetTimeout(func() {
				currentTime := time.Now().Format("15:04:05")
				fmt.Println(currentTime)
				callCtx.Notify(&currentTime)
				issue()
			}, 100)
			m.Unlock()
		}
		callCtx.WsCtx.On("Close", token, func() {
			defer callCtx.WsCtx.Off("Close", token)
			log.Println("Clock() called but connection closed")
			m.Lock()
			*stop <- true
			m.Unlock()
		})
		issue()
	*/
}

/*
# ClockBgRun
is a clock run in background. It runs even user closes the connection.

Args:[*interval, times]

@interval: report once per every interval. in milliseconds.
*/
func (self *TestBranch) ClockBgRun(callCtx *TreeCallCtx) {
	var interval int64 //1 second
	if len(callCtx.Args) > 0 {
		if v, err := strconv.ParseInt((callCtx.Args)[0], 10, 64); err == nil {
			interval = v
		} else {
			interval = 1000
		}

	} else {
		interval = 1000
	}
	callCtx.SetBackground(true)
	reply := func(s *chan bool) {
		currentTime := time.Now().Format("15:04:05.999")
		fmt.Println(currentTime)
		callCtx.Notify(&currentTime)
	}
	stop := objsh.SetInterval(reply, interval)
	callCtx.On("Kill", func() {
		//Will be called both on ctx cancelled or ctx's websocket lost connection
		log.Println("Clock() stopped because of cancell been called")
		*stop <- true
	})
	reply(nil)

}

/*
InternalCall is an example of calling another branch in a branch.
*/
func (self *TestBranch) InternalCall(ctx *TreeCallCtx) {

	//(root *TreeRoot, CmdID int32, wsCtx PromiseStateListener, args []string, kw *map[string]string, message *proto.Message)
	wsCtx := model.NewInternalCallPromiseListener(ctx.WsCtx.GetUser(), ctx.WsCtx.GenID(), func(ret *model.TreeCallReturn) {
		ctx.WsCtx.SendTreeCallReturn(ret)
	})
	args := []string{"ls", "-l", "/Users/me/Desktop"}
	iCtx := model.NewTreeCallCtx(
		ctx.Root,
		ctx.CmdID,
		wsCtx,
		args,
		nil,
		nil,
	)
	ctx.Root.Call(ctx.Root.Name+".$exec.Command", iCtx)
}

/*
# Benchmark call to wrk
Args:[url]
@url: url to test, ex. "http://localhost:2990/unittest/py/getimage"
*/
func (self *TestBranch) Benchmark(callCtx *TreeCallCtx) {
    //url := "http://localhost:2990/unittest/py/getimage"
    //cmd := exec.Command("wrk", "-t", "5", "-c", "20", "-d", "3", url)
    //args := []string{"wrk", "-t", "5", "-c", "20", "-d", "3",url}
    fmt.Println("-->",callCtx.Args)
    cmd := exec.Command("wrk", callCtx.Args...)
    callCtx.SetBackground(true)

    deferred := model.Subprocess(cmd,0)
    deferred.Progress(func(line interface{}){
        callCtx.Notify(line)
    })
    deferred.Done(func(line interface{}){
        callCtx.Resolve(line)
    })
    deferred.Fail(func(err error){
        callCtx.Reject(505, err)
    })
    callCtx.On("Kill", func() {
        // deferred.Kill() will call callCtx.Reject(500)
        deferred.Kill(0)
    })
}
/*
# Subprocess with notify

Args:[*interval, times]

@interval: report once per every interval. in milliseconds.
*/

func (self *TestBranch) SubprocessTest(callCtx *TreeCallCtx) {
    cmd := exec.Command("python3","/Users/iap/Dropbox/workspace/ObjectiveShell/src/unittest/subprocess_test.py")
    callCtx.SetBackground(true)
    
    // get "flag" parameter
    var flag int64
    var err error
    if len(callCtx.Args) > 0 {
        flag, err = strconv.ParseInt(callCtx.Args[0],10,64)
        if err != nil{
            flag = 0
        }    
    }
    
    deferred := model.Subprocess(cmd,int(flag))
    deferred.Progress(func(line interface{}){
        callCtx.Notify(line)
    })
    deferred.Done(func(line interface{}){
        callCtx.Resolve(line)
    })
    deferred.Fail(func(err error){
        callCtx.Reject(505, err)
    })
    callCtx.On("Kill", func() {
        //log.Println("Benchmark stopped because of cancell been called")
        // deferred.Kill() will call callCtx.Reject(500)
        deferred.Kill(0)
    })
}


/*
 gRPC-style

type GrpcStyle struct {
	BaseBranch
}

func (self *GrpcStyle) Hello(callCtx *TreeCallCtx) {
	who := "guest"

	if callCtx.WsCtx.User != nil {
		who = callCtx.WsCtx.User.Username
	}

	duration, err1 := callCtx.Kw.GetUint("duration")
	if err1 == nil {
		time.Sleep(time.Second * time.Duration(duration))
	}
	out := []string{"Sleeping called by " + who}
	if args := callCtx.Args; args != nil {
		for i, arg := range *args {
			out = append(out, fmt.Sprintf("arg%d='%s'", i, arg))
		}
	}
	out = append(out, callCtx.Kw.String())
	callCtx.Resolve(&out)
}
*/

var guestTree *objsh.TreeRoot

//var memberTree *objsh.TreeRoot

func init() {
	// Two styles to add a branch
	// branches in guessTree has prefix "Tree", for example Tree.UnitTest.Clock
	guestTree = objsh.UseTree("Unittest", "/unittest/pub/tree", objsh.PublicMode)
	guestTree.AddBranchWithName(&TestBranch{},"Testing")

	//Python3
	Py3 := objshpy.NewPy3()
	Py3.AddTree(guestTree)

	// a single python script
	//Py3.ImportModule("pytest/pybranches.py")

    // 2019-11-21T02:09:33+00:00
    //  Temporary commented-out, since "py" has been imported in routes.go
    // a python package in a folder    
	Py3.ImportModule("py")

	guestTree.BeReady()

	objshpy.CallWhenRunning()

	guestTree.Dump()

}
