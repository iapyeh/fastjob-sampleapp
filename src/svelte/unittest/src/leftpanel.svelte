<script>
import { importState, setState, event } from './store.js'
import { loadNode } from './mainpanel.svelte'
import { autoTestStart } from './autotest.svelte'
let namespace = importState('namespace')
let user = importState('user')
let message = importState('message')
let config = importState('config')
let layout = importState('layout')
let username = ''

// inital nodes on the sidebar
let nodes = [
    { id: 'overview', text: 'Overview', img: 'icon-folder', expanded: true, group: true,
        nodes: [ 
             { id: 'settings', text: 'Settings', img:'icon-folder' }
            ,{ id: 'golang', text: 'Go', img: 'icon-folder', expanded: true , 
                nodes: [
                    { id: 'goroute', text: 'Route', icon: 'fa-star-empty' },
                ]}
            ,{ id: 'python', text: 'Python', img: 'icon-folder', expanded: true, 
                nodes: [
                    { id: 'pyroute', text: 'Route', icon: 'fa-star-empty' },
                    { id: 'pyreactor', text: 'Reactor,Event Loops', icon: 'fa-star-empty' },
                ]}
            ,{ id:'authentication',text:'Authentication', img:'icon-folder', expanded: true,
                nodes:[

                ]}
        ]
    }
]
function renderToolbar(){
    if (w2ui['LeftPanelToolbar']) w2ui['LeftPanelToolbar'].destroy()
    jQuery('.LeftPanelToolbar').w2toolbar({
        name:'LeftPanelToolbar',
        items:[
            //{id:'newgroup',img:'fas fa-layer-group',tooltip:'Add Folder Node'},
            //{id:'newsubgroup',img:'fas fa-folder',tooltip:'Add Sub Folder'},
            //{id:'newtest',img:'fas fa-vial',tooltip:'Add Testing Node'},
            {type:'spacer'},
            //{id:'remove',img:'fas fa-trash',tooltip:'Remove Current Node'},
            //{type:'break'},
            {id:'refresh',img:'fas fa-redo',tooltip:'Refersh sidebar'},
        ],
        onClick:function(evt){
            
            switch(evt.target){
                case 'refresh':
                    render(true)
                    break
            }
        }
    })
}
function render(){
    let url = $config.allSidebarNodesUrl
    jQuery.getJSON(url,(testing_nodes)=>{
        if (w2ui['LeftPanel']) w2ui['LeftPanel'].destroy()
        jQuery('.LeftPanel').w2sidebar({
            name: 'LeftPanel',
            nodes: nodes.concat(testing_nodes),
            onClick:function(evt){
                evt.done(()=>{
                    if (evt.node.url || evt.node.testings) loadNode(evt.node)
                })
            }
        }); 
        message.set('sidebar refreshed')
    }).fail(function(err){
        w2alert(err.responseText)
    })
}

user.subscribe(value =>{
    if (value == null) return
    username = $user.username
    if (username == 'guest'){
        //not been login or has logout
        if (w2ui['LeftPanel']) w2ui['LeftPanel'].destroy()
    }else{
        var rect = $layout.el('left').getBoundingClientRect()
        jQuery('.LeftPanel').height(rect.height - 30)
        renderToolbar()
        render()
    }
})

</script>
<style>
.LeftPanelToolbar{
    height:30px;
    background-color:#e6e6e6;
}
.LeftPanel{
}
</style>

<div>
<div class="LeftPanel"></div>
<div class="LeftPanelToolbar"></div>
</div>