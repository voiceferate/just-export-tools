const axios = require('axios');
const log = require('cllc')();
const fs = require('fs');

const createCsvWriter = require('csv-writer').createArrayCsvWriter;


(async () => {
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

  const inputFileParsed = parseInputData('src.csv')
  let resultArray = []

  let headerValuesArray = []

  headerValuesArray.push(...inputFileParsed[0])
  headerValuesArray.push("popularity")
  headerValuesArray.push(...keyWordsToCheck)

  const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: headerValuesArray
  });


  // підготовка даних для перебору
  try {
    handleFirstRowForOutputArray()

    while (inputFileParsed.length > 0) {
      checkUrlExistanceInArray(inputFileParsed, resultArray)
    }
  } catch (error) {
    log.error("виникла помилка при розборі даних для аналізу\n", error)
  }


  try {
    await handleKeywordsCount(resultArray)

  } catch (error) {
    // log.error(error);
  }

  async function handleKeywordsCount(array) {

    log.info(array)

    //перебір головного масиву з даними
    for (let index = 1; index < array.length; index++) {
      let el = array[index]
      const rootURL = el[el.length - 2];

      let currentLineKeywordsResult = [];
      keyWordsToCheck.forEach((keyword, index) => {
        currentLineKeywordsResult[index] = 0
      })

      log.d('first request', rootURL)
      const urlsList = await getLinksFromRoot(rootURL)

      if (urlsList.length > 0) {

        try {
          // перебір кожного із знайдених лінків
          for (let index = 0; index < urlsList.length && index < 10; index++) {
            const url = urlsList[index]
            const res = await axios.get(url);

            log.d('second request', url)

            if (res.status < 200 && res.staus > 300 || typeof res.data !== "string") {
              log.error("bad response");
              log.debug('request to', rootURL)
            } else {
              // перебираємо кожне з клюлчових слів
              try {
                keyWordsToCheck.forEach((keyword, index) => {

                  const foundKeywordsNumber = countKeywords(res.data, keyword)
                  currentLineKeywordsResult[index] += foundKeywordsNumber

                })
              } catch (error) {
                log.error("keyword error")
              }

            }
          }
        } catch (error) {
          log.d("single url error")
        }


        currentLineKeywordsResult.forEach(elem => {
          el.push(elem)
        })
        log.info(`result for ${rootURL}`, currentLineKeywordsResult)

        await csvWriter.writeRecords([el])

      } else {
        el.push('url is not awaliable')
        log.warn("url is not awaliable", urlsList)
        
        await csvWriter.writeRecords([el])
      }

      // log.info("output", array)
    }



    log.warn("ALL DONE")

  }

  // return numbers array
  function countKeywords(reqText, keyword) {
    const regex = new RegExp(keyword, 'g');
    if (reqText.match(regex) !== null) {
      return reqText.match(regex).length
    } else {
      return 0
    }
  }


  async function getLinksFromRoot(url) {
    try {
      const res = await axios.get(url);

      log.debug(res.status)
      log.debug(res.data)

      const httpRegexG = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;

      const domainRegex = /https?:\/\/(?:www\.)?([-a-zA-Z0-9@:%._\+~#=]{1,256})\./
      const domain = url.match(domainRegex)[1];

      let linksArray = res.data.match(httpRegexG);

      let result = linksArray.filter(link => {
        if (
          link.charAt(link.length - 1) !== '/'
          || !link.includes(domain)
        ) { return false };

        return true;
      });

      result.push(url)

      return Array.from(new Set(result))

    } catch (error) {
      log.warn(`cant get ${url}`)
      log.error(error)
      return []
    }
  }


  function checkUrlExistanceInArray(inputArr, outputArr) {

    const currentRowIndex = inputArr.length - 1
    const currentRowArray = inputArr[currentRowIndex];
    let findMach = false

    outputArr.forEach((element) => {

      const innerURL = currentRowArray[currentRowArray.length - 1]
      const outerURL = element[element.length - 2]

      if (innerURL === outerURL) {
        element[element.length - 1]++
        inputArr.splice(currentRowIndex, 1)
        findMach = true
      }
    });

    if (!findMach) {
      let newUrlEl = currentRowArray
      newUrlEl.push(1)
      outputArr.push(newUrlEl)
      inputArr.splice(currentRowIndex, 1)
    }
  }

  function handleFirstRowForOutputArray() {
    let newEl = []
    newEl.length = inputFileParsed[1].length
    newEl.splice(inputFileParsed[1].length, 0, "popularity", ...keyWordsToCheck)

    // newEl.push(1)
    resultArray.push(newEl)
    log.warn("first line", resultArray[0])
    // inputFileParsed.splice(0, 1)
  }

  function parseInputData(file) {
    let inputArray = fs.readFileSync(file).toString().split("\r\n");

    inputArray = inputArray.map(function (line) {
      const currentStr = delBr(line).split(',');

      const regex = /(http.*:\/\/[\w\._-]+)/g;
      let urlEl = currentStr[currentStr.length - 1];
      const matches = urlEl.matchAll(regex);
      for (const match of matches) {
        currentStr[currentStr.length - 1] = match[0] + "/";
      }

      return currentStr;
    })
    return inputArray
  }

})();















