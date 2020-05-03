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
        # Since reactor.run is a blocking call,
        # That makes "callWhenRunning()" becomes a blocking call in golang too
        reactor.run(installSignalHandlers=False)
    except:
        traceback.print_exc()

callWhenRunning(initTwistedReactor)
