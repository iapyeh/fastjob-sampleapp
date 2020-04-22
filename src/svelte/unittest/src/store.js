/*
 use Svelte store as
 1. an event channel
 2. a configuration store
 3. a constant / singleton (such as jquery ) store
*/
import { writable, readable } from 'svelte/store';
//import jQuery from "jquery";

/* 
 Svelte store-based event system 
*/

let states = {}
const config = {
    loginUrl : '/unittest/login'
    ,logoutUrl : '/unittest/pri/logout'
    // see what headers sent by this browser
    // used for benchmark (wrk) to set headers
    ,allHeadersUrl:'/unittest/pri/allheaders'
    ,allSidebarNodesUrl:'/unittest/pri/static/sidebarAllNodes.json'
}
states['config'] = readable(config)
export const importState = (key,defaultValue) =>{
    if (typeof(states[key]) == 'undefined'){
        states[key] = writable((typeof defaultValue == 'undefined' ? null : defaultValue));
    }
    return states[key]
}
export const getState = (key,defaultValue) =>{
    console.log('getState() deprecated, use importState instead')
    return importState(key,defaultValue)
}
export const hasState = (key) => {
    return (typeof(states[key]) != 'undefined')
}
export const setState = (key,value) => {
    let s = importState(key)
    s.set(value)
    return s
}

states['requestHeaders'] = writable({})
export const refreshRequestHeaders = () => {
    // see what headers sent by this browser
    // used for benchmark (wrk) to set headers
    return jQuery.getJSON(config.allHeadersUrl).done((headers)=>{
        states['requestHeaders'].set(headers)
    }).fail((err)=>{
        console.warn(config.allHeadersUrl,'error',err.responseText)
    })
}

/* 
Event system
*/
let eventListeners = {}
const onEvent = (evtname,listener,listenerId) => {
    var lEvtName = evtname.toLowerCase()
    if (typeof listenerId == 'undefined') listenerId = '' + (new Date().getTime())
    if (!eventListeners[lEvtName]) eventListeners[lEvtName] = {}
    eventListeners[lEvtName][listenerId] = listener
    return listenerId
}
const onceEvent = (evtname,listener) =>{
    let listenerId = '_' + new String(new Date().getTime())
    return onEvent(evtname,listener,listenerId)
}
const fireEvent = (evtname, payload) => {
    var lEvtName = evtname.toLowerCase()
    if (eventListeners[lEvtName]){
        for(var listenerId in eventListeners[lEvtName]){
            try{
                eventListeners[lEvtName][listenerId](payload)
                if (listenerId.substr(0,1) == '_') offEvent(evtname,listenerId)
            }catch(e){
                console.log(e)
            }
        }
    }
}
const offEvent = (evtname,listenerId) =>{
    var lEvtName = evtname.toLowerCase()
    if (eventListeners[lEvtName]){
        delete eventListeners[lEvtName][listenerId]
    }
}
export let event = {
    on: onEvent,
    off: offEvent,
    once: onceEvent,
    fire:fireEvent
}


// in  *.js, $state is not accessible, call getState instead.
/*
export const getState = function (key){
    return stateData[key]
}
*/