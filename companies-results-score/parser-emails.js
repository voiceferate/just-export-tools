const axios = require('axios');
const fs = require('fs');

let keyWordsToCheck = process.argv.slice(2)
keyWordsToCheck = keyWordsToCheck.map((element) => {
  return element.toLowerCase()
})
console.log(keyWordsToCheck)

const createCsvWriter = require('csv-writer').createArrayCsvWriter;

let dataStructure = [
  "company_name",
  "activity",
  "address",
  "phone",
  "site_url",
]


console.log(dataStructure.concat(keyWordsToCheck))
const csvWriter = createCsvWriter({
  path: 'data.csv',
  header: dataStructure.concat(keyWordsToCheck)
});



const file_input_array = fs.readFileSync('src.csv').toString().split("\r\n");

let parsedArray = [];

if (keyWordsToCheck.length >= 20) {
  console.log(keyWordsToCheck)
  console.warn('You have entered to much keywords')
  process.exit()
} else if (keyWordsToCheck.length === 0) {
  console.log(keyWordsToCheck)
  console.warn('You haven`t entered any keywords')
  process.exit()
}

file_input_array.forEach(function (currentValue, index, array) {
  let mainIndex = index;

  // currentValue = currentValue.replace(/\n\r/g, '');
  let currentStr = delBr(currentValue).split(',');

  parsedArray.push(currentStr);

  // you can set a column with the site's URL number. count from 0. i.e. fifth column = 4
  // #######################
  let url = currentStr[4];
  // #######################

  if (url !== undefined) {
    if(url.endsWith("/")) {
      url = url.slice(0, -1)
    }
  } 

  console.log(url)

  axios(url)
    .then(response => {
      const html = response.data.toLowerCase();

      keyWordsToCheck.forEach((element,index) => {
        parsedArray[mainIndex].push(chekKeyWord(element, html, 0).toString())
      });


      let result = extractEmails(html);
      parsedArray[mainIndex].push(Array.from(result).join(' : '))
    })
    .then(()=>{
      // console.log('parsedArray', parsedArray)
      showProgress(parsedArray)
    })
    .catch(error => {
      console.log('url is not available')
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
  console.log(`Done ${progressCounter} of ${arr.length}`)

  if (arr.length === progressCounter) {
    console.log("Process finished successfully")

    // console.log(arr)

    csvWriter
      .writeRecords(arr)
      .then(() => console.log('The CSV file was written successfully'));
  }
}

function delBrLink (s) {return s.replace (/\s{1,}/g, '')};
function delBr (s) {return s.replace (/\s{2,}/g, ' ')};

