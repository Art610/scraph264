var tress = require('tress'),
needle = require('needle'),
cheerio = require('cheerio'),
moment = require('moment'),
log = require('cllc')(),
resolve = require('url').resolve,
mongodb = require('mongodb'),
mongojs = require('mongojs'),
assert = require('assert'),
fs = require('fs');

function scraph264() {

	log.dateFormat('%F');
	log('Run scrapping [h-264.ru]');

	var URL = 'http://www.h-264.ru/sitemap.html',
	mainURL = 'http://www.h-264.ru/';

	var data = [];
	var imgSrc = [];

	log.dateFormat('%T');
	log('Start parse of the publications');
	log.start('Detected news: %s ; Detected images %s');

	var q = tress(crawl, 10);

	q.retry = function() {
		q.pause();
		log.i('Paused on:', this);
		setTimeout(function() {
			q.resume();
			log.i('Resumed');
	}, 300000); // 5 minutes
		q.concurrency = 1; // set 1 thread
	}

	q.success = function(){
		q.concurrency = 10;
	}

	function crawl(url, callback){

		needle.get(url, function(err, res){ 

			if (err || res.statusCode !== 200) {
				q.concurrency === 1 && log.e((err || res.statusCode) + ' - ' + url);
				return callback(true);
				log.e((err || res.statusCode) + ' - ' + url);
				log.finish();
				process.exit();
			}

			var $ = cheerio.load(res.body);

			data.push({
				title: $('.article .headline h1.title').text(),
				href: url,
				subtitle: $('.article h2').text(),
				content: $('.article p').next().text(),
				size: $('.article p').next().text().length        
			});

			log.step();

			$('.contentpaneopen ul.level_0 li ul.level_1 li > a').each(function() {
				q.push(mainURL+($(this).attr('href')));
			});

			$('.article p>img').each(function() {
				imgSrc.push({
					img: resolve(URL, $(this).attr('src')), 
					href: url
				});
				log.step(0,1);
			});

			callback(); 
		});
	};

	q.success = function(){
		fs.writeFileSync('temp/h264/articlesdata.json', JSON.stringify(data, null, 4));
		fs.writeFileSync('temp/h264/articlesimg.json', JSON.stringify(imgSrc, null, 4));
	}

	q.drain = function() {
		log('Articles was written in files');
		log("Data will write in MongoDB, please wait...");
		var db = mongojs('data_at_h264'),
		collectionForData = "articlesData",
		collectionForImg = "articlesIMG";
		log('Connceted with database -> data_at_h264');
		updateDBCollection(db, collectionForData, data);
		updateDBCollection(db, collectionForImg, imgSrc);
		log('Work is done');
		log('Please wait...');
		log.finish('Restarting will be produced on ' + 
			moment().add(1,'days').format('MMMM DD YYYY, h:mm:ss a'));
		timer();
	}

	q.push(URL);
}

var timer = function() {
	var timerId = setTimeout(function run() {
		scraph264();
		log('Script was start on: ' + moment().format('DD MMMM YYYY, h:mm:ss a'));

		setTimeout(run, 86400000);
}, 86400000); // 86400000 => 24 hours
}

// Update data in MongoDB
function updateDBCollection(db, newCollection, data){
	db.newCollection.drop(function() {
		db.newCollection.insert(data, function(err, doc) {
			if (err) throw err;
			log.i("Collection " + newCollection + " was update");
		});
	});
}

module.exports = scraph264;
