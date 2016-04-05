//我们使用$('')的操作返回的也是priest的实例
//jQuery的$.fn指向的是jQuery.prototype的原型对象，而zepto的fn就是一个简单对象

//function this
//情况一：纯粹的函数调用。这是函数的最通常用法，属于全局性调用，因此this就代表全局对象Global。
//情况二：作为对象方法的调用。函数还可以作为某个对象的方法调用，这时this就指这个上级对象。
//情况三：作为构造函数调用 所谓构造函数，就是通过这个函数生成一个新对象（object）。这时，this就指这个新对象。
//情况四：apply调用 apply()是函数对象的一个方法，它的作用是改变函数的调用对象，它的第一个参数就表示改变后的调用这个函数的对象。因此，this指的就是这第一个参数。

/**
 * @file Priest.js js库库
 * @author zhoudaozhang WECHAT:zhouxiaotian0227
 */
var Priest = (function() {
	//priest={}这个变量贯穿始终，也是priest与jQuery不一样的地方，
	//jQuery是一个类，会创建一个个实例，而priest本身就只是一个对象......
	var $, priest = {},
		emptyArray = [],
		class2type = {},
		toString = class2type.toString,
		slice = emptyArray.slice, 
		filter = emptyArray.filter,
		readyRE = /complete|loaded|interactive/,
		simpleSelectorRE = /^[\w-]*$/,
		isArray = Array.isArray() || function(object) {
			return object instanceof Array
		};
	//‘$’是最最基本的Priest对象，调用这个函数的时候调用$.priest.init方法
	//使得实现选择节点和创建Priest集合的细节可以通过插件来修补
	
//	$是zepto的入口，具有两个参数selector选择器与context选择范围，这里看着是两个参数，
//事实上各个参数不同会造成不同的实现
//方法相当于一个黑盒子，用户会根据自己的想法获得自己想要的结果，这也会导致的实现变得复杂：
	$ = function(selector, context) {
		return priest.init(selector, context)
	}
//	比较不正经的是居然是通过重写__proto__实现，感觉怪怪的
	priest.Z = function(dom, selector) {
		dom = dom || []
		dom.__proto__ = $.fn
		dom.selector = selector || ''
		return dom;
	}
	priest.isZ = function(object) {
		return object instanceof priest.Z
	}

	function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }

	function isWindow(obj)     { return obj != null && obj == obj.window }

	function isObject(obj) {
		return type(obj) == 'object';
	}

	function likeArray(obj) {
		return typeof obj.length == 'number'
	}

	function flatten(array) {
		return array.length > 0 ? $.fn.concat.apply([], array) : array
	}

	function type(obj) {
		return obj == null ? String(obj) :
			class2type[toString.call(obj)] || "object"
	}

	//对于通过字面量定义的对象和new Object的对象返回true，new Object时传参数的返回false
    function isPlainObject(obj) {
    	return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }

	function isFunction(value) {
		return type(value) == "function"
	}

	function compact(array) {
		return filter.call(array, function(item) {
			return item != null
		})
	}

	function type(obj) {
		return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
	}


	$.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject
    
    
//扩展，deep表示是否深度扩展
  function extend(target, source, deep) {
    for (key in source)
    //如果深度扩展
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        //如果要扩展的数据是对象且target相对应的key不是对象
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
          //如果要扩展的数据是数组且target相对应的key不是数组
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {//当第一个参数为boolean类型的值时，表示是否深度扩展
      deep = target
      target = args.shift()//target取第二个参数
    }
     //遍历后面的参数，全部扩展到target上
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }


	// `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
    // This method can be overriden in plugins.
    priest.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
        //当element为document,且selector为ID选择器时
    return (isDocument(element) && isSimple && maybeID) ?
     //直接返回document.getElementById,RegExp.$1为ID的值,当没有找节点时返回[]
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      //当element不为元素节点或者document时，返回[]
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      //否则将获取到的结果转成数组并返回
      slice.call(
        isSimple && !maybeID ?
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
    }

	// `$.priest.init` is Priest's counterpart to jQuery's `$.fn.init` and
	// takes a CSS selector and an optional context (and handles various
	// special cases).
	// This method can be overriden in plugins.
	//Priest 的 `$.priest.init` 方法类似于 jQuery 的`$.fn.init`方法。
	//参数 为一个选择器以及上下文（各种特殊情况的处理）
	//这个方法可以用写插件覆盖
	priest.init = function(selector, context) {
		var dom
			// If nothing given, return an empty Priest collection
		if (!selector) return priest.Z()
			// Optimize for string selectors
		else if (typeof selector == 'string') {
			selector = selector.trim()
				// If it's a html fragment, create nodes from it
				// Note: In both Chrome 21 and Firefox 15, DOM error 12
				// is thrown if the fragment doesn't begin with <
			if (selector[0] == '<' && fragmentRE.test(selector))
				dom = priest.fragment(selector, RegExp.$1, context), selector = null
				// If there's a context, create a collection on that context first, and select
				// nodes from there
			else if (context !== undefined) return $(context).find(selector)
				// If it's a CSS selector, use it to select nodes.
			else dom = priest.qsa(document, selector)
		}
		// If a function is given, call it when the DOM is ready
		else if (isFunction(selector)) return $(document).ready(selector)
			// If a Priest collection is given, just return it
		else if (priest.isZ(selector)) return selector
		else {
			// normalize array if an array of nodes is given
			if (isArray(selector)) dom = compact(selector)
				// Wrap DOM nodes.
			else if (isObject(selector))
				dom = [selector], selector = null
				// If it's a html fragment, create nodes from it
			else if (fragmentRE.test(selector))
				dom = priest.fragment(selector.trim(), RegExp.$1, context), selector = null
				// If there's a context, create a collection on that context first, and select
				// nodes from there
			else if (context !== undefined) return $(context).find(selector)
				// And last but no least, if it's a CSS selector, use it to select nodes.
			else dom = priest.qsa(document, selector)
		}
		// create a new Priest collection from the nodes found
		return priest.Z(dom, selector)
	}

	$.each = function(elements, callback) {
		var i, key
		if (likeArray(elements)) {
			for (i = 0; i < elements.length; i++)
				if (callback.call(elements[i], i, elements[i]) === false) return elements
		} else {
			for (key in elements)
				if (callback.call(elements[key], key, elements[key]) === false) return elements
		}

		return elements
	}

	$.map = function(elements, callback) {
			var value, values = [],
				i, key
			if (likeArray(elements))
				for (i = 0; i < elements.length; i++) {
					value = callback(elements[i], i)
					if (value != null) values.push(value)
				} else
					for (key in elements) {
						value = callback(elements[key], key)
						if (value != null) values.push(value)
					}
			return flatten(values)
		}
		// Populate the class2type map
	$.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
		class2type["[object " + name + "]"] = name.toLowerCase()
	})

	$.fn = {
		// Because a collection acts like an array
		// copy over these useful array functions.
		forEach: emptyArray.forEach,
		reduce: emptyArray.reduce,
		push: emptyArray.push,
		sort: emptyArray.sort,
		indexOf: emptyArray.indexOf,
		concat: emptyArray.concat,
		ready: function(callback) {
			// need to check if document.body exists for IE as that browser reports
			// document ready when it hasn't yet created the body element
			if (readyRE.test(document.readyState) && document.body) callback($)
			else document.addEventListener('DOMContentLoaded', function() {
				callback($)
			}, false)
			return this
		},
		filter: function(selector) {
			if (isFunction(selector)) return this.not(this.not(selector))
			return $(filter.call(this, function(element) {
				return priest.matches(element, selector)
			}))
		},
		// `map` and `slice` in the jQuery API work differently
		// from their array counterparts
		map: function(fn) {
			console.log(this);
			return $($.map(this, function(el, i) {
				return fn.call(el, i, el)
			}))
		},
		//遍历集合，将集合中的每一项放入callback中进行处理，去掉结果为false的项，注意这里的callback如果明确返回false
	    //那么就会停止循环了
	    each: function(callback){
	      emptyArray.every.call(this, function(el, idx){
	        return callback.call(el, idx, el) !== false
	      })
	      return this
	    }
	}
