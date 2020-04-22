<script context="module">
let hashCount = 0
</script>
<script>
import { importState, refreshRequestHeaders, event } from './store.js'
import { default as Tooltip, scanTooltip} from './tooltip.svelte'
import {onMount} from 'svelte'
export let name // string
export let priority = 0 // less got more priority
export let expectXML // a XML DOM element for settings
export let queryXML // a XML DOM element for settings
export let myself 
let el
let className
let config = importState('config')
let tree = importState('tree')
let requestHeaders = importState('requestHeaders')
let registerAutoTesting = importState('registerAutoTesting')

let query = {}
// compiler willl complain myself, but actually myself is set in main.js

hashCount += 1
let formName = 'featuretest-form' + hashCount
const prefix = 'featuretest' + hashCount

onMount(async ()=>{
    query.url = queryXML.querySelector('url').innerText
    query.method = queryXML.querySelector('method') ? queryXML.querySelector('method').innerText.trim().toLowerCase() : 'get'
    query.data = queryXML.querySelector('data') ? JSON.parse(unescape(queryXML.querySelector('data').innerText)) : []
    // convert <expect> to pretty DOM element
    let lintExpectedLines =  []
    let pat = /^\/(.+)\/([ig]*)$/

    queryXML.remove()

    // collect expected value
    expectXML.querySelectorAll('status').forEach(function(ele){
        let text = ele.innerText.trim()
        if (text=='') return
        if (pat.test(text)) {
            let m = text.match(pat)
            expects.status.push(new RegExp(m[1],m[2]))
        }else{
            expects.status.push(new RegExp(text))
        }
        lintExpectedLines.push('<div class="status">' + text + '</div>')
    })
    expectXML.querySelectorAll('header').forEach(function(ele){
        let text = ele.innerText.trim()
        if (text=='') return
        if (pat.test(text)) {
            let m = text.match(pat)
            expects.header.push(new RegExp(m[1],m[2]))
        }else{
            expects.header.push(new RegExp(text))
        }
        lintExpectedLines.push('<div class="header">' + text + '</div>')
    })
    expectXML.querySelectorAll('response').forEach(function(ele){
        let text = ele.innerText.trim()
        if (text=='') return
        if (pat.test(text)) {
            let m = text.match(pat)
            expects.response.push(new RegExp(m[1],m[2]))
        }else{
            expects.response.push(new RegExp(text))
        }
        lintExpectedLines.push('<div class="response">' + text + '</div>')
    })


    if (expectXML.querySelector('validate')) {
        let code = unescape(expectXML.querySelector('validate').innerText)
        expects.validate =  (new Function('"use strict";return (' + code +')'))()
        expects.validateSource = code
    }

    if (expectXML.querySelector('responseType')) expects.responseType = expectXML.querySelector('responseType').innerText

    if (expectXML.querySelector('renderResponse')) {
        let code = unescape(expectXML.querySelector('renderResponse').innerText)
        expects.renderResponse =  (new Function('"use strict";return (' + code +')'))()
        expects.renderResponseSource = code
    }

    // set default condition to status=200 if there is none given
    if (expects.status.length + expects.header.length + expects.response.length == 0 && (!expectXML.querySelector('validate'))){
        expects.status.push(200)
    }

    if (expectXML.querySelector('notes')) lintExpectedLines.push('<div class="notes">' + expectXML.querySelector('notes').innerHTML + '</div>')

    expectXML.remove()
   
    // className could be "" if there is no style settting on it,
    // Svelte compiler would not assign. But if there are multip instance of this component,
    // they share the same class name.
    el.className.split(' ').some(function(n){
        if (/^svelte/.test(n)) {className = n; return true}
    })

    // increase this value to create uniqe w2form
    hashCount += 1

    if ($tree){
        refreshRequestHeaders().done(()=>{
            render().done(()=>{
                // call registerAutoTesting if this page is created by AutoTest compoenent (autotest.svelte)
                if ($registerAutoTesting){
                    $registerAutoTesting(()=>{
                        return startTeaturetest()
                    },priority)
                }
                // autotest need this event to know that it 
                // can start to call startTeaturetest()
                event.fire('featuretest-ready')
            })
        })
    }

})


// expected values defined in loaded htmls
let expects = { 
    status:[],
    header:[],
    response:[]
}
const expectsChecker =  (response, xhr) => {
    let pass = true
    let messages = []
    if (expects.status.length){
        let s = new String(xhr.status)
        expects.status.some(function(re){
            if (!s.match(re)){
                messages.push('status error')
                pass = false
                return true
            }
        })
    }
    if (expects.header.length){
        let allHeaders = xhr.getAllResponseHeaders()
        expects.header.some(function(re){
            if (!allHeaders.match(re)){
               messages.push('header error')
                pass = false
                return true
            }
        })
    }
    if (expects.response.length){

        if (typeof response == 'object'){
            // covert object to json if necessary
            response = JSON.stringify(response)
        }
        
        expects.response.some(function(re){
            if (!response.match(re)){
                messages.push('response error')
                pass = false
                return true
            }
        })
    }
    return [pass, messages]
}


