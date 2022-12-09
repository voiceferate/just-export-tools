const axios = require('axios');
const log = require('cllc')();
const fs = require('fs');


const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const csvWriter = createCsvWriter({
  path: 'data.csv',
});

let keyWordsToCheck = process.argv.slice(2);
keyWordsToCheck = keyWordsToCheck.map((element) => {
  return element.toLowerCase();
})

if (keyWordsToCheck.length >= 30) {
  log(keyWordsToCheck)
  log.warn('You have entered to much keywords')
  process.exit()
} else if (keyWordsToCheck.length === 0) {
  log(keyWordsToCheck)
  log.warn('You haven`t entered any keywords')
  process.exit()
}

const inputFileArray = parseInputData('src.csv');
const inputArray = inputFileArray;

// записати ключові слова у вихідний файл
csvWriter.writeRecords([getKeyWordsList(inputFileArray)])


// filter input array and remove duplicating sites
const filteredUrlsArray = filterUniqeUrls(inputArray)

// temp
let ok = 0
let bad = 0

// перебираємо підготовлений масив
filteredUrlsArray.forEach(async (elem, index) => {

  const rootUrl = elem[elem.length-2]
  log(elem)

  axios.get(rootUrl)
  .then(function (response) {
    // handle success
    console.log(response);
  })
  .catch(function (error) {
    // handle error
    console.log(error.code);
  })
  .then(function () {
    // always executed
  });


})



console.log("done all")

// return numbers array
function countKeywords(reqText, keyword) {
  const regex = new RegExp(keyword, 'g');
  if (reqText.match(regex) !== null) {
    return reqText.match(regex).length
  } else {
    return 0
  }
}


function getLinksFromRoot(pageText, root) {

  console.log("root", root)

  const httpRegexG = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;

  const domainRegex = /https?:\/\/(?:www\.)?([-a-zA-Z0-9@:%._\+~#=]{1,256})\./
  const domain = root.match(domainRegex)[1];

  let linksArray = pageText.match(httpRegexG);

  let result = [root];

  if (linksArray && linksArray.length > 0) {
    let findedUrls = linksArray.filter(link => {
      if (
        link.match(domainRegex)[1] !== domain
        || link.match(/(.*\/{2}.*\/{1}.*\.)/g) !== null
        || link.includes("/wp-") === true
      ) {
        return false
      };

      return true;
    });
    result.push(...findedUrls)
  };

  return Array.from(new Set(result))
}

async function getPage(url) {

  try {
    let res = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 10,
    }
    )

    // console.log("status", res.status)

    if (res.status === 200 && typeof res.data === "string") {
      // console.log("return resp");
      return res.data
    } else {
      // console.log("return bad resp", res.status);

      return false
    }

  } catch (error) {
    // console.log("error getting page")
    // console.log("error", error)
    return false
  }
}

async function getChildPage(url) {

  try {
    let res = await axios.get(url, {
      timeout: 2000,
      maxRedirects: 10,
    }
    )

    // console.log("child status", res.status)

    if (res.status === 200 && typeof res.data === "string") {
      // console.log("return resp");
      return res.data
    } else {
      // console.log("return bad resp", res.status);

      return false
    }

  } catch (error) {
    // console.log("error getting child page")
    // console.log(url)
    // console.log("error", error)
    return false
  }
}


function filterUniqeUrls(array) {
  let output = [array[0]];


  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    let findMach = false;

    output.forEach((el) => {
      if (el[el.length - 2] === element[element.length - 1]) {
        el[el.length - 1]++;
        findMach = true
      }
    })

    if (!findMach) {
      element[element.length] = 1
      output.push(element)
    }
  }


  return output
}

function getKeyWordsList(inputArr) {
  let headerValuesArray = []

  headerValuesArray.length = inputArr[1].length
  headerValuesArray.push("popularity")
  headerValuesArray.push(...keyWordsToCheck)

  // inputArr.unshift([...headerValuesArray])
  return headerValuesArray
}

function parseInputData(file) {
  let inputArr = fs.readFileSync(file).toString().split("\r\n");

  inputArr = inputArr.map(function (line) {
    const currentStr = delBr(line).split(',');

    const regex = /(http.*:\/\/[\w\._-]+)/g;
    let urlEl = currentStr[currentStr.length - 1];
    const matches = urlEl.matchAll(regex);
    for (const match of matches) {
      currentStr[currentStr.length - 1] = match[0] + "/";
    }

    return currentStr;
  })
  return inputArr
}

function delBrLink(s) { return s.replace(/\s{1,}/g, '') };
function delBr(s) { return s.replace(/\s{2,}/g, ' ') };
