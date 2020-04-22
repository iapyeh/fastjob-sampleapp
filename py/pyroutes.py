"""
使用decorator定義route的版本
"""
from fastjob import *
#from fastjob import Router, ACL
import traceback, io
import os, sys, json
"""
@Router.Get('/objsh/reload',ACL.ProtectMode)
def reloadmodule(ctx):
    try:
        path = ctx.metadata['path']
        
        return 'module reloaded(%s)' % path
    except:
        return traceback.format_exc()
"""

def postgethandler(ctx):
    querydata = {
        'username':ctx.user.username if ctx.user else 'guest' ,
        'ip':ctx.remoteAddr(),
        'header':{
            'user-agent':ctx.getHeader('User-Agent'),
            'cookie':ctx.getHeader('Cookie')
        },
        'data':{
            'name': ctx.peek('name'),
            'age' : ctx.peek('age', 17.5) # with default value
        }        
    }
    return json.dumps(querydata)

@Router.Get('/unittest/py/pri/gethandler',ACL.ProtectMode)
def gethandler(ctx):
    return postgethandler(ctx)

@Router.Post('/unittest/py/pri/posthandler',ACL.ProtectMode)
def posthandler(ctx):
    return postgethandler(ctx)

"""
@Router.Get('/unittest/pri/sayhello',ACL.ProtectMode)
def sayhello(ctx):
    # since this is a protect-mode handler, ctx.user is accessible.
    username =  ctx.user.username

    # takes the query parameters
    name = ctx.peek('name')
    age  = ctx.peek('age', 17.5) # with default value
    
    ret = 'Hello %s your name %s sounds great!' % (username, name)
    if (float(age) < 18): ret += ', Do not stay outside after AM1'
    
    return ret
"""

@Router.Get('/unittest/py/getheader',ACL.PublicMode)
def getheader(ctx):
    ip = ctx.remoteAddr()
    agent = ctx.getHeader('User-Agent')
    return 'hello %s, your ip is %s' % (agent,ip)


@Router.Get('/objsh/py1',ACL.PublicMode)
def request1(ctx):
    try:
        username =  ''#ctx.user.username if ctx.user else 'guest' 
        
        # 這樣比較慢
        #cookie = ctx.request.header.get('Cookie')
        #cookie += ctx.request.header.get('user-agent')
        
        #這樣比較快，約快20％
        cookie = ctx.metadata['header']['Cookie'] + ctx.metadata['header']['User-Agent']

        addr = ''#ctx.remoteAddr()
        kw = ctx.metadata['kw']
        return 'hello %s from %s with %s and cookie:%s' % (username, addr, kw,cookie)
    except:
        return traceback.format_exc()

@Router.Get('/unittest/py/download',ACL.PublicMode)
def py_download(ctx):
    ctx.setHeader('Content-Disposition','attachment; filename="settings.json"')
    content = json.dumps({
        'name':'Mizuno',
        'score':'87'
    })
    return content



@Router.Get('/unittest/py/getimage_by_write',ACL.PublicMode)
def getimage_by_write(ctx):
    try:
        path = os.path.normpath(os.path.join(os.path.dirname(__file__),'downloadtest.jpg'))
        with open(path,'rb') as fd:
            content = fd.read()
        ctx.response.header.set('Content-Type','image/png')
        ctx.response.header.set('Content-Length',str(len(content)))
        ctx.write(content)
        return ''
    except:
        return traceback.format_exc()

@Router.Get('/unittest/py/getimage_by_sendfile',ACL.PublicMode)
def getimage_by_sendfile(ctx):
    try:
        path = os.path.abspath(os.path.normpath(os.path.join(os.path.dirname(__file__),'downloadtest.jpg')))
        # set the header is ok
        ctx.response.header.set('Content-Disposition','attachment; filename="downloadtest.jpg"')
        ctx.sendfile(path)
        # but must return None
        return
    except:
        return traceback.format_exc()