// try {




// const createCsvWriter = require('csv-writer').createArrayCsvWriter;

// let dataStructure = [
//   "company_name",
//   "activity",
//   "address",
//   "phone",
//   "site_url",
// ]


// log.d('Output structure',dataStructure.concat(keyWordsToCheck))
// const csvWriter = createCsvWriter({
//   path: 'data.csv',
//   header: dataStructure.concat(keyWordsToCheck)
// });



// const file_input_array = fs.readFileSync('src.csv').toString().split("\r\n");
// log.i(`Started process: ${file_input_array.length} strings to handle`)


// let parsedArray = [];



// log.start('lines done: [%s]\nurls is not available [%s]', 0, 0);


// // file_input_array.forEach(function (currentValue, index, array) {
// //   let mainIndex = index;

// //   // currentValue = currentValue.replace(/\n\r/g, '');
// //   let currentStr = delBr(currentValue).split(',');

// //   parsedArray.push(currentStr);

// //   // you can set a column with the site's URL number. count from 0. i.e. seventh column = 4
// //   let url = currentStr[currentStr.length-1];

// //   if (url !== undefined) {
// //     if(url.endsWith("/")) {
// //       url = url.slice(0, -1)
// //     }
// //     url = url.replace ("http:", 'https:')
// //   } 


// //     axios(url, {
// //       timeout: 100000,
// //       maxRedirects: 10,
// //       // httpsAgent: new https.Agent({ keepAlive: true }),
// //     })
// //       .then(response => {
// //         const html = response.data.toLowerCase();

// //         keyWordsToCheck.forEach((element,index) => {
// //           parsedArray[mainIndex].push(chekKeyWord(element, html, 0).toString())
// //         });


// //         let result = extractEmails(html);
// //         parsedArray[mainIndex].push(Array.from(result).join(' : '))
// //       })
// //       .then(()=>{
// //         showProgress(parsedArray)
// //       })
// //       .catch(error => {
// //         // log.e(new Error(error))
// //         let susses = false;

// //         // #####################################################
// //         url = url.replace ("https:", 'http:')

// //         axios(url, {
// //           timeout: 60000,
// //           maxRedirects: 10,
// //           // httpsAgent: new https.Agent({ keepAlive: true }),
// //         })
// //           .then(response => {
// //             const html = response.data.toLowerCase();

// //             keyWordsToCheck.forEach((element,index) => {
// //               parsedArray[mainIndex].push(chekKeyWord(element, html, 0).toString())
// //             });


// //             let result = extractEmails(html);
// //             parsedArray[mainIndex].push(Array.from(result).join(' : '))
// //             susses = true
// //           })

// //           .catch(error => {

// //           });

// //           if(susses) {
// //             showProgress(parsedArray);
// //           } else {
// //             log.step(0, 1);
// //           }

// //           showProgress(parsedArray)
// //       });


// //   });



// function chekKeyWord(word, string, counter) {

//   if (string.indexOf(word) === -1) {
//     return counter;
//   } else {
//     counter++
//     return chekKeyWord(word, string.substring(string.indexOf(word)+1), counter)
//   }
// }

// function extractEmails (input_text)
// {
//     let arr = input_text.match(/([a-zA-Z0-9._-]+@[a-zA-Z._-]+\.[a-zA-Z._-]+)/gi);
//     return new Set(arr);
// }

// let progressCounter = 0
// function showProgress(arr) {
//   progressCounter++;
//   // console.log(`Done ${progressCounter} of ${arr.length}`)
//   log.step(1, 0);

//   if (arr.length === progressCounter) {
//     log.i("Process finished successfully")

//     csvWriter
//       .writeRecords(arr)
//       .then(() => log.d('The CSV file was written successfully'));
//   }
// }



// } catch (error) {
//   log.error('big error')
// }


function delBrLink(s) { return s.replace(/\s{1,}/g, '') };
function delBr(s) { return s.replace(/\s{2,}/g, ' ') };