//如此一来，我们所有的$方法返回的东西其实就变成了priest.Z的实例了，
//构造函数priest.Z 包含一个原型 $.fn（priest.Z的prototype被重写了）
	priest.Z.prototype = $.fn
	$.priest = priest;
	return $;
})();

window.Priest = Priest;
window.$ === undefined && (window.$ = Priest);

/* 
 事件处理部份
  */
;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'
//取element的唯一标示符，如果没有，则设置一个并返回
  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  //查找绑定在元素上的指定类型的事件处理函数集合
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)//判断事件类型是否相同
        && (!event.ns || matcher.test(handler.ns))//判断事件命名空间是否相同
         //注意函数是引用类型的数据zid(handler.fn)的作用是返回handler.fn的标示符，如果没有，则给它添加一个，
       //这样如果fn和handler.fn引用的是同一个函数，那么fn上应该也可相同的标示符，
       //这里就是通过这一点来判断两个变量是否引用的同一个函数
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  //解析事件类型，返回一个包含事件名称和事件命名空间的对象
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  //生成命名空间的正则
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }
//通过给focus和blur事件设置为捕获来达到事件冒泡的目的
  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }
//修复不支持mouseenter和mouseleave的情况
  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

//给元素绑定监听事件,可同时绑定多个事件类型，如['click','mouseover','mouseout'],也可以是'click mouseover mouseout'
  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))//元素上已经绑定的所有事件处理函数
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      //保存fn,下面为了处理mouseenter, mouseleave时，对fn进行了修改
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
       // 模仿 mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
      	 /* 
             relatedTarget为事件相关对象，只有在mouseover和mouseout事件时才有值
             mouseover时表示的是鼠标移出的那个对象，mouseout时表示的是鼠标移入的那个对象
             当related不存在，表示事件不是mouseover或者mouseout,mouseover时!$.contains(this, related)当相关对象不在事件对象内
             且related !== this相关对象不是事件对象时，表示鼠标已经从事件对象外部移入到了对象本身，这个时间是要执行处理函数的
             当鼠标从事件对象上移入到子节点的时候related就等于this了，且!$.contains(this, related)也不成立，这个时间是不需要执行处理函数的
         */
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      //事件委托
      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        //当事件处理函数返回false时，阻止默认操作和冒泡
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      //设置处理函数的在函数集中的位置
      handler.i = set.length
      //将函数存入函数集中
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
   //删除绑定在元素上的指定类型的事件监听函数，可同时删除多种事件类型指定的函数，用数组或者还空格的字符串即可，同add
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }
//设置代理
  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
    	//如果fn是函数，则申明一个新的函数并用context作为上下文调用fn
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      //引用fn标示符
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  //绑定一次性事件监听函数
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',//是否调用过preventDefault方法
        //取消执行其他的事件处理函数并取消事件冒泡.如果同一个事件绑定了多个事件处理函数, 在其中一个事件处理函数中调用此方法后将不会继续调用其他的事件处理函数.
       stopImmediatePropagation: 'isImmediatePropagationStopped', //是否调用过stopImmediatePropagation方法，
        stopPropagation: 'isPropagationStopped'//是否调用过stopPropagation方法
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)
 //将preventDefault，stopImmediatePropagatio,stopPropagation方法定义到proxy上
      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }
 //创建事件代理
  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)//保存原始event
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]//复制event属性至proxy

    return compatible(proxy, event)
  }
 //事件委托
  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
    //取消事件委托
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }
 //on也有live和事件委托的效果，所以可以只用on来绑定事件
  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (isFunction(data) || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }
 //主动触发事件
  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // items in the collection might not be DOM elements
      if('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
   //触发元素上绑定的指定类型的事件，但是不冒泡
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
       //遍历元素上绑定的指定类型的事件处理函数集，按顺序执行，如果执行过stopImmediatePropagation，
       //那么e.isImmediatePropagationStopped()就会返回true,再外层函数返回false
       //注意each里的回调函数指定返回false时，会跳出循环，这样就达到的停止执行回面函数的目的
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return callback ?
      //如果有callback回调，则认为它是绑定
        this.bind(event, callback) :
        //如果没有callback回调，则让它主动触发
        this.trigger(event)
    }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else this.each(function(){
        try { this[name]() }
        catch(e) {}
      })
      return this
    }
  })
