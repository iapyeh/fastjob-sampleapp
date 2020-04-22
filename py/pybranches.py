from fastjob import *
import time
from datetime import datetime
import sched
import traceback
import os
class PyBranch(BaseBranch):
    def __init__(self):
        super(PyBranch,self).__init__('py')

    def beReady(self,treeroot):
        self.export(
            self.okStr,
            self.errStr,
            self.progressStr,
            )
        return True
    
    def okStr(self,ctx):
        """hello 1"""
        ctx.resolve('hello, how do you do')

    def errStr(self,ctx):
        """hello 2"""
        ctx.reject(500,'nothing wrong')

    def progressStr(self,ctx):
        """hello 3"""
        killed = [False]
        def onkill(*args):
            print('killed')
            killed[0] = True
        ctx.onkill = onkill
        def task(c):
            if c < 3000 and (not killed[0]):
                #if c == 300:
                #    ctx.setBackground(False)
                mesg = 'hello, how are you #%s/3000' % c
                print(mesg)
                ctx.notify(mesg)
                scheduler.enter(0.01, 0, task, (c+1,))
            else:
                ctx.resolve('ok')
        ctx.setBackground(True)
        scheduler = sched.scheduler(time.time, time.sleep)
        now = datetime.now()
        scheduler.enterabs(now.timestamp(), 0, task,(0,)) 
        scheduler.run()

GoTrees.Unittest.addBranch(PyBranch())
