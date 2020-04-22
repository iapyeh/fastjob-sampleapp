
from fastjob import *
def forever():
    import _thread
    import time
    # Define a function for the thread
    global count
    count = 0
    def print_time( threadName, delay):
        global count
        while count < 5:
            time.sleep(delay)
            count += 1
            print ("#%s %s: %s" % ( count, threadName, time.ctime(time.time()) ))

    # Create two threads as follows
    try:
        _thread.start_new_thread( print_time, ("Thread-1", 2, ) )
        _thread.start_new_thread( print_time, ("Thread-2", 4, ) )
    except:
        print ("Error: unable to start thread")
    import random
    while count < 6:
        #print('%s.' % random.randint)
        pass
    print("Thread test completed")

callWhenRunning(forever)