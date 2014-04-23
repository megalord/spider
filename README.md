#spider

A library for defining and injecting client-side modules from different files.

####config(newSettings)

Writes each key/value pair of the passed object literal to the private settings object.

Available settings:
* basePath (string) = '/' -> The base path (root folder) of the javascript files on the server.
* concat (bool) = false -> A flag indicating if the javascript files for the modules are concatenated. When false, no attempt is made to load dependencies from the server.

####define(module, constructor)

Define a module with a constructor function, which can return any data type. The constructor function is only executed once, no matter how many times the module is imported across other modules. The functions result is cached in a registry, and that variable is returned for subsequent imports.

All modules should be named by their file path relative to the basePath.  The .js file extension should not be in the name, nor should a leading backslash.  For example, /app/main.js should be named 'app/main'.

Spider will automatically attempt to load any modules imported by the constructor.

####execute(module)

Tells spider which module is the root module.  If the module dependencies are visualized as a web, this module is the center.  Once the entire module web is loaded, the constructor function for the specified module is executed.  The execute method returns the result of the constructor, just like import.

```javascript
spider.execute('app');  // loads app.js, which should have a call to spider.define()
```

####fetch(module)

Imports a module, returning whatever is returned by that module's constructor function. Note that calls to import outside of a define constructor will fail unless the module being imported is already loaded.

```javascript
spider.define('model', function() {
    return {
        a:1
    };
});

var model = spider.fetch('model');
// model.a returns 1
```
