# called in branches.go
# would generate a line to stdout per second

import time, sys,random
def run():
    sys.stdout.write('-------start------\n')
    sys.stdout.flush()
    for i in range(5):
        n = random.randint(50,200)
        line = 'LINE %s %s>\n'
        sys.stdout.write(  line % (i, '=' * n))
        sys.stdout.flush()
        time.sleep(0.25 + 0.25 * random.random())
    sys.stdout.write('-------end---no newline------')
    if random.random() > 0.5:
        sys.exit(1)

def err():
    for i in range(5):
        sys.stderr.write("you got error #%s\n" % i)
        sys.stderr.flush()
        time.sleep(0.25 + 0.25 * random.random())
    sys.stderr.write('-------errend---no newline------')
if __name__ == '__main__':
    #run()
    err()