//根据参数创建一个event对象
  $.Event = function(type, props) {
  	//当type是个对象时
    if (!isString(type)) props = type, type = props.type
    //创建一个event对象，如果是click,mouseover,mouseout时，创建的是MouseEvent,bubbles为是否冒泡
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    //确保bubbles的值为true或false,并将props参数的属性扩展到新创建的event对象上
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    //初始化event对象，type为事件类型，如click，bubbles为是否冒泡，第三个参数表示是否可以用preventDefault方法来取消默认操作
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Priest);

/**
   Ajax处理部份
 **/
;(function($){
  var jsonpID = 0,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
   //触发 ajax的全局事件
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0
  
 //settings.global为true时表示需要触发全局ajax事件
     //注意这里的$.active++ === 0很巧妙，用它来判断开始，因为只有$.active等于0时$.active++ === 0才成立
  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  //注意这里的 !(--$.active)同上面的异曲同工，--$.active为0，则表示$.active的值为1，这样用来判断结束，也很有意思
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
 //触发全局ajaxBeforeSend事件，如果返回false,则取消此次请求
 function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}
 //可参考http://zh.wikipedia.org/zh-cn/JSONP
  $.ajaxJSONP = function(options, deferred){
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),//创建回调函数名
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      //取消加载
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function(e, errorType){
      clearTimeout(abortTimeout)
      $(script).off().remove()
//这里通过将回调函数重新赋值为空函数来达到看似阻止加载JS的目的，实际上给script标签设置了src属性后，请求就已经产生了，并且不能中断
      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }
   //成功加载后的回调函数
      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments
    }
