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
	<span v-class="{
	  red    : hasError;
	  bold   : isImportant;
	  hidden : isHidden;
	}"></span>
	```

- **r-style**
	

- **r-attr**
- **r-on**
- **r-html**
- **r-component**
- **r-ref**
- **r-data**
- **r-method**





