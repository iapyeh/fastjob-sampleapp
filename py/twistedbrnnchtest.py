"""
使用decorator定義branch的版本
"""

from fastjob import *
import time
from datetime import datetime
import sched
import traceback
import sys

# 2019-11-10T14:39:19+00:00
# 不知道為什麼以下這行的寫法會在macbook pro 中突然會造成go 死當
# from twisted.internet import reactor
# 2019-11-17T04:54:14+00:00 已解，原因是：
# cryptography 2.3 has problem, it will crash twisted
# 解法是upgrade到 >= 2.8，例如 python3 -m pip instsall --upgrade cryptography
from cryptography import x509

from twisted.internet import defer
from twisted.internet import reactor

def initTwistedReactor():
    try:
        reactor.run(installSignalHandlers=False)
    except:
        traceback.print_exc()
callWhenRunning(initTwistedReactor)

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
