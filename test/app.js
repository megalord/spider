spider.define(function(require) {
    var a = require('./a'),
        b = require('./sub1/b'),
        c = require('./sub2/c');
    
    console.log('Test ' + ((a + b + c === 'adbcd') ? 'Passed' : 'Failed'));
});