spider.define(function(require) {
    var a = require('./a'),
        b = require('./sub1/b'),
        c = require('./sub2/c');

    alert('Test ' + ((a + b + c === 'adbcde') ? 'Passed' : 'Failed: got ' + a + b + c));
});
