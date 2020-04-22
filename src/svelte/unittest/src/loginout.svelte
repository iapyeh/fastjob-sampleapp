<script>
/*
Events:
    1. login-succeed, 此listener會在login成功的event之前(aka setState("user") 事件）
    先被呼叫。 SDK 利用來建立tree物件，讓其他收到 login 成功事件的listener可使用

    2.then  setState("user",{username:<not guest>}), when login succeed
*/
import { onMount } from 'svelte';
import { importState, setState, event } from './store.js'
let config = importState('config')
let user = importState('user')
let username = 'guest'
function doLogin(_username,_password,callback){
    let data
    if (_username){
        data = {username:_username,password:_password}
    }else{
        data = {}
    }
    jQuery.getJSON($config.loginUrl,data, function(response){
        if (response.username)  {
            username = response.username
            user.set({username:username})
            if (callback) callback(true,response)           
        }
        else {
            if (callback) callback(false)
        }
    })

}
onMount(async ()=>{
    doLogin(null,null)
})
function logout(){
    w2confirm(
        'Are you sure to logout?',
        function(yes){
            if (yes != 'Yes') return
            jQuery.get($config.logoutUrl,function(response){
                username = 'guest'
                user.set({username:username})
            })
        }
    )
}
function login(){
    w2popup.open({
        title:'Login',
        body:jQuery('.loginform-template .loginform').clone(),
        buttons:'<button class="w2ui-btn login">Login</button>'
    })
    jQuery('#w2ui-popup button.login').on('click',function(){
        let name = jQuery('#w2ui-popup input.username').val()
        let password = jQuery('#w2ui-popup input.password').val()
        if (name && password){
            doLogin(name,password,function(success,response){
                if (success) {
                    w2popup.close()
                }
                else jQuery('#w2ui-popup .message').html('try again')
            })
        }
    })
}
</script>
<style>
.loginform{

}
.loginform input{
    display: block;
    padding: 10px;
}
</style>

<span class="fas fa-user"></span>
{#if username=='guest'}
    <a  href="javascript:void(0);" on:click="{login}"><span>Login</span></a>
{:else}
    <a  href="javascript:void(0);" on:click="{logout}"><span title="{username}">Logout</span></a>
{/if}

<div style="display:none" class="loginform-template">
    <div class="loginform w2ui-center">
        <div class="message">&nbsp;</div>
        <input class="username" placeholder="username"/>
        <input class="password" type="password"/>
    </div>
</div>