@Router.Get('/unittest/py/getbytes',ACL.PublicMode)
def py_getbytes(ctx):
    try:
        path = os.path.normpath(os.path.join(os.path.dirname(__file__),'downloadtest.jpg'))
        with open(path,'rb') as fd:
            content = fd.read()
        return content
    except:
        return traceback.format_exc()

@Router.Get('/unittest/py/redirect',ACL.PublicMode)
def py_redirect(ctx):
    try:
        path = '/img/redirecttest.png'
        #ctx.redirect(path,307)
        #ctx.redirect(path) #default to 307
        #ctx.redirect(path,"301")
        ctx.redirect(path,301)
    except:
        return traceback.format_exc()

@Router.Post('/objsh/py2',ACL.PublicMode)
def request2(ctx):
    try:
        return '=== (%s) ===' % ctx.kw()
    except:
        return traceback.format_exc()

@Router.Websocket('/objsh/pyws',ACL.PublicMode)
#@Router.Websocket('/objsh/pyws',ProtectMode)
def request3(ctx):
    #called when connection made
    try:
        count = [0]
        username =  ctx.user.username if ctx.user else 'guest' 
        def onmessage(message):
            count[0] += 1
            try:
                ctx.send(username + '@' + str(count[0]) + ': ' + message)
            except:
                ctx.send(traceback.format_exc())

        def onclose():
            print("websocket closed /objsh/pyws")
        ret = ctx.on("close",onclose)
        ret2 = ctx.on("message",onmessage)
        return "1"
    
    except:
        return traceback.format_exc()

#@Router.Websocket('/objsh/pyws',ProtectMode)
@Router.Websocket('/objsh/pywsbinary',PublicMode)
def pywsbinary(ctx):
    
    try:
        count = [0]
        username =  ctx.user.username if ctx.user else 'guest' 
        def callback(message):
            count[0] += 1
            try:
                ctx.send(username + '@' + str(count[0]) + ': ' + message)
            except:
                ctx.send(traceback.format_exc())
    
        ctx.on("message",callback)
        return "1"
    except:
        return traceback.format_exc()

#@Router.FileUpload('/objsh/pyupload',PublicMode)
"""
<form enctype="multipart/form-data" action="/twgo/asr"  method="post" >
    <input type="file" name="file">
    <input type="submit">
</form>
"""

@Router.FileUpload('/unittest/py/upload_resp_bytes',PublicMode)
def py_upload_resp_bytes(ctx):
    try:
        # title is an extra parameter for file upload
        title = ctx.peek("title")
        print("title=",title)
        ctx.saveTo("Uploads/%s" % ctx.filename)
        return ("got %s of size %s by %s, bytes returned" % (ctx.filename, ctx.filesize,'')).encode()
    except:
        return traceback.format_exc()


@Router.FileUpload('/unittest/py/upload',PublicMode)
def py_upload(ctx):
    try:
        # title is an extra parameter for file upload
        title = ctx.peek("title")
        print("title2=",title)
        ctx.saveTo("Uploads/%s" % ctx.filename)
        return "got %s of size %s by %s" % (ctx.filename, ctx.filesize,'')
    except:
        return traceback.format_exc()

@Router.Get('/unittest/py/getimage',ACL.PublicMode)
def getimage(ctx):
    try:
        path = os.path.normpath(os.path.join(os.path.dirname(__file__),'downloadtest.jpg'))
        with open(path,'rb') as fd:
            content = fd.read()
        ctx.setHeader('Content-Type','image/png')
        ctx.setHeader('Content-Length',str(len(content)))
        return content
    except:
        return traceback.format_exc()

@Router.Get('/unittest/py/getbinary',ACL.PublicMode)
def getbinary(ctx):
    download = ctx.peek('download')
    path = os.path.normpath(os.path.join(os.path.dirname(__file__),'downloadtest.jpg'))
    with open(path,'rb') as fd:
        content = fd.read()
    ctx.setHeader('Content-Type','image/png')
    ctx.setHeader('Content-Length',str(len(content)))
    if download:
        ctx.setHeader('Content-Disposition','attachment; filename="downloadtest.jpg"')
    return content

if __name__ == '__main__':
    pass