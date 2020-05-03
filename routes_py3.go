package main

import (
	fastjob_python3 "github.com/iapyeh/fastjob-python3"
)

func init() {
	
    //Python3
	Py3 := fastjob_python3.New()

    // a python package in a folder    
	Py3.ImportModule("py")

}
