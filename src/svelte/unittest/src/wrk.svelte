<script>
import { importState } from './store.js'
import {onMount} from 'svelte'

export let options = {
    url:'',
    thread: 5,
    connection:10,
    duratoin:3
}
let el
let className
let tree = importState('tree')
export let myself
onMount(async ()=>{
    el.className.split(' ').some(function(n){
        if (/^svelte/.test(n)) {className = n; return true}
    })
    if ($tree){
        render()
    }
})
const render = () =>{
    const fields = [
            { name:'url', field: 'url', type: 'text', required: true ,html:{caption:'URL', attr:'placeholder="http://" style="width:300px"'}},
            { name:'thread', field: 'thread', type: 'int', required: true,html:{text:'concurrent thread(-t)'} },
            { name:'connection', field: 'connection', type: 'int', required: true, html:{text:'connection/thread(-c)'} },
            { name:'duration', field: 'duration', type: 'int', required: true,html:{text:'testing duration(-d)'}},
        ]
    const record = {
            url:options.url,
            thread:options.thread || 5,
            connection:options.connection || 10,
            duration:options.duration || 3
        }
    const prefix = 'wrk'
    // name will be converted to be "id" of <input>,
    // so to set a unique name is necessary
    fields.forEach((f)=>{
        f.name = prefix + f.name
    })
    let urecord = {}
    for (let name in record){
        urecord[prefix+name] = record[name]
    }

    if (w2ui['wrk-form']) w2ui['wrk-form'].destroy()
    jQuery(el.querySelector('.form')).w2form({ 
        name     : 'wrk-form',
        header   : 'Benchmark by wrk',
        style:'width:500px',
        fields: fields,
        record: urecord,
        actions: {
            reset: function () {
                this.clear();
            },
            save: function () {
                var record = {}
                var len = prefix.length
                for(let name in this.record){
                    record[name.substr(len)] = this.record[name]
                }
                if ((!options.validate) || options.validate(record)){
                    start_benchmark(record)
                }                
            }
        }
    });
    el.querySelector('button[name="save"]').innerHTML = 'Run'    
}

tree.subscribe(tree =>{
    if ($tree == null){
        if (w2ui['wrk-form']) w2ui['wrk-form'].destroy()
        return
    }else if (el){
        render()
    }    
})

const start_benchmark = (record) =>{
    w2ui['wrk-form'].lock('Testing',true)
    var path = 'Testing.Benchmark'
    //var path = 'Testing.SubprocessTest'
    var flag = 0
    var url = record.url
    if (!/^http/.test(url)) url = location.protocol + '//' + location.host + (url.substr(0,1) == '/' ? '' : '/') + url
    var args = ['-t', record.thread, '-c', record.connection,'-d',record.duration,url]
    var kw = {}
    var pbMsg = null
    var cmd =  $tree.call(path,args,kw,pbMsg)
    var kill = false
    if (kill){
        setTimeout(function(){
            cmd.kill().done(function(response){
                console.log(response)
            }).fail(function(retcode,errmsg){
                console.log([retcode,errmsg])
            })
        },1000)
    }
    const addLine = (s) => {
        let div = document.createElement('pre')
        div.innerText = s
        el.querySelector('.result').appendChild(div)
    }
    cmd.always(function(){
        w2ui['wrk-form'].unlock()
    }).progress(function(response){
        addLine(response)
    }).done(function(response){
        addLine(response)
    }).fail(function(retcode, errmsg){
        addLine('Error: '+retcode+' '+errmsg)
    })                
}
</script>
<style>
.result pre{
    font-family:Courier !important;
}
</style>
<div>
<slot>
    <p>Please note: <a href="https://github.com/wg/wrk" target="blank">Wrk</a> is required to be installed on server for benchmark working</p>
    <div bind:this={el}>
        <div class="form"/>
        <div class="result"><pre></pre></div>
    </div>
</slot>
</div>
