const axios = require('axios');
const log = require('cllc')();
const fs = require('fs');
const puppeteer = require('puppeteer')

// https://plainenglish.io/blog/async-await-foreach


const createCsvWriter = require('csv-writer').createArrayCsvWriter;

(async function() {

  const csvWriter = createCsvWriter({
    path: 'result1.csv',
  });

  const csvWriterUnreacable = createCsvWriter({
    path: 'input-second-step.csv',
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
  await csvWriter.writeRecords([getKeyWordsList(inputFileArray)])

  // filter input array and remove duplicating sites
  const filteredUrlsArray = filterUniqeUrls(inputArray)
  log.info(filteredUrlsArray.length)

  async function iterate() {


    log.i(`Started process: ${filteredUrlsArray.length} URLS to handle`);
    log.start('lines done: [%s]\nurls is not available [%s]\nURLS total: [%s]', 0, 0, 0);
    
    // перебираємо підготовлений масив
    // for (const [i, elem] of filteredUrlsArray.entries()) {
    for await (const elem of filteredUrlsArray) {

      const rootUrl = elem[elem.length-2]

      log.info(rootUrl)

      axios.get(rootUrl, {
        timeout: 600000
      })
      .then(async function (response) {

        let lineTotal = []
        
        if (response && response.status < 200 && response.status > 300 && typeof response.data !== "string") {
          throw new Error({
            message: 'wrong response format',
            url: rootUrl
          });
        }
        
        log(response.status);

        const childLinks = getLinksFromRoot(response.data, rootUrl)
        if (childLinks.length === 0) {log.error('empty childLinks')};

        // ######################################
        // створюю масив для резьтатів по одному рядку і заповнюю його нулями
        keyWordsToCheck.forEach((k, index) => { lineTotal[index] = 0 })
        let childSuccesResponse = 0
        for (let index = 0; index < childLinks.length && index < 12; index++) {

          const currentChildURL = childLinks[index];

          await axios.get(currentChildURL, {
            timeout: 300000
          })
            .then(function (response) {
              const childPage = response.data;
              
              keyWordsToCheck.forEach((keyword, index) => {
                const foundKeywordsNumber = countKeywords(childPage, keyword)
                lineTotal[index] += foundKeywordsNumber
              })
              childSuccesResponse++
            })
            .catch(function (error) {
              log.error("child req error", error.code);
              return
            })
        }
        log.debug(`childLinks: ${childLinks.length}\nget info from ${childSuccesResponse}`)

        // ######################################

        let sinleLineResult = elem;
        const keywordsCountRes = lineTotal
        sinleLineResult.push(...keywordsCountRes)
        // log.info("res", sinleLineResult)

        await csvWriter.writeRecords([sinleLineResult])
        log.step(1, 0, 1);
      })
      .catch(async function (error) {
        log.error("error block");
        // log.error(error);
        await csvWriterUnreacable.writeRecords([elem])
        log.step(0, 1, 1);
      })

    }
  }

  iterate()


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

    log("root", root)

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


})()