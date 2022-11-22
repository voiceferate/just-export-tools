const axios = require('axios');
const log = require('cllc')();
const fs = require('fs');



(async () => {
  try {
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


    // підготовка даних для перебору
    try {
      handleFirstRowForOutputArray()
      while (inputFileParsed.length > 0) {
        checkUrlExistanceInArray(inputFileParsed, resultArray)
      }
    } catch (error) {
      log.error("виникла помилка при розборі даних для аналізу\n", error)
    }

    log.d("resultArray", resultArray)

    async function getRootUrl(array) {


      for (let index = 0; index < array.length; index++) {
        const el = array[index]
        const rootURL = el[el.length - 2];
        const urlsList = await getLinksFromRoot(rootURL)



        if (urlsList.length > 0) {
          for (let index = 0; index < urlsList.length && index < 15; index++) {
            
            log.d("urlsList", urlsList[index])

            // робити це через йобані регулярки
            // let regex = /франція/gi
            // str.match(regex)

          }
        }




        log.info(urlsList)
      }



      log.warn("ALL DONE")

    }

    try {
      await getRootUrl(resultArray)

    } catch (error) {
      log.error(error);
    }

    async function getLinksFromRoot(url) {
      try {
        const res = await axios.get(url);
        
        const httpRegexG = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;
        
        const domainRegex = /https?:\/\/(?:www\.)?([-a-zA-Z0-9@:%._\+~#=]{1,256})\./
        const domain = url.match(domainRegex)[1];
        
        let linksArray = res.data.match(httpRegexG);

        let result = linksArray.filter(link => {
          if ( 
            link.charAt(link.length-1) !== '/' 
            ||!link.includes(domain) 
          ) {return false};

          return true;
        });
        
        return Array.from(new Set(result))

      } catch (error) {
        log.warn(`cant get ${url}`)
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
      const newEl = inputFileParsed[0]
      newEl.push(1)
      resultArray.push(newEl)
      inputFileParsed.splice(0, 1)
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
  } catch (e) {
    log.error(e);
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