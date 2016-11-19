
var log = require('cllc')(),
mongodb = require('mongodb'),
mongojs = require('mongojs'),
assert = require('assert');

require('./secnews')();
setTimeout(require('./h264')(), 21600000);