const render = () =>{

    let textarea_attr = 'cols="100" style="white-space:pre;width:98%; ' //should( + 'height:40px"  <-- end quote )
    // page #0
    let fields = [
            { name:'url',field: 'url', type: 'textarea', 
                required: true ,html:{
                    text:'<br/><a target="_blank" href="'+escape(query.url)+'">' + query.url+'</a>',
                    caption:'URL To ' + query.method, 
                    attr:textarea_attr+'height:50px" placeholder="http://"'}
            },
        ]
    let record = {
        url:query.url,
    }
    // add into query.data
    query.data.forEach((item)=>{
        let fieldEntry = jQuery.extend({},item) //copy this dict
        fieldEntry.field = fieldEntry.name
        
        // assign label
        if (fieldEntry.html && fieldEntry.html.caption) {} //pass
        else if (fieldEntry.html) fieldEntry.html.caption = fieldEntry.name
        else fieldEntry.html = {caption:fieldEntry.name}

        fields.push(fieldEntry)
        record[fieldEntry.name] = fieldEntry.value || ''
    })

    // page #1: benchmark tab
    fields.push({name:'benchmark_connections',html:{caption:'Connections',text:' cocurrent connections',page:1}})
    fields.push({name:'benchmark_threads',html:{caption:'Threads',text:' to make connections',page:1}})
    fields.push({name:'benchmark_duration',html:{caption:'Duration',text:' seconds to run',page:1}})
    fields.push({name:'benchmark_headers',type:'textarea',html:{
        attr:textarea_attr+'height:100px"', 
        caption:'Headers',
        text:'request headers, line by line; auto generated by <a target="_blank" href="'+$config.allHeadersUrl+'">' + $config.allHeadersUrl + '</a>',
        page:1}
        })
    record['benchmark_threads'] = 5
    record['benchmark_connections'] = 10
    record['benchmark_duration'] = 3
    let benchmark_headers = []
    let headers = ['Accept-Encoding','Cookie','Accept-Language','User-Agent']
    headers.forEach((name)=>{
        benchmark_headers.push(name + ': ' + $requestHeaders[name])
    })
    record['benchmark_headers'] = benchmark_headers.join('\n')

    // page #2: expact tab
    let linebyline = '<br/>line by line, <tooltip text="more about status,header and response" url="/page/help.html#status" size="600x600" tip="conditions to validate testing result">'
    fields.push({name:'expect_status',html:{caption:'Status',page:2,attr:textarea_attr+'height:40px"',text:linebyline},type:'textarea'})
    fields.push({name:'expect_header',html:{caption:'Header',page:2,attr:textarea_attr+'height:60px"'},type:'textarea'})
    fields.push({name:'expect_response',html:{caption:'Response',page:2,attr:textarea_attr+'height:80px"'},type:'textarea'})
    fields.push({name:'expect_validate',html:{caption:'validate()',page:2,attr:textarea_attr+'height:100px"',text:'<br/><tooltip text="more about validate(), responseType and renderResponse()" url="/page/help.html#validate" tip="customize reponse validation and how to render response on browser">'},type:'textarea'})
    fields.push({name:'expect_responseType',html:{caption:'responseType',page:2}})
    fields.push({name:'expect_renderResponse',html:{caption:'renderResponse()',page:2,attr:textarea_attr+'height:100px"'},type:'textarea'})
    record['expect_status'] = expects.status.join('\n')
    record['expect_header'] = expects.header.join('\n')
    record['expect_response'] = expects.response.join('\n')
    record['expect_validate'] = expects.validateSource
    record['expect_responseType'] = expects.responseType
    record['expect_renderResponse'] = expects.renderResponseSource
    // name will be converted to be "id" of <input>,
    // so to set a unique name is necessary
    fields.forEach((f)=>{
        f.name = prefix + f.name
    })
    let urecord = {}
    for (let name in record){
        urecord[prefix+name] = record[name]
    }
    jQuery(el.querySelector('.form')).w2form({ 
        name     : formName,
        header   : name,
        style:'width:100%',
        fields: fields,
        tabs:[
            {id:'featuretest',text:'Parameters'},
            {id:'benchmark',text:'Benchmark'},
            {id:'expect',text:'Expect'},
        ],
        record:urecord,
        toolbar:{
            items:[
                {id:'run',text:'Run Test',icon:'fas fa-play-circle', tooltip:'Run this testing case'},
                {id:'benchmark',text:'Do Benchmark',icon:'fas fa-running', tooltip:'Benchmarking this testing case'},
                {type:'break'},
                {id:'reset',text:'Reset',icon:'fas fa-pause', tooltip:'clean testing results'},
                {type:'spacer'},
                {id:'savecase',text:'New Case',icon:'fas fa-running',tooltip:'Save as a new testing case'},
            ],
            onClick:function(evt){
                switch(evt.target){
                    case 'run':
                        startTeaturetest() 
                        break
                    case 'benchmark':
                        startBenchmark()
                        break
                    case 'reset':
                        //miso
                        el.querySelector('.http-response.result .result-check').innerHTML = ''
                        el.querySelector('.http-response.result .result-content').innerHTML = ''
                        el.querySelector('.http-response.result').style.display = 'none'
                        break
                }
            }
        },
        actions:{

        }
    });
    
    //el.querySelector('button[name="save"]').style.display = 'none'
    //el.querySelector('button[name="reset"]').style.display = 'none'
    scanTooltip(Tooltip, w2ui[formName].box)

    return jQuery.when()
}
tree.subscribe(tree =>{
    if ($tree == null){
        if (w2ui['featuretest-form']) w2ui['featuretest-form'].destroy()
        return
    }
    //else if (el){
    //    render()
    //}    
})

