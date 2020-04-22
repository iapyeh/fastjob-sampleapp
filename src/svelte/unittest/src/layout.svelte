<script>
import { onMount, getContext, setContext} from 'svelte';
import TopPanel from './toppanel.svelte'
import LeftPanel from './leftpanel.svelte'
import MainPanel from './mainpanel.svelte'
//import { default as MainPanel } from './mainpanel.svelte'
import { importState, setState, event } from './store.js'
import  { default as AutoTest, autoTestStart}  from './autotest.svelte'
let layout 
let leftSize = '20%'
let rightSize = '50%'
let topSize = 37
let namespace = importState('namespace')
let autotest = importState('autotest'); //instance of AutoTest
const unsubscribe = namespace.subscribe(value =>{
    if ($namespace == null) return
    let w2layout = render($namespace)
    setState('layout',w2layout)
    unsubscribe() // because namespace is need once
})


const doAutoTest = function (){
    
    // toggle right panel
    if (!layout.get('right').hidden){
        layout.hide('right',true)
        return
    }
    
    //layout.sizeTo('right','50%',true)
    layout.show('right',true)
    
    if (!$autotest){
        // create autotest once only
        layout.content('right','<div class="autotest-box"></div>')
        autotest.set(new AutoTest({
            target:layout.el('right').querySelector('.autotest-box'),
        }))
    }
    
    autoTestStart()
}

function render(namespace){
    
    const box = jQuery('.' + namespace + '.Layout')
    box.css({
        width:'100%',
        height:'100%',
        'background-color':'#c0c0c0'
    })
    
    layout = w2ui[namespace + 'layout']
    
    if (layout) return layout
    
    var topPanelRenderer = {
        render:function(){
            setTimeout(function(){
                layout = w2ui[namespace + 'layout']
                new TopPanel({
                    target:layout.get('top').toolbar.box.querySelector('.app-header-in-toolbar')
                })
            },0)
        }
    }
    var leftPanelRenderer = {
        render:function(){
            layout = w2ui[namespace + 'layout']
            new LeftPanel({
                target:layout.el('left')
            })
        }
    }

    var toppanelToolbarSettings = {
        style: '',
        items: [
            { type: 'html',  id: 'html', html:'<div class="app-header-in-toolbar"></div>' },
            { type: 'spacer'},
            { type: 'button',  id: 'autotest', caption: 'Auto Test', img: 'icon-page'},
            //{ type: 'button',  id: 'edit', caption: 'Edit', img: 'icon-page'},
        ],
        onClick:function(evt){
            switch(evt.target){
                case 'autotest':
                    doAutoTest()
                    break
            }
        }
    }
    box.w2layout({
        name: namespace + 'layout',
        panels: [
            { type: 'top', size: topSize,resizable:false,content:topPanelRenderer,toolbar:toppanelToolbarSettings},
            { type: 'left', size: leftSize, resizable: true , content:leftPanelRenderer},
            { type: 'right', size: rightSize, hidden:true, resizable: true,content:'<div class="panel-content"></div>'},
            { type: 'main', resizable: true, style:'background-color:white',content:'',tabs:{tabs:[]}},
        ]
    });    

    layout = w2ui[namespace + 'layout']
    
    //render MainPanel
    
    let mainpanel = new MainPanel({
        target:layout.el('main'),
        props:{
        }
    })
    
    return layout
}
</script>
<slot></slot>