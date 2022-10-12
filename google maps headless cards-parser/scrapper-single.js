const log = require('cllc')();
const puppeteer = require('puppeteer');
const fs = require('fs');

var wstream = fs.createWriteStream('parse_result.csv');

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const csvStringifier = createCsvStringifier({
    header: [
        {id: 'name', title: 'name'},
        {id: 'activity', title: 'activity'},
        {id: 'address', title: 'address'},
        {id: 'phone', title: 'phone'},
        {id: 'siteUrl', title: 'siteUrl'},
    ]
  });

wstream.write(csvStringifier.getHeaderString());
log.start('%s lines done \n%s results grabed .', 0, 0);


function parseInputArray(file) {
  let file_input_array = fs.readFileSync(file).toString().split("\r\n");
  let preaperedLinks = [];
  file_input_array.forEach((item) => {
    if (item === "") {return}
    preaperedLinks.push(item)
  })
  return preaperedLinks
}


const queryArray = parseInputArray('src.txt');

let queryArrayLength = queryArray.length;
let currentCicle = 0;
parseSingle(queryArray[0], queryArray)



async function parseSingle(query, array) {

  if (currentCicle === queryArrayLength) {
    log.debug('whole document nandled succesfully');
    return
  }
  
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 600 });

  try {
    // query string
    await page.goto(query);
    await page.waitForSelector('.Nv2PK.THOPZb.CpccDe', { timeout: 60000 })


    await autoScroll(page);
    log.warn('scroll ended')

    const placesElemsArray = await page.$$('.hfpxzc');

    if (placesElemsArray && placesElemsArray.length) {
      for (const place of placesElemsArray) {
        log.trace('step');
        try {
          await handlePlaceClick(place, page)
        } catch (error) {
          log.error(error)
        }
      }
    }
  } catch (error) {
    log.e(`can't open new page`)
  }
  
  await page.close();
  await browser.close();

  log.debug('single query nandled succesfully');
  currentCicle++;
  log.step(1, 0);

  parseSingle(array[currentCicle], array);
};

async function autoScroll(page){
    let endOfListSelector =  await page.$('.PbZDve');
    
    if (!!endOfListSelector) {
      log('end selector')
      return true;
    }

    let placesCards =  await page.$$('.hfpxzc');

    if (placesCards.length > 99) {
      log('too much places cards')
      return true;
    }

    log.warn(placesCards.length)

    async function clickPlaceCard(cardsArray) {
      cardsArray[cardsArray.length - 1].click()
    }


    // let lastPalceItemCard = await page.$$('.Nv2PK.THOPZb.CpccDe')
    // await lastPalceItemCard[lastPalceItemCard.length - 1].hover()
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

async function handlePlaceClick(placeEl, page) {
  placeEl.click();
  log.info('clicked');

  await page.waitForNetworkIdle();
  await page.waitForSelector('.bJzME.Hu9e2e.tTVLSc')
  await new Promise(r => setTimeout(r, 1200));

  log.warn(await parsePlaceInfo(page))

  await page.click('.VfPpkd-icon-Jh9lGc');
  await page.waitForNetworkIdle();
  await new Promise(r => setTimeout(r, 800));
}

async function parsePlaceInfo(page) {
  let name = await page.evaluate(() => {
    let element = document.querySelectorAll('.lMbq3e .DUwDvf span');
    if(element && element.length) {
      return (element[0].innerText)
    } else {
      return ('place name parce error')
    };
  });

  let activity = await page.evaluate(() => {
    let element = document.querySelectorAll('button[jsaction="pane.rating.category"]');
    if(element && element.length) {
      return (element[0].innerText)
    } else {
      return ('place activity parce error')
    };
  });

  let address = await page.evaluate(() => {
    let element = document.querySelectorAll('[data-item-id="address"] .rogA2c .Io6YTe');
    if(element && element.length) {
      return (element[0].innerText)
    };
  });

  let phone = await page.evaluate(() => {
    let element = document.querySelectorAll('[data-item-id^="phone:tel"]');
    if(element && element.length) {
      return (element[0].innerText.replace(/\s/g, ''))
    };
  });

  let siteUrl = await page.evaluate(() => {
    let element = document.querySelectorAll('a[data-item-id="authority"]');
    if(element && element.length) {
      return (element[0].href)
    };
  });

  let currentString = [{
    name: name.replace(/,/g, ''),
    activity,
    address,
    phone,
    siteUrl
  }]

  wstream.write(csvStringifier.stringifyRecords(currentString));
  log.step(0, 1);

  return {
    name,
    activity,
    address,
    phone,
    siteUrl
  }

}
