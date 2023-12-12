const fs = require('fs');
const log = require('cllc')();
const puppeteer = require('puppeteer')


var wstream = fs.createWriteStream('myOutput.csv');

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const csvStringifier = createCsvStringifier({
    header: [
        // {id: 'line_number', title: 'line_number'},
        {id: 'query_string', title: 'query_string'},
        {id: 'company_name', title: 'company_name'},
        {id: 'address', title: 'address'},
        {id: 'phone', title: 'phone'},
        {id: 'site', title: 'site'},
        {id: 'activity', title: 'activity'},
        // {id: 'altSite', title: 'altSite'},
    ]
  });

wstream.write(csvStringifier.getHeaderString());



async function openSearchPage() {
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: [
      // '--start-fullscreen',
      '-start-maximized',
      '--incognito',
      '--no-sandbox',
    ],
  })

  try {
    log('Початок роботи');


    const page = await browser.newPage()
    
    page.setViewport({
      width: 1360,
      height: 760,
    })


    await page.goto('https://www.google.com.ua')


    const searchNames = parseInputArray('src.csv');
    
    
    log.warn(`кількість запитів: ${searchNames.length}`);
    let counter = 1;

    for (const item of searchNames) {
      log(`запит: ${counter}`)

      await page.$eval('textarea', el => el.value = '');

      await page.type('textarea', item); // Types slower, like a user , {delay: 189}
      await page.keyboard.press('Enter');
      await page.waitForNavigation({
        waitUntil: ['networkidle2', 'domcontentloaded'],
        timeout: 60000
      });

      try {
        const card = await page.waitForSelector('.TQc1id.IVvPP.Jb0Zif.yqK6Z', { timeout: 1000 })
        // await clickByText(`Сайт`);
        log.info("card finded ______________")
  
        let name = await page.evaluate(() => {
          let link = document.querySelector('h2.qrShPb.pXs6bb span')
  
          return (link != null ? link.innerText : "no info")
        });
  
        let site = await page.evaluate(() => {
          let link = document.querySelector('.zhZ3gf a.mI8Pwc')
  
          return link.href
        })
        
  
        let address = await page.evaluate(() => {
          let link = document.querySelector('.Z1hOCe .LrzXr')
  
          return (link != null ? link.innerText : "no info")
        });
  
        let phone = await page.evaluate(() => {
          let link = document.querySelector('.LrzXr.zdqRlf.kno-fv')
  
          return (link != null ? link.innerText : "no info")
        });

        let activity = await page.evaluate(() => {
          let link = document.querySelector('.TpnEn .YhemCb')
  
          return (link != null ? link.innerText : "no info")
        });
  
  
        log.warn(site, address, phone)
  
        if (site === undefined) {site = ''}
        if (address === undefined) {address = ''}
        if (phone === undefined) {phone = ''}
        if (name === undefined) {name = ''}

        let currentString = [{
          'line_number': counter,
          company_name: delBr(name),
          address: delBr(address),
          phone: delBr(phone),
          site: delBr(site),
          activity: delBr(activity),
          // altSite: '',
          query_string: item
        }]
  
        wstream.write(csvStringifier.stringifyRecords(currentString));
  
  
      } catch (error) {
        log.trace(`no card finded`)
        log.error(error)
  
        let altSite = await page.evaluate((item) => {
          let links = document.querySelectorAll('.yuRUbf>a')
  
          for (let index = 0; index < links.length; index++) {
              // console.log('item inside: ', item)
            if (links[index].host.replace("www.", "").indexOf(item.toLowerCase().slice(0, 3)) !== -1) {
              return altSite = links[index].href
            } else {
              return altSite = ''
            }
          }
        }, item);
  
        if (!!altSite) {
          log.debug('altSite: ', altSite)
        }

        let currentString = [{
          'line_number': counter,
          company_name: '',
          address: '',
          phone: '',
          site: altSite,
          // altSite,
          query_string: item
        }]
  
        wstream.write(csvStringifier.stringifyRecords(currentString));
      }

      log(`кінець запиту ${counter}: ${item}`)
      counter++

    }

    log.finish('all done')
    await browser.close()


  } catch (error) {
    log.error('can`t open new page')
    log.error(error)
  }



}

function parseInputArray(file) {
  let file_input_array = fs.readFileSync(file).toString().split("\r\n");
  let preaperedLinks = file_input_array.map((el) => {
    // additional changes can be done here
    return el
  })
  return preaperedLinks
}

function delBr (s) {return s.replace (/\s{2,}/g, ' ')};




openSearchPage();


