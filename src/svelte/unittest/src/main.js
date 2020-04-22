import App from './App.svelte';
import {importState,event,setState} from './store.js'
import Wrk  from './wrk.svelte'
import Featuretest from './featuretest.svelte'

const app = new App({
	target: document.body.querySelector('#app'),
	props: {
		namespace: 'unittest_'
	}
});

// for dynamically loaded *.js to access store
app.importState = importState

// external page can fire events
app.event = event

// external page can prompt message
app.message = importState('message')

// external page can create components
app.component = {
    benchmark : Wrk,
    featuretest: Featuretest,
}

app.registerFeatureTest = (options) => {
    options.props.myself = null
    let f = new Featuretest(options)
    f.$set({myself:f})
    setState('featuretestInstance',f)
}
app.registerBenchmark = (options) =>{
    options.props.myself = null
    let w = new Wrk(options)
    w.$set({myself:w})
    setState('benchmarkInstance',w)
}
// app is the entry point of all external page access
// see rollup.config.js for public name
export default app;
