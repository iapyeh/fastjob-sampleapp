<script context="module">
    //auto generate page
    let generateTestingTags = null
    let renderPage = null
    let renderContent = null
    export function loadNode(node){
        if (node.url && node.testings){
            let promise = new jQuery.Deferred()
            jQuery.get(node.url,async function(response){
                let tags = generateTestingTags(node)
                
                //seperate .tabs from response, insert tabs in node to response
                let p = response.indexOf('</tabs>')
                let content;
                if (p == -1){
                    // collect existing content to tab "Doc"
                    content = '<tabs>' + tags.tabs.join('') + '<tab data-id="Doc">Doc</tab></tabs>' + '<div class="tab-content Doc">' + response + '</div>'
                }else{
                    content = response.substring(0,p) + tags.tabs.join('') + response.substring(p) + tags.tabContents.join('') 
                }
                renderContent(content,promise)
            }).fail((e)=>{
                promise.reject(e)
            })
            return promise
        }
        else if (node.url) {
            return renderPage(node.url)
        }
        else if (node.testings) {
            let tags = generateTestingTags(node)
            let promise = new jQuery.Deferred()
            let content = '<tabs>' + tags.tabs.join('') +'</tabs>' + tags.tabContents.join('')
            renderContent(content,promise)
            return promise
        }
        else return jQuery.when(true)
    }
</script>
<script>
import { onMount, getContext, setContext} from 'svelte';
import { tick } from 'svelte';
import {  importState, setState, event } from './store.js'
let resetAutoTestingQueue = importState('resetAutoTestingQueue')
let mainTabs = importState('mainTabs')
let content = ''
let signleton
let className 
onMount(()=>{
    signleton.className.split(' ').some(function(n){
        if (/^svelte/.test(n)) {className = n; return true}
    })
})

let layout = importState('layout')

/*
function resize(){
    // size the container ".mainpanel-content" to fill parent container
    let box = document.querySelector('.mainpanel-content')
    let size = $layout.el('main').getBoundingClientRect()
    box.style.width = size.width + 'px'
    box.style.height = size.height + 'px'
}
*/

renderPage = function (url) {
    var promise = new jQuery.Deferred()
    jQuery.get(url,async function(response){
        try{
            renderContent(response, promise)
        }catch(e){
            console.warn(e)
            promise.reject('renderPage error:' + e)
        }
    })
    return promise
}

// node comes from left-panel
generateTestingTags = function(node){
    var promise = new jQuery.Deferred()
    let testings = []
    let tab = '    '
    node.testings.forEach((testing) =>{
        testings.push('<featuretest>')
        testings.push('<priority>' + (testing.priority || 1) + '</priority>')
        testings.push('<name>' + testing.name + '</name>')
        testings.push(tab+'<query>')
        testings.push(tab+tab+'<url>'+testing.query.url+'</url>')
        if (testing.query.method){
            testings.push(tab+tab+'<method>'+testing.query.method+'</method>')
        }
        if (testing.query.data) {
            testings.push(tab+tab+'<data>'+escape(JSON.stringify(testing.query.data))+'</data>')
        }
        testings.push(tab+'</query>')
        testings.push('    <expect>')
        if (testing.expect.status) {
            let statusArray = typeof testing.expect.status == 'string' ? [testing.expect.status] : testing.expect.status
            statusArray.forEach((status) => {testings.push('        <status>' + status + '</status>')})
        }
        if (testing.expect.header) {
            let headerArray = typeof testing.expect.header == 'string' ? [testing.expect.header] : testing.expect.header
            headerArray.forEach((header) => {testings.push('       <header>' + header + '</header>')})
        }
        if (testing.expect.response){
            let responseArray = typeof testing.expect.response == 'string' ? [testing.expect.response] : testing.expect.response
            responseArray.forEach((response) => {testings.push('     <response>' + response + '</response>')})
        }
        if (testing.expect.notes){
            testings.push('<notes>' + testing.expect.notes + '</notes>')    
        }
        if (testing.expect.validate) testings.push(tab+tab+'<validate>'+escape(testing.expect.validate.trim())+'</validate>')
        if (testing.expect.responseType) testings.push(tab+tab+'<responseType>'+testing.expect.responseType.trim()+'</responseType>')
        if (testing.expect.renderResponse) testings.push(tab+tab+'<renderResponse>'+escape(testing.expect.renderResponse.trim())+'</renderResponse>')

        testings.push('    </expect>')
        testings.push('</featuretest>')
    })
    var testingTags = testings.join('    \n')

    let benchmarkTag = node.benchmarks ? '<tab data-id="Benchmark">Benchmark</tab>' : ''
    return {
        tabs:[' <tab data-id="Test" data-active="1">Test</tab>',benchmarkTag ],
        tabContents:[`<div class="tab-content Test">${testingTags}</div>`,
                '<div class="tab-content Benchmark"></div>']
    }
}

