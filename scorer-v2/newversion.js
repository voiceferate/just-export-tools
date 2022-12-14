const axios = require('axios');
const log = require('cllc')();
const fs = require('fs');
const puppeteer = require('puppeteer')

// https://plainenglish.io/blog/async-await-foreach


const createCsvWriter = require('csv-writer').createArrayCsvWriter;

(async function() {

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
  await csvWriter.writeRecords([getKeyWordsList(inputFileArray)])

  // filter input array and remove duplicating sites
  const filteredUrlsArray = filterUniqeUrls(inputArray)

  async function iterate() {

    const unreachebleURLS = [];
    
    // перебираємо підготовлений масив
    for (const elem of filteredUrlsArray) {

      const rootUrl = elem[elem.length-2]

      axios.get(rootUrl, {
        timeout: 60000
      })
      .then(async function (response) {

        let lineTotal = []
        
        if (response && response.status < 200 && response.status > 300 && typeof response.data !== "string") {
          throw new Error({
            message: 'wrong response format',
            url: rootUrl
          });
        }
        
        console.log(response.status);

        const childLinks = getLinksFromRoot(response.data, rootUrl)
        if (childLinks.length === 0) {log.error('empty childLinks')};

        log.d(childLinks.length)
        // ######################################
        // створюю масив для резьтатів по одному рядку і заповнюю його нулями
        keyWordsToCheck.forEach((k, index) => { lineTotal[index] = 0 })

        for (let index = 0; index < childLinks.length && index < 10; index++) {

          const currentChildURL = childLinks[index];

          await axios.get(currentChildURL, {
            timeout: 30000
          })
            .then(function (response) {
              const childPage = response.data;
              
              keyWordsToCheck.forEach((keyword, index) => {
                const foundKeywordsNumber = countKeywords(childPage, keyword)
                lineTotal[index] += foundKeywordsNumber
              })
              
            })
            .catch(function (error) {
              log.error("child req error", error.code);
              return
            })
        }
        // ######################################

        let sinleLineResult = elem;
        const keywordsCountRes = lineTotal
        sinleLineResult.push(...keywordsCountRes)
        log.info("res", sinleLineResult)

        await csvWriter.writeRecords([sinleLineResult])
      })
      .catch(async function (error) {
        log.error("error block");
        unreachebleURLS.push(rootUrl)
      })

    }
  }

  const links = await iterate()

  // log.warn("unreachebleURLS",links)







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

  async function openHeadlessPage(url) {
    const browser = await puppeteer.launch({
      headless: true,
      // ignoreHTTPSErrors: true,
      args: [
        // '--start-fullscreen',
        '-start-maximized',
        '--incognito',
        '--no-sandbox',
      ],
    })

    try {
      const page = await browser.newPage()
      
      page.setViewport({
        width: 1360,
        height: 760,
      })

      await page.goto(url)
      await page.waitForSelector("body", { timeout: 6000 })

      const headlessPage = await page.evaluate(() => {
        // log.warn("innerHTML", document.querySelector("html").innerHTML)
        return document.querySelector("html").innerHTML
      })
      await browser.close()

      // log.debug("headlessPage", headlessPage)
      return "peppeter result"
    }
    catch(error) {
      log.error("peppeter navigation error")
      await browser.close()
      return "peppeter empty result"
    }
  }

  function delBrLink(s) { return s.replace(/\s{1,}/g, '') };
  function delBr(s) { return s.replace(/\s{2,}/g, ' ') };


})()