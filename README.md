#spider

A library for defining and injecting client-side modules from different files.

##API

####define(constructor)

Define a module with a constructor function, which can return any data type. The constructor function is only executed once, no matter how many times the module is imported across other modules. The functions result is cached in a registry, and that variable is returned for subsequent imports.

The require function is passed as the only argument to the constructor function. Spider will automatically attempt to load any modules imported by the require function.

####require()

Imports a module, returning whatever is returned by that module's constructor function.

##Usage

Download the source and add it to your html page. Point spider to your main executable (top-level module) by adding the attribute data-execute="your_module" to the script tag. Once the entire module web is loaded, the constructor function for the specified module is executed.

For example...
```html
<script data-execute="app" src="libs/spider.min.js"></script>
```

```javascript
//app.js
spider.define(function(require) {
    var module = require('./module');
    console.log(module);
});

//module.js
spider.define(function() {
	return 1;
});
```

Although the example returns an integer for simplicity, the constructor function for a module can return any type of value.