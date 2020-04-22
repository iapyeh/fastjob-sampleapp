
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /*
     use Svelte store as
     1. an event channel
     2. a configuration store
     3. a constant / singleton (such as jquery ) store
    */
    //import jQuery from "jquery";

    /* 
     Svelte store-based event system 
    */

    let states = {};
    const config = {
        loginUrl : '/unittest/login'
        ,logoutUrl : '/unittest/pri/logout'
        // see what headers sent by this browser
        // used for benchmark (wrk) to set headers
        ,allHeadersUrl:'/unittest/pri/allheaders'
    };
    states['config'] = readable(config);
    const importState = (key,defaultValue) =>{
        if (typeof(states[key]) == 'undefined'){
            states[key] = writable((typeof defaultValue == 'undefined' ? null : defaultValue));
        }
        return states[key]
    };
    const setState = (key,value) => {
        let s = importState(key);
        s.set(value);
        return s
    };

    states['requestHeaders'] = writable({});
    const refreshRequestHeaders = () => {
        // see what headers sent by this browser
        // used for benchmark (wrk) to set headers
        return jQuery.getJSON(config.allHeadersUrl).done((headers)=>{
            states['requestHeaders'].set(headers);
        }).fail((err)=>{
            console.warn(config.allHeadersUrl,'error',err.responseText);
        })
    };

    /* 
    Event system
    */
    let eventListeners = {};
    const onEvent = (evtname,listener,listenerId) => {
        var lEvtName = evtname.toLowerCase();
        if (typeof listenerId == 'undefined') listenerId = '' + (new Date().getTime());
        if (!eventListeners[lEvtName]) eventListeners[lEvtName] = {};
        eventListeners[lEvtName][listenerId] = listener;
        return listenerId
    };
    const onceEvent = (evtname,listener) =>{
        let listenerId = '_' + new String(new Date().getTime());
        return onEvent(evtname,listener,listenerId)
    };
    const fireEvent = (evtname, payload) => {
        var lEvtName = evtname.toLowerCase();
        if (eventListeners[lEvtName]){
            for(var listenerId in eventListeners[lEvtName]){
                try{
                    eventListeners[lEvtName][listenerId](payload);
                    if (listenerId.substr(0,1) == '_') offEvent(evtname,listenerId);
                }catch(e){
                    console.log(e);
                }
            }
        }
    };
    const offEvent = (evtname,listenerId) =>{
        var lEvtName = evtname.toLowerCase();
        if (eventListeners[lEvtName]){
            delete eventListeners[lEvtName][listenerId];
        }
    };
    let event = {
        on: onEvent,
        off: offEvent,
        once: onceEvent,
        fire:fireEvent
    };


    // in  *.js, $state is not accessible, call getState instead.
    /*
    export const getState = function (key){
        return stateData[key]
    }
    */

    /* src/loginout.svelte generated by Svelte v3.14.1 */
    const file = "src/loginout.svelte";

    // (81:0) {:else}
    function create_else_block(ctx) {
    	let a;
    	let span;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			span = element("span");
    			t = text("Logout");
    			attr_dev(span, "title", ctx.username);
    			add_location(span, file, 81, 55, 2220);
    			attr_dev(a, "href", "javascript:void(0);");
    			add_location(a, file, 81, 4, 2169);
    			dispose = listen_dev(a, "click", ctx.logout, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, span);
    			append_dev(span, t);
    		},
    		p: function update(changed, ctx) {
    			if (changed.username) {
    				attr_dev(span, "title", ctx.username);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(81:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (79:0) {#if username=='guest'}
    function create_if_block(ctx) {
    	let a;
    	let span;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			span = element("span");
    			span.textContent = "Login";
    			add_location(span, file, 79, 54, 2134);
    			attr_dev(a, "href", "javascript:void(0);");
    			add_location(a, file, 79, 4, 2084);
    			dispose = listen_dev(a, "click", ctx.login, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, span);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(79:0) {#if username=='guest'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let div2;
    	let div1;
    	let div0;
    	let t3;
    	let input0;
    	let t4;
    	let input1;

    	function select_block_type(changed, ctx) {
    		if (ctx.username == "guest") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(null, ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = " ";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			attr_dev(span, "class", "fas fa-user");
    			add_location(span, file, 77, 0, 2022);
    			attr_dev(div0, "class", "message");
    			add_location(div0, file, 86, 8, 2372);
    			attr_dev(input0, "class", "username svelte-6zth90");
    			attr_dev(input0, "placeholder", "username");
    			add_location(input0, file, 87, 8, 2414);
    			attr_dev(input1, "class", "password svelte-6zth90");
    			attr_dev(input1, "type", "password");
    			add_location(input1, file, 88, 8, 2471);
    			attr_dev(div1, "class", "loginform w2ui-center svelte-6zth90");
    			add_location(div1, file, 85, 4, 2328);
    			set_style(div2, "display", "none");
    			attr_dev(div2, "class", "loginform-template");
    			add_location(div2, file, 84, 0, 2270);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			insert_dev(target, t0, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    		},
    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t1.parentNode, t1);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t0);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $config;
    	let config = importState("config");
    	validate_store(config, "config");
    	component_subscribe($$self, config, value => $$invalidate("$config", $config = value));
    	let user = importState("user");
    	let username = "guest";

    	function doLogin(_username, _password, callback) {
    		let data;

    		if (_username) {
    			data = { username: _username, password: _password };
    		} else {
    			data = {};
    		}

    		jQuery.getJSON($config.loginUrl, data, function (response) {
    			if (response.username) {
    				$$invalidate("username", username = response.username);
    				user.set({ username });
    				if (callback) callback(true, response);
    			} else {
    				if (callback) callback(false);
    			}
    		});
    	}

    	onMount(async () => {
    		doLogin(null, null);
    	});

    	function logout() {
    		w2confirm("Are you sure to logout?", function (yes) {
    			if (yes != "Yes") return;

    			jQuery.get($config.logoutUrl, function (response) {
    				$$invalidate("username", username = "guest");
    				user.set({ username });
    			});
    		});
    	}

    	function login() {
    		w2popup.open({
    			title: "Login",
    			body: jQuery(".loginform-template .loginform").clone(),
    			buttons: "<button class=\"w2ui-btn login\">Login</button>"
    		});

    		jQuery("#w2ui-popup button.login").on("click", function () {
    			let name = jQuery("#w2ui-popup input.username").val();
    			let password = jQuery("#w2ui-popup input.password").val();

    			if (name && password) {
    				doLogin(name, password, function (success, response) {
    					if (success) {
    						w2popup.close();
    					} else jQuery("#w2ui-popup .message").html("try again");
    				});
    			}
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$invalidate("config", config = $$props.config);
    		if ("user" in $$props) user = $$props.user;
    		if ("username" in $$props) $$invalidate("username", username = $$props.username);
    		if ("$config" in $$props) config.set($config = $$props.$config);
    	};

    	return { config, username, logout, login };
    }

    class Loginout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loginout",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/message.svelte generated by Svelte v3.14.1 */
    const file$1 = "src/message.svelte";

    function create_fragment$1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(" ");
    			set_style(span, "display", "inline-block");
    			set_style(span, "width", "1px");
    			attr_dev(span, "class", classname);
    			add_location(span, file$1, 25, 0, 600);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let classname = "message-component";

    function instance$1($$self) {
    	let message = importState("message", "");

    	const setMessage = function (value) {
    		const el = jQuery("." + classname);

    		if (value) {
    			el.w2tag(value);

    			setTimeout(
    				() => {
    					message.set("");
    					el.w2tag();
    				},
    				1500
    			);
    		} else el.w2tag();
    	};

    	message.subscribe(value => {
    		if (value) setMessage(value);
    	});

    	event.on("message", value => {
    		setMessage(value);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) message = $$props.message;
    		if ("classname" in $$props) $$invalidate("classname", classname = $$props.classname);
    	};

    	return {};
    }

    class Message extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Message",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/toppanel.svelte generated by Svelte v3.14.1 */
    const file$2 = "src/toppanel.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let h4;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let current;
    	const message_1 = new Message({ $$inline: true });
    	const loginlogout = new Loginout({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			t0 = text("Unittest of ");
    			t1 = text(ctx.$namespace);
    			t2 = text(" for ");
    			t3 = text(ctx.username);
    			t4 = space();
    			create_component(message_1.$$.fragment);
    			t5 = space();
    			create_component(loginlogout.$$.fragment);
    			set_style(h4, "margin", "0");
    			add_location(h4, file$2, 20, 4, 546);
    			set_style(div, "display", "inline-block");
    			add_location(div, file$2, 19, 0, 507);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h4);
    			append_dev(h4, t0);
    			append_dev(h4, t1);
    			append_dev(h4, t2);
    			append_dev(h4, t3);
    			append_dev(h4, t4);
    			mount_component(message_1, h4, null);
    			append_dev(h4, t5);
    			mount_component(loginlogout, h4, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (!current || changed.$namespace) set_data_dev(t1, ctx.$namespace);
    			if (!current || changed.username) set_data_dev(t3, ctx.username);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(message_1.$$.fragment, local);
    			transition_in(loginlogout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(message_1.$$.fragment, local);
    			transition_out(loginlogout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(message_1);
    			destroy_component(loginlogout);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $user;
    	let $namespace;
    	let namespace = importState("namespace");
    	validate_store(namespace, "namespace");
    	component_subscribe($$self, namespace, value => $$invalidate("$namespace", $namespace = value));
    	let user = importState("user");
    	validate_store(user, "user");
    	component_subscribe($$self, user, value => $$invalidate("$user", $user = value));
    	let username = "guest";
    	let message = importState("message", "");

    	user.subscribe(value => {
    		if ($user == null) return;
    		$$invalidate("username", username = $user.username);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("namespace" in $$props) $$invalidate("namespace", namespace = $$props.namespace);
    		if ("user" in $$props) $$invalidate("user", user = $$props.user);
    		if ("username" in $$props) $$invalidate("username", username = $$props.username);
    		if ("message" in $$props) message = $$props.message;
    		if ("$user" in $$props) user.set($user = $$props.$user);
    		if ("$namespace" in $$props) namespace.set($namespace = $$props.$namespace);
    	};

    	return { namespace, user, username, $namespace };
    }

    class Toppanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toppanel",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/mainpanel.svelte generated by Svelte v3.14.1 */
    const file$3 = "src/mainpanel.svelte";

    // (269:0) {#if true}
    function create_if_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "mainpanel-content svelte-zq12zz");
    			add_location(div, file$3, 269, 4, 9544);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			ctx.div_binding(div);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			ctx.div_binding(null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(269:0) {#if true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;

    	function select_block_type(changed, ctx) {
    		return create_if_block$1;
    	}

    	let current_block_type = select_block_type();
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(changed, ctx) {
    			if_block.p(changed, ctx);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let generateTestingTags = null;
    let renderPage = null;
    let renderContent = null;

    function loadNode(node) {
    	if (node.url && node.testings) {
    		let promise = new jQuery.Deferred();

    		jQuery.get(node.url, async function (response) {
    			let tags = generateTestingTags(node);
    			let p = response.indexOf("</tabs>");
    			let content;

    			if (p == -1) {
    				content = "<tabs>" + tags.tabs.join("") + "<tab data-id=\"Doc\">Doc</tab></tabs>" + "<div class=\"tab-content Doc\">" + response + "</div>";
    			} else {
    				content = response.substring(0, p) + tags.tabs.join("") + response.substring(p) + tags.tabContents.join("");
    			}

    			renderContent(content, promise);
    		}).fail(e => {
    			promise.reject(e);
    		});

    		return promise;
    	} else if (node.url) {
    		return renderPage(node.url);
    	} else if (node.testings) {
    		let tags = generateTestingTags(node);
    		let promise = new jQuery.Deferred();
    		let content = "<tabs>" + tags.tabs.join("") + "</tabs>" + tags.tabContents.join("");
    		renderContent(content, promise);
    		return promise;
    	} else return jQuery.when(true);
    }

    let content = "";

    function instance$3($$self, $$props, $$invalidate) {
    	let $resetAutoTestingQueue;
    	let $layout;
    	let resetAutoTestingQueue = importState("resetAutoTestingQueue");
    	validate_store(resetAutoTestingQueue, "resetAutoTestingQueue");
    	component_subscribe($$self, resetAutoTestingQueue, value => $$invalidate("$resetAutoTestingQueue", $resetAutoTestingQueue = value));
    	let mainTabs = importState("mainTabs");
    	let signleton;
    	let className;

    	onMount(() => {
    		signleton.className.split(" ").some(function (n) {
    			if ((/^svelte/).test(n)) {
    				className = n;
    				return true;
    			}
    		});
    	});

    	let layout = importState("layout");
    	validate_store(layout, "layout");
    	component_subscribe($$self, layout, value => $$invalidate("$layout", $layout = value));

    	renderPage = function (url) {
    		var promise = new jQuery.Deferred();

    		jQuery.get(url, async function (response) {
    			try {
    				renderContent(response, promise);
    			} catch(e) {
    				console.warn(e);
    				promise.reject("renderPage error:" + e);
    			}
    		});

    		return promise;
    	};

    	generateTestingTags = function (node) {
    		var promise = new jQuery.Deferred();
    		let testings = [];
    		let tab = "    ";

    		node.testings.forEach(testing => {
    			testings.push("<featuretest>");
    			testings.push("<priority>" + (testing.priority || 1) + "</priority>");
    			testings.push("<name>" + testing.name + "</name>");
    			testings.push(tab + "<query>");
    			testings.push(tab + tab + "<url>" + testing.query.url + "</url>");

    			if (testing.query.method) {
    				testings.push(tab + tab + "<method>" + testing.query.method + "</method>");
    			}

    			if (testing.query.data) {
    				testings.push(tab + tab + "<data>" + escape(JSON.stringify(testing.query.data)) + "</data>");
    			}

    			testings.push(tab + "</query>");
    			testings.push("    <expect>");

    			if (testing.expect.status) {
    				let statusArray = typeof testing.expect.status == "string"
    				? [testing.expect.status]
    				: testing.expect.status;

    				statusArray.forEach(status => {
    					testings.push("        <status>" + status + "</status>");
    				});
    			}

    			if (testing.expect.header) {
    				let headerArray = typeof testing.expect.header == "string"
    				? [testing.expect.header]
    				: testing.expect.header;

    				headerArray.forEach(header => {
    					testings.push("       <header>" + header + "</header>");
    				});
    			}

    			if (testing.expect.response) {
    				let responseArray = typeof testing.expect.response == "string"
    				? [testing.expect.response]
    				: testing.expect.response;

    				responseArray.forEach(response => {
    					testings.push("     <response>" + response + "</response>");
    				});
    			}

    			if (testing.expect.notes) {
    				testings.push("<notes>" + testing.expect.notes + "</notes>");
    			}

    			if (testing.expect.validate) testings.push(tab + tab + "<validate>" + escape(testing.expect.validate.trim()) + "</validate>");
    			if (testing.expect.responseType) testings.push(tab + tab + "<responseType>" + testing.expect.responseType.trim() + "</responseType>");
    			if (testing.expect.renderResponse) testings.push(tab + tab + "<renderResponse>" + escape(testing.expect.renderResponse.trim()) + "</renderResponse>");
    			testings.push("    </expect>");
    			testings.push("</featuretest>");
    		});

    		var testingTags = testings.join("    \n");

    		let benchmarkTag = node.benchmarks
    		? "<tab data-id=\"Benchmark\">Benchmark</tab>"
    		: "";

    		return {
    			tabs: [" <tab data-id=\"Test\" data-active=\"1\">Test</tab>", benchmarkTag],
    			tabContents: [
    				`<div class="tab-content Test">${testingTags}</div>`,
    				"<div class=\"tab-content Benchmark\"></div>"
    			]
    		};
    	};

    	renderContent = async function (response, promise) {
    		if (response.indexOf("<featuretest") > 0 || response.indexOf("<benchmark") > 0) {
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
        <\/script>`;
    		}

    		if ($resetAutoTestingQueue) $resetAutoTestingQueue();
    		response = "<div class=\"mainpanel-page\">" + response + "</div>";
    		jQuery(".mainpanel-content." + className).html(response);
    		await tick();
    		let box = $layout.el("main");

    		box.querySelectorAll(".tab-content, code, .code, .code p, .code pre, .http-response, .http-response.pass, .http-response.no-pass").forEach(function (ele) {
    			ele.classList.add(className);
    		});

    		let tabsEle = box.querySelector("tabs");
    		let tabs = [];
    		let active_tab = "";

    		tabsEle.querySelectorAll("tab").forEach(function (ele) {
    			tabs.push({
    				id: ele.dataset["id"],
    				caption: ele.innerHTML
    			});

    			if (ele.dataset["active"]) active_tab = ele.dataset["id"];
    		});

    		let tabbox = $layout.get("main").tabs.box;
    		let name = $layout.get("main").tabs.name;
    		if (w2ui[name]) w2ui[name].destroy();

    		$layout.get("main").tabs = jQuery(tabbox).w2tabs({
    			name,
    			tabs,
    			active: active_tab,
    			onClick(evt) {
    				active_tab = evt.target;

    				evt.done(function () {
    					if (box.querySelector(".tab-content.active")) {
    						box.querySelector(".tab-content.active").classList.remove("active");
    					}

    					if (box.querySelector(".tab-content." + active_tab + "." + className)) {
    						box.querySelector(".tab-content." + active_tab + "." + className).classList.add("active");
    						event.fire("mainpanel-active-tab", active_tab);
    					}
    				});
    			}
    		});

    		jQuery(tabsEle).hide();
    		$layout.showTabs("main");
    		w2ui[name].click(active_tab);
    		mainTabs.set(w2ui[name]);

    		app.event.once("mainpanel-ready", () => {
    			promise.resolve();
    		});
    	};

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("signleton", signleton = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("resetAutoTestingQueue" in $$props) $$invalidate("resetAutoTestingQueue", resetAutoTestingQueue = $$props.resetAutoTestingQueue);
    		if ("mainTabs" in $$props) mainTabs = $$props.mainTabs;
    		if ("content" in $$props) content = $$props.content;
    		if ("signleton" in $$props) $$invalidate("signleton", signleton = $$props.signleton);
    		if ("className" in $$props) className = $$props.className;
    		if ("layout" in $$props) $$invalidate("layout", layout = $$props.layout);
    		if ("$resetAutoTestingQueue" in $$props) resetAutoTestingQueue.set($resetAutoTestingQueue = $$props.$resetAutoTestingQueue);
    		if ("$layout" in $$props) layout.set($layout = $$props.$layout);
    	};

    	return {
    		resetAutoTestingQueue,
    		signleton,
    		layout,
    		div_binding
    	};
    }

    class Mainpanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mainpanel",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/autotest.svelte generated by Svelte v3.14.1 */

    function create_fragment$4(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let renderListOfTestingNodes;

    const autoTestStart = rootNode => {
    	renderListOfTestingNodes(rootNode);
    };

    function instance$4($$self, $$props, $$invalidate) {
    	let $layout;
    	let $mainTabs;
    	let layout = importState("layout");
    	validate_store(layout, "layout");
    	component_subscribe($$self, layout, value => $$invalidate("$layout", $layout = value));
    	let namespace = importState("namespace");
    	let user = importState("user");
    	let message = importState("message");
    	let mainTabs = importState("mainTabs");
    	validate_store(mainTabs, "mainTabs");
    	component_subscribe($$self, mainTabs, value => $$invalidate("$mainTabs", $mainTabs = value));
    	let el;
    	let testingItems = [];

    	renderListOfTestingNodes = function (rootNode) {
    		let rightLayoutName = "right-layout";

    		if (w2ui[rightLayoutName]) {
    			return;
    		}

    		jQuery($layout.el("right")).w2layout({
    			name: rightLayoutName,
    			panels: [
    				{
    					type: "top",
    					size: "50%",
    					toolbar: {
    						items: [
    							{
    								id: "start",
    								text: "Start",
    								icon: "fas fa-play-circle"
    							},
    							{ type: "spacer" },
    							{
    								id: "refresh",
    								text: "Refresh",
    								icon: "fas fa-redo",
    								tooltip: "regenerate list table"
    							},
    							{ type: "break" },
    							{
    								id: "close",
    								text: "Close",
    								icon: "fas fa-times-circle"
    							}
    						],
    						onClick(evt) {
    							switch (evt.target) {
    								case "start":
    									w2ui[rightLayoutName].get("top").toolbar.disable("start");
    									startTest();
    									break;
    								case "close":
    									$layout.hide("right", true);
    									break;
    								case "refresh":
    									w2ui[rightLayoutName].destroy();
    									setTimeout(() => {
    										renderListOfTestingNodes();
    									});
    									break;
    							}
    						}
    					}
    				},
    				{ type: "main", size: "50%" }
    			]
    		});

    		if (typeof rootNode == "undefined") rootNode = w2ui["LeftPanel"];
    		let records = [];
    		let recid = 0;

    		var digTestItems = function (node) {
    			if (node.nodes && node.nodes.length > 0) {
    				node.nodes.forEach(subnode => {
    					digTestItems(subnode);
    				});
    			} else if (node.testings && node.testings.length) {
    				let children = [];
    				let hasChildren = node.testings.length > 1;

    				node.testings.forEach(testing => {
    					children.push({
    						recid,
    						nodeName: hasChildren ? "" : node.text,
    						name: testing.name,
    						url: testing.query.url,
    						testing,
    						node,
    						pass: ""
    					});

    					recid += 1;
    				});

    				if (hasChildren) {
    					children.sort((a, b) => {
    						return a.testing.priority > b.testing.priority
    						? 1
    						: a.testing.priority < b.testing.priority ? -1 : 0;
    					});

    					records.push({
    						recid,
    						nodeName: node.text,
    						node,
    						name: "",
    						url: "",
    						pass: "",
    						doTest: true,
    						w2ui: { expand: true, children }
    					});

    					recid += 1;
    				} else {
    					children[0].doTest = true;
    					records.push(children[0]);
    				}
    			}
    		};

    		digTestItems(rootNode);
    		if (w2ui["autotest-list"]) w2ui["autotest-list"].destroy();

    		let grid = jQuery().w2grid({
    			name: "autotest-list",
    			columns: [
    				{
    					field: "nodeName",
    					caption: "Node",
    					size: 30
    				},
    				{
    					field: "name",
    					caption: "Testing",
    					size: 30
    				},
    				{ field: "url", caption: "URL", size: 30 },
    				{ field: "pass", caption: "Pass", size: 5 }
    			],
    			show: { lineNumbers: true },
    			onClick: evt => {
    				evt.done(() => {
    					let record = w2ui["autotest-list"].get(evt.recid);
    					loadNode(record.node);
    				});
    			}
    		});

    		w2ui["autotest-list"].records = records;
    		grid.render(w2ui[rightLayoutName].el("top"));

    		setTimeout(
    			() => {
    				w2ui["autotest-list"].refresh();
    			},
    			200
    		);
    	};

    	let queueOfTestingCalls = [];

    	let registerAutoTesting = function (testingCall, priority) {
    		queueOfTestingCalls.push({ priority, callable: testingCall });
    	};

    	let resetAutoTestingQueue = function (testingCall) {
    		queueOfTestingCalls = [];
    	};

    	setState("registerAutoTesting", registerAutoTesting);
    	setState("resetAutoTestingQueue", resetAutoTestingQueue);

    	function doTestingOnItem(record) {
    		let promise = new jQuery.Deferred();
    		message.set("Testing " + record.node.text);
    		let resultOfTestings = [];

    		let startTestingOfNode = function (idx) {
    			if (idx >= queueOfTestingCalls.length) {
    				promise.resolve(resultOfTestings);
    				return;
    			}

    			let testingCall = queueOfTestingCalls[idx].callable;
    			let p = testingCall();

    			p.done(function (pass) {
    				resultOfTestings.push(pass);
    			}).fail(function (xhr) {
    				console.warn(record.node.text, "error=", xhr.responseText);
    				resultOfTestings.push(false);
    			}).always(() => {
    				startTestingOfNode(idx + 1);
    			});
    		};

    		loadNode(record.node).done(function () {
    			queueOfTestingCalls.sort((a, b) => {
    				return a.priority < b.priority
    				? -1
    				: a.priority > b.priority ? 1 : 0;
    			});

    			$mainTabs.click("Test");
    			startTestingOfNode(0);
    		}).fail(e => {
    			console.warn("loadNode Error:" + e);
    		});

    		return promise;
    	}

    	function startTest() {
    		let records = w2ui["autotest-list"].records;

    		if (records.length == 0) {
    			return jQuery.when();
    		}

    		let p = new jQuery.Deferred();

    		let activateTesting = function (i) {
    			if (i >= records.length) {
    				p.resolve();
    				return;
    			}

    			if (records[i].doTest) {
    				if (records[i].w2ui && records[i].w2ui.children && records[i].w2ui.children.length > 1) {
    					w2ui["autotest-list"].expand(records[i].recid);
    				}

    				doTestingOnItem(records[i]).always(function (testingResults) {
    					let pass = testingResults.reduce((current, newvalue) => current && newvalue, true);
    					records[i].pass = "<span class=\"fas fa-" + (pass ? "check" : "bug") + "\"></span>";
    					if (!pass) records[i].w2ui = jQuery.extend(records[i].w2ui || ({}), { style: "color:red" });
    					w2ui["autotest-list"].refreshRow(records[i].recid);

    					if (records[i].node.testings.length > 1) {
    						records[i].w2ui.children.forEach((child, idx) => {
    							let pass = testingResults[idx];
    							child.pass = "<span class=\"fas fa-" + (pass ? "check" : "bug") + "\"></span>";
    							if (!pass) child.w2ui.style = "color:red";
    							w2ui["autotest-list"].refreshRow(child.recid);
    						});
    					}

    					setTimeout(() => {
    						activateTesting(i + 1);
    					});
    				});
    			} else {
    				setTimeout(() => {
    					activateTesting(i + 1);
    				});
    			}
    		};

    		activateTesting(0);
    		return p;
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("layout" in $$props) $$invalidate("layout", layout = $$props.layout);
    		if ("namespace" in $$props) namespace = $$props.namespace;
    		if ("user" in $$props) user = $$props.user;
    		if ("message" in $$props) message = $$props.message;
    		if ("mainTabs" in $$props) $$invalidate("mainTabs", mainTabs = $$props.mainTabs);
    		if ("el" in $$props) el = $$props.el;
    		if ("testingItems" in $$props) testingItems = $$props.testingItems;
    		if ("queueOfTestingCalls" in $$props) queueOfTestingCalls = $$props.queueOfTestingCalls;
    		if ("registerAutoTesting" in $$props) registerAutoTesting = $$props.registerAutoTesting;
    		if ("resetAutoTestingQueue" in $$props) resetAutoTestingQueue = $$props.resetAutoTestingQueue;
    		if ("$layout" in $$props) layout.set($layout = $$props.$layout);
    		if ("$mainTabs" in $$props) mainTabs.set($mainTabs = $$props.$mainTabs);
    	};

    	return { layout, mainTabs };
    }

    class Autotest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Autotest",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/leftpanel.svelte generated by Svelte v3.14.1 */
    const file$4 = "src/leftpanel.svelte";

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "LeftPanel svelte-1skflu6");
    			add_location(div0, file$4, 104, 0, 3404);
    			attr_dev(div1, "class", "LeftPanelToolbar svelte-1skflu6");
    			add_location(div1, file$4, 105, 0, 3434);
    			add_location(div2, file$4, 103, 0, 3398);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $user;
    	let $layout;
    	let namespace = importState("namespace");
    	let user = importState("user");
    	validate_store(user, "user");
    	component_subscribe($$self, user, value => $$invalidate("$user", $user = value));
    	let message = importState("message");
    	let config = importState("config");
    	let layout = importState("layout");
    	validate_store(layout, "layout");
    	component_subscribe($$self, layout, value => $$invalidate("$layout", $layout = value));

    	let api = {
    		list: "/unittest/pri/static/sidebarAllNodes.json",
    		refresh: "/unittest/pri/sidebar/refresh"
    	};

    	let username = "";

    	let nodes = [
    		{
    			id: "overview",
    			text: "Overview",
    			img: "icon-folder",
    			expanded: true,
    			group: true,
    			nodes: [
    				{
    					id: "settings",
    					text: "Settings",
    					img: "icon-folder"
    				},
    				{
    					id: "golang",
    					text: "Go",
    					img: "icon-folder",
    					expanded: true,
    					nodes: [
    						{
    							id: "goroute",
    							text: "Route",
    							icon: "fa-star-empty"
    						}
    					]
    				},
    				{
    					id: "python",
    					text: "Python",
    					img: "icon-folder",
    					expanded: true,
    					nodes: [
    						{
    							id: "pyroute",
    							text: "Route",
    							icon: "fa-star-empty"
    						},
    						{
    							id: "pyreactor",
    							text: "Reactor,Event Loops",
    							icon: "fa-star-empty"
    						}
    					]
    				},
    				{
    					id: "authentication",
    					text: "Authentication",
    					img: "icon-folder",
    					expanded: true,
    					nodes: []
    				}
    			]
    		}
    	];

    	function renderToolbar() {
    		if (w2ui["LeftPanelToolbar"]) w2ui["LeftPanelToolbar"].destroy();

    		jQuery(".LeftPanelToolbar").w2toolbar({
    			name: "LeftPanelToolbar",
    			items: [
    				{ type: "spacer" },
    				{
    					id: "refresh",
    					img: "fas fa-redo",
    					tooltip: "Refersh sidebar"
    				}
    			],
    			onClick(evt) {
    				switch (evt.target) {
    					case "refresh":
    						render(true);
    						break;
    				}
    			}
    		});
    	}

    	function render(refresh) {
    		let url = refresh ? api.refresh : api.list;

    		jQuery.getJSON(url, testing_nodes => {
    			if (w2ui["LeftPanel"]) w2ui["LeftPanel"].destroy();

    			jQuery(".LeftPanel").w2sidebar({
    				name: "LeftPanel",
    				nodes: nodes.concat(testing_nodes),
    				onClick(evt) {
    					evt.done(() => {
    						if (evt.node.url || evt.node.testings) loadNode(evt.node);
    					});
    				}
    			});

    			message.set("sidebar refreshed");
    		}).fail(function (err) {
    			w2alert(err.responseText);
    		});
    	}

    	user.subscribe(value => {
    		if (value == null) return;
    		username = $user.username;

    		if (username == "guest") {
    			if (w2ui["LeftPanel"]) w2ui["LeftPanel"].destroy();
    		} else {
    			var rect = $layout.el("left").getBoundingClientRect();
    			jQuery(".LeftPanel").height(rect.height - 30);
    			renderToolbar();
    			render();
    		}
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("namespace" in $$props) namespace = $$props.namespace;
    		if ("user" in $$props) $$invalidate("user", user = $$props.user);
    		if ("message" in $$props) message = $$props.message;
    		if ("config" in $$props) config = $$props.config;
    		if ("layout" in $$props) $$invalidate("layout", layout = $$props.layout);
    		if ("api" in $$props) api = $$props.api;
    		if ("username" in $$props) username = $$props.username;
    		if ("nodes" in $$props) nodes = $$props.nodes;
    		if ("$user" in $$props) user.set($user = $$props.$user);
    		if ("$layout" in $$props) layout.set($layout = $$props.$layout);
    	};

    	return { user, layout };
    }

    class Leftpanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Leftpanel",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/layout.svelte generated by Svelte v3.14.1 */

    function create_fragment$6(ctx) {
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let leftSize = "20%";
    let rightSize = "50%";
    let topSize = 37;

    function instance$6($$self, $$props, $$invalidate) {
    	let $namespace;
    	let $autotest;
    	let layout;
    	let namespace = importState("namespace");
    	validate_store(namespace, "namespace");
    	component_subscribe($$self, namespace, value => $$invalidate("$namespace", $namespace = value));
    	let autotest = importState("autotest");
    	validate_store(autotest, "autotest");
    	component_subscribe($$self, autotest, value => $$invalidate("$autotest", $autotest = value));

    	const unsubscribe = namespace.subscribe(value => {
    		if ($namespace == null) return;
    		let w2layout = render($namespace);
    		setState("layout", w2layout);
    		unsubscribe();
    	});

    	const doAutoTest = function () {
    		if (!layout.get("right").hidden) {
    			layout.hide("right", true);
    			return;
    		}

    		layout.show("right", true);

    		if (!$autotest) {
    			layout.content("right", "<div class=\"autotest-box\"></div>");

    			autotest.set(new Autotest({
    					target: layout.el("right").querySelector(".autotest-box")
    				}));
    		}

    		autoTestStart();
    	};

    	function render(namespace) {
    		const box = jQuery("." + namespace + ".Layout");

    		box.css({
    			width: "100%",
    			height: "100%",
    			"background-color": "#c0c0c0"
    		});

    		layout = w2ui[namespace + "layout"];
    		if (layout) return layout;

    		var topPanelRenderer = {
    			render() {
    				setTimeout(
    					function () {
    						layout = w2ui[namespace + "layout"];

    						new Toppanel({
    								target: layout.get("top").toolbar.box.querySelector(".app-header-in-toolbar")
    							});
    					},
    					0
    				);
    			}
    		};

    		var leftPanelRenderer = {
    			render() {
    				layout = w2ui[namespace + "layout"];
    				new Leftpanel({ target: layout.el("left") });
    			}
    		};

    		var toppanelToolbarSettings = {
    			style: "",
    			items: [
    				{
    					type: "html",
    					id: "html",
    					html: "<div class=\"app-header-in-toolbar\"></div>"
    				},
    				{ type: "spacer" },
    				{
    					type: "button",
    					id: "autotest",
    					caption: "Auto Test",
    					img: "icon-page"
    				}
    			],
    			onClick(evt) {
    				switch (evt.target) {
    					case "autotest":
    						doAutoTest();
    						break;
    				}
    			}
    		};

    		box.w2layout({
    			name: namespace + "layout",
    			panels: [
    				{
    					type: "top",
    					size: topSize,
    					resizable: false,
    					content: topPanelRenderer,
    					toolbar: toppanelToolbarSettings
    				},
    				{
    					type: "left",
    					size: leftSize,
    					resizable: true,
    					content: leftPanelRenderer
    				},
    				{
    					type: "right",
    					size: rightSize,
    					hidden: true,
    					resizable: true,
    					content: "<div class=\"panel-content\"></div>"
    				},
    				{
    					type: "main",
    					resizable: true,
    					style: "background-color:white",
    					content: "",
    					tabs: { tabs: [] }
    				}
    			]
    		});

    		layout = w2ui[namespace + "layout"];
    		let mainpanel = new Mainpanel({ target: layout.el("main"), props: {} });
    		return layout;
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("layout" in $$props) layout = $$props.layout;
    		if ("leftSize" in $$props) leftSize = $$props.leftSize;
    		if ("rightSize" in $$props) rightSize = $$props.rightSize;
    		if ("topSize" in $$props) topSize = $$props.topSize;
    		if ("namespace" in $$props) $$invalidate("namespace", namespace = $$props.namespace);
    		if ("autotest" in $$props) $$invalidate("autotest", autotest = $$props.autotest);
    		if ("$namespace" in $$props) namespace.set($namespace = $$props.$namespace);
    		if ("$autotest" in $$props) autotest.set($autotest = $$props.$autotest);
    	};

    	return { namespace, autotest, $$slots, $$scope };
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.14.1 */
    const file$5 = "src/App.svelte";

    // (27:0) <Layout>
    function create_default_slot(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "" + (ctx.namespace + " Layout"));
    			add_location(div, file$5, 27, 0, 791);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(changed, ctx) {
    			if (changed.namespace && div_class_value !== (div_class_value = "" + (ctx.namespace + " Layout"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(27:0) <Layout>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let current;

    	const layout = new Layout({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const layout_changes = {};

    			if (changed.$$scope || changed.namespace) {
    				layout_changes.$$scope = { changed, ctx };
    			}

    			layout.$set(layout_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { namespace = "" } = $$props;

    	onMount(async () => {
    		setState("namespace", namespace);
    	});

    	let user = importState("user");

    	const unsubscribe = user.subscribe(value => {
    		if (value == null) return;

    		if (user.username == "guest") {
    			setState("sdk", null);
    			setState("tree", null);
    		} else {
    			var protectMode = false;
    			var url = "ws://" + location.host + "/unittest/" + (protectMode ? "pri/" : "pub/") + "tree";
    			var sdk = GetSDKSingleton();

    			sdk.useTree("Unittest", url).done(function (tree) {
    				setState("sdk", sdk);
    				setState("tree", tree);
    			});
    		}
    	});

    	const writable_props = ["namespace"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("namespace" in $$props) $$invalidate("namespace", namespace = $$props.namespace);
    	};

    	$$self.$capture_state = () => {
    		return { namespace, user };
    	};

    	$$self.$inject_state = $$props => {
    		if ("namespace" in $$props) $$invalidate("namespace", namespace = $$props.namespace);
    		if ("user" in $$props) user = $$props.user;
    	};

    	return { namespace };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { namespace: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get namespace() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set namespace(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/wrk.svelte generated by Svelte v3.14.1 */

    const { console: console_1 } = globals;
    const file$6 = "src/wrk.svelte";

    function create_fragment$8(ctx) {
    	let div3;
    	let p;
    	let t0;
    	let a;
    	let t2;
    	let t3;
    	let div2;
    	let div0;
    	let t4;
    	let div1;
    	let pre;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div3 = element("div");

    			if (!default_slot) {
    				p = element("p");
    				t0 = text("Please note: ");
    				a = element("a");
    				a.textContent = "Wrk";
    				t2 = text(" is required to be installed on server for benchmark working");
    				t3 = space();
    				div2 = element("div");
    				div0 = element("div");
    				t4 = space();
    				div1 = element("div");
    				pre = element("pre");
    			}

    			if (default_slot) default_slot.c();

    			if (!default_slot) {
    				attr_dev(a, "href", "https://github.com/wg/wrk");
    				attr_dev(a, "target", "blank");
    				add_location(a, file$6, 125, 20, 3772);
    				add_location(p, file$6, 125, 4, 3756);
    				attr_dev(div0, "class", "form");
    				add_location(div0, file$6, 127, 8, 3928);
    				attr_dev(pre, "class", "svelte-cgth0a");
    				add_location(pre, file$6, 128, 28, 3976);
    				attr_dev(div1, "class", "result svelte-cgth0a");
    				add_location(div1, file$6, 128, 8, 3956);
    				add_location(div2, file$6, 126, 4, 3899);
    			}

    			add_location(div3, file$6, 123, 0, 3739);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);

    			if (!default_slot) {
    				append_dev(div3, p);
    				append_dev(p, t0);
    				append_dev(p, a);
    				append_dev(p, t2);
    				append_dev(div3, t3);
    				append_dev(div3, div2);
    				append_dev(div2, div0);
    				append_dev(div2, t4);
    				append_dev(div2, div1);
    				append_dev(div1, pre);
    				ctx.div2_binding(div2);
    			}

    			if (default_slot) {
    				default_slot.m(div3, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);

    			if (!default_slot) {
    				ctx.div2_binding(null);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $tree;

    	let { options = {
    		url: "",
    		thread: 5,
    		connection: 10,
    		duratoin: 3
    	} } = $$props;

    	let el;
    	let className;
    	let tree = importState("tree");
    	validate_store(tree, "tree");
    	component_subscribe($$self, tree, value => $$invalidate("$tree", $tree = value));
    	let { myself } = $$props;

    	onMount(async () => {
    		el.className.split(" ").some(function (n) {
    			if ((/^svelte/).test(n)) {
    				className = n;
    				return true;
    			}
    		});

    		if ($tree) {
    			render();
    		}
    	});

    	const render = () => {
    		const fields = [
    			{
    				name: "url",
    				field: "url",
    				type: "text",
    				required: true,
    				html: {
    					caption: "URL",
    					attr: "placeholder=\"http://\" style=\"width:300px\""
    				}
    			},
    			{
    				name: "thread",
    				field: "thread",
    				type: "int",
    				required: true,
    				html: { text: "concurrent thread(-t)" }
    			},
    			{
    				name: "connection",
    				field: "connection",
    				type: "int",
    				required: true,
    				html: { text: "connection/thread(-c)" }
    			},
    			{
    				name: "duration",
    				field: "duration",
    				type: "int",
    				required: true,
    				html: { text: "testing duration(-d)" }
    			}
    		];

    		const record = {
    			url: options.url,
    			thread: options.thread || 5,
    			connection: options.connection || 10,
    			duration: options.duration || 3
    		};

    		const prefix = "wrk";

    		fields.forEach(f => {
    			f.name = prefix + f.name;
    		});

    		let urecord = {};

    		for (let name in record) {
    			urecord[prefix + name] = record[name];
    		}

    		if (w2ui["wrk-form"]) w2ui["wrk-form"].destroy();

    		jQuery(el.querySelector(".form")).w2form({
    			name: "wrk-form",
    			header: "Benchmark by wrk",
    			style: "width:500px",
    			fields,
    			record: urecord,
    			actions: {
    				reset() {
    					this.clear();
    				},
    				save() {
    					var record = {};
    					var len = prefix.length;

    					for (let name in this.record) {
    						record[name.substr(len)] = this.record[name];
    					}

    					if (!options.validate || options.validate(record)) {
    						start_benchmark(record);
    					}
    				}
    			}
    		});

    		el.querySelector("button[name=\"save\"]").innerHTML = "Run";
    	};

    	tree.subscribe(tree => {
    		if ($tree == null) {
    			if (w2ui["wrk-form"]) w2ui["wrk-form"].destroy();
    			return;
    		} else if (el) {
    			render();
    		}
    	});

    	const start_benchmark = record => {
    		w2ui["wrk-form"].lock("Testing", true);
    		var path = "Testing.Benchmark";
    		var url = record.url;
    		if (!(/^http/).test(url)) url = location.protocol + "//" + location.host + (url.substr(0, 1) == "/" ? "" : "/") + url;
    		var args = ["-t", record.thread, "-c", record.connection, "-d", record.duration, url];
    		var kw = {};
    		var pbMsg = null;
    		var cmd = $tree.call(path, args, kw, pbMsg);

    		const addLine = s => {
    			let div = document.createElement("pre");
    			div.innerText = s;
    			el.querySelector(".result").appendChild(div);
    		};

    		cmd.always(function () {
    			w2ui["wrk-form"].unlock();
    		}).progress(function (response) {
    			addLine(response);
    		}).done(function (response) {
    			addLine(response);
    		}).fail(function (retcode, errmsg) {
    			addLine("Error: " + retcode + " " + errmsg);
    		});
    	};

    	const writable_props = ["options", "myself"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Wrk> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("el", el = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("options" in $$props) $$invalidate("options", options = $$props.options);
    		if ("myself" in $$props) $$invalidate("myself", myself = $$props.myself);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			options,
    			el,
    			className,
    			tree,
    			myself,
    			$tree
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("options" in $$props) $$invalidate("options", options = $$props.options);
    		if ("el" in $$props) $$invalidate("el", el = $$props.el);
    		if ("className" in $$props) className = $$props.className;
    		if ("tree" in $$props) $$invalidate("tree", tree = $$props.tree);
    		if ("myself" in $$props) $$invalidate("myself", myself = $$props.myself);
    		if ("$tree" in $$props) tree.set($tree = $$props.$tree);
    	};

    	return {
    		options,
    		el,
    		tree,
    		myself,
    		div2_binding,
    		$$slots,
    		$$scope
    	};
    }

    class Wrk extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { options: 0, myself: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wrk",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.myself === undefined && !("myself" in props)) {
    			console_1.warn("<Wrk> was created without expected prop 'myself'");
    		}
    	}

    	get options() {
    		throw new Error("<Wrk>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Wrk>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get myself() {
    		throw new Error("<Wrk>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set myself(value) {
    		throw new Error("<Wrk>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/tooltip.svelte generated by Svelte v3.14.1 */
    const file$7 = "src/tooltip.svelte";

    function create_fragment$9(ctx) {
    	let span;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(ctx.text);
    			set_style(span, "cursor", "help");
    			attr_dev(span, "class", "fas fa-info-circle");
    			add_location(span, file$7, 44, 0, 960);

    			dispose = [
    				listen_dev(span, "click", ctx.popuphref, false, false, false),
    				listen_dev(span, "mouseout", ctx.hidetip, false, false, false),
    				listen_dev(span, "mouseenter", ctx.showtip, false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			ctx.span_binding(span);
    		},
    		p: function update(changed, ctx) {
    			if (changed.text) set_data_dev(t, ctx.text);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			ctx.span_binding(null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const scanTooltip = (cls, ele) => {
    	ele.querySelectorAll("tooltip").forEach(tooltip => {
    		new cls({
    				target: tooltip,
    				props: { tooltipXML: tooltip }
    			});
    	});
    };

    function instance$9($$self, $$props, $$invalidate) {
    	let { tooltipXML } = $$props;
    	let { el } = $$props;
    	let text = "";

    	onMount(async () => {
    		$$invalidate("text", text = tooltipXML.getAttribute("text"));
    	});

    	let showing = false;

    	function showtip() {
    		if (showing) return;
    		showing = true;
    		jQuery(el).w2tag(tooltipXML.getAttribute("tip"));
    	}

    	function hidetip() {
    		showing = false;
    		jQuery(el).w2tag();
    	}

    	function popuphref(evt) {
    		showing = false;
    		jQuery(el).w2tag();
    		let url = tooltipXML.getAttribute("url");
    		if (!url) return;
    		let size = (tooltipXML.getAttribute("size") || "800x600").split("x");

    		w2popup.load({
    			url,
    			showMax: true,
    			width: size[0],
    			height: size[1]
    		});
    	}

    	const writable_props = ["tooltipXML", "el"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tooltip> was created with unknown prop '${key}'`);
    	});

    	function span_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("el", el = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("tooltipXML" in $$props) $$invalidate("tooltipXML", tooltipXML = $$props.tooltipXML);
    		if ("el" in $$props) $$invalidate("el", el = $$props.el);
    	};

    	$$self.$capture_state = () => {
    		return { tooltipXML, el, text, showing };
    	};

    	$$self.$inject_state = $$props => {
    		if ("tooltipXML" in $$props) $$invalidate("tooltipXML", tooltipXML = $$props.tooltipXML);
    		if ("el" in $$props) $$invalidate("el", el = $$props.el);
    		if ("text" in $$props) $$invalidate("text", text = $$props.text);
    		if ("showing" in $$props) showing = $$props.showing;
    	};

    	return {
    		tooltipXML,
    		el,
    		text,
    		showtip,
    		hidetip,
    		popuphref,
    		span_binding
    	};
    }

    class Tooltip extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { tooltipXML: 0, el: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tooltip",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.tooltipXML === undefined && !("tooltipXML" in props)) {
    			console.warn("<Tooltip> was created without expected prop 'tooltipXML'");
    		}

    		if (ctx.el === undefined && !("el" in props)) {
    			console.warn("<Tooltip> was created without expected prop 'el'");
    		}
    	}

    	get tooltipXML() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltipXML(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get el() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set el(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/featuretest.svelte generated by Svelte v3.14.1 */
    const file$8 = "src/featuretest.svelte";

    function create_fragment$a(ctx) {
    	let div6;
    	let div4;
    	let table;
    	let tr0;
    	let td0;
    	let div0;
    	let t0;
    	let tr1;
    	let td1;
    	let div3;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div5;
    	let pre;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div6 = element("div");

    			if (!default_slot) {
    				div4 = element("div");
    				table = element("table");
    				tr0 = element("tr");
    				td0 = element("td");
    				div0 = element("div");
    				t0 = space();
    				tr1 = element("tr");
    				td1 = element("td");
    				div3 = element("div");
    				div1 = element("div");
    				t1 = space();
    				div2 = element("div");
    			}

    			if (default_slot) default_slot.c();
    			t2 = space();
    			div5 = element("div");
    			pre = element("pre");

    			if (!default_slot) {
    				attr_dev(div0, "class", "form");
    				add_location(div0, file$8, 573, 78, 19487);
    				set_style(td0, "min-width", "250px");
    				set_style(td0, "width", "100%");
    				set_style(td0, "vertical-align", "top");
    				add_location(td0, file$8, 573, 20, 19429);
    				add_location(tr0, file$8, 572, 16, 19404);
    				attr_dev(div1, "class", "result-check");
    				add_location(div1, file$8, 578, 28, 19694);
    				attr_dev(div2, "class", "result-content");
    				add_location(div2, file$8, 579, 28, 19755);
    				attr_dev(div3, "class", "result http-response");
    				add_location(div3, file$8, 577, 24, 19631);
    				set_style(td1, "vertical-align", "top");
    				add_location(td1, file$8, 576, 20, 19575);
    				add_location(tr1, file$8, 575, 16, 19550);
    				set_style(table, "width", "100%");
    				set_style(table, "vertical-align", "top");
    				add_location(table, file$8, 571, 12, 19342);
    				add_location(div4, file$8, 570, 8, 19323);
    			}

    			add_location(pre, file$8, 589, 74, 20061);
    			set_style(div5, "display", "none");
    			attr_dev(div5, "class", "http-response pass no-pass expected");
    			add_location(div5, file$8, 589, 4, 19991);
    			add_location(div6, file$8, 568, 0, 19283);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);

    			if (!default_slot) {
    				append_dev(div6, div4);
    				append_dev(div4, table);
    				append_dev(table, tr0);
    				append_dev(tr0, td0);
    				append_dev(td0, div0);
    				append_dev(table, t0);
    				append_dev(table, tr1);
    				append_dev(tr1, td1);
    				append_dev(td1, div3);
    				append_dev(div3, div1);
    				append_dev(div3, t1);
    				append_dev(div3, div2);
    			}

    			if (default_slot) {
    				default_slot.m(div6, null);
    			}

    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, pre);
    			ctx.div6_binding(div6);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (default_slot) default_slot.d(detaching);
    			ctx.div6_binding(null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let hashCount = 0;

    function instance$a($$self, $$props, $$invalidate) {
    	let $tree;
    	let $registerAutoTesting;
    	let $config;
    	let $requestHeaders;
    	let { name } = $$props;
    	let { priority = 0 } = $$props;
    	let { expectXML } = $$props;
    	let { queryXML } = $$props;
    	let { myself } = $$props;
    	let el;
    	let className;
    	let config = importState("config");
    	validate_store(config, "config");
    	component_subscribe($$self, config, value => $$invalidate("$config", $config = value));
    	let tree = importState("tree");
    	validate_store(tree, "tree");
    	component_subscribe($$self, tree, value => $$invalidate("$tree", $tree = value));
    	let requestHeaders = importState("requestHeaders");
    	validate_store(requestHeaders, "requestHeaders");
    	component_subscribe($$self, requestHeaders, value => $$invalidate("$requestHeaders", $requestHeaders = value));
    	let registerAutoTesting = importState("registerAutoTesting");
    	validate_store(registerAutoTesting, "registerAutoTesting");
    	component_subscribe($$self, registerAutoTesting, value => $$invalidate("$registerAutoTesting", $registerAutoTesting = value));
    	let query = {};
    	hashCount += 1;
    	let formName = "featuretest-form" + hashCount;
    	const prefix = "featuretest" + hashCount;

    	onMount(async () => {
    		query.url = queryXML.querySelector("url").innerText;

    		query.method = queryXML.querySelector("method")
    		? queryXML.querySelector("method").innerText.trim().toLowerCase()
    		: "get";

    		query.data = queryXML.querySelector("data")
    		? JSON.parse(unescape(queryXML.querySelector("data").innerText))
    		: [];

    		let lintExpectedLines = [];
    		let pat = /^\/(.+)\/([ig]*)$/;
    		queryXML.remove();

    		expectXML.querySelectorAll("status").forEach(function (ele) {
    			let text = ele.innerText.trim();
    			if (text == "") return;

    			if (pat.test(text)) {
    				let m = text.match(pat);
    				expects.status.push(new RegExp(m[1], m[2]));
    			} else {
    				expects.status.push(new RegExp(text));
    			}

    			lintExpectedLines.push("<div class=\"status\">" + text + "</div>");
    		});

    		expectXML.querySelectorAll("header").forEach(function (ele) {
    			let text = ele.innerText.trim();
    			if (text == "") return;

    			if (pat.test(text)) {
    				let m = text.match(pat);
    				expects.header.push(new RegExp(m[1], m[2]));
    			} else {
    				expects.header.push(new RegExp(text));
    			}

    			lintExpectedLines.push("<div class=\"header\">" + text + "</div>");
    		});

    		expectXML.querySelectorAll("response").forEach(function (ele) {
    			let text = ele.innerText.trim();
    			if (text == "") return;

    			if (pat.test(text)) {
    				let m = text.match(pat);
    				expects.response.push(new RegExp(m[1], m[2]));
    			} else {
    				expects.response.push(new RegExp(text));
    			}

    			lintExpectedLines.push("<div class=\"response\">" + text + "</div>");
    		});

    		if (expectXML.querySelector("validate")) {
    			let code = unescape(expectXML.querySelector("validate").innerText);
    			expects.validate = new Function("\"use strict\";return (" + code + ")")();
    			expects.validateSource = code;
    		}

    		if (expectXML.querySelector("responseType")) expects.responseType = expectXML.querySelector("responseType").innerText;

    		if (expectXML.querySelector("renderResponse")) {
    			let code = unescape(expectXML.querySelector("renderResponse").innerText);
    			expects.renderResponse = new Function("\"use strict\";return (" + code + ")")();
    			expects.renderResponseSource = code;
    		}

    		if (expects.status.length + expects.header.length + expects.response.length == 0 && !expectXML.querySelector("validate")) {
    			expects.status.push(200);
    		}

    		if (expectXML.querySelector("notes")) lintExpectedLines.push("<div class=\"notes\">" + expectXML.querySelector("notes").innerHTML + "</div>");
    		expectXML.remove();

    		el.className.split(" ").some(function (n) {
    			if ((/^svelte/).test(n)) {
    				className = n;
    				return true;
    			}
    		});

    		hashCount += 1;

    		if ($tree) {
    			refreshRequestHeaders().done(() => {
    				render().done(() => {
    					if ($registerAutoTesting) {
    						$registerAutoTesting(
    							() => {
    								return startTeaturetest();
    							},
    							priority
    						);
    					}

    					event.fire("featuretest-ready");
    				});
    			});
    		}
    	});

    	let expects = { status: [], header: [], response: [] };

    	const expectsChecker = (response, xhr) => {
    		let pass = true;
    		let messages = [];

    		if (expects.status.length) {
    			let s = new String(xhr.status);

    			expects.status.some(function (re) {
    				if (!s.match(re)) {
    					messages.push("status error");
    					pass = false;
    					return true;
    				}
    			});
    		}

    		if (expects.header.length) {
    			let allHeaders = xhr.getAllResponseHeaders();

    			expects.header.some(function (re) {
    				if (!allHeaders.match(re)) {
    					messages.push("header error");
    					pass = false;
    					return true;
    				}
    			});
    		}

    		if (expects.response.length) {
    			if (typeof response == "object") {
    				response = JSON.stringify(response);
    			}

    			expects.response.some(function (re) {
    				if (!response.match(re)) {
    					messages.push("response error");
    					pass = false;
    					return true;
    				}
    			});
    		}

    		return [pass, messages];
    	};

    	const render = () => {
    		let textarea_attr = "cols=\"100\" style=\"white-space:pre;width:98%; ";

    		let fields = [
    			{
    				name: "url",
    				field: "url",
    				type: "textarea",
    				required: true,
    				html: {
    					text: "<br/><a target=\"_blank\" href=\"" + escape(query.url) + "\">" + query.url + "</a>",
    					caption: "URL To " + query.method,
    					attr: textarea_attr + "height:50px\" placeholder=\"http://\""
    				}
    			}
    		];

    		let record = { url: query.url };

    		query.data.forEach(item => {
    			let fieldEntry = jQuery.extend({}, item);
    			fieldEntry.field = fieldEntry.name;

    			if (fieldEntry.html && fieldEntry.html.caption) ; else if (fieldEntry.html) fieldEntry.html.caption = fieldEntry.name; else fieldEntry.html = { caption: fieldEntry.name };

    			fields.push(fieldEntry);
    			record[fieldEntry.name] = fieldEntry.value || "";
    		});

    		fields.push({
    			name: "benchmark_connections",
    			html: {
    				caption: "Connections",
    				text: " cocurrent connections",
    				page: 1
    			}
    		});

    		fields.push({
    			name: "benchmark_threads",
    			html: {
    				caption: "Threads",
    				text: " to make connections",
    				page: 1
    			}
    		});

    		fields.push({
    			name: "benchmark_duration",
    			html: {
    				caption: "Duration",
    				text: " seconds to run",
    				page: 1
    			}
    		});

    		fields.push({
    			name: "benchmark_headers",
    			type: "textarea",
    			html: {
    				attr: textarea_attr + "height:100px\"",
    				caption: "Headers",
    				text: "request headers, line by line; auto generated by <a target=\"_blank\" href=\"" + $config.allHeadersUrl + "\">" + $config.allHeadersUrl + "</a>",
    				page: 1
    			}
    		});

    		record["benchmark_threads"] = 5;
    		record["benchmark_connections"] = 10;
    		record["benchmark_duration"] = 3;
    		let benchmark_headers = [];
    		let headers = ["Accept-Encoding", "Cookie", "Accept-Language", "User-Agent"];

    		headers.forEach(name => {
    			benchmark_headers.push(name + ": " + $requestHeaders[name]);
    		});

    		record["benchmark_headers"] = benchmark_headers.join("\n");
    		let linebyline = "<br/>line by line, <tooltip text=\"more about status,header and response\" url=\"/page/help.html#status\" size=\"600x600\" tip=\"conditions to validate testing result\">";

    		fields.push({
    			name: "expect_status",
    			html: {
    				caption: "Status",
    				page: 2,
    				attr: textarea_attr + "height:40px\"",
    				text: linebyline
    			},
    			type: "textarea"
    		});

    		fields.push({
    			name: "expect_header",
    			html: {
    				caption: "Header",
    				page: 2,
    				attr: textarea_attr + "height:60px\""
    			},
    			type: "textarea"
    		});

    		fields.push({
    			name: "expect_response",
    			html: {
    				caption: "Response",
    				page: 2,
    				attr: textarea_attr + "height:80px\""
    			},
    			type: "textarea"
    		});

    		fields.push({
    			name: "expect_validate",
    			html: {
    				caption: "validate()",
    				page: 2,
    				attr: textarea_attr + "height:100px\"",
    				text: "<br/><tooltip text=\"more about validate(), responseType and renderResponse()\" url=\"/page/help.html#validate\" tip=\"customize reponse validation and how to render response on browser\">"
    			},
    			type: "textarea"
    		});

    		fields.push({
    			name: "expect_responseType",
    			html: { caption: "responseType", page: 2 }
    		});

    		fields.push({
    			name: "expect_renderResponse",
    			html: {
    				caption: "renderResponse()",
    				page: 2,
    				attr: textarea_attr + "height:100px\""
    			},
    			type: "textarea"
    		});

    		record["expect_status"] = expects.status.join("\n");
    		record["expect_header"] = expects.header.join("\n");
    		record["expect_response"] = expects.response.join("\n");
    		record["expect_validate"] = expects.validateSource;
    		record["expect_responseType"] = expects.responseType;
    		record["expect_renderResponse"] = expects.renderResponseSource;

    		fields.forEach(f => {
    			f.name = prefix + f.name;
    		});

    		let urecord = {};

    		for (let name in record) {
    			urecord[prefix + name] = record[name];
    		}

    		jQuery(el.querySelector(".form")).w2form({
    			name: formName,
    			header: name,
    			style: "width:100%",
    			fields,
    			tabs: [
    				{ id: "featuretest", text: "Parameters" },
    				{ id: "benchmark", text: "Benchmark" },
    				{ id: "expect", text: "Expect" }
    			],
    			record: urecord,
    			toolbar: {
    				items: [
    					{
    						id: "run",
    						text: "Run Test",
    						icon: "fas fa-play-circle",
    						tooltip: "Run this testing case"
    					},
    					{
    						id: "benchmark",
    						text: "Do Benchmark",
    						icon: "fas fa-running",
    						tooltip: "Benchmarking this testing case"
    					},
    					{ type: "break" },
    					{
    						id: "reset",
    						text: "Reset",
    						icon: "fas fa-pause",
    						tooltip: "clean testing results"
    					},
    					{ type: "spacer" },
    					{
    						id: "savecase",
    						text: "New Case",
    						icon: "fas fa-running",
    						tooltip: "Save as a new testing case"
    					}
    				],
    				onClick(evt) {
    					switch (evt.target) {
    						case "run":
    							startTeaturetest();
    							break;
    						case "benchmark":
    							startBenchmark();
    							break;
    						case "reset":
    							el.querySelector(".http-response.result .result-check").innerHTML = "";
    							el.querySelector(".http-response.result .result-content").innerHTML = "";
    							el.querySelector(".http-response.result").style.display = "none";
    							break;
    					}
    				}
    			},
    			actions: {}
    		});

    		scanTooltip(Tooltip, w2ui[formName].box);
    		return jQuery.when();
    	};

    	tree.subscribe(tree => {
    		if ($tree == null) {
    			if (w2ui["featuretest-form"]) w2ui["featuretest-form"].destroy();
    			return;
    		}
    	});

    	const getRecordFromForm = theform => {
    		let record = {};

    		if (theform) {
    			query.data.forEach(item => {
    				record[item.name] = theform.record[prefix + item.name];
    			});
    		} else {
    			throw "there is no w2form of name:" + formName;
    		}

    		return record;
    	};

    	const startTeaturetest = () => {
    		let theform = w2ui[formName];
    		let record = getRecordFromForm(theform);
    		let promise = new jQuery.Deferred();
    		theform.lock("Testing", true);
    		let url = theform.record[prefix + "url"];
    		let options = { url, data: record };

    		if (expects.responseType) {
    			options.xhr = function () {
    				let xhr = new XMLHttpRequest();
    				xhr.responseType = expects.responseType;
    				return xhr;
    			};
    		}

    		let resultContent = el.querySelector(".http-response.result .result-content");
    		let resultCheck = el.querySelector(".http-response.result .result-check");

    		let p = query.method == "get"
    		? jQuery.get(options)
    		: jQuery.post(options);

    		p.done(function (response, status, xhr) {
    			el.querySelector(".http-response.result").style.display = "block";
    			let renderedResponse;

    			if (expects.renderResponse) renderedResponse = expects.renderResponse(response); else if (expects.responseType && expects.responseType.toLowerCase() == "json") {
    				renderedResponse = JSON.stringify(response, null, 2);
    			} else {
    				renderedResponse = response;
    			}

    			resultContent.innerHTML = `<pre class="header">${xhr.status} ${xhr.statusText}
${xhr.getAllResponseHeaders().trim()}</pre>
<pre class="response">
${renderedResponse}
</pre>`;

    			let next = (pass, messages) => {
    				if (typeof messages == "string") messages = [messages];
    				resultCheck.classList.add(pass ? "pass" : "no-pass");
    				resultCheck.classList.remove(pass ? "no-pass" : "pass");
    				if (messages) resultCheck.innerText = messages.join("\n");
    				promise.resolve(pass, messages);
    			};

    			if (expects.validate) {
    				let p = new jQuery.Deferred();

    				p.done(messages => {
    					next(true, messages);
    				}).fail(messages => {
    					next(false, messages);
    				});

    				expects.validate(response, xhr, p);
    			} else {
    				let [pass, messages] = expectsChecker(response, xhr);
    				next(pass, messages);
    			}
    		}).fail(function (xhr) {
    			el.querySelector(".http-response.result").style.display = "block";
    			resultCheck.classList.remove("pass");
    			resultCheck.classList.add("no-pass");
    			resultContent.innerHTML = "<pre class=\"header\">" + xhr.status + " " + xhr.statusText + "\n" + xhr.getAllResponseHeaders() + "</pre><pre class=\"response\">" + xhr.responseText + "</pre>";
    			promise.reject(xhr);
    		}).always(() => {
    			theform.unlock();
    		});

    		return promise;
    	};

    	const startBenchmark = () => {
    		let theform = w2ui[formName];
    		let record = getRecordFromForm(theform);
    		let benchmarkFields = ["threads", "connections", "duration", "cookie", "headers"];

    		benchmarkFields.forEach(name => {
    			record[name] = theform.record[prefix + "benchmark_" + name];
    		});

    		theform.lock("Testing", true);
    		let path = "Testing.Benchmark";
    		let headers = [];

    		if (record.headers) {
    			record.headers.split("\n").forEach(line => {
    				line = line.trim();
    				if (line.length) headers.push(line);
    			});
    		}

    		let args = [
    			"-t",
    			record.threads,
    			"-c",
    			record.connections,
    			"-d",
    			record.duration,
    			"--timeout",
    			10 + record.duration
    		];

    		let readableArgs = args.slice();

    		headers.forEach(header => {
    			args.push("-H");
    			readableArgs.push("-H");
    			args.push(header);
    			readableArgs.push("\"" + header.replace("\"", "\\\"") + "\"");
    		});

    		let url = theform.record[prefix + "url"];
    		if (!(/^http/).test(url)) url = location.protocol + "//" + location.host + (url.substr(0, 1) == "/" ? "" : "/") + url;
    		args.push(url);
    		readableArgs.push("\"" + url.replace("\"", "\\\"") + "\"");
    		let kw = {};
    		let pbMsg = null;
    		let cmd = $tree.call(path, args, kw, pbMsg);
    		el.querySelector(".result.http-response").innerHTML = "";
    		el.querySelector(".result.http-response").style.display = "block";

    		const addResult = s => {
    			let div = document.createElement("pre");
    			div.innerText = s;
    			el.querySelector(".result").appendChild(div);
    		};

    		cmd.always(function () {
    			theform.unlock();
    		}).progress(function (response) {
    			addResult(response);
    		}).done(function (response) {
    			addResult(response);
    		}).fail(function (retcode, errmsg) {
    			addResult("Error: " + retcode + " " + errmsg);
    		});
    	};

    	const writable_props = ["name", "priority", "expectXML", "queryXML", "myself"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Featuretest> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div6_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("el", el = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate("name", name = $$props.name);
    		if ("priority" in $$props) $$invalidate("priority", priority = $$props.priority);
    		if ("expectXML" in $$props) $$invalidate("expectXML", expectXML = $$props.expectXML);
    		if ("queryXML" in $$props) $$invalidate("queryXML", queryXML = $$props.queryXML);
    		if ("myself" in $$props) $$invalidate("myself", myself = $$props.myself);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			hashCount,
    			name,
    			priority,
    			expectXML,
    			queryXML,
    			myself,
    			el,
    			className,
    			config,
    			tree,
    			requestHeaders,
    			registerAutoTesting,
    			query,
    			formName,
    			expects,
    			$tree,
    			$registerAutoTesting,
    			$config,
    			$requestHeaders
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate("name", name = $$props.name);
    		if ("priority" in $$props) $$invalidate("priority", priority = $$props.priority);
    		if ("expectXML" in $$props) $$invalidate("expectXML", expectXML = $$props.expectXML);
    		if ("queryXML" in $$props) $$invalidate("queryXML", queryXML = $$props.queryXML);
    		if ("myself" in $$props) $$invalidate("myself", myself = $$props.myself);
    		if ("el" in $$props) $$invalidate("el", el = $$props.el);
    		if ("className" in $$props) className = $$props.className;
    		if ("config" in $$props) $$invalidate("config", config = $$props.config);
    		if ("tree" in $$props) $$invalidate("tree", tree = $$props.tree);
    		if ("requestHeaders" in $$props) $$invalidate("requestHeaders", requestHeaders = $$props.requestHeaders);
    		if ("registerAutoTesting" in $$props) $$invalidate("registerAutoTesting", registerAutoTesting = $$props.registerAutoTesting);
    		if ("query" in $$props) query = $$props.query;
    		if ("formName" in $$props) formName = $$props.formName;
    		if ("expects" in $$props) expects = $$props.expects;
    		if ("$tree" in $$props) tree.set($tree = $$props.$tree);
    		if ("$registerAutoTesting" in $$props) registerAutoTesting.set($registerAutoTesting = $$props.$registerAutoTesting);
    		if ("$config" in $$props) config.set($config = $$props.$config);
    		if ("$requestHeaders" in $$props) requestHeaders.set($requestHeaders = $$props.$requestHeaders);
    	};

    	return {
    		name,
    		priority,
    		expectXML,
    		queryXML,
    		myself,
    		el,
    		config,
    		tree,
    		requestHeaders,
    		registerAutoTesting,
    		startTeaturetest,
    		startBenchmark,
    		div6_binding,
    		$$slots,
    		$$scope
    	};
    }

    class Featuretest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			name: 0,
    			priority: 0,
    			expectXML: 0,
    			queryXML: 0,
    			myself: 0,
    			startTeaturetest: 0,
    			startBenchmark: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Featuretest",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.name === undefined && !("name" in props)) {
    			console.warn("<Featuretest> was created without expected prop 'name'");
    		}

    		if (ctx.expectXML === undefined && !("expectXML" in props)) {
    			console.warn("<Featuretest> was created without expected prop 'expectXML'");
    		}

    		if (ctx.queryXML === undefined && !("queryXML" in props)) {
    			console.warn("<Featuretest> was created without expected prop 'queryXML'");
    		}

    		if (ctx.myself === undefined && !("myself" in props)) {
    			console.warn("<Featuretest> was created without expected prop 'myself'");
    		}
    	}

    	get name() {
    		throw new Error("<Featuretest>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Featuretest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get priority() {
    		throw new Error("<Featuretest>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priority(value) {
    		throw new Error("<Featuretest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expectXML() {
    		throw new Error("<Featuretest>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expectXML(value) {
    		throw new Error("<Featuretest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get queryXML() {
    		throw new Error("<Featuretest>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set queryXML(value) {
    		throw new Error("<Featuretest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get myself() {
    		throw new Error("<Featuretest>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set myself(value) {
    		throw new Error("<Featuretest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startTeaturetest() {
    		return this.$$.ctx.startTeaturetest;
    	}

    	set startTeaturetest(value) {
    		throw new Error("<Featuretest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startBenchmark() {
    		return this.$$.ctx.startBenchmark;
    	}

    	set startBenchmark(value) {
    		throw new Error("<Featuretest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app$1 = new App({
    	target: document.body.querySelector('#app'),
    	props: {
    		namespace: 'unittest_'
    	}
    });

    // for dynamically loaded *.js to access store
    app$1.importState = importState;

    // external page can fire events
    app$1.event = event;

    // external page can prompt message
    app$1.message = importState('message');

    // external page can create components
    app$1.component = {
        benchmark : Wrk,
        featuretest: Featuretest,
    };

    app$1.registerFeatureTest = (options) => {
        options.props.myself = null;
        let f = new Featuretest(options);
        f.$set({myself:f});
        setState('featuretestInstance',f);
    };
    app$1.registerBenchmark = (options) =>{
        options.props.myself = null;
        let w = new Wrk(options);
        w.$set({myself:w});
        setState('benchmarkInstance',w);
    };

    return app$1;

}());
//# sourceMappingURL=bundle.js.map
