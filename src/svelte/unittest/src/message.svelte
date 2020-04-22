<script>
import {importState, event} from './store.js'
let message = importState('message','')
let classname = 'message-component'

const setMessage = function(value){
    const el = jQuery('.'+classname)
    if (value) {
         el.w2tag(value)
        setTimeout(() => {
            // should reset to empty, otherwise same message value would not trigger Svelte's event
            message.set('')
            el.w2tag()
        },1500)
    }
    else  el.w2tag()
}
message.subscribe(value =>{
    if (value) setMessage(value)
})
event.on('message',(value)=>{
    setMessage(value)
})
</script>

<span style="display:inline-block;width:1px;" class="{classname}">&nbsp;</span>