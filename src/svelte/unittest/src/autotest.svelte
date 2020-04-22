<script context="module">
let renderListOfTestingNodes
export const  autoTestStart = (rootNode) => {
    renderListOfTestingNodes(rootNode)
}
</script>

<script>
import { importState, setState, event } from './store.js'
let layout = importState('layout')
import { onMount,tick } from 'svelte'
import { loadNode } from './mainpanel.svelte'
let namespace = importState('namespace')
let user = importState('user')
let message = importState('message')
let mainTabs = importState('mainTabs')

//let featuretestInstance = importState('featuretestInstance')
let el ;
let testingItems = []

// render a list of nodes for testing
renderListOfTestingNodes = function(rootNode){

    let rightLayoutName = 'right-layout'
    
    if (w2ui[rightLayoutName]) {
        return
    }

    jQuery($layout.el('right')).w2layout({
        name:rightLayoutName,
        panels:[
            {type:'top',size:'50%',toolbar:{
                    items:[
                        {id:'start',text:'Start',icon:'fas fa-play-circle'},
                        //{id:'suspend',text:'Suspend',img:'fas fa-pause',disable:true},
                        //{id:'stop',text:'Stop',img:'fas fa-stop',disable:true}
                        {type:'spacer'},
                        {id:'refresh',text:'Refresh',icon:'fas fa-redo',tooltip:'regenerate list table'},
                        {type:'break'},
                        {id:'close',text:'Close',icon:'fas fa-times-circle'}
                    ],
                    onClick:function(evt){
                        switch(evt.target){
                            case 'start':
                                w2ui[rightLayoutName].get('top').toolbar.disable('start')
                                startTest()
                                break
                            case 'close':
                                $layout.hide('right',true)
                                break
                            case 'refresh':
                                //w2ui[rightLayoutName].get('top').toolbar.enable('start')
                                //regenerate table
                                w2ui[rightLayoutName].destroy()
                                setTimeout(()=>{renderListOfTestingNodes()})
                                break
                        }
                    }
                }
            },
            {type:'main',size:'50%'}
        ],
    })

    if (typeof rootNode == 'undefined') rootNode = w2ui['LeftPanel']

    let records = []
    let recid = 0
    var digTestItems = function(node){
        if (node.nodes && node.nodes.length > 0){
            node.nodes.forEach((subnode) =>{
                digTestItems(subnode)
            })
        }else if (node.testings && node.testings.length){
            //let testing = node.testings[0]
            let children = []
            let hasChildren = node.testings.length > 1
            node.testings.forEach((testing)=>{
                children.push({
                    recid:recid, 
                    nodeName:(hasChildren ? '' : node.text),
                    name:testing.name,
                    url:testing.query.url,
                    testing:testing,
                    node:node,
                    pass:'',
                })
                recid += 1
            })
            if (hasChildren){
                children.sort((a,b)=>{
                    return a.testing.priority > b.testing.priority ? 1 : (a.testing.priority < b.testing.priority ? -1 : 0)
                })
                // doTest should only be true at top level nodes
                records.push({
                    recid:recid, 
                    nodeName:node.text,
                    node:node,
                    name:'',
                    url:'',
                    pass:'',
                    doTest:true,
                    w2ui:{
                        expand:true,
                        children:children
                    }
                })
                recid += 1
            }else{
                // doTest should only be true at top level nodes
                children[0].doTest = true
                records.push(children[0])
            }
        }
    }    
    digTestItems(rootNode)
    
    //testingItems = nodesOfTest.slice()

    if (w2ui['autotest-list']) w2ui['autotest-list'].destroy()
    let grid = jQuery().w2grid({
        name:'autotest-list',
        columns:[
            {field:'nodeName',caption:'Node',size:30},
            {field:'name',caption:'Testing',size:30},
            {field:'url',caption:'URL',size:30},
            {field:'pass',caption:'Pass',size:5},
        ],
        show:{
            lineNumbers:true,
        },
        onClick:(evt)=>{
            evt.done(()=>{
                //let columnName = w2ui['autotest-list'].columns[evt.column].field
                let record = w2ui['autotest-list'].get(evt.recid)
                loadNode(record.node) 
            })
        }
    })
    w2ui['autotest-list'].records = records
    grid.render(w2ui[rightLayoutName].el('top'))
    setTimeout(()=>{
        w2ui['autotest-list'].refresh()
    },200)
}

let queueOfTestingCalls = []
let registerAutoTesting = function(testingCall,priority){
    queueOfTestingCalls.push({priority:priority,callable:testingCall})
}
let resetAutoTestingQueue = function(testingCall){
    queueOfTestingCalls = []
}

// a page will call this to register autotesting calls when it is loaded
setState('registerAutoTesting',registerAutoTesting)
setState('resetAutoTestingQueue',resetAutoTestingQueue)

function doTestingOnItem(record){
    // return a promise which always resove, never reject.
    // it resolves an array of boolean of pass or no-pass.
    // ex. [true,false] (pass at 1st testing, no-pass at 2nd testing)
    let  promise = new jQuery.Deferred()
    message.set('Testing '+record.node.text)
    let resultOfTestings = []
    // There might be multiple testing items on this Node
    let startTestingOfNode = function(idx){
        if (idx >= queueOfTestingCalls.length){
            promise.resolve(resultOfTestings)
            return
        }
        let testingCall = queueOfTestingCalls[idx].callable
        let p = testingCall()
        p.done(function(pass){
            resultOfTestings.push(pass)
        })
        .fail(function(xhr){
            console.warn(record.node.text,'error=',xhr.responseText)
            resultOfTestings.push(false)
        })
        .always(() => {
            startTestingOfNode(idx + 1)
        })
    }
    loadNode(record.node).done(function(){
        queueOfTestingCalls.sort((a,b)=>{
            return a.priority < b.priority ? -1 : (a.priority > b.priority ? 1 : 0)
        })
        $mainTabs.click('Test')
        startTestingOfNode(0)
    }).fail((e)=>{
        console.warn('loadNode Error:' + e)
    })
    return promise
}

function startTest(){
    let records = w2ui['autotest-list'].records
    if (records.length == 0){
        return jQuery.when()
    }
    let p = new jQuery.Deferred()
    let activateTesting = function(i){
        if (i >= records.length){
            p.resolve()
            return
        }
        if (records[i].doTest){
            //miso
            if (records[i].w2ui && records[i].w2ui.children && records[i].w2ui.children.length > 1){
                w2ui['autotest-list'].expand(records[i].recid)
            }
            doTestingOnItem(records[i]).always(function(testingResults){
                // pass if and only all pass
                let pass = testingResults.reduce((current,newvalue) => (current && newvalue), true)
                records[i].pass = '<span class="fas fa-' + (pass ? 'check' : 'bug') + '"></span>'
                if (!pass) records[i].w2ui = jQuery.extend(records[i].w2ui || {} ,{style:'color:red'})
                w2ui['autotest-list'].refreshRow(records[i].recid)
                if (records[i].node.testings.length > 1){
                    records[i].w2ui.children.forEach((child,idx)=>{
                        let pass = testingResults[idx]
                        child.pass = '<span class="fas fa-' + (pass ? 'check' : 'bug') + '"></span>'
                        if (!pass) child.w2ui.style = 'color:red'
                        w2ui['autotest-list'].refreshRow(child.recid)
                    })
                }
                setTimeout(()=>{
                    activateTesting(i+1)
                })
            })
        }else{
            setTimeout(()=>{activateTesting(i+1)})
        }
    }
    activateTesting(0)
    return p
}

</script>
<style>
.autotest-list-box{
    height:500px;
}
</style>
