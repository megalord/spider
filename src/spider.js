window.spider = (function() {
    
    var aliases = {},
    
        executeOnReady = document.currentScript.getAttribute('data-execute'),

        basePath = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1) + executeOnReady.slice(0, executeOnReady.lastIndexOf('/') + 1),

        // Storage for all module information.
        registry = {};
    
    function alias(from, to) {
        aliases[to] = resolvePath(basePath, from);
    }

    // Build and cache a module by calling its constructor and passing the require function.
    function build(path) {
        var module = registry[path],
        
        require = function(relativePath) {
            return registry[resolvePath(module.parentDirectory, relativePath)].exports;
        };
        
        module.exports = module.constructor(require);
        module.isBuilt = true;
    }
    
    function config(options) {
        if ('basePath' in options) {
            basePath = options.basePath;
        }
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
                isReady: false
            };
        }

        // Complete the module's registry data.
        registry[path].isBuilt = false;
        registry[path].constructor = constructor;
        registry[path].dependencies = dependencies;
        registry[path].parentDirectory = parentDirectory;
        
        // Load and update this module's dependencies.
        for (var i = 0; i < dependencies.length; i++) {
            if (!(dependencies[i] in registry)) {
                registry[dependencies[i]] = {
                    importedBy: [],
                    isReady: false
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
            dependencies.push(resolvePath(parentDirectory, match[1]));
        }
        
        return dependencies;
    }
    
    // Checks a module's dependencies to determine if it is ready to be build.
    function isReady(path) {
        var dependencies = registry[path].dependencies;
        
        for(var i = 0; i < dependencies.length; i++) {
            if(!registry[dependencies[i]].isReady) {
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
        
        module.isReady = isReady(path);
        
        if (!module.isBuilt && module.isReady) {
            build(path);
            for (var i = 0; i < module.importedBy.length; i++) {
                propagateReadiness(module.importedBy[i]);
            }
        }
    }
 
    // Transform a partial or relative path into a full path.
    function resolvePath(parentDirectory, relativePath) {
        if (relativePath in aliases) {
            return aliases[relativePath];
        }

        if (relativePath.slice(0, 2) !== './' && relativePath.slice(0, 3) !== '../') {
            return basePath + relativePath;
        }

        var dirs    = (parentDirectory + relativePath).split('/'),
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
    
    window.r = registry;
    // Expose the define function to the global spider namespace.
    return {
        alias:  alias,
        config: config,
        define: define
    }
    
})();
