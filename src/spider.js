window.spider = (function() {
    
    var executeOnReady = document.currentScript.getAttribute('data-execute'),

        // Storage for all module information.
        registry = {};
    
    // Build and cache a module by calling its constructor and passing the require function.
    function build(path) {
        var module = registry[path],
        
        require = function(relativePath) {
            return registry[resolvePath(module.parentDirectory + relativePath)].exports;
        };
        
        module.exports = module.constructor(require);
    }
    
    function define(constructor) {
        // Every module is added to the registry before it is defined (by a module dependent on it).
        
        var src = document.currentScript.src,
            path = src.slice(window.location.origin.length, src.lastIndexOf('.')),
            parentDirectory = path.slice(0, path.lastIndexOf('/') + 1),
        	dependencies = getDependencies(parentDirectory, constructor);
        
        if (!(path in registry)) {
            registry[path] = {
                importedBy: [],
                ready: false
            };
        }

        // Complete the module's registry data.
        registry[path].constructor = constructor;
        registry[path].dependencies = dependencies;
        registry[path].parentDirectory = parentDirectory;
        
        // Load and update this module's dependencies.
        for (var i = 0; i < dependencies.length; i++) {
            if (!(dependencies[i] in registry)) {
                registry[dependencies[i]] = {
                    importedBy: [],
                    ready: false
                };
                
                load(dependencies[i]);
            }
            
            registry[dependencies[i]].importedBy.push(path);
        }
        
        propagateReadiness(path);
    }
    
    // Extract a module's dependencies from its constructor function.
    function getDependencies(parentDirectory, constructor) {
        var match,
            dependencies = [],
            constructorString = constructor.toString(),
            regex = /require\('([\.\w\/]*)'\)/g;
        
        while (match = regex.exec(constructorString)) {
            dependencies.push(resolvePath(parentDirectory + match[1]));
        }
        
        return dependencies;
    }
    
    // Checks a module's dependencies to determine if it is ready to be build.
    function isReady(path) {
        var dependencies = registry[path].dependencies;
        
        for(var i = 0; i < dependencies.length; i++) {
            if(!registry[dependencies[i]].ready) {
                return false;
            }
        }
        
        return true;
    }
    
    // Load the script file for a module.
    function load(path) {
        var script = document.createElement('script');
        script.src = (path[0] === '/' ? window.location.origin : '') + path + '.js';
        script.addEventListener('load', function () {
            script.parentNode.removeChild(script);
        });
        document.body.appendChild(script);
    }
 
    // Attempts to change the readiness of the module and the module's parents.
    function propagateReadiness(path) {
        var module = registry[path];
        
        module.ready = isReady(path);
        
        if (module.ready) {
            build(path);
            for (var i = 0; i < module.importedBy.length; i++) {
                propagateReadiness(module.importedBy[i]);
            }
        }
    }
 
    // Transform a partial or relative path into a full path.
    function resolvePath(path) {
        var dirs    = path.split('/'),
            i       = 0;

        while (i < dirs.length) {
            switch (dirs[i]) {
                case '':
                    if (i === 0 || i === dirs.length - 1) {
                        i++;
                        break;
                    }
                case '.':
                    dirs.splice(i, 1);
                    break;
                case '..':
                    dirs.splice(i - 1, 2);
                    i -= 1;
                    break;
                default:
                    i++;
                    break;
            }
        }

        return dirs.join('/');
    }

    // Load the executable.
    load(executeOnReady);
    
    // Expose the define function to the global spider namespace.
    return {
        define: define
    }
    
})();