//将回调函数名追加到请求地址，并赋给script，至此请求产生
    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)
//如果设置了超时处理
    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }
//ajax全局设置
  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true
  }
//根据MIME返回相应的数据类型，用作ajax参数里的dataType用，设置预期返回的数据类型
   //如html,json,scirpt,xml,text
  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }
//将查询字符串追加到URL后面
  function appendQuery(url, query) {
    if (query == '') return url
     //注意这里的replace,将第一个匹配到的&或者&&,&?,? ?& ??替换成?,用来保证地址的正确性
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  //序列化发送到服务器上的数据，如果是GET请求，则将序列化后的数据追加到请求地址后面
  function serializeData(options) {
  	 //options.processData表示对于非Get请求,是否自动将 options.data转换为字符串,前提是options.data不是字符串
    if (options.processData && options.data && $.type(options.data) != "string")
     //options.traditional表示是否以$.param方法序列化
     options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
       //如果是GET请求，将序列化后的数据追加到请求地址后面
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function(options){
  	//注意这里不能直接将$.ajaxSettings替换掉$.extend的第一个参数,这样会改变 $.ajaxSettings里面的值
     //这里的做法是创建一个新对象
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred()
        //如果它没有定义$.ajaxSettings里面的属性的时候，才去将$.ajaxSettings[key] 复制过来
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]
 //执行全局ajaxStart
    ajaxStart(settings)
//通过判断请求地址和当前页面地址的host是否相同来设置是跨域
    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host
//如果没有设置请求地址，则取当前页面地址
    if (!settings.url) settings.url = window.location.toString()
    //将data进行转换
    serializeData(settings)

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (hasPlaceholder) dataType = 'jsonp'
//如果不设置缓存
    if (settings.cache === false || (
         (!options || options.cache !== true) &&
         ('script' == dataType || 'jsonp' == dataType)
        ))
      settings.url = appendQuery(settings.url, '_=' + Date.now())

 //如果请求的是jsonp，则将地址栏里的=?替换为callback=?,相当于一个简写
    if ('jsonp' == dataType) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
         //如果请求地址没有定请求协议，则与当前页面协议相同
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)
//如果没有跨域
    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
     //如果不是GET请求，设置发送信息至服务器时内容编码类型
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        //根据状态来判断请求是否成功
         //状态>=200 && < 300 表示成功
         //状态 == 304 表示文件未改动过，也可认为成功
         //如果是取要本地文件那也可以认为是成功的，xhr.status == 0是在直接打开页面时发生请求时出现的状态，也就是不是用localhost的形式访问的页面的情况
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
         //获取返回的数据类型
         dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script')    (1,eval)(result)//如果返回的数据类型是JS
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }
 //如果解析出错，则执行全局parsererror事件
          if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
          //否则执行ajaxSuccess
          else ajaxSuccess(result, xhr, settings, deferred)
        } else {
        	//如果请求出错，则根据xhr.status来执行相应的错误处理函数
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)
//设置请求头信息
    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

//当设置了settings.timeout，则在超时后取消请求，并执行timeout事件处理函数
    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
   //将参数转换成ajax函数指定的参数格式
  function parseArguments(url, data, success, dataType) {
  	//如果data是function，则认为它是请求成功后的回调
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }
//简单的get请求
  $.get = function(/* url, data, success, dataType */){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(/* url, data, success, dataType */){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(/* url, data, success */){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }
 //这里的url可以是http://www.xxxx.com selector这种形式，就是对加载进来的HTML对行一个筛选
  $.fn.load = function(url, data, success){
    if (!this.length) return this
    //将请求地址用空格分开
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
     //要对成功后的回调函数进行一个改写，因为需要将加载进来的HTML添加进当前集合
    options.success = function(response){
    	 //selector就是对请求到的数据就行一个筛选的条件，比如只获取数据里的类名为.test的标签
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      //这里才是你写的回调
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      //scope用作处理value也是object或者array的情况
         //traditional表示是否以传统的方式拼接数据，
         //传统的意思就是比如现有一个数据{a:[1,2,3]},转成查询字符串后结果为'a=1&a=2&a=3'
         //非传统的的结果则是a[]=1&a[]=2&a[]=3
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      // handle data in serializeArray() format
      //当处理的数据为[{},{},{}]这种情况的时候，一般指的是序列化表单后的结果
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      //当value值是数组或者是对象且不是按传统的方式序列化的时候，需要再次遍历value
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }
//将obj转换为查询字符串的格式，traditional表示是否转换成传统的方式，至于传统的方式的意思看上面的注释
  $.param = function(obj, traditional){
    var params = []
     //注意这里将add方法定到params，所以下面serialize时才不需要返回数据
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Priest)