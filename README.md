# reve
Declarative DOM manipulations. Play happy with server-side render architecture, such as [scrat-seo](https://github.com/scrat-team/scrat-swig).

## Downloads

- [reve.js](https://raw.githubusercontent.com/switer/reve/master/dist/reve.js)
- [reve.min.js](https://raw.githubusercontent.com/switer/reve/master/dist/reve.min.js)

## Guide

Assume we have a `app`'s HTML that is generated by server:

```html
<div id="app" 
	r-show="{show}" 
	r-class="{hl: hl}"
>Hi, Reve</div>
```

Then create an the `app` ViewModel instance with it's element selector:

```js
var $app = new Reve({
	el: '#app',
	data: function () {
		// define some state of ViewModel
		return {
			show: true,
			hl: true
		}
	},
	ready: function () {
		// ... do something when instance compele ...
	},
	methods: {
		// ... define methods of the ViewModel ...
	}
})
```

After instancing, the element is rendered to:

```html
<div id="app" class="hl">Hi, Reve</div>
```

We can change states of the `app` ViewModel, such as disable the highlight state, 
then call `$update` method, it will update UI automatically:

```js
ready: function () {
	this.$data.hl = false
	// it need to call update() to trigger UI update after state being changed
	this.$update()
}
```

Render result: 

```html
<div id="app" class="">Hi, Reve</div>
```

If want to hide the `app` element, we can do it like this:

```js
this.$data.show = false
this.$update()
```

The `app` element's style of display will be "none":

```html
<div id="app" class="" style="display: none">Hi, Reve</div>
```

## API

#### Directives
Directive is declarative DOM manipulation, such as "r-class" is the DOM manipulation of add/remove class of the element.

- **r-show**
	set element's style of display to none, when value is false.  

- **r-class**
	Add className to the element when value is true, Otherwise remove that class.
	such as: 
	```html
	<span r-class="{
	  red    : hasError;
	  bold   : isImportant;
	  hidden : isHidden;
	}"></span>
	```

- **r-style**
	Set inline style to element.
	```html
	<span r-class="{
	  display    : show ? '':'none'
	}"></span>
	```

- **r-attr**
	Update element's attribute by binding data.
	```html
	<img r-attr="{src: imgUrl || './default.png'}" alt="">
	```

- **r-on**
	Add event listener to the element, such as add a "click" and "toucstart" events to the button element:
	```html
	<button 
		r-on="{
			click: onClick;
			touchstart: onTouchStart;
		}"
	></button>
	```

- **r-html**
	Update element's innerHTML by binding data.

- **r-component**
	Compile the element as Child component and instance it by component id.
	Assume we have defined a component with state "title" and method "capitalize", as below:
	```js
	Reve.component('header', {
		data: function () {
			return {
				title: ''
			}
		},
		methods: {
			capitalize: function (str) {
				var initial = str[0]
				return initial.towUpperCase() + str.slice(1)
			}
		}
	})
	```
	And component's template as below:
	```html
	<div id="app">
		<div r-component="header" 
			r-data="{
				title: "hi, reve"
			}""
		>
			<span r-html="{capitalize(title)}"></span>
		</div>
	</div>
	```
	It will be instanced when instance parent VM:
	```js
	var app = new Reve({
		el: '#app'
	})
	```
	Render result:
	```html
	<div id="app">
		<div>
			<span>Hi, reve</span>
		</div>
	</div>
	```

- **r-ref**
	Add a reference of the component instance to parent component instance.
	> Notice: work with "r-component" only.

	```html
	<div r-component="header" r-ref="header"></div>
	```
	We can access the header component instance refernce by parent VM's **$refs** property:
	```js
	app.$refs.header.$data.title // 'hi, reve'
	```

- **r-data**
	Passing and binding data from parent VM to child component.
	> Notice: work with "r-component" only.
	

- **r-methods**
	Passing methods from parent VM to child component.
	> Notice: work with "r-component" only.

#### Class Methods

- **Reve(options)**
- **Reve.create(options)**
- **Reve.component(options)**

#### Instance Options

- **el** `\<HTMLElement\>` | `\<String\>`
- **template** `\<String\>`
- **data** `\<Function\>`
- **methods** `\<Object\>`
- **ready** `\<Function\>`
- **created** `\<Function\>`

#### Instance Properties

- **$el** `\<HTMLElement\>`
- **$data** `\<Object\>`
- **$methods** `\<Object\>`
- **$refs** `\<Object\>`
- **$directives** `\<Object\>`


#### Instance Methods

- **$update()**
- **$compile(HTMLElement | String)**

## License

MIT






