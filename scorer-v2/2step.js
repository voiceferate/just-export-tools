const log = require('cllc')();
const fs = require('fs');
const puppeteer = require('puppeteer')

// https://plainenglish.io/blog/async-await-foreach


const createCsvWriter = require('csv-writer').createArrayCsvWriter;

const csvWriter = createCsvWriter({
  path: 'result2.csv',
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

const inputFileArray = parseInputData('input-second-step.csv');
const inputArray = inputFileArray;

async function parse(inputArr) {
  log("parse")
  log("inputArr", inputArr)

  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: [
      // '--start-fullscreen',
      '-start-maximized',
      // '--incognito',
      '--no-sandbox',
    ],
  })


  log.start(`done [%s] of ${inputArr.length}: OK - [%s]`);

  for (let index = 0; index < inputArr.length; index++) {
    const element = inputArr[index];
    if (element.length === 1) { continue }
    const url = element[element.length - 2];


    const page = await browser.newPage()

    log(url);

    try {

      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() == 'font' || req.resourceType() == 'image') {
          req.abort();
        } else {req.continue();}
      });

      await page.goto(url, {
        waitUntil: "load",
        timeout: 4500
      })

      const headlessPage = await page.evaluate(() => {
        return document.querySelector("html").innerHTML
      })

      let lineResult = [];
      keyWordsToCheck.forEach((keyword, index) => {
        const foundKeywordsNumber = countKeywords(headlessPage, keyword)
        lineResult[index] = foundKeywordsNumber
      })

      let sinleLineResult = element;
      sinleLineResult.push(...lineResult)
      
      log.info("res - OK:", url)

      await csvWriter.writeRecords([sinleLineResult])
      await page.close()
      log.step(1, 1)
      continue


    } catch (error) {
      // log.error(error)
      log.warn("can't get")

      let sinleLineResult = element;
      sinleLineResult.push(`can't get`)

      await csvWriter.writeRecords([sinleLineResult])

      await page.close()
      log.step(1, 0)

      continue
    } 
    // log.debug("headlessPage", headlessPage)
    return "peppeter result"


  }

  await browser.close()
}

parse(inputArray)


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
        || link.includes("/#") === true
      ) {
        return false
      };

      return true;
    });
    result.push(...findedUrls)
  };

  return Array.from(new Set(result))
}


function filterUniqeUrls(array) {
  let output = [];
  array[0].push(1)
  output.push(array[0]);


  for (let index = 1; index < array.length; index++) {
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
  let inputArr = fs.readFileSync(file).toString().split("\n");

  inputArr = inputArr.map(function (line) {
    const currentStr = delBr(line).split(',');
    return currentStr;
  })
  return inputArr
}


function delBrLink(s) { return s.replace(/\s{1,}/g, '') };
function delBr(s) { return s.replace(/\s{2,}/g, ' ') };

