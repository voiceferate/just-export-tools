var log = require('cllc')();
var tress = require('tress');
var needle = require('needle');
var cheerio = require('cheerio');
var fs = require('fs');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: [
        {id: 'line_number', title: 'line_number'},
        // {id: 'company_name', title: 'company_name'},
    ]
  });



var httpOptions = {
    follow_max: 10,
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
};

var results = [];
var line_number = 1;

var q = tress(crawl, 5);

// q.success = function(){
//     q.concurrency = 1;
// }

q.retry = function(){
    q.concurrency = -1000;
}

q.drain = function(){
    // fs.writeFileSync('./data.json', JSON.stringify(results, null, 4));
    log.finish();
    log('Работа закончена');
    
    csvWriter
        .writeRecords(results)
        .then(()=> console.log('The CSV file was written'));
    return
}


function crawl(url, callback){
    needle.get(url, httpOptions, function(err, res){
        
        if (err || res.statusCode !== 200) {

            log.e((err || res.statusCode) + ' - ' + url);
            callback(err, 'some #### err ##### message');

        } else {
            var $ = cheerio.load(res.body);



            let breadcramps = $('.box_c a').text()
            let item_type = $('.h1_desktop_c .type_marker').text()
            let item_title = $('.h1_desktop_c h1').text()
            let location = $('.i3_grid_main_c .t11pt span[itemprop="addressLocality"]').text();
            let author = $('.sprite_box_7_1.ct_user_box_7_1').text()

            var phone = $(".contactButton a input").attr("value");
            if(phone == undefined) {
                phone = "no_data"
            };
            delBr(phone);


                
            results.push({
                'line_number': line_number,
                // country: delBr($("span[itemprop='addressCountry']").text().trim()),
             })
            log.info(`line ${line_number} done`)
            log.step()

            line_number++;

            callback()
        }
    });
}


var file_input_array = fs.readFileSync('book.csv').toString().split("\n");


for (i in file_input_array) {
    let url = delBrLink(file_input_array[i]);
    // let url = delBrLink(file_input_array[i]);
    url = encodeURI(url);
    
    log('Начало работы');
    log.start(`Пройдено посилань %s із ${file_input_array.length}`);
    q.push( url );
};


function delBrLink (s) {return s.replace (/\s{1,}/g, '')};
function commaRemove (s) {return s.replace (/[,\/]/g, '')};
function delBr (s) {return s.replace (/\s{2,}/g, ' ')};
