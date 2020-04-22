<script>
import { setContext,onMount } from 'svelte';
import { importState, setState, event } from './store.js'
import Layout from "./layout.svelte";
export let namespace = ''
onMount(async ()=>{
    setState('namespace',namespace)
})
let user = importState('user')
const unsubscribe = user.subscribe(value =>{
    if (value == null) return //initialization phase
    if (user.username == 'guest'){
        setState('sdk',null)
        setState('tree',null)
    }else{
        var protectMode= false
        var url = "ws://"+location.host+"/unittest/"+(protectMode ? "pri/" : "pub/")+"tree"
        var sdk = GetSDKSingleton()
        sdk.useTree('Unittest',url).done(function(tree){
            setState('sdk',sdk)
            setState('tree',tree)
        })
    }
})
</script>

<Layout>
<div class="{namespace} Layout"></div>
</Layout>
