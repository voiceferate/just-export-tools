const axios = require('axios');
const log = require('cllc')();
const fs = require('fs');

let keyWordsToCheck = process.argv.slice(2)
keyWordsToCheck = keyWordsToCheck.map((element) => {
  return element.toLowerCase()
})


const createCsvWriter = require('csv-writer').createArrayCsvWriter;

let dataStructure = [
  "company_name",
  "activity",
  "address",
  "phone",
  "site_url",
]


log.d('Output structure',dataStructure.concat(keyWordsToCheck))
const csvWriter = createCsvWriter({
  path: 'data.csv',
  header: dataStructure.concat(keyWordsToCheck)
});



const file_input_array = fs.readFileSync('src.csv').toString().split("\r\n");
log.i(`Started process: ${file_input_array.length} strings to handle`)


let parsedArray = [];

if (keyWordsToCheck.length >= 20) {
  log(keyWordsToCheck)
  log.warn('You have entered to much keywords')
  process.exit()
} else if (keyWordsToCheck.length === 0) {
  log(keyWordsToCheck)
  log.warn('You haven`t entered any keywords')
  process.exit()
}

log.start('lines done: [%s]\nurls is not available [%s]', 0, 0);


file_input_array.forEach(function (currentValue, index, array) {
  let mainIndex = index;

  // currentValue = currentValue.replace(/\n\r/g, '');
  let currentStr = delBr(currentValue).split(',');

  parsedArray.push(currentStr);

  // you can set a column with the site's URL number. count from 0. i.e. seventh column = 4
  let url = currentStr[currentStr.length-1];

  if (url !== undefined) {
    if(url.endsWith("/")) {
      url = url.slice(0, -1)
    }
    url = url.replace ("http:", 'https:')
  } 

  axios(url, {timeout: 60000})
    .then(response => {
      const html = response.data.toLowerCase();

      keyWordsToCheck.forEach((element,index) => {
        parsedArray[mainIndex].push(chekKeyWord(element, html, 0).toString())
      });


      let result = extractEmails(html);
      parsedArray[mainIndex].push(Array.from(result).join(' : '))
    })
    .then(()=>{
      showProgress(parsedArray)
    })
    .catch(error => {
      // log.e(new Error(error))
      log.step(0, 1);
      showProgress(parsedArray)
    });
  });


function chekKeyWord(word, string, counter) {

  if (string.indexOf(word) === -1) {
    return counter;
  } else {
    counter++
    return chekKeyWord(word, string.substring(string.indexOf(word)+1), counter)
  }
}

function extractEmails (input_text)
{
    let arr = input_text.match(/([a-zA-Z0-9._-]+@[a-zA-Z._-]+\.[a-zA-Z._-]+)/gi);
    return new Set(arr);
}

let progressCounter = 0
function showProgress(arr) {
  progressCounter++;
  // console.log(`Done ${progressCounter} of ${arr.length}`)
  log.step(1, 0);

  if (arr.length === progressCounter) {
    log.i("Process finished successfully")

    csvWriter
      .writeRecords(arr)
      .then(() => log.d('The CSV file was written successfully'));
  }
}

function delBrLink (s) {return s.replace (/\s{1,}/g, '')};
function delBr (s) {return s.replace (/\s{2,}/g, ' ')};

