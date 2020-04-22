<script>
/*
 toobar in top-panel is created in mainpanel.svelte,
 see "toppanelToolbarSettings" in mainpanel.svelte for detail.
*/
import { importState, setState, event } from './store.js'
import LoginLogout from './loginout.svelte'
import Message from './message.svelte'

let namespace = importState('namespace')
let user = importState('user')
let username = 'guest'
let message = importState('message','')
user.subscribe(value =>{
    if ($user == null) return
    username = $user.username
})

</script>
<div style="display:inline-block">
    <h4 style="margin:0">Unittest of {$namespace} for {username} <Message/> <LoginLogout/> </h4>
</div>