const getRecordFromForm = (theform)=>{
    // convert form data to query data
    let record = {}
    let len = prefix.length
    if (theform) {
        query.data.forEach((item)=>{
            record[item.name] = theform.record[prefix + item.name]
        })
    }else{
        throw 'there is no w2form of name:' + formName
    }
    return record
}

export const startTeaturetest = () =>{
    let theform = w2ui[formName]
    let record = getRecordFromForm(theform)
    let promise = new jQuery.Deferred()
    theform.lock('Testing',true)
    let url = theform.record[prefix + 'url']
    let options = {
        url:url,
        data:record,
    }
    if (expects.responseType){
        options.xhr = function(){
            let xhr = new XMLHttpRequest();
            xhr.responseType= expects.responseType
            return xhr;
        }
    }
    // make query
    let resultContent = el.querySelector('.http-response.result .result-content')
    let resultCheck = el.querySelector('.http-response.result .result-check')
    let p = query.method == 'get' ? jQuery.get(options) : jQuery.post(options)
    p.done(function(response,status, xhr){
        el.querySelector('.http-response.result').style.display = 'block'        

        let renderedResponse 
        if (expects.renderResponse) renderedResponse  = expects.renderResponse(response)
        else if (expects.responseType && expects.responseType.toLowerCase() == 'json') {
            // auto-convert json to pretty string
            renderedResponse = JSON.stringify(response,null,2)
        } else {
            renderedResponse = response
        }

        resultContent.innerHTML = 
`<pre class="header">${xhr.status} ${xhr.statusText}
${xhr.getAllResponseHeaders().trim()}</pre>
<pre class="response">
${renderedResponse}
</pre>`

        let next = (pass,messages)=>{
            //let [pass = passMessages[0], messages = passMessages[1]
            if (typeof messages == 'string') messages = [messages]
            resultCheck.classList.add(pass ? 'pass' : 'no-pass')
            resultCheck.classList.remove(pass ? 'no-pass' : 'pass')
            if (messages) resultCheck.innerText = messages.join('\n')
            promise.resolve(pass,messages)

        }

        if ( expects.validate){
            let p = new jQuery.Deferred()
            p.done((messages)=>{
                next(true,messages)
            }).fail((messages)=>{
                next(false,messages)
            })
            expects.validate(response,xhr,p)
        }
        else{
            let [pass,messages]  = expectsChecker(response,xhr)
            next(pass,messages)
        }

    })
    .fail(function(xhr){
        el.querySelector('.http-response.result').style.display = 'block'
        resultCheck.classList.remove('pass')
        resultCheck.classList.add('no-pass')
        resultContent.innerHTML = '<pre class="header">' + xhr.status+ ' ' + xhr.statusText + '\n' + xhr.getAllResponseHeaders() + '</pre><pre class="response">' + xhr.responseText + '</pre>'
        promise.reject(xhr)
    })
    .always(()=>{
       theform.unlock()
    })
    return promise
}


