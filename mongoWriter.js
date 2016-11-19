var fs = require('fs');
var mongojs = require('mongojs');
var db = mongojs('h-264rucontent');
assert = require('assert');


//Вставка данных в базу (добавление)
var insertDocument = function(collection, data) {
	var dbw = db.collection(collection);
	dbw.insert(data, function(err, doc) {
		if (err) throw err;
		console.log("Insert is complete");
		db.close();
	});
}

var data = fs.readFileSync('data.json', 'utf8');
var json = JSON.parse(data);

//Вывод всех данных из коллекции
var findDocument = function(collection) {
	var dbw = db.collection(collection);
	dbw.find( function(err, doc) {
		if(err) throw err;
		console.log("Finding of data is complete");
		db.close();
	});
}
 
// Обновление коллекции полностью
var updateCollection = function(collection, data) {
	var dbw = db.collection(collection);
	dbw.drop(function(err) {
		if(err) throw err;
	});
	dbw.insert(data, function(err, doc) {
		if (err) throw err;
		console.log("Collection " + collection + " was update");
		db.close();
	});
}

//Поиск данных в коллекции
var findDataObject = function(collection, dataChunk) {
	var dbw = db.collection(collection);
	dbw.find(dataChunk, function(err, doc) {
		if(err) throw err;
		console.log("Finding of data is complete");
		console.log(doc);
		db.close();
	});
}

var c = "h264ru";
var dataChunk = {"href": "http://www.h-264.ru//kupolnievideokameri/149-techwin-sid-47-48-49.html"};

module.exports = updateCollection;