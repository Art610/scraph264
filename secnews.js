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

function scrapsecnews() {

	log.dateFormat('%F');
	log('Run scrapping [secnews.ru]');

	var URL = 'http://www.secnews.ru/articles/#axzz4Htvgyahm';
	var mainURL = 'http://www.secnews.ru';

	var articlesData = [];
	var articlesIMG = [];

	log.dateFormat('%T');
	log('Start parse of the publications');
	log.start('Detected news: %s ; Detected images %s');

	var q = tress(crawl, 10);



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

			articlesData.push({
				title: $('h1').text(),
				href: url,
				date: $('span.news-date-time').text(),
				content: $('.news-detail p').text(),
				size: $('.news-detail p').text().length    
			});

			log.step();

			$('.news-list p>a').each(function() {
				q.push(mainURL+($(this).attr('href')));

			});

			$('.news-detail p>img').each(function() {
				articlesIMG.push({
					img: resolve(mainURL, $(this).attr('src')), 
					href: url
				});
				log.step(0,1);
			});

         //паджинатор
         $('.news-list p font.text>a').each(function() {
         	q.push(resolve(mainURL, $(this).attr('href')));
         });

         callback(); 
       });
	};
	q.success = function(){
		fs.writeFileSync('temp/secnews/articlesdata.json', JSON.stringify(articlesData, null, 4));
		fs.writeFileSync('temp/secnews/articlesimg.json', JSON.stringify(articlesIMG, null, 4));
	}

	q.drain = function(){
		log('Articles was written in files');
		log("Data will write in MongoDB, please wait...");
		var db = mongojs('data_at_secnews'),
		collectionForArticlesData = "articlesData",
		collectionForArticlesImg = "articlesIMG";
		log('Connceted with database -> data_at_secnews');
		updateDBCollection(db, collectionForArticlesData, articlesData);
		updateDBCollection(db, collectionForArticlesImg, articlesIMG);
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
		scrapsecnews();
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

module.exports = scrapsecnews;

