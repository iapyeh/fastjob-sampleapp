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


from twisted.internet import defer
from twisted.internet import reactor

#import configparser
class TwistedBranch(BaseBranch):
    def __init__(self):
        super(TwistedBranch,self).__init__('twisted')
       
    def beReady(self,treeroot):
        #self.parser = configparser.ConfigParser()
        self.export()

        def countDown(c,deferred):
            print('--callLater works--','*' * 10*(1+c))
            if c < 3:
                reactor.callLater(1,countDown,c+1,deferred)
            else:
                deferred.callback('--callLater works-- stop')

        def TwistedBranchReady(deferred):
            print('twisted reactor.callWhenRunning works')
            reactor.callLater(1,countDown,0,deferred)

        deferred = defer.Deferred()

        def done(mesg):
            print(mesg,' and Deferred works')
        deferred.addCallback(done)
        reactor.callWhenRunning(TwistedBranchReady,deferred)
        return True

GoTrees.Unittest.addBranch(TwistedBranch())
