spider.define(function (require) {
    var a = require('a'),
        f = require('sub1/f');

    alert('Test ' + ((a + f === 'adfb') ? 'Passed' : 'Failed: got ' + a + f));
});
