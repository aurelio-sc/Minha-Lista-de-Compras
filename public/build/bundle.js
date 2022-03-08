
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\ListName.svelte generated by Svelte v3.46.4 */

    const file$2 = "src\\components\\ListName.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let div0;
    	let p;
    	let t0_value = /*listName*/ ctx[0].text + "";
    	let t0;
    	let t1;
    	let button0;
    	let div0_class_value;
    	let t3;
    	let div1;
    	let input;
    	let t4;
    	let button1;
    	let div1_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Alterar";
    			t3 = space();
    			div1 = element("div");
    			input = element("input");
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Confirmar";
    			add_location(p, file$2, 23, 4, 398);
    			attr_dev(button0, "class", "editButton svelte-1o7si31");
    			add_location(button0, file$2, 24, 4, 426);
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*listName*/ ctx[0].status) + " svelte-1o7si31"));
    			attr_dev(div0, "id", "showName");
    			add_location(div0, file$2, 22, 2, 349);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Nome da lista");
    			add_location(input, file$2, 27, 4, 558);
    			attr_dev(button1, "class", "editButton svelte-1o7si31");
    			add_location(button1, file$2, 28, 4, 638);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*showListNameInput*/ ctx[1]) + " svelte-1o7si31"));
    			attr_dev(div1, "id", "editName");
    			add_location(div1, file$2, 26, 2, 507);
    			attr_dev(main, "class", "svelte-1o7si31");
    			add_location(main, file$2, 21, 0, 339);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(main, t3);
    			append_dev(main, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*listName*/ ctx[0].text);
    			append_dev(div1, t4);
    			append_dev(div1, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*editListName*/ ctx[3], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(button1, "click", /*updateListName*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*listName*/ 1 && t0_value !== (t0_value = /*listName*/ ctx[0].text + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*listName*/ 1 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*listName*/ ctx[0].status) + " svelte-1o7si31"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*listName*/ 1 && input.value !== /*listName*/ ctx[0].text) {
    				set_input_value(input, /*listName*/ ctx[0].text);
    			}

    			if (dirty & /*showListNameInput*/ 2 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*showListNameInput*/ ctx[1]) + " svelte-1o7si31"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ListName', slots, []);
    	let listName = { text: '', status: false };
    	let showListNameInput = true;

    	function updateListName() {
    		$$invalidate(0, listName);
    		$$invalidate(0, listName.status = true, listName);
    		$$invalidate(1, showListNameInput = false);
    	}

    	function editListName() {
    		$$invalidate(1, showListNameInput = true);
    		$$invalidate(0, listName.status = false, listName);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ListName> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		listName.text = this.value;
    		$$invalidate(0, listName);
    	}

    	$$self.$capture_state = () => ({
    		listName,
    		showListNameInput,
    		updateListName,
    		editListName
    	});

    	$$self.$inject_state = $$props => {
    		if ('listName' in $$props) $$invalidate(0, listName = $$props.listName);
    		if ('showListNameInput' in $$props) $$invalidate(1, showListNameInput = $$props.showListNameInput);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [listName, showListNameInput, updateListName, editListName, input_input_handler];
    }

    class ListName extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListName",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\ListItems.svelte generated by Svelte v3.46.4 */

    const file$1 = "src\\components\\ListItems.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (26:2) {#each itemList as item, index}
    function create_each_block(ctx) {
    	let div;
    	let span0;
    	let t0_value = /*item*/ ctx[8].number + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*item*/ ctx[8].text + "";
    	let t2;
    	let t3;
    	let span2;
    	let t5;
    	let br;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*index*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "❌";
    			t5 = space();
    			br = element("br");
    			attr_dev(span0, "class", "quantity svelte-fx7qs3");
    			add_location(span0, file$1, 27, 6, 469);
    			attr_dev(span1, "class", "itemName svelte-fx7qs3");
    			add_location(span1, file$1, 28, 6, 520);
    			attr_dev(span2, "class", "removeButton");
    			add_location(span2, file$1, 29, 6, 570);
    			add_location(br, file$1, 30, 6, 652);
    			attr_dev(div, "class", "newListItem svelte-fx7qs3");
    			add_location(div, file$1, 26, 4, 436);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    			append_dev(div, t3);
    			append_dev(div, span2);
    			append_dev(div, t5);
    			append_dev(div, br);

    			if (!mounted) {
    				dispose = listen_dev(span2, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*itemList*/ 4 && t0_value !== (t0_value = /*item*/ ctx[8].number + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*itemList*/ 4 && t2_value !== (t2_value = /*item*/ ctx[8].text + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(26:2) {#each itemList as item, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t0;
    	let input0;
    	let t1;
    	let input1;
    	let t2;
    	let button;
    	let t4;
    	let br;
    	let mounted;
    	let dispose;
    	let each_value = /*itemList*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			input0 = element("input");
    			t1 = space();
    			input1 = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "✚";
    			t4 = space();
    			br = element("br");
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "placeholder", "Quant.");
    			attr_dev(input0, "class", "quantity svelte-fx7qs3");
    			add_location(input0, file$1, 35, 2, 691);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "Novo item");
    			attr_dev(input1, "class", "item svelte-fx7qs3");
    			add_location(input1, file$1, 36, 2, 779);
    			attr_dev(button, "class", "addButton svelte-fx7qs3");
    			add_location(button, file$1, 37, 2, 860);
    			add_location(br, file$1, 39, 2, 923);
    			attr_dev(div, "class", "list");
    			add_location(div, file$1, 23, 0, 375);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, input0);
    			set_input_value(input0, /*newQuantity*/ ctx[0]);
    			append_dev(div, t1);
    			append_dev(div, input1);
    			set_input_value(input1, /*newItem*/ ctx[1]);
    			append_dev(div, t2);
    			append_dev(div, button);
    			append_dev(div, t4);
    			append_dev(div, br);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[7]),
    					listen_dev(button, "click", /*addToList*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*removeFromList, itemList*/ 20) {
    				each_value = /*itemList*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*newQuantity*/ 1 && to_number(input0.value) !== /*newQuantity*/ ctx[0]) {
    				set_input_value(input0, /*newQuantity*/ ctx[0]);
    			}

    			if (dirty & /*newItem*/ 2 && input1.value !== /*newItem*/ ctx[1]) {
    				set_input_value(input1, /*newItem*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ListItems', slots, []);
    	let newQuantity = '';
    	let newItem = '';
    	let itemList = [];

    	function addToList() {
    		$$invalidate(2, itemList = [...itemList, { text: newItem, number: newQuantity }]);
    		$$invalidate(1, newItem = '');
    		$$invalidate(0, newQuantity = '');
    	}

    	function removeFromList(index) {
    		itemList.splice(index, 1);
    		$$invalidate(2, itemList);
    	}
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ListItems> was created with unknown prop '${key}'`);
    	});

    	const click_handler = index => removeFromList(index);

    	function input0_input_handler() {
    		newQuantity = to_number(this.value);
    		$$invalidate(0, newQuantity);
    	}

    	function input1_input_handler() {
    		newItem = this.value;
    		$$invalidate(1, newItem);
    	}

    	$$self.$capture_state = () => ({
    		newQuantity,
    		newItem,
    		itemList,
    		addToList,
    		removeFromList
    	});

    	$$self.$inject_state = $$props => {
    		if ('newQuantity' in $$props) $$invalidate(0, newQuantity = $$props.newQuantity);
    		if ('newItem' in $$props) $$invalidate(1, newItem = $$props.newItem);
    		if ('itemList' in $$props) $$invalidate(2, itemList = $$props.itemList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		newQuantity,
    		newItem,
    		itemList,
    		addToList,
    		removeFromList,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class ListItems extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListItems",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\List.svelte generated by Svelte v3.46.4 */

    function create_fragment$1(ctx) {
    	let listname;
    	let t;
    	let listitems;
    	let current;
    	listname = new ListName({ $$inline: true });
    	listitems = new ListItems({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(listname.$$.fragment);
    			t = space();
    			create_component(listitems.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(listname, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(listitems, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listname.$$.fragment, local);
    			transition_in(listitems.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listname.$$.fragment, local);
    			transition_out(listitems.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listname, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(listitems, detaching);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('List', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ListName, ListItems });
    	return [];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let list;
    	let current;
    	list = new List({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(list.$$.fragment);
    			attr_dev(main, "class", "svelte-mhbv4v");
    			add_location(main, file, 4, 0, 66);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(list, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(list);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ List });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
