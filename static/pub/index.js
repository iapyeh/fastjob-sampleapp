function upload(url,file){

    var formData = new FormData();//let
    formData.append('file',file);
    formData.append('title','a super file');
    var promise = new $.Deferred()//let
    $.ajax({
        url : url,
        type : 'POST',
        data : formData,
        dataType:'text', //return type
        processData: false,  // tell jQuery not to process the data
        contentType: false,  // tell jQuery not to set contentType
        success : function(response) {
            promise.resolve(response);
        },
        error:function(xhr,err){
            promise.reject(err)
        }
    });
    return promise

}
window.addEventListener('DOMContentLoaded',function(){
    window.objshSDK = GetSDKSingleton()
    /*
    var protobuf = new ObjshSDK.Protobuf('objsh')    
    document.getElementById('login-btn').onclick = function(evt){
        evt.preventDefault()
        var username = encodeURIComponent(document.getElementById('username').value)
        var password = encodeURIComponent(document.getElementById('password').value)
        var url = "/objsh/login?username=" +  username + 
                "&password=" + encodeURIComponent(password) + 
                "&oknext="+encodeURIComponent(location.pathname) + 
                "&errnext="+encodeURIComponent(location.pathname)
        location.href = url
    }
    document.getElementById('logout-btn').onclick = function(evt){
        evt.preventDefault()
        var url = "/objsh/logout?" + 
                "&oknext="+encodeURIComponent(location.pathname)
        location.href = url
    }
    $.get("/unittest/whoami",function(username){
        console.log('you are ',username)
        if (username == "guest"){
            document.getElementById("login-form").style.display = ""
            document.getElementById("logout-form").style.display = "none"
        }else{
            document.getElementById("login-form").style.display = "none"
            document.getElementById("logout-form").style.display = ""
            document.querySelector('.username').innerHTML = username
        }
    })
    */
    var lineCount = 0
    var addLine = function(line){
            if (lineCount > 100){
                lineCount = 0
                document.getElementById('ws-response').innerHTML = ''
            }
            lineCount += 1
            var ele = document.createElement('div')
            ele.innerHTML = line
            document.getElementById('ws-response').insertBefore(ele,document.querySelector('#ws-response div:first-child'))
        }
    
    /*
        speed test
    */
    var waitingEcho = {}
    var reportEcho=function(result){
        delete waitingEcho[result.retcode]
    }
    var echoCount = 0,suspendEcho=false
    var emitEcho = function(use_pbjson,use_json){
        echoCount += 1
        var commandDict = {
                id: echoCount
                ,name:'echo'
                ,args:["abc","efg"]
                ,kw:{"x":"y","w":"z"}
            }
        if (use_json){
            window.ws.send(JSON.stringify(commandDict))
        }
        else if (use_pbjson){
            commandDict['@type'] = 'objsh.Command'
            window.ws.send(JSON.stringify(commandDict))
        }else{
            //by protobuf
            var command = protobuf.message('Command',commandDict)
            command.emit()
        }
        waitingEcho[echoCount] = 1
        if (!suspendEcho) setTimeout(function(){emitEcho(use_pbjson,use_json)})
    }
    var echoTestStart = function(){
        var use_pbjson =  document.getElementById('ws-protobuf-json').checked
        var use_json =  document.getElementById('ws-json').checked
        addLine('echo started')
        suspendEcho = false
        echoCount = 0
        var start = new Date().getTime()
        var duration = Math.max(2,parseInt($('#duration').val()))
        var thread = parseInt($('#thread').val())
        for (var i=0;i<thread;i++){
            emitEcho(use_pbjson,use_json)
        }
        setTimeout(function(){
            suspendEcho = true
        },(duration - 1) * 1000)
        setTimeout(function(){
            var end = new Date().getTime()
            var remain = 0
            for (var k in waitingEcho){remain+= 1}
            var rps = Math.floor((echoCount - remain)/(end-start-1) * 1000)
            addLine(['issued=',echoCount,', missing=',remain,', request/second=',rps].join(" "))
        },duration * 1000)
    }
    document.getElementById('ws-connect-btn').onclick = function(evt){
        $(document.getElementById('ws-connect-close-btn')).show()
        $(document.getElementById('ws-connect-btn')).hide()
        $(document.getElementById('ws-options')).hide()
        evt.preventDefault()
        $('#connected-area').show()
        var protected = document.getElementById('protected-ws').checked
        var use_pb =  document.getElementById('ws-protobuf').checked
        var use_pbjson =  document.getElementById('ws-protobuf-json').checked
        var use_json =  document.getElementById('ws-json').checked
        var url = "ws://"+location.host+"/objsh"+(protected ? "/pri" : "")+(use_json ? '/wsjson' : ( use_pbjson ? '/wspbjson' : (use_pb ? "/wspb" : "/ws")))
        if (use_pb){
            
            protobuf.connect(url)
            protobuf.onopen=function(){
                addLine("Connected to "+url)
            }
            protobuf.onclose = function(){
                addLine("Closed")
            }
           
            protobuf.onmessage = function(message){
                // message is an instance of ObjshSDK.ProtobufMessage()
                switch (message.typeName){
                    case 'Result':
                        window.msg = message
                        var result = message.toObject()
                        switch(result.id){
                            case 0:
                                addLine(JSON.stringify(result))
                                
                                break
                            case 2:
                                reportEcho(result)
                                break
                        }
                        break
                }
            }                    
        }
        else if (use_pbjson){
            var ws = new WebSocket(url)
            window.ws = ws
            ws.onconnect = function(){
                addLine("Connected to "+url)
            }
            ws.onclose = function(){
                addLine("Closed")
            }
            ws.onmessage = function(evt){
                var any = JSON.parse(evt.data)
                switch(any.id){
                    case 1:
                        addLine(JSON.stringify(any))
                        break
                    case 2:
                        reportEcho(any)
                        break
                }
            }
        }
        else if (use_json){
            var ws = new WebSocket(url)
            ws.binaryType = "arraybuffer"
            window.ws = ws
            ws.onconnect = function(){
                addLine("Connected to "+url)
            }
            ws.onclose = function(){
                addLine("Closed")
            }
            var blob2str = function(data,callback){
                const reader = new FileReader();
                // This fires after the blob has been read/loaded.
                reader.addEventListener('loadend', (e) => {
                    callback(e.srcElement.result);
                });
                reader.readAsText(data)
            }
            ws.onmessage = function(evt){
                var b = new Blob([evt.data])
                blob2str(b,function(str){
                    var obj = JSON.parse(str)
                    switch(obj.id){
                        case 1:
                            addLine(JSON.stringify(obj))
                            break
                        case 2:
                            reportEcho(obj)
                            break
                    }                    
                })                
            }
        }
        else{
            var ws = new WebSocket(url)
            window.ws = ws
            ws.onconnect = function(){
                addLine("Connected to "+url)
            }
            ws.onclose = function(){
                addLine("Closed")
            }
            ws.onmessage = function(evt){
                addLine(evt.data)
            }
        }

        document.getElementById('ws-send-btn').onclick = function(){
            var value = document.getElementById('ws-input').value
            ws.send(value)
        }
    }
    document.getElementById('ws-connect-close-btn').onclick = function(evt){
        evt.preventDefault()
        $(document.getElementById('ws-connect-close-btn')).hide()
        $(document.getElementById('ws-connect-btn')).show()
        $(document.getElementById('connected-area')).hide()
        $(document.getElementById('ws-options')).show()
        var use_pb =  document.getElementById('ws-protobuf').checked
        var ws
        if (use_pb) ws = protobuf.ws
        else ws = window.ws
        ws.onclose = function(){}
        ws.close()
        console.log('--close--')
    }
    document.getElementById('ws-echo-btn').onclick = function(evt){
        evt.preventDefault()
        echoTestStart()
    }
    document.getElementById('upload-btn').onclick= function(evt){
        var file = document.getElementById('file').files[0]
        var protected = document.getElementById('protected-up').checked
        var resp_bytes = true
        if (resp_bytes){
            var url = "//"+location.host+"/unittest"+(protected ? "/pri" : "")+"/py/upload_resp_bytes"
        }else{
            var url = "//"+location.host+"/unittest"+(protected ? "/pri" : "")+"/py/upload"
        }
        var i = 0
        var do_upload = function(){
            upload(url,file).done(function(response){
                console.log(response)
            })   
            i += 1
            if (i < 1)  do_upload()
        }
        do_upload()
    }
    /* API */
    document.getElementById('ws-connect-api-btn').onclick = function(evt){
        evt.preventDefault()
        var protected = document.getElementById('protected-api').checked
        var url = "ws://"+location.host+"/objsh"+(protected ? "/pri" : "")+ "/wsapi"
        var protobuf = new ObjshSDK.Protobuf('objsh')
        console.log('connect to',url)
        protobuf.connect(url)
        protobuf.onopen=function(){
            addLine("Connected to "+url)
        }
        protobuf.onclose = function(){
            addLine("Closed")
        }
        
        protobuf.onmessage = function(message){
            // message is an instance of ObjshSDK.ProtobufMessage()
            //console.log('Protobuf>>',message)
            switch (message.typeName){
                case 'Result':
                    var result = message.toObject()
                    if (result.retcode == 0){
                        addLine('Succeed:'+result.stdout)
                    }
                    else{
                        addLine('Error:'+result.stderr)
                    }
                    
                    break
            }
        }
        document.getElementById('ws-call-api-btn').onclick = function(){
            var nodeName = $('#node').val()
            var args = $('#node').find(':selected').attr('args')
            var kwobj = {}
            var kw = $('#node').find(':selected').attr('kw')
            if (kw){
                kw.split(',').forEach(function(item){
                    kv = item.split('=')
                    kwobj[kv[0].trim()] = kv[1].trim()
                })
            }
            var command = protobuf.message('Command',{
                id: 10,
                name: "Tree."+nodeName,
                args:args ? args.split(',') : [],
                kw:kwobj
            })
            console.log(command.toObject())
            command.emit()
        } 
    }


    /* Tree Calls and chat*/
    var tree = null
    document.getElementById('ws-call-tree-btn').onclick = function(evt){ //Tree Call
        var callTree = function(){
            var path = $('#tree-path').val()

            var args,kw,pbMsg
            if ($('#tree-call-args').val()){
                args = $('#tree-call-args').val().split(',')
            }else{
                //test Protobuf
                // a bare Protocol buffer message
                var bareMessage = new proto.grpcstyle.HelloRequest()
                bareMessage.setGreeting("fuck you")
                console.log('~~~~ins',bareMessage.constructor.prototype) //jspb.Message
                pbMsg = bareMessage
            }
            
            if ($('#tree-call-kw').val()){
                kw = {}
                var items = $('#tree-call-kw').val().split(',')
                items.forEach(function(item){
                    var kv = item.split('=')
                    if (kv.length==2 && kv[0].trim().length){
                        kw[kv[0].trim()] = kv[1].trim()
                    }
                })
            }
            
            tree.call(path,args,kw,pbMsg).then(function(response){
                addLine('THEN:'+JSON.stringify(response))
            }).progress(function(response){
                addLine('Progress:'+JSON.stringify(response))
            }).done(function(response){
                addLine('DONE'+JSON.stringify(response))
            }).fail(function(response){
                addLine('Error'+JSON.stringify(response))
            })
        }
        if (tree == null) {
            var protected = document.getElementById('tree-protected').checked
            var url = "ws://"+location.host+"/objsh/"+(protected ? "pri/" : "")+"tree"
            console.log('user tree at',url)
            tree = new ObjshSDK.Tree(url)
            tree.onannouce = function(content){addLine("Tree Announce>> "+content)}
            tree.onopen = function(){
                callTree()
                //enable clock
                
                tree.call('Tree.UnitTest.Clock',[100]).progress(function(response){
                    $('#server-time').html(response)
                })
                
            }
            return 
        } else {callTree()}
    }
    //tests of chatting
    var roomname = function(){
       return $(document.getElementById('chat-room')).val()
    }
    var myname = 'User'+Math.floor(Math.random() * 100)
    document.getElementById('chat-join-btn').onclick = function(){
        if (tree == null)return alert("not connected yet")
        addLine("You are "+myname)
        tree.call('Tree.$chat.Join',[roomname(),myname]).progress(function(message){
            addLine(this.roomname+">>"+JSON.stringify(message))
        }.bind({roomname:roomname()})).fail(function(err){
            addLine("Join room failed "+JSON.stringify(err))
        })
    }
    document.getElementById('chat-exit-btn').onclick = function(){
        if (tree == null) return alert("not connected yet")
        tree.call('Tree.$chat.Exit',[roomname()]).done(function(response){
            addLine('Exited from '+roomname())
        })
    }
    document.getElementById('chat-talk-btn').onclick = function(){
        if (tree == null)return alert("not connected yet")
        var content = document.getElementById('chat-talk').value
        var duplicate_start = parseInt(document.getElementById('chat-talk-duplicate').value)
        var send_talk = function(duplicate){
            document.getElementById('chat-talk-duplicate').value = duplicate
            if (duplicate==0) {
                document.getElementById('chat-talk-duplicate').value = duplicate_start
                return
            }
            tree.call('Tree.$chat.Talk',[roomname(),'#'+duplicate+'::'+content]).fail(function(err){
                addLine("Talk to room failed "+JSON.stringify(err))
            })
            setTimeout(function(){send_talk(duplicate-1)})
        }
        send_talk(duplicate_start)
    }    
    /* gRPC style */
    
    var grpc_protobuf= null
    document.getElementById('grpc-style-btn').onclick = function(evt){
        if (grpc_protobuf == null){
            var url = "ws://"+location.host+"/objsh/grpcstyle"
            grpc_protobuf = new ObjshSDK.Protobuf('grpcstyle')
            console.log('connect to',url)
            grpc_protobuf.connect(url)
            grpc_protobuf.onopen=function(){
                addLine("Connected to "+url)
                var hello = grpc_protobuf.message('HelloRequest',{
                    greeting: document.getElementById('grpc-greeting').value
                })
                console.log(hello.toObject())
                hello.emit()                
            }
            grpc_protobuf.onclose = function(){
                addLine("Closed")
            }
            
            grpc_protobuf.onmessage = function(message){
                // message is an instance of ObjshSDK.ProtobufMessage()
                //console.log('Protobuf>>',message)
                switch (message.typeName){
                    case 'HelloReply':
                        //var response = message.toObject()
                        addLine("By message.get('reply') ->"+message.get('reply'))
                        addLine("By message.value.getReply() ->"+message.value.getReply())
                        break
                }
            }
        }

    }

    /* Python websocket handler */
    var pyws;
    document.getElementById('pyws-connect-btn').onclick = function(){
        var url = "ws://"+location.host+"/objsh/pyws"
        pyws = new WebSocket(url)
        pyws.onopen = function(){
            addLine("python websocket opened")
        }
        pyws.onclose = function(){
            addLine("python websocket closed")
        }
        pyws.onmessage = function(evt){
            addLine(evt.data)
        }
    }
    document.getElementById('pyws-send-btn').onclick = function(){
        if (!pyws) return alert('not connected yet')
        pyws.send(document.getElementById('pyws-message').value)
    }
})