window.spider = (function() {

    // General note:
    // A module's name is the same as its path minus what is set in the private basePath property.
    // This is also the first argument of the public define(), fetch(), and execute() methods.
 
        // Keep a list of the modules' names that need to be executed when ready.
    var executeOnReady = {},

        // This is where the module and their metadata is stored.
        registry = {},    

        settings = {
            // This is the base path to the modules.
            basePath:'/',

            // Indicates if the modules are all defined in the same file.
            // This should be set to false until all the js is concatenated.
            concat:false,

            // Indicates if the files are being served from a server or the local file system.
            local:false
        },

    config = function(newSettings) {
        for(var option in newSettings)
            settings[option] = newSettings[option];
    },

    // Define a module using a constructor function.
    // If a module is imported before it is defined,
    // then it has been added to the registry,
    // and its importedBy property will not be empty,
    // and its ready property will be false.
    define = function(module, constructor) {
        if(typeof registry[module] === 'undefined') {
            // The module was not imported by any previously defined modules.
            registry[module] = {
                importedBy:[],
                ready:false
            };
        };

        // Add more information pertinent to the module.
        var dependencies = findDependencies(constructor);
        registry[module].constructor = constructor;
        registry[module].dependencies = dependencies;

        if(dependencies.length === 0)
            registry[module].ready = true;

        // Register each of the module's dependencies, loading them if needed.
        for(var i = 0; i < dependencies.length; i++) {
            if(typeof registry[dependencies[i]] === 'undefined') {
                // The dependency module was not imported by any previously defined modules.
                registry[dependencies[i]] = {
                    importedBy:[],
                    ready:false
                };

                load(dependencies[i]);
            };

            // The module name is saved in each dependency module so that
            // readiness can propagate up the module tree
            registry[dependencies[i]].importedBy.push(module);
        };

        propagateReadiness(module);
    },

    // Mark a module as being needed to run when it is ready.
    execute = function(module) {
        if(module in registry && registry[module].ready)
            return registry[module].constructor();

        executeOnReady[module] = true;
        load(module);
    },

    // Import a module into the scope.
    // This method returns the result of the module's constructor
    // and should only be called inside the constructor passed to the define() method.
    fetch = function(module) {
        if(typeof registry[module].obj === 'undefined')
            registry[module].obj = registry[module].constructor();

        return registry[module].obj;
    },

    // Determine a module's dependencies by looking for the module.import() method
    // in its constructor function and extracting the argument.
    // Returns an array of module names.
    findDependencies = function(constructor) {
        var match,
            dependencies = [],
            constructorString = constructor.toString(),
            regex = /spider\.fetch\('([\w\/]*)'\)/g;

        while(match = regex.exec(constructorString))
            dependencies.push(match[1]);

        return dependencies;
    },
    
    // Load a script from the server in a new script tag.
    // Delete the script tag once the js has been parsed.
    load = function(module) {
        if(settings.concat)
            return;

        var script = document.createElement('script');
        script.src = (settings.local ? '' : settings.basePath) + module + '.js';
        script.addEventListener('load', function() {
            script.parentNode.removeChild(script);
        });
        document.getElementsByTagName('head')[0].appendChild(script);
    },

    // Resolve the readiness of any modules that import the given module.
    // This method will atttempt to propagate up the module tree.
    // It also checks ready modules against the list of modules to be executed when ready,
    // as are determined by the module.execute() method.
    propagateReadiness = function(module) {
        if(!registry[module].ready)
            registry[module].ready = testReadiness(module);

        if(registry[module].ready) {
            if(executeOnReady[module]) {
                delete executeOnReady[module];
                registry[module].constructor();
            } else {
                var requestingModules = registry[module].importedBy;
                for(var i = 0; i < requestingModules.length; i++)
                    propagateReadiness(requestingModules[i]);
            };
        };
    },

    // Check the readiness of all the dependencies of a module.
    // Returns true if all dependencies are ready, false otherwise.
    testReadiness = function(module) {
        var dependencies = registry[module].dependencies;
        for(var i = 0; i < dependencies.length; i++)
            if(!registry[dependencies[i]].ready)
                return false;   
        return true;
    };
    
    return {
        config:config,
        define:define,
        execute:execute,
        fetch:fetch
    };

}());
