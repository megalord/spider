window.spider = (function() {
    
    var execute = document.currentScript.getAttribute('data-execute'),
    
        // The base path for the modules.
        // Each module is located at basePath + relativePath + .js
        basePath = execute.slice(0, execute.lastIndexOf('/') + 1),
            
    	// The relative path for the executed module.
        executeOnReady = execute.slice(execute.lastIndexOf('/') + 1),
        
        // Storage for all module information.
        registry = {},
    
    // Build and cache a module by calling its constructor and passing the require function.
    build = function(relativePath) {
        var module = registry[relativePath],
        
        require = function(path) {
            return registry[sanitizePath(module.parentDirectory, path)].exports;
        };
        
        module.exports = module.constructor(require);
    },
    
    define = function(constructor) {
        // Every module is added to the registry before it is defined (by a module dependent on it).
        
        var relativePath = getRelativePath(document.currentScript.src),
            parentDirectory = relativePath.slice(0, relativePath.lastIndexOf('/') + 1),
        
        	dependencies = getDependencies(parentDirectory, constructor);
        
        // Complete the module's registry data.
        registry[relativePath].constructor = constructor;
        registry[relativePath].dependencies = dependencies;
        registry[relativePath].parentDirectory = parentDirectory;
        
        // Load and update this module's dependencies.
        for(var i = 0; i < dependencies.length; i++) {
            if(!(dependencies[i] in registry)) {
                registry[dependencies[i]] = {
                    importedBy: [],
                    ready: false
                };
                
                load(dependencies[i]);
            };
            
            registry[dependencies[i]].importedBy.push(relativePath);
        };
        
        propagateReadiness(relativePath);
    },
    
    // Extract a module's dependencies from its constructor function.
    getDependencies = function(parentDirectory, constructor) {
        var match,
            dependencies = [],
            constructorString = constructor.toString(),
            regex = /require\('([\.\w\/]*)'\)/g;
        
        while(match = regex.exec(constructorString))
            dependencies.push(sanitizePath(parentDirectory, match[1]));
        
        return dependencies;
    },
    
    // Convert the full path of a module to a relative one.
    getRelativePath = function(fullPath) {
        return fullPath.slice(fullPath.lastIndexOf(basePath) + basePath.length, fullPath.lastIndexOf('.'));
    },
    
    // Checks a module's dependencies to determine if it is ready to be build.
    isReady = function(relativePath) {
        var dependencies = registry[relativePath].dependencies;
        
        for(var i = 0; i < dependencies.length; i++)
            if(!registry[dependencies[i]].ready)
                return false;
        
        return true;
    },
    
    // Load the script file for a module.
    load = function(relativePath) {
        var script = document.createElement('script');
        script.src = basePath + relativePath + '.js';
        script.addEventListener('load', function() {
            script.parentNode.removeChild(script);
        });
        document.body.appendChild(script);
    },
 
    // Attempts to change the readiness of the module and the module's parents.
    propagateReadiness = function(relativePath) {
        var module = registry[relativePath];
        
        module.ready = isReady(relativePath);
        
        if(module.ready) {
            build(relativePath);
            for(var i = 0; i < module.importedBy.length; i++)
                propagateReadiness(module.importedBy[i]);
        }
    },
 
    // Merge a relative path with the parent directory to create a full path.
    sanitizePath = function(parentDirectory, relativePath) {
        return parentDirectory + relativePath.replace('./', '');
    };
    
    // Initialize the registry.
    registry[executeOnReady] = {
        importedBy: [],
        ready: false
    };
    
    // Load the executable.
    load(executeOnReady);
    
    // Expose the define function to the global spider namespace.
    return {
        define:define
    };
    
})();