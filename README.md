# reve
Declarative DOM manipulations. Play happy with server-side render architecture, such as [scrat-seo](https://github.com/scrat-team/scrat-swig).

## Downloads

- [reve.js](https://raw.githubusercontent.com/switer/reve/master/dist/reve.js)
- [reve.min.js](https://raw.githubusercontent.com/switer/reve/master/dist/reve.min.js)

## Guide

Assume we have HTML that generate by server, such as:

```html
<div id="app" 
	r-show="{show}" 
	r-class="{hl: hl}"
>Hi, Reve</div>
```

Then create an app ViewModel instance with "app"'s selector:

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

After instance, the DOM become to:

```html
<div id="app" class="hl">Hi, Reve</div>
```

We can change state of ViewModel, such as disable highlight state, it will update UI auto:

```js
ready: function () {
	this.$data.hl = false
	// it need to call update() to trigger UI pdate after change ViewModel state
	this.$update()
}
```
Render result: 

```html
<div id="app" class="">Hi, Reve</div>
```

If want to hide the app's DOM, we can do that:

```js
this.$data.show = false
this.$update()
```

The app's DOM will display as none:

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
	And component's DOM as below:
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
	And then, instance it and parent VM:
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
	Add a reference of the component instance to parent ViewModel's.**Only work with 'r-component'**.
	```html
	<div r-component="header" r-ref="header"></div>
	```
	We can access the header component instance refernce by parent VM's **$refs** property:
	```js
	app.$refs.header.$data.title // 'hi, reve'
	```

- **r-data**
	Passing and binding data from parent VM to child component.**Only work with 'r-component'**.
	

- **r-method**
	Passing methods from parent VM to child component.**Only work with 'r-component'**.

## License

MIT






