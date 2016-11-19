var needle = require('needle');
var fs = require('fs');
var URL = 'http://www.h-264.ru/';

needle.get(URL, function(err, res){
    if (err) throw err;
    fs.writeFileSync('temp/fullData.html', res.body);
});