export const startBenchmark = () =>{
    let theform = w2ui[formName]
    let record = getRecordFromForm(theform)
    // add settings of benchmark into record
    let benchmarkFields = ['threads','connections','duration','cookie','headers']
    benchmarkFields.forEach((name)=>{
        record[name] = theform.record[prefix + 'benchmark_' + name]
    })    
    // start benchmark process
    theform.lock('Testing',true)
    let path = 'Testing.Benchmark'
    
    //var path = 'Testing.SubprocessTest'
    //let flag = 0
    
    let headers = []
    //if (record.cookie) headers.push('Cookie:' + record.cookie)
    if (record.headers){
        record.headers.split('\n').forEach((line)=>{
            line = line.trim()
            if (line.length) headers.push(line)
        })
    }
    let args = ['-t', record.threads, '-c', record.connections, '-d', record.duration, '--timeout', 10 + record.duration]
    let readableArgs = args.slice()
    headers.forEach((header) =>{
        args.push('-H')
        readableArgs.push('-H')

        args.push(header)
        readableArgs.push('"' + header.replace('"','\\"') + '"')
        
    })

    let url = theform.record[prefix + 'url']
    if (!/^http/.test(url)) url = location.protocol + '//' + location.host + (url.substr(0,1) == '/' ? '' : '/') + url
    args.push(url)
    readableArgs.push('"' + url.replace('"','\\"') + '"')

    let kw = {}
    let pbMsg = null
    let cmd =  $tree.call(path,args,kw,pbMsg)
    
    /*
    let kill = false
    if (kill){
        setTimeout(function(){
            cmd.kill().done(function(response){
                console.log(response)
            }).fail(function(retcode,errmsg){
                console.log([retcode,errmsg])
            })
        },1000)
    }
    */

    el.querySelector('.result.http-response').innerHTML = ''
    el.querySelector('.result.http-response').style.display = 'block'

    const addResult = (s) => {
        let div = document.createElement('pre')
        div.innerText = s
        el.querySelector('.result').appendChild(div)
    }
    cmd.always(function(){
        theform.unlock()
    }).progress(function(response){
        addResult(response)
    }).done(function(response){
        addResult(response)
    }).fail(function(retcode, errmsg){
        addResult('Error: '+retcode+' '+errmsg)
    })                
}
</script>
<style>

/* Testing related starts */
:global(.http-response.expected){
    text-align:left;
    white-space:normal;
    background-color:white !important;
    border-radius:5px;
    padding-left:15px;
    padding-bottom:10px;
}
:global(.http-response.expected::before){
    content:"Expected";
    padding:10px;
    margin-left:-15px;
    display:block;
    border-bottom:solid 1px #c4c2c2;
    margin-bottom:10px;
}
:global(.http-response.expected .status){
    font-weight: bold;
}
:global(.http-response.expected .header){
    font-weight: bold;
}
:global(.http-response.expected .response){
    margin-top:1em;
    font-weight: bold;
}

:global(.http-response){
    font-family: monospace;
    white-space: pre;
    width:100%;
    border-radius:5px;
    padding:0px;
    border:solid 1px #dbdbdb;  
    overflow:auto;

}
:global(.http-response.result){
    display:none;

}
:global(.http-response.result::before){
    content:"Result";
    padding:10px;
    display:block;
    border-bottom:solid 1px #c4c2c2;
    margin-bottom:10px;
}
:global(.http-response pre){
    width:100%;
    padding:0px 10px;
    margin:0;
    overflow-x:auto;
}
:global(.http-response .status){
    /* 載入的 page 當中會有動態增加的內容，所以用 :global() */
    color:#888;
}
:global(.http-response .header){
    /* 載入的 page 當中會有動態增加的內容，所以用 :global() */
    color:#888;
}
:global(.http-response .response){
    /* 載入的 page 當中會有動態增加的內容，所以用 :global() */
}
:global(.http-response .result-check.pass){
}
:global(.http-response .result-check.pass::before){
    content: "PASS";
    margin-left: 2px;
    background-color: #46fd3b;
    padding: 0px 10px;
    display: inline-block;
    line-height: 20px;
    font-size: 14px;
}
:global(.http-response .result-check.no-pass){
}
:global(.http-response .result-check.no-pass::before){
    content: "NO-PASS";
    margin-left: 2px;
    color:white;
    background-color: #fd583b;
    padding: 0px 10px;
    display: inline-block;
    line-height: 20px;
    font-size: 14px;
    border-radius: 5px;
}

.featuretest-box{
}
/* Testing related end */
</style>
<div bind:this={el}>
    <slot>
        <div >
            <table style="width:100%;vertical-align:top">
                <tr>
                    <td style="min-width:250px;width:100%;vertical-align:top"><div class="form"/></td>
                </tr>
                <tr>
                    <td style="vertical-align:top">
                        <div class="result http-response">
                            <div class="result-check"></div>
                            <div class="result-content"></div>
                        </div>
                    </td>
                </tr>

            </table>
            
        </div>
    </slot>
    <!-- let svelte compiler to include related css -->
    <div style="display:none" class="http-response pass no-pass expected"><pre></pre></div>
</div>
