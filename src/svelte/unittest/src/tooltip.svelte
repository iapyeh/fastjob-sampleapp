<script context="module">
export const scanTooltip = (cls, ele) => {
    ele.querySelectorAll('tooltip').forEach((tooltip)=>{
        new cls({
            target:tooltip,
            props:{
                tooltipXML:tooltip
            }
        })
    })
}
</script>
<script>
import {onMount} from 'svelte'
export let tooltipXML;
export let el
let text = ''
onMount(async()=>{
    text = tooltipXML.getAttribute('text')
})
let showing = false
function showtip(){
    if (showing) return
    showing = true
    jQuery(el).w2tag(tooltipXML.getAttribute('tip'))
}
function hidetip(){
    showing = false
    jQuery(el).w2tag()
}
function popuphref(evt){
    showing = false
    jQuery(el).w2tag()
    let url = tooltipXML.getAttribute('url')
    if (!url) return
    let size = (tooltipXML.getAttribute('size') || '800x600').split('x')
    w2popup.load({
        url:url,
        showMax:true,
        width:size[0],
        height:size[1]
    })
}
</script>
<span style="cursor:help" bind:this={el} class="fas fa-info-circle" on:click={popuphref} on:mouseout={hidetip} on:mouseenter={showtip}>{text}</span>