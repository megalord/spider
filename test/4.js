spider.alias('sub1/b', 'sillyName')

spider.define(function (require) {
    var b = require('sillyName');

    alert('Test ' + ((b === 'b') ? 'Passed' : 'Failed: got ' + b));
});