renderContent = async function(response,promise){
    if (response.indexOf('<featuretest') > 0 || response.indexOf('<benchmark') > 0) {
        response += `
        <script>
            var totalCount = document.querySelectorAll('.mainpanel-page featuretest').length
            document.querySelectorAll('.mainpanel-page featuretest').forEach(function(featuretest,idx){
                app.registerFeatureTest({
                    target: featuretest.parentNode,
                    props:{
                        name: featuretest.querySelector('name').innerHTML,
                        priority: parseInt(featuretest.querySelector('priority').innerText),
                        expectXML:featuretest.querySelector('expect'),
                        queryXML:featuretest.querySelector('query')
                    }
                })
            })
            // wait for featuretest component to be rendered.
            var readyCount = 0
            var listenerId = app.event.on('featuretest-ready',()=>{
                readyCount += 1
                if (readyCount == totalCount){
                    app.event.off('featuretest-ready',listenerId)
                    app.event.fire('mainpanel-ready')
                }
            })
        <\/script>`
    }
    
    // clean queue of auto-test
    if ($resetAutoTestingQueue) $resetAutoTestingQueue()
    
    response = '<div class="mainpanel-page">' + response + '</div>'
    jQuery('.mainpanel-content.'+className).html(response)
    // wait DOM to be updated
    await tick()

    // size the container ".mainpanel-content" to fill parent container
    let box = $layout.el('main')//.querySelector('.mainpanel-content')

    // add Classname to injected elements to let CSS take effecitve
    box.querySelectorAll('.tab-content, code, .code, .code p, .code pre, .http-response, .http-response.pass, .http-response.no-pass').forEach(function(ele){
        ele.classList.add(className)
    })

    let tabsEle = box.querySelector('tabs')
    let tabs = []
    let active_tab = ''
    tabsEle.querySelectorAll('tab').forEach(function(ele){
        tabs.push({id:ele.dataset['id'], caption:ele.innerHTML})
        if (ele.dataset['active']) active_tab = ele.dataset['id']
    })
    let tabbox = $layout.get('main').tabs.box
    let name = $layout.get('main').tabs.name
    if (w2ui[name]) w2ui[name].destroy()
    $layout.get('main').tabs = jQuery(tabbox).w2tabs({
        name:name,
        tabs:tabs,
        active:active_tab,
        onClick:function(evt){
            active_tab = evt.target
            evt.done(function(){
                if (box.querySelector('.tab-content.active')){
                    box.querySelector('.tab-content.active').classList.remove('active')
                }
                if (box.querySelector('.tab-content.'+active_tab+'.'+className)){
                    box.querySelector('.tab-content.'+active_tab+'.'+className).classList.add('active')
                    event.fire('mainpanel-active-tab',active_tab)
                }
            })
        }
    })
    jQuery(tabsEle).hide()
    $layout.showTabs('main')
    w2ui[name].click(active_tab)
    mainTabs.set(w2ui[name])

    app.event.once('mainpanel-ready',()=>{
        promise.resolve()
    })
}


</script>
<style>
.mainpanel-content{
    display:flex;
    align-items:stretch;
    flex-direction:column;
    background-color:white;
}

/* 
方法一：
Below are CSS classes used by content in loadded page (ex. staticfile.html) by @html.
The Svelte does not append Svelte-specific class to them,
So we have to escalate :global()
方法二：
取得此component的classname，將此classname加入所有的相關class中
*/
.tab-content{
    display: none;
    width:100%;
    background-color:white;
    padding:15px;
}
.tab-content.active{
    display:block;
}
.tab-content p{
    padding-left:20px;
}
code{
    font-weight: bold;
    background-color: #f5f5f5;
    padding: 2px;
    border-radius:2px;
}
.code pre{
    margin:5px 0px;
    padding:10px 20px;
    font-size:1.0em;
    outline: 1px solid #cccccc;
    font-family:monospace;
    background-color: cornsilk;
}
.code p{
    margin:0;
    padding:0;
}

:global(featuretest){
    display:none;
}
:global(benchmark){
    display:none;

}
</style>
{#if true}
    <div bind:this={signleton} class="mainpanel-content"></div>
{:else}
    <!-- 為了讓Svelte將style中的css compile 進去，因為只有用到的css才會被compile進去 -->
    <div class="tab-content active"></div>
    <div class="code"><p></p><pre></pre></div>
    <code/>
    <div class="http-response pass error"></div>
    <div class="http-response"><div class="header"></div></div>
{/if}