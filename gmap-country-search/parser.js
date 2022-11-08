const { exit } = require('process');
const log = require('cllc')();
const axios = require('axios');
const puppeteer = require('puppeteer');
const places = require('./countries');
const fs = require('fs');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'URLs.csv',
  header: ['URL']
});

const parseResultWriter = createCsvWriter({
  path: 'full-result.csv',
  header: [
    { id: 'name', title: 'name' },
    { id: 'activity', title: 'activity' },
    { id: 'address', title: 'address' },
    { id: 'phone', title: 'phone' },
    { id: 'site', title: 'site' },
  ]
});


const arguments = process.argv.slice(2)
if (arguments.length == 0 || arguments.length > 3) {
  log.e('arguments empty or has a wrong format');
  exit();
}
if (!places.countriesList.hasOwnProperty(arguments[1].toUpperCase())) {
  log.e('you have entered nonexistent country shortname');
  exit();
}

const scrollCardsAmount = arguments[2] || 40;

// масив запитів для перебору
const queriesArray = places.makeQueriesArray(arguments)
log(queriesArray)

let parsedPlacesLinks = []
let currentIteratorStep = 0;



startParse()



async function startParse(placesArray) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 600 });

  await page.goto("https://www.google.com.ua/maps/?hl=en");
  await page.waitForSelector('input#searchboxinput', { timeout: 5000 })

  for (const currentQuery of queriesArray) {
    try {
      await handleSingleQuery(page, currentQuery, placesArray);
    } catch (error) {
      log.error(`throuble on ${currentQuery},\n`, error)
    }
    log.warn(currentQuery)
  }
  log.debug('done all scrolling');
  await browser.close();

  parseLinks(placesLinksIterator(parsedPlacesLinks))
  log.start(`lines total: ${parsedPlacesLinks.length}\nlines done [%s]`, 1);

}



async function handleSingleQuery(page, item) {
  // handle keyboard input
  await page.focus('input#searchboxinput');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('input#searchboxinput', item);
  await page.keyboard.press('Enter');

  await page.waitForSelector('.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd', { timeout: 60000 }).then(async () => {

    try {
      await autoScroll(page);
    } catch (error) {
      log.error('scroll error \n', error)
    }

    if (await page.$(".lcr4fd.S9kvJb") !== null) {
      log.warn('has shortcards')

      const cardsData = await page.evaluate(() => {

        let cardsArray = []
        document.querySelectorAll('.Nv2PK.THOPZb').forEach(function (elem) {
          const output = {}

          output.name = elem.ariaLabel

          let activity = elem.querySelector(".Z8fK3b .W4Efsd .W4Efsd:nth-child(2) span:first-child jsl span:nth-child(2)")
          if (activity !== null) {
            output.activity = activity.textContent.replace(/,/g, ".")
          } else {
            output.activity = "null"
          }

          let company_address = elem.querySelector(".Z8fK3b .W4Efsd .W4Efsd:nth-child(2) span:nth-child(2) jsl span:nth-child(2)")
          if (company_address !== null) {
            output.address = company_address.textContent.replace(/,/g, ".")
          } else {
            output.address = "null"
          }

          let phone = elem.querySelector(".Z8fK3b .W4Efsd .W4Efsd:nth-child(3) span:nth-child(2) jsl span:nth-child(2)")
          if (phone !== null) {
            output.phone = phone.textContent.replace(/,/g, ".")
          } else {
            output.phone = "null"
          }

          let site_link = elem.querySelector(".Rwjeuc a")
          if (site_link !== null) {
            output.site = site_link.href
          } else {
            output.site = "null"
          }

          cardsArray.push(output)
        })

        return cardsArray

      });

      await parseResultWriter.writeRecords(cardsData)

    }
    else {
      log.warn('standart flow');

      const URIs = await page.evaluate(() => {
        const links = document.querySelectorAll(".hfpxzc");
        let linksURIs = [];

        links.forEach((el) => {
          linksURIs.push({ "URL": el.href });
        });
        return linksURIs;
      });

      URIs.forEach(el => {
        parsedPlacesLinks.push(el["URL"]);
      })

      await csvWriter.writeRecords(URIs)
    };



    log.i("done single")
  }).catch(e => {
    log('FAIL');
    log.error(`fail on ${item} query,\n`, e)
  });

}



async function autoScroll(page) {
  let endOfListSelector = await page.$('.PbZDve');

  if (!!endOfListSelector) {
    log('end selector')
    return true;
  }

  let placesCards = await page.$$('.hfpxzc');

  if (placesCards.length > scrollCardsAmount) {
    log('too much places cards')
    return true;
  }

  // log.warn(placesCards.length)

  new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const scrollElem = document.querySelectorAll('.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd')[1];
    scrollElem.scrollTop = scrollElem.scrollTop - 300;
  })

  await page.waitForNetworkIdle();

  await page.evaluate(() => {
    document.querySelectorAll('.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd')[1].scrollTop = 100000
  })

  await page.waitForNetworkIdle();

  await autoScroll(page)
}



function placesLinksIterator(array) {
  if (currentIteratorStep === array.length) {
    log.warn('process finished succesfully');
    return false;
  }

  ++currentIteratorStep

  log.step(1);
  return array[currentIteratorStep - 1]
}

async function parseLinks(url) {
  if (url === false) {
    log.info('exit');
    exit();
  }

  await axios(url)
    .then(async response => {
      log(response.status)

      let currentResult = [handleResponseData(response.data)];

      await parseResultWriter.writeRecords(currentResult)
      // log.info(currentResult)
      log.debug('current line written')
    })
    .catch(error => {
      log.error(error)
    });


  await parseLinks(placesLinksIterator(parsedPlacesLinks))
}

function handleResponseData(data) {
  const currentLine = {}


  const infoStrEnd = data.indexOf('itemprop="name">');
  const infoStrStart = data.lastIndexOf('<meta content=', infoStrEnd);
  let infoStr = data.slice(infoStrStart + 15, infoStrEnd - 2);

  if (infoStr.indexOf(" · ") > 0) {
    infoStr = infoStr.split(' · ');
    currentLine.name = infoStr[0].replace(',', '');
    currentLine.address = infoStr[1].replace(',', '');
  } else {
    currentLine.name = infoStr.replace(',', '');
    currentLine.address = "null";
  }



  const activityStrEnd = data.indexOf('itemprop="description">');
  const activityStrStart = data.lastIndexOf('<meta content=', activityStrEnd)

  if (activityStrEnd !== -1) {
    let activity = data.slice(activityStrStart + 15, activityStrEnd - 2);
    if (activity.indexOf(' · ') > 0) {
      activity = activity.slice(8)
    }

    currentLine.activity = activity.replace(',', '');
  } else {
    currentLine.activity = 'null';
  }


  const phoneStrStart = data.indexOf('tel:')
  const phoneStrEnd = data.indexOf('",', phoneStrStart);
  if (phoneStrStart !== -1) {
    currentLine.phone = data.slice(phoneStrStart + 4, phoneStrEnd - 1);
  } else {
    currentLine.phone = 'null';
  }


  const httpRegexG = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;

  let linksArray = data.match(httpRegexG);

  let result = linksArray.filter(link => {
    if (link.indexOf("google") === -1 && link.indexOf("gstatic") === -1 && link.indexOf("ggpht") === -1 && link.indexOf("schema") === -1 && link.indexOf("broofa") === -1) {
      return true
    } else {
      return false
    }
  });
  result = new Set(result);

  if (result.size === 0) {
    currentLine.site = 'null';
  } else {
    currentLine.site = Array.from(result)[0];
  }

  return currentLine
}