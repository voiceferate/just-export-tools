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


const arguments = process.argv.slice(2)
if (arguments.length == 0 || arguments.length !== 2) {
  log.e('arguments empty or has a wrong format');
  exit();
}
if (!places.countriesList.hasOwnProperty(arguments[1].toUpperCase())) {
  log.e('you have entered nonexistent country shortname');
  exit();
}

// масив запитів для перебору
const queriesArray = places.makeQueriesArray(arguments)
log(queriesArray)




async function startParse() {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 600 });
  
  await page.goto("https://www.google.com.ua/maps/?hl=en");
  await page.waitForSelector('input#searchboxinput', { timeout: 5000 })

  for (const currentQuery of queriesArray) {
    await handleSingleQuery(page, currentQuery);
    log.warn(currentQuery)
  }
  log.debug('done all');
}



async function handleSingleQuery (page, item) {
  // handle keyboard input
  await page.focus('input#searchboxinput');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('input#searchboxinput', item); 
  await page.keyboard.press('Enter');

  await page.waitForSelector('.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd', { timeout: 60000 })

  await autoScroll(page);

  const URIs = await page.evaluate(() => {
    const links = document.querySelectorAll(".hfpxzc");
    let linksURIs = []
    links.forEach((el) => {
      // console.log(el.href)
      linksURIs.push({"URL": el.href})
    });
    return linksURIs;
  });
  await csvWriter.writeRecords(URIs)
  log.i("done single")
}

async function autoScroll(page){
  let endOfListSelector =  await page.$('.PbZDve');
  
  if (!!endOfListSelector) {
    log('end selector')
    return true;
  }

  let placesCards =  await page.$$('.hfpxzc');

  if (placesCards.length > 25) {
    log('too much places cards')
    return true;
  }

  log.warn(placesCards.length)

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

// startParse()



// якась магія би зібрати лінки
let gmapsPlacesLinksArray = [
  'https://www.google.com.ua/maps/place/Sushi+Szajnochy+11/data=!4m7!3m6!1s0x470fc274ec9720d3:0xd09f86027380af2f!8m2!3d51.1085171!4d17.0287554!16s%2Fg%2F1tl1glxr!19sChIJ0yCX7"HTCD0cRL6-AcwKGn9A?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/WSHOKU+Sushi+Ramen.+Bar/data=!4m7!3m6!1s0x470fe9df90d57331:0x918d17a4a84bca6!8m2!3d51.1128905!4d17.0318727!16s%2Fg%2F1tmxd8mz!19sChIJMXPVkN_pD0cRpryESnrRGAk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Krzyki+Wroc%C5%82aw+-+Szajnochy+O%C5%82taszyn/data=!4m7!3m6!1s0x470fc359ede19c3d:0x3496b6663ecfb40f!8m2!3d51.0583912!4d17.0161703!16s%2Fg%2F11mw0l3f8b!19sChIJPZzh7VnDD0cRD7TPPma2ljQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/ESENCJA+SUSHI+%26+ORIENT/data=!4m7!3m6!1s0x470f95b27fe7c7e7:0xe9693de6c56ff17f!8m2!3d51.1454127!4d16.8695878!16s%2Fg%2F11c455zg6r!19sChIJ58fnf7KVD0cRf_FvxeY9aek?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Restaurant+Maiko+Wroc%C5%82aw/data=!4m7!3m6!1s0x470fe8f4cad55db3:0xd2105784cf5e2303!8m2!3d51.1307709!4d17.0443382!16s%2Fg%2F11dynxnr2z!19sChIJs13VyvToD0cRAyNez4RXENI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Izumi+Sushi/data=!4m7!3m6!1s0x470fc26f563629bb:0xb24a4f5a63662ad!8m2!3d51.0959345!4d17.034199!16s%2Fg%2F11f_bzzqcj!19sChIJuyk2Vm_CD0cRrWI2pvWkJAs?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Hoshi-Sushi/data=!4m7!3m6!1s0x470fc20107822bad:0xeb311dfbf90a32ac!8m2!3d51.1132604!4d17.0015671!16s%2Fg%2F1hf3tc"htm!19sChIJrSuCBwHCD0cRrDIK-fsdMes?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Kushi+Psie+Pole/data=!4m7!3m6!1s0x470fe88b2cd2ddcd:0x5684a1d9d9c9159c!8m2!3d51.1460115!4d17.1131004!16s%2Fg%2F11cs0r9yg6!19sChIJzd3SLIvoD0cRnBXJ2dmhhFY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/I+Love+Sushi+Wroc%C5%82aw+-+Stro%C5%84ska/data=!4m7!3m6!1s0x470fc2f8fddbb59d:0x813f321ebe5aa90d!8m2!3d51.0749859!4d17.0404411!16s%2Fg%2F1vd7015c!19sChIJnbXb_fjCD0cRDalavh4yP4E?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Corner+W%C5%82odkowica/data=!4m7!3m6!1s0x470fc20b6f98018f:0x12ed39cb399d88ae!8m2!3d51.108567!4d17.023512!16s%2Fg%2F1pp2tsbpq!19sChIJjwGYbwvCD0cRroidOcs57RI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Noriko+Sushi+Bar/data=!4m7!3m6!1s0x470fc3a6a1c97b4f:0x20a59e6338f2954!8m2!3d51.1070193!4d17.0277858!16s%2Fg%2F11h6g5cy8j!19sChIJT3vJoabDD0cRVCmPM-ZZCgI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Spot/data=!4m7!3m6!1s0x470feb121ac9bdab:0x4b7d13d477ff7c27!8m2!3d51.1247803!4d16.9877353!16s%2Fg%2F11h0vt1mtw!19sChIJq73JGhLrD0cRJ3z_d9QTfUs?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi:Sushi+Cafe/data=!4m7!3m6!1s0x470fe913a9061e41:0x562c6abd98608727!8m2!3d51.1183565!4d17.021652!16s%2Fg%2F11rhszckgr!19sChIJQR4GqRPpD0cRJ4dgmL1qLFY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SushiTU/data=!4m7!3m6!1s0x470feb24ebd9ec89:0x8e2e948e6f58f885!8m2!3d51.1377105!4d16.9290613!16s%2Fg%2F11k7yg7zxn!19sChIJiezZ6yTrD0cRhfhYb46ULo4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sebu+Sushi/data=!4m7!3m6!1s0x470fe915947deeff:0xe24018c081e4ff8b!8m2!3d51.1321981!4d17.0457283!16s%2Fg%2F11ktvw6nv1!19sChIJ_-59lBXpD0cRi__kgcAYQOI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Wasabi+Sushi/data=!4m7!3m6!1s0x470fc1ee17e9e47d:0x78c557401388bb1a!8m2!3d51.1071934!4d16.9466579!16s%2Fg%2F11h6nlbdd5!19sChIJfeTpF-7BD0cRGruIE0BXxXg?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Koi+Sushi+Bar/data=!4m7!3m6!1s0x470fc3bb2d6c3c01:0xb3fd0d1034361911!8m2!3d51.0583029!4d17.0117098!16s%2Fg%2F12lky5spm!19sChIJATxsLbvDD0cRERk2NBAN_bM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Lovers/data=!4m7!3m6!1s0x470fc3aeded15b6d:0x2394350ef2d8f1ad!8m2!3d51.0867726!4d17.0540259!16s%2Fg%2F11j3xbzznk!19sChIJbVvR3q7DD0cRrfHY8g41lCM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Lovers/data=!4m7!3m6!1s0x470fc1be9d8cf7bb:0x2b7af6bf191100a9!8m2!3d51.1047692!4d16.9444401!16s%2Fg%2F11q310xdp9!19sChIJu_eMnb7BD0cRqQARGb_2eis?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Yemsetu+Sushi+Bar/data=!4m7!3m6!1s0x470fe9bbade0d7f5:0x5a25f4479ab2c099!8m2!3d51.1375499!4d17.0557906!16s%2Fg%2F11c3k97140!19sChIJ9dfgrbvpD0cRmcCymkf0JVo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/CuFu+Sushi+%26+Europe+food/data=!4m7!3m6!1s0x470fc1c97b9a42ed:0x4272ed760592564e!8m2!3d51.1157202!4d16.9589563!16s%2Fg%2F11rjkbv690!19sChIJ7UKae8nBD0cRTlaSBXbtckI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Suszarnia+Wroc%C5%82aw+HUBSKA/data=!4m7!3m6!1s0x470fc3d0c0a0d375:0xad2537663c23d881!8m2!3d51.090426!4d17.044906!16s%2Fg%2F11s5dv_mt7!19sChIJddOgwNDDD0cRgdgjPGY3Ja0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/I+Love+Sushi+-+Grabiszy%C5%84ska/data=!4m7!3m6!1s0x470fc21f17ccb25b:0x4575b3dccc5c5fb2!8m2!3d51.095942!4d16.9871427!16s%2Fg%2F1hc0xl8vy!19sChIJW7LMFx_CD0cRsl9czNyzdUU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/AMMO+SUSHI%26WOK/data=!4m7!3m6!1s0x470fc30c3b4f58e7:0x56c9c218b5982a27!8m2!3d51.0727815!4d16.994661!16s%2Fg%2F11s8b94l2k!19sChIJ51hPOwzDD0cRJyqYtRjCyVY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/American+Sushi+Express/data=!4m7!3m6!1s0x470fe95f78acfa79:0x30bb008d148c30d7!8m2!3d51.1348067!4d17.0383174!16s%2Fg%2F11s94mwt_m!19sChIJefqseF_pD0cR1zCMFI0AuzA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Ohh!+Sushi%26Grill/data=!4m7!3m6!1s0x470fc1fd7b31e599:0x3acc01f4e89670cc!8m2!3d51.1200246!4d16.9913122!16s%2Fg%2F11bxfrlc81!19sChIJmeUxe_3BD0cRzHCW6PQBzDo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/KOI+Sushi+Bar+II/data=!4m7!3m6!1s0x470fe81ee73c0bbb:0xb170c2a7ab93b354!8m2!3d51.1066755!4d17.0928822!16s%2Fg%2F11clsgb8g6!19sChIJuws85x7oD0cRVLOTq6fCcLE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Takai/data=!4m7!3m6!1s0x470fc2752c18ff3f:0xb4a29580033a10a5!8m2!3d51.0991978!4d17.0453016!16s%2Fg%2F12qf5gknk!19sChIJP_8YLHXCD0cRpRA6A4CVorQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/7+Samuraj%C3%B3w+-+Ryc"htalska+-+Restauracja+Japo%C5%84ska/data=!4m7!3m6!1s0x470fe93167f2fae5:0x3cb21789bfd4832!8m2!3d51.1298599!4d17.04603!16s%2Fg%2F11hk0_vc7y!19sChIJ5fryZzHpD0cRMkj9m3ghywM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Kofuku+sushi/data=!4m7!3m6!1s0x470fc1315c921e3d:0x27d3de9dfa428bf3!8m2!3d51.0873603!4d16.9134631!16s%2Fg%2F11ptw1_bzw!19sChIJPR6SXDHBD0cR84tC-p3e0yc?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Garden+Fusion+Restaurant/data=!4m7!3m6!1s0x47031391abe1b94f:0xd0da9e34542b294f!8m2!3d53.1187449!4d18.0204249!16s%2Fg%2F12qgx0222!19sChIJT7nhq5ETA0cRTykrVDSe2tA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Dom+Sushi/data=!4m7!3m6!1s0x4703351d7e8e5119:0x3414df04659bd989!8m2!3d53.0117163!4d18.603337!16s%2Fg%2F1wb8sdft!19sChIJGVGOfh01A0cRidmbZQTfFDQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Tako+Sushi/data=!4m7!3m6!1s0x470313ba10b7ab23:0x1024b912398f0506!8m2!3d53.1322326!4d18.0195446!16s%2Fg%2F11j6y6fp5y!19sChIJI6u3ELoTA0cRBgWPORK5JBA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Art+Sushi+by+Kurkuma/data=!4m7!3m6!1s0x470313bea5c293e5:0xf6685ee3ac51932!8m2!3d53.1240431!4d18.003531!16s%2Fg%2F1tfmm26h!19sChIJ5ZPCpb4TA0cRMhnFOu6FZg8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/AJA+SUSHI/data=!4m7!3m6!1s0x4703358ef261073d:0x82736b84ef2a1824!8m2!3d53.0438033!4d18.579562!16s%2Fg%2F11r_n6by0v!19sChIJPQdh8o41A0cRJBgq74Rrc4I?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Edo+sushi/data=!4m7!3m6!1s0x4703513c1df33915:0xf300b58bd31a31dc!8m2!3d52.8010416!4d18.2536117!16s%2Fg%2F11n090vpwq!19sChIJFTnz"HTxRA0cR3DEa04u1APM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/OAZA+Sushi/data=!4m7!3m6!1s0x471ccb4180e66953:0x339063bfc3b70b6!8m2!3d53.0244699!4d18.7735416!16s%2Fg%2F11ptmdq_7r!19sChIJU2nmgEHLHEcRtnA7_DsGOQM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/YAKUZA+SUSHI+BAR+%C5%9AWIECIE/data=!4m7!3m6!1s0x4702dfcb9113ad53:0x5f2042f6ed33a64!8m2!3d53.4068267!4d18.4310413!16s%2Fg%2F11kxhqx8lf!19sChIJU60TkcvfAkcRZDrTbi8E8gU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Garden+Fusion+Restaurant/data=!4m7!3m6!1s0x4703126a02a5b2bd:0x94ef676a1ba66dd0!8m2!3d53.1325758!4d17.9475527!16s%2Fg%2F11fxy5rz5m!19sChIJvbKlAmoSA0cR0G2mG2pn75Q?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SUSHI+Odwa%C5%BCny+Japo%C5%84czyk/data=!4m7!3m6!1s0x47036be2505c9039:0x547f71b1bac310e6!8m2!3d53.0295156!4d18.0171523!16s%2Fg%2F11rhdy0hrl!19sChIJOZBcUOJrA0cR5hDDurFxf1Q?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/OTO+SUSHI/data=!4m7!3m6!1s0x470313945bf356d3:0x91cafabd95afa6fa!8m2!3d53.1246518!4d18.017882!16s%2Fg%2F1thfd3sv!19sChIJ01bzW5QTA0cR-qavlb36ypE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Kushi/data=!4m7!3m6!1s0x470334e21f4ded83:0x5543c1091a8d05d7!8m2!3d53.012459!4d18.608089!16s%2Fg%2F11c2qt29_g!19sChIJg-1NH-I0A0cR1wWNGgnBQ1U?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Oshi+Sushi+Fusion+Restaurant/data=!4m7!3m6!1s0x47030d879b1e3977:0x95d7734866fcf1ad!8m2!3d53.126721!4d17.8819889!16s%2Fg%2F11q8svqymr!19sChIJdzkem4cNA0cRrfH8Zkhz15U?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NoBo+Sushi/data=!4m7!3m6!1s0x47031392758147f5:0x6140583470b7637f!8m2!3d53.1218725!4d18.0261801!16s%2Fg%2F11b76mcmxq!19sChIJ9UeBdZITA0cRf2O3cDRYQGE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SUSHI+Projekt/data=!4m7!3m6!1s0x471ccbb6c658526b:0x5662d1d2c16c8c80!8m2!3d53.0244614!4d18.773546!16s%2Fg%2F11r3ljnm44!19sChIJa1JYxrbLHEcRgIxswdLRYlY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NOVA+SUSHI/data=!4m7!3m6!1s0x47031328b1d468ab:0x88a3994867f4012a!8m2!3d53.1097938!4d18.0293285!16s%2Fg%2F11pdx_8zlj!19sChIJq2jUsSgTA0cRKgH0Z0iZo4g?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Poke+Go/data=!4m7!3m6!1s0x471ccbedd3f67f61:0xc3113c32a4dca4ed!8m2!3d53.0270384!4d18.6741424!16s%2Fg%2F11fky_ssv0!19sChIJYX_20-3LHEcR7aTcpDI8EcM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SAYURI+SUSHI/data=!4m7!3m6!1s0x4702cf4358bc5629:0x495a0c306dc66072!8m2!3d53.4900544!4d18.7523798!16s%2Fg%2F11fhqrv1vy!19sChIJKVa8WEPPAkcRcmDGbTAMWkk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Shark+Sushi/data=!4m7!3m6!1s0x470335d9e2578231:0xad2572d640bd2b5!8m2!3d53.0121102!4d18.6078062!16s%2Fg%2F11ryhg4s5d!19sChIJMYJX4tk1A0cRtdILZC1X0go?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Yoko+Sushi/data=!4m7!3m6!1s0x4703171e61c0426f:0x12d3e145df16bf69!8m2!3d53.1538216!4d18.1302589!16s%2Fg%2F11j0tlsx1w!19sChIJb0LAYR4XA0cRab8W30Xh0xI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Yasaka+Sushi/data=!4m7!3m6!1s0x471c993e1dc1d513:0xc3e594a23a40a80!8m2!3d52.6556694!4d19.0674187!16s%2Fg%2F11hhfg1l_n!19sChIJE9XB"HT6ZHEcRgAqkI0pZPgw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Poke+Go/data=!4m7!3m6!1s0x470313ca918b6785:0xd26fef13f8dd79fc!8m2!3d53.1067912!4d18.0236619!16s%2Fg%2F11rq2pr522!19sChIJhWeLkcoTA0cR_Hnd-BPvb9I?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Sushi+Kama+Kuchnia+Domowa+%26+Pizza/data=!4m7!3m6!1s0x47036b9154712af9:0xd4235cc6df55595d!8m2!3d52.9865291!4d18.0771306!16s%2Fg%2F11jpd7dzh8!19sChIJ-SpxVJFrA0cRXVlV38ZcI9Q?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Nova+Sushi/data=!4m7!3m6!1s0x471c9911d39302e5:0x91eb06c9ad4a7bca!8m2!3d52.649297!4d19.0704739!16s%2Fg%2F11m1l56fpz!19sChIJ5QKT0xGZHEcRyntKrckG65E?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Kami/data=!4m7!3m6!1s0x470313bb1c395555:0x7ca27233b28f0b1a!8m2!3d53.1212069!4d17.996481!16s%2Fg%2F11j4l289rq!19sChIJVVU5HLsTA0cRGguPsjNyonw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Poke+Go/data=!4m7!3m6!1s0x470317f5b9a0df95:0x99d5db5812ba525a!8m2!3d53.1565929!4d18.1492631!16s%2Fg%2F11qppt0525!19sChIJld-gufUXA0cRWlK6Eljb1Zk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+%22+%C5%81apcie+Maki+%22/data=!4m7!3m6!1s0x4702cf72ceaa866f:0xb4b2f1bc2c16ee35!8m2!3d53.4836797!4d18.7518604!16s%2Fg%2F11nxc49rx3!19sChIJb4aqznLPAkcRNe4WLLzxsrQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/BE+SUSHI/data=!4m7!3m6!1s0x470313e28b20209f:0xbca054d18c1c0e0d!8m2!3d53.1246518!4d18.017882!16s%2Fg%2F11q9m8ngf4!19sChIJnyAgi-ITA0cRDQ4cjNFUoLw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Street+-+Sushi+Toru%C5%84/data=!4m7!3m6!1s0x470335b5408917fd:0x472be75bce3fe149!8m2!3d53.0158116!4d18.5616479!16s%2Fg%2F11jl2wsffj!19sChIJ_ReJQLU1A0cRSeE_zlvnK0c?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Dla+Mnie+Toru%C5%84+Plaza/data=!4m7!3m6!1s0x470335fbab19efb5:0x9e305c638c25674f!8m2!3d53.0151226!4d18.5615325!16s%2Fg%2F11sw__d2jj!19sChIJte8Zq_s1A0cRT2cljGNcMJ4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Kaminari+Sushi/data=!4m7!3m6!1s0x471bcad57187146d:0xebff6758ac484ab3!8m2!3d51.7672406!4d19.4562061!16s%2Fg%2F11fz9k1cqv!19sChIJbRSHcdXKG0cRs0pIrFhn_-s?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Ato+Sushi/data=!4m7!3m6!1s0x471bcad5b0d7502b:0xadff25f6fe3e1568!8m2!3d51.7687788!4d19.4561184!16s%2Fg%2F1tfjv0gn!19sChIJK1DXsNXKG0cRaBU-_vYl_60?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/House+of+Sushi/data=!4m7!3m6!1s0x471bcad567b3b4e1:0xbbb25f3de12a1cc0!8m2!3d51.7661388!4d19.456118!16s%2Fg%2F1tnbjx09!19sChIJ4bSzZ9XKG0cRwBwq4T1fsrs?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Tabu+Sushi/data=!4m7!3m6!1s0x471a35b637e7c6fd:0x3077e89a6123bb4!8m2!3d51.7600584!4d19.461844!16s%2Fg%2F11hzkf0rxf!19sChIJ_cbnN7Y1GkcRtDsSpol-BwM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sendai+sushi+%26+ramen/data=!4m7!3m6!1s0x471a34d095f8f18d:0x14ae38925ac22c1b!8m2!3d51.762866!4d19.4852235!16s%2Fg%2F11b86g5y_f!19sChIJjfH4ldA0GkcRGyzCWpI4rhQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Koku+Sushi/data=!4m7!3m6!1s0x471a35d61567f937:0x2aca63764d7613e5!8m2!3d51.7628253!4d19.4575447!16s%2Fg%2F11gmf3jgg9!19sChIJN_lnFdY1GkcR5RN2TXZjyio?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SUSHI+W+D%C5%81O%C5%83+%C5%9AR%C3%93DMIE%C5%9ACIE/data=!4m7!3m6!1s0x471bcad51bc8d039:0x51a8414dbeef1e62!8m2!3d51.766975!4d19.454413!16s%2Fg%2F11c0tb5_fl!19sChIJOdDIG9XKG0cRYh7vvk1BqFE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+%C5%81%C3%B3d%C5%BA+-+Sushi+World/data=!4m7!3m6!1s0x471bcbd663e229dd:0xe722ca67d1a84792!8m2!3d51.793264!4d19.434702!16s%2Fg%2F11ppd9fnh2!19sChIJ3SniY9bLG0cRkkeo0WfKIuc?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/HOT+SUSHI%26WOK/data=!4m7!3m6!1s0x471a35ea941d3259:0x321cb1d8e7b8f055!8m2!3d51.7536339!4d19.4816632!16s%2Fg%2F11jfm1y50d!19sChIJWTIdlOo1GkcRVfC459ixHDI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Wasabi+Sushi+To+Go+GALERIA+%C5%81%C3%93DZKA/data=!4m7!3m6!1s0x471a34d24a72b1ad:0x554d0b8363b879e5!8m2!3d51.7591129!4d19.464528!16s%2Fg%2F11f_f3qz59!19sChIJrbFyStI0GkcR5Xm4Y4MLTVU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Zielony+Chrzan/data=!4m7!3m6!1s0x471a3435a7c28639:0x14906b911da21f00!8m2!3d51.755553!4d19.4573444!16s%2Fg%2F1tfdc6cr!19sChIJOYbCpzU0GkcRAB-iHZFrkBQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Smaki/data=!4m7!3m6!1s0x471bcd698ba92425:0xa95017ced12e39eb!8m2!3d51.7594664!4d19.4554067!16s%2Fg%2F11f61d_ps3!19sChIJJSSpi2nNG0cR6zku0c4XUKk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Fame+Sushi/data=!4m7!3m6!1s0x471bcbc2014d142f:0x164d926d20e2b566!8m2!3d51.819158!4d19.4351401!16s%2Fg%2F11rb9kdq7_!19sChIJLxRNAcLLG0cRZrXiIG2STRY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/totoro/data=!4m7!3m6!1s0x471bcbf8fd697ea1:0xfac88a12ac1d7405!8m2!3d51.8032861!4d19.421827!16s%2Fg%2F11lltmybwz!19sChIJoX5p_fjLG0cRBXQdrBKKyPo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Hana+Sushi/data=!4m7!3m6!1s0x471bcac5efbf6013:0x9250a599ee2d2484!8m2!3d51.7795453!4d19.4475424!16s%2Fg%2F1td79xk7!19sChIJE2C_78XKG0cRhCQt7pmlUJI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SUSHI+W+D%C5%81O%C5%83+G%C3%93RNA/data=!4m7!3m6!1s0x471a3506693157db:0x190d381f781be8c9!8m2!3d51.7367483!4d19.4780922!16s%2Fg%2F11pyffhqc0!19sChIJ21cxaQY1GkcRyegbeB84DRk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Wasabi+Sushi+To+Go/data=!4m7!3m6!1s0x471a35cb95fc29b3:0x244e57b16d084bb2!8m2!3d51.7498249!4d19.4409901!16s%2Fg%2F11fl7q5ndz!19sChIJsyn8lcs1GkcRsksIbbFXTiQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/%C5%81%C3%B3dzkie+Sushi/data=!4m7!3m6!1s0x471a35378f6f5a67:0x5d3cf28d73d3e645!8m2!3d51.7354575!4d19.4800989!16s%2Fg%2F11s1t182vp!19sChIJZ1pvjzc1GkcRRebTc43yPF0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Has"htag+Sushi+D%C4%85browa%2FWidzew/data=!4m7!3m6!1s0x471a35452755243b:0x117d58e1dbc91eb1!8m2!3d51.737401!4d19.493939!16s%2Fg%2F11fm_746y2!19sChIJOyRVJ0U1GkcRsR7J2-FYfRE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Has"htag+Sushi+Centrum%2FBa%C5%82uty/data=!4m7!3m6!1s0x471a35b2dada6513:0x5946a9472438b7eb!8m2!3d51.7634379!4d19.4573315!16s%2Fg%2F11h48yn0cx!19sChIJE2Xa2rI1GkcR67c4JEepRlk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Bukowiecki+Sushi+Widzew/data=!4m7!3m6!1s0x471bccb187282c7b:0x7a5c41507acefe32!8m2!3d51.7572028!4d19.537194!16s%2Fg%2F11c806xyly!19sChIJeywoh7HMG0cRMv7OelBBXHo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Hona+Sushi+Ba%C5%82uty/data=!4m7!3m6!1s0x471bcb02da199927:0xea30de1a7aecb40f!8m2!3d51.7914962!4d19.4492603!16s%2Fg%2F11pv5bgr0m!19sChIJJ5kZ2gLLG0cRD7TsehreMOo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/O!+SUSHI/data=!4m7!3m6!1s0x471a3570dc622a77:0x1a29a2dc018e332a!8m2!3d51.7647887!4d19.5072703!16s%2Fg%2F11sgd2hptb!19sChIJdypi3HA1GkcRKjOOAdyiKRo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Has"htag+Sushi+Polesie%2FTeofil%C3%B3w/data=!4m7!3m6!1s0x471a354e9bd437a9:0x6f24aade571a436e!8m2!3d51.7445108!4d19.3888399!16s%2Fg%2F11qp2s7n"ht!19sChIJqTfUm041GkcRbkMaV96qJG8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SushiNori/data=!4m7!3m6!1s0x471bca9c5ba69361:0x494528b7a32b02f2!8m2!3d51.8007015!4d19.4208727!16s%2Fg%2F11g6wcn7jd!19sChIJYZOmW5zKG0cR8gIro7coRUk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Tanoshii+Sushi+and+Ramen/data=!4m7!3m6!1s0x471a356064a6eaa1:0xb9c5416b3f90df1e!8m2!3d51.7518215!4d19.4528149!16s%2Fg%2F11smgtmslq!19sChIJoeqmZGA1GkcR"Ht-QP2tBxbk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Gorilla+Sushi+%26+Ramen/data=!4m7!3m6!1s0x471bcd0185bef6ef:0xef21dce2bb35c313!8m2!3d51.7570914!4d19.5375609!16s%2Fg%2F11px31csxt!19sChIJ7_a-hQHNG0cRE8M1u-LcIe8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Bukowiecki+Sushi+Radogoszcz/data=!4m7!3m6!1s0x471a34baa09b04c3:0x9b27061d8a243f51!8m2!3d51.8240875!4d19.4386825!16s%2Fg%2F11dfm88h6q!19sChIJwwSboLo0GkcRUT8kih0GJ5s?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Kushi+Retkinia/data=!4m7!3m6!1s0x471a356813fcc4e1:0x7f62802c32b6b50e!8m2!3d51.7520072!4d19.3984219!16s%2Fg%2F11bytn4jnd!19sChIJ4cT8E2g1GkcRDrW2MiyAYn8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Art+2.0+-+Zgierska+211/data=!4m7!3m6!1s0x471bcb2433ccfcc5:0xb240cbe44ea4c403!8m2!3d51.8178145!4d19.4347658!16s%2Fg%2F11p04qpl0m!19sChIJxfzMMyTLG0cRA8SkTuTLQLI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Takushi+Ramen+%26+Sushi/data=!4m7!3m6!1s0x4722576689a801d7:0x251a02bea4c9ed1a!8m2!3d51.2366301!4d22.5281587!16s%2Fg%2F1tfv3x1v!19sChIJ1wGoiWZXIkcRGu3JpL4CGiU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Go+Sushi+Lublin/data=!4m7!3m6!1s0x472257aa11783fef:0xafbaefaf74396457!8m2!3d51.2364375!4d22.5687105!16s%2Fg%2F11skm1jm0d!19sChIJ7z94EapXIkcRV2Q5dK_vuq8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Kobi+Sushi/data=!4m7!3m6!1s0x4722576902c6d4ff:0x8514de898feaa15f!8m2!3d51.246772!4d22.559949!16s%2Fg%2F1q5bmpxhp!19sChIJ_9TGAmlXIkcRX6Hqj4neFIU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Sushi+-+Takami+Sushi+%26+Thai+w+Lublinie/data=!4m7!3m6!1s0x4722576f5230d71d:0x9fcb73ff3931c12d!8m2!3d51.2451741!4d22.5558074!16s%2Fg%2F1yfh_hyrx!19sChIJHdcwUm9XIkcRLcExOf9zy58?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Haiku+Sushi/data=!4m7!3m6!1s0x4722571272948de5:0x5ab3c58057aa3bcf!8m2!3d51.2340464!4d22.5703216!16s%2Fg%2F11fp1sygck!19sChIJ5Y2UchJXIkcRzzuqV4DFs1o?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/MusiSushi/data=!4m7!3m6!1s0x4722575db488bec1:0x85a29767ab94acbc!8m2!3d51.2536295!4d22.5553152!16s%2Fg%2F1pp2vj0bm!19sChIJwb6ItF1XIkcRvKyUq2eXooU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Yuka/data=!4m7!3m6!1s0x472257eefbec17bd:0xfde77c6be2d77d2d!8m2!3d51.2465343!4d22.5598263!16s%2Fg%2F11sqj3mx4x!19sChIJvRfs--5XIkcRLX3X4mt85_0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Panda+Sushi+Lublin/data=!4m7!3m6!1s0x4722594ec742c91d:0x30de9f6b3e84da78!8m2!3d51.2660828!4d22.5195533!16s%2Fg%2F11h5n59k94!19sChIJHclCx05ZIkcReNqEPmuf3jA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Matsu+Sushi+Matsu+Wok/data=!4m7!3m6!1s0x4722575275e9a645:0xc62a85b852a568e4!8m2!3d51.2665851!4d22.5704472!16s%2Fg%2F1tctqf4r!19sChIJRabpdVJXIkcR5GilUriFKsY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NOTO+Sushi+Lublin/data=!4m7!3m6!1s0x472257389334bb4d:0x2e4c7581f9d4fab7!8m2!3d51.2464295!4d22.5437937!16s%2Fg%2F11mvgxl02w!19sChIJTbs0kzhXIkcRt_rU-YF1TC4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/MUSI+SUSHI+RestoBar/data=!4m7!3m6!1s0x472259774ed2d375:0x6ff8bda0b1e07644!8m2!3d51.2293698!4d22.4839923!16s%2Fg%2F11sfdjc6qz!19sChIJddPSTndZIkcRRHbgsaC9-G8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/2Pier+Sushi+House/data=!4m7!3m6!1s0x4722579c2613a1d1:0x45ba630325bda8b!8m2!3d51.2474408!4d22.5495679!16s%2Fg%2F11llyhbj78!19sChIJ0aETJpxXIkcRi9pbMjCmWwQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/DajTo+Sushi+Kuchnia+Japo%C5%84ska/data=!4m7!3m6!1s0x47225760dbbfdbe3:0x9ce04f04e3e6e892!8m2!3d51.2488113!4d22.5649406!16s%2Fg%2F11j8lgwxgn!19sChIJ49u_22BXIkcRkujm4wRP4Jw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Masami+Sushi/data=!4m7!3m6!1s0x4722572daf955d73:0x57e62faf672695ab!8m2!3d51.244603!4d22.5580075!16s%2Fg%2F11rvg54zx3!19sChIJc12Vry1XIkcRq5UmZ68v5lc?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Warsztat/data=!4m7!3m6!1s0x472257c4c9c96879:0xa3ae2566e97541ec!8m2!3d51.2477479!4d22.5640429!16s%2Fg%2F11fn95m4vy!19sChIJeWjJycRXIkcR7EF16WYlrqM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Kago+Sushi+Lublin/data=!4m7!3m6!1s0x472257cbb4814449:0x5d2c19452d96e5b0!8m2!3d51.2475564!4d22.5678148!16s%2Fg%2F11t9mw3j58!19sChIJSUSBtMtXIkcRsOWWLUUZLF0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Nova+Sushi/data=!4m7!3m6!1s0x47225bc794af3423:0xf2e38484e594670c!8m2!3d51.2750573!4d22.54715!16s%2Fg%2F11qn10nmym!19sChIJIzSvlMdbIkcRDGeU5YSE4_I?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Nova+Sushi/data=!4m7!3m6!1s0x472257e36f00a843:0x97b05f93f1753c04!8m2!3d51.22672!4d22.554491!16s%2Fg%2F11fntb6dww!19sChIJQ6gAb-NXIkcRBDx18ZNfsJc?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/1/data=!4m7!3m6!1s0x472259058f13dae3:0xb9a78864eece476a!8m2!3d51.225415!4d22.4797854!16s%2Fg%2F11llx2_ckz!19sChIJ49oTjwVZIkcRakfO7mSIp7k?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Ichiban+Sushi/data=!4m7!3m6!1s0x472256e577395415:0x8c8892f2fb0e083d!8m2!3d51.231931!4d22.6140687!16s%2Fg%2F11bbtmtpm9!19sChIJFVQ5d-VWIkcRPQgO-_KSiIw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/B%C5%8Dru+Ramen+Shop/data=!4m7!3m6!1s0x472257ab3572519b:0xd126018922598090!8m2!3d51.2470614!4d22.5597566!16s%2Fg%2F11h27cfcm_!19sChIJm1FyNatXIkcRkIBZIokBJtE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Taigon+Asian+Cuisine/data=!4m7!3m6!1s0x472257ac4285b003:0x1566b6c3e2be0f99!8m2!3d51.2450255!4d22.5504022!16s%2Fg%2F11h_f7rx_z!19sChIJA7CFQqxXIkcRmQ--4sO2ZhU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+2PIER/data=!4m7!3m6!1s0x4722576698516a1d:0xae4dab70cae393f9!8m2!3d51.2472903!4d22.5495623!16s%2Fg%2F11fylmy_1z!19sChIJHWpRmGZXIkcR-ZPjynCrTa4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sport+Pub/data=!4m7!3m6!1s0x47225783fbfa9db3:0x1c58369b45fdacc7!8m2!3d51.2377079!4d22.5502767!16s%2Fg%2F11j79g24r7!19sChIJs536-4NXIkcRx6z9RZs2WBw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/MOJO+Kuchnia+%26+Przyjaciele/data=!4m7!3m6!1s0x47225765a26248a5:0x1f464799d9c8c158!8m2!3d51.2464708!4d22.5439379!16s%2Fg%2F11qn9x39_r!19sChIJpUhiomVXIkcRWMHI2ZlHRh8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Azja+na+Ostro/data=!4m7!3m6!1s0x472257a38c7fb117:0xb5553e1e48b293b6!8m2!3d51.247976!4d22.5625382!16s%2Fg%2F11mv4z1w75!19sChIJF7F_jKNXIkcRtpOySB4-VbU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Bar+Chi%C5%84czyk/data=!4m7!3m6!1s0x4722593fbdb81aab:0x41320d9d0937978a!8m2!3d51.2465485!4d22.5352169!16s%2Fg%2F11fd4bbrcs!19sChIJqxq4vT9ZIkcRipc3CZ0NMkE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Megobari/data=!4m7!3m6!1s0x4722577fac84ca23:0xadfdb24de71d5318!8m2!3d51.2483307!4d22.564743!16s%2Fg%2F11h8gxy00n!19sChIJI8qErH9XIkcRGFMd502y_a0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Torii+Sushi+Lubart%C3%B3w/data=!4m7!3m6!1s0x472247da1a9cbca9:0x6a07252a8f4ab6f5!8m2!3d51.462782!4d22.6110205!16s%2Fg%2F11t9b06nq7!19sChIJqbycGtpHIkcR9bZKjyolB2o?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Lucky+Cat/data=!4m7!3m6!1s0x472257d5d52e7793:0x7086c2d022a62286!8m2!3d51.2494265!4d22.5693131!16s%2Fg%2F11qnbr2sbf!19sChIJk3cu1dVXIkcRhiKmItDChnA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Miyagi+Sushi+Gubin/data=!4m7!3m6!1s0x4707cf35f80c69f1:0x52fdfd60365756e9!8m2!3d51.949981!4d14.72466!16s%2Fg%2F11s2nc99xb!19sChIJ8WkM-DXPB0cR6VZXNmD9_VI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Masami+Sushi/data=!4m7!3m6!1s0x47066793ca7d4089:0x7b1cfde36e730a8f!8m2!3d52.2347626!4d15.5339623!16s%2Fg%2F11fhwxqf7p!19sChIJiUB9ypNnBkcRjwpzbuP9HHs?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/YOI+SUSHI+%26+RAMEN+Gorz%C3%B3w+Wielkopolski/data=!4m7!3m6!1s0x4707202d7487e6a3:0xff9f9582f618dddc!8m2!3d52.7317845!4d15.2411558!16s%2Fg%2F11b8c07ts8!19sChIJo-aHdC0gB0cR3N0Y9oKVn_8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NO+TO+SUSHI/data=!4m7!3m6!1s0x470613cb51231c07:0xa9a0dfb7e651bc8c!8m2!3d51.9425471!4d15.5077225!16s%2Fg%2F11n2ym065f!19sChIJBxwjUcsTBkcRjLxR5rffoKk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/GO-SUSHI+atelier/data=!4m7!3m6!1s0x470613de478673dd:0xbefcba85da703ddd!8m2!3d51.9373196!4d15.5041469!16s%2Fg%2F11b7bz3ylq!19sChIJ3XOGR94TBkcR3T1w2oW6_L4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Akai+House/data=!4m7!3m6!1s0x470613c9fde20c75:0x7d4ad2899a4e3e51!8m2!3d51.9418635!4d15.4792551!16s%2Fg%2F11nrprpjjm!19sChIJdQzi_ckTBkcRUT5OmonSSn0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+World+Mi%C4%99dzyrzecz/data=!4m7!3m6!1s0x4706f5a1724d01ff:0x899190adff8c0248!8m2!3d52.445201!4d15.574833!16s%2Fg%2F11tc2ljcf0!19sChIJ_wFNcqH1BkcRSAKM_62QkYk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+World+Zielona+G%C3%B3ra/data=!4m7!3m6!1s0x470611ec69d80275:0x840dad0af0282fc7!8m2!3d51.8974579!4d15.5200241!16s%2Fg%2F11smgm2cz6!19sChIJdQLYaewRBkcRxy8o8AqtDYQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Go/data=!4m7!3m6!1s0x470721d2fa3b8ce5:0xbf81534816088e6c!8m2!3d52.762917!4d15.242376!16s%2Fg%2F11c5949g2y!19sChIJ5Yw7-tIhB0cRbI4IFk"hTgb8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NOVA+Sushi+Zielona+G%C3%B3ra/data=!4m7!3m6!1s0x47061344593547fd:0xe048ff6eccf19b2e!8m2!3d51.9524004!4d15.490583!16s%2Fg%2F11t22ndd00!19sChIJ_Uc1WUQTBkcRLpvxzG7_SOA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/BOSS+SUSHI/data=!4m7!3m6!1s0x4706110f7c288ea7:0x24a425e9ec939a04!8m2!3d51.9289908!4d15.4968787!16s%2Fg%2F11p_0_fzzb!19sChIJp44ofA8RBkcRBJqT7OklpCQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/HEROSIMA+SUSHI+BAR/data=!4m7!3m6!1s0x470613e8fa701061:0x3be66b9b84c85ec2!8m2!3d51.9380333!4d15.5038747!16s%2Fg%2F11q9hs8cp_!19sChIJYRBw-ugTBkcRwl7IhJtr5js?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/My+Sushi/data=!4m7!3m6!1s0x4706135801ae929f:0x534a010e72bd2fe!8m2!3d51.9391575!4d15.5037053!16s%2Fg%2F11mqwk7mgr!19sChIJn5KuAVgTBkcR_tIr5xCgNAU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Madara+Restauracja+Japo%C5%84ska/data=!4m7!3m6!1s0x47071f95dc5b6d75:0xad6f52f3592cec20!8m2!3d52.7479253!4d15.2562995!16s%2Fg%2F11f3xwz612!19sChIJdW1b3JUfB0cRIOwsWfNSb60?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Miyagi+Sushi/data=!4m7!3m6!1s0x47061348c9406cd5:0xa88df2ee983229e6!8m2!3d51.9437554!4d15.5067211!16s%2Fg%2F11f5nnh_b7!19sChIJ1WxAyUgTBkcR5ikymO7yjag?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi/data=!4m7!3m6!1s0x47071fbd90aae523:0x4a62845fbcd078b2!8m2!3d52.730526!4d15.241705!16s%2Fg%2F11ckr57d5p!19sChIJI-WqkL0fB0cRsnjQvF-EYko?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/TomYam/data=!4m7!3m6!1s0x470613901e9ac699:0xefd12ca96906231d!8m2!3d51.934773!4d15.5070466!16s%2Fg%2F11fsk25hbz!19sChIJmcaaHpATBkcRHSMGaaks0e8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NOTOSHUSHI/data=!4m7!3m6!1s0x470613d32a273d53:0xd2fd7b3181c89b58!8m2!3d51.9423872!4d15.5075775!16s%2Fg%2F11rffcrvm9!19sChIJUz0nKtMTBkcRWJvIgTF7_dI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Wasabi+Vegan+Sushi/data=!4m7!3m6!1s0x470613be96ebab1f:0xb36f1c5f5aa688e4!8m2!3d51.9437556!4d15.5067267!16s%2Fg%2F11pxj5j8j0!19sChIJH6vrlr4TBkcR5IimWl8cb7M?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Kim+Pirson+Sushi/data=!4m7!3m6!1s0x470611865d93b9e1:0xf4f59497fa08e697!8m2!3d51.934381!4d15.5294375!16s%2Fg%2F11r10vx7c5!19sChIJ4bmTXYYRBkcRl-YI-peU9fQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Bosko/data=!4m7!3m6!1s0x4707cd8bfc75785b:0x772d4c54fa3fd584!8m2!3d51.9527978!4d14.7288583!16s%2Fg%2F11hzg8ddfv!19sChIJW3h1_IvNB0cRhNU_-lRMLXc?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SUSHI+SATORI+CATERING/data=!4m7!3m6!1s0x47065df48994eae7:0xa2f5d9458e2ad2b!8m2!3d52.2599481!4d15.5218932!16s%2Fg%2F11q9hlxm27!19sChIJ5-qUifRdBkcRK63iWJRdLwo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/City+Sushi/data=!4m7!3m6!1s0x4707986be287c6cf:0x611efb60ccd9d3b9!8m2!3d52.346801!4d14.539787!16s%2Fg%2F11f3xjv2rk!19sChIJz8aH4muYB0cRudPZzGD7HmE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/KIM+PIRSON+SUSHI+KINGA+PIEKOS/data=!4m7!3m6!1s0x470613d75599d6ed:0xc1595f03952966ae!8m2!3d51.937151!4d15.5179269!16s%2Fg%2F11sy3crr9l!19sChIJ7daZVdcTBkcRrmYplQNfWcE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Gardenbistro+Sulech%C3%B3w/data=!4m7!3m6!1s0x47066d67a3679ced:0xefe55fdf885f04e9!8m2!3d52.0900729!4d15.6187605!16s%2Fg%2F11j81hmr84!19sChIJ7Zxno2dtBkcR6QRfiN9f5e8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/My+Thai/data=!4m7!3m6!1s0x470613d2d3d58c1f:0xf0c15f2a5fd74498!8m2!3d51.9391512!4d15.5043969!16s%2Fg%2F11jlhvmy6l!19sChIJH4zV09ITBkcRmETXXypfwfA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Laura/data=!4m7!3m6!1s0x47065768fabc92a3:0xf081efc33fb49623!8m2!3d52.334178!4d15.2972806!16s%2Fg%2F11clyzvb5f!19sChIJo5K8-mhXBkcRI5a0P8PvgfA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Bar+Azja/data=!4m7!3m6!1s0x4706ffe004d182f1:0xf93d9dd25fe2f3b1!8m2!3d52.4403105!4d15.1222676!16s%2Fg%2F11d_7rblnx!19sChIJ8YLRBOD_BkcRsfPiX9KdPfk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/meesushi+GmbH/data=!4m7!3m6!1s0x47079873dcd11fb5:0x10aab56bdbcba8bc!8m2!3d52.3443965!4d14.5532745!16s%2Fg%2F11g9dsvg3l!19sChIJtR_R3HOYB0cRvKjL22u1qhA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Ogr%C3%B3d+Smak%C3%B3w/data=!4m7!3m6!1s0x47065769a5f0f72f:0xa3e5c28b12b2bbcc!8m2!3d52.3334118!4d15.2955692!16s%2Fg%2F12q4s5fmh!19sChIJL_fwpWlXBkcRzLuyEovC5aM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Point+Sushi+Krak%C3%B3w/data=!4m7!3m6!1s0x47165ba7f24b4831:0xd46dc02663988c64!8m2!3d50.0915886!4d19.9881794!16s%2Fg%2F11ndw3d7sd!19sChIJMUhL8qdbFkcRZIyYYybAbdQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Nago+Sushi+%26+Sake/data=!4m7!3m6!1s0x47165b130f009b87:0x81d552ff844cfac5!8m2!3d50.0578323!4d19.9411889!16s%2Fg%2F11c2jvjmn1!19sChIJh5sADxNbFkcRxfpMhP9S1YE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Yana+Sushi+%26+Ramen/data=!4m7!3m6!1s0x47165b89d861d34d:0xa068192dcca5f75f!8m2!3d50.0455291!4d19.9557303!16s%2Fg%2F11g0mjddhf!19sChIJTdNh2IlbFkcRX_elzC0ZaKA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/URARA+SUSHI+%26+HOT+POT+%E5%A3%BD%E5%8F%B8%E5%B0%8F%E7%81%AB%E9%8D%8B/data=!4m7!3m6!1s0x47165b11d934aefd:0xecc85667dee31b1c!8m2!3d50.0629064!4d19.9394967!16s%2Fg%2F11bzrgqhr4!19sChIJ_a402RFbFkcRHBvj3mdWyOw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sakana+Sushi%26Sticks+Krak%C3%B3w/data=!4m7!3m6!1s0x47165b8fdbbd0267:0x3f6568b5ea635f72!8m2!3d50.0602439!4d19.9201332!16s%2Fg%2F11h1r96gfb!19sChIJZwK9249bFkcRcl9j6rVoZT8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Miyako+Sushi.+Restauracja/data=!4m7!3m6!1s0x47165b1aeea07f4f:0xac2638026dc4e55f!8m2!3d50.0673776!4d19.9460466!16s%2Fg%2F1v62gd4_!19sChIJT3-g7hpbFkcRX-XEbQI4Jqw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Roru+Sushi+Krak%C3%B3w/data=!4m7!3m6!1s0x47165b4ca3e41bbf:0xed173f6cc694cb7!8m2!3d50.0444135!4d19.9590909!16s%2Fg%2F11jmjwsfbp!19sChIJvxvko0xbFkcRt0xpzPZz0Q4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Yatai+Sushi+Otsumami+Bar/data=!4m7!3m6!1s0x47165b7a704fcfa5:0xf2d79413d8c9a6d1!8m2!3d50.0450449!4d19.9494361!16s%2Fg%2F11h160_k8q!19sChIJpc9PcHpbFkcR0abJ2BOU1_I?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Hana+Sushi/data=!4m7!3m6!1s0x47165b69be57d677:0x5ffe31cb50d2073b!8m2!3d50.0518384!4d19.9462527!16s%2Fg%2F11bv1n2jz8!19sChIJd9ZXvmlbFkcROwfSUMsx_l8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Krak%C3%B3w+-+Sushi+World/data=!4m7!3m6!1s0x47165b0d9fd9ac35:0x9eada7859e689987!8m2!3d50.0690549!4d19.9835896!16s%2Fg%2F11m8skrkzy!19sChIJNazZnw1bFkcRh5lonoWnrZ4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Jikasei+Sushi+Niepo%C5%82omice/data=!4m7!3m6!1s0x471647564cac7149:0xbd85dd33c40913cd!8m2!3d50.0192803!4d20.2051556!16s%2Fg%2F11qntqqmnw!19sChIJSXGsTFZHFkcRzRMJxDPdhb0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Royal+Niepo%C5%82omice/data=!4m7!3m6!1s0x471647a6f707096b:0xe83f6e9901a5d98a!8m2!3d50.036907!4d20.2192296!16s%2Fg%2F11p9vqcs_m!19sChIJawkH96ZHFkcRitmlAZluP-g?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Genji+Premium+Sushi/data=!4m7!3m6!1s0x47165b6b04f7a197:0x48aaf6592c796547!8m2!3d50.053112!4d19.9433785!16s%2Fg%2F1tp06vfc!19sChIJl6H3BGtbFkcRR2V5LFn2qkg?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Kazoku+Sushi+108+Wieliczka/data=!4m7!3m6!1s0x4716416516ab5f5f:0xb22732750e4f1ea5!8m2!3d49.9834301!4d20.0699807!16s%2Fg%2F11h26bbwjc!19sChIJX1-rFmVBFkcRpR5PDnUyJ7I?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Yana+Sushi/data=!4m7!3m6!1s0x471645d3e3f157af:0x24c23297587fead0!8m2!3d50.0631145!4d20.0072685!16s%2Fg%2F11h56pq92_!19sChIJr1fx49NFFkcR0Op_WJcywiQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Kushi/data=!4m7!3m6!1s0x47165b721dc45e7f:0x52306812abce31b9!8m2!3d50.0682879!4d19.9784245!16s%2Fg%2F11rg8g2943!19sChIJf17EHXJbFkcRuTHOqxJoMFI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Koku+Sushi/data=!4m7!3m6!1s0x47165baa399edf45:0x315ec62ba9680902!8m2!3d50.0772413!4d19.9266002!16s%2Fg%2F11clvtpnf3!19sChIJRd-eOapbFkcRAgloqSvGXjE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+TU/data=!4m7!3m6!1s0x47165b671c43374f:0x2dedf39b79c5711d!8m2!3d50.0703501!4d19.9196363!16s%2Fg%2F11kgt9mzh0!19sChIJTzdDHGdbFkcRHXHFeZvz7S0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SushiTaxiZielonki/data=!4m7!3m6!1s0x47165196b8fbd96d:0x4dd39fe91848d61c!8m2!3d50.1210498!4d19.9573763!16s%2Fg%2F11fky_swy5!19sChIJbdn7uJZRFkcRHNZIGOmf000?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Yamato+Sushi+Krak%C3%B3w/data=!4m7!3m6!1s0x47165a5348f97047:0x982addea171bb9f6!8m2!3d50.0804741!4d19.926011!16s%2Fg%2F11c5_8fz21!19sChIJR3D5SFNaFkcR9rkbF-rdKpg?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Masami+Sushi/data=!4m7!3m6!1s0x471ecb6249d2b8c5:0xc33ed0676929acde!8m2!3d52.2301356!4d20.9695037!16s%2Fg%2F11b77d5tmt!19sChIJxbjSSWLLHkcR3qwpaWfQPsM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SeaBus/data=!4m7!3m6!1s0x471ecdc1ff63f9d3:0xcae286da6c23c7b9!8m2!3d52.193783!4d21.0457867!16s%2Fg%2F11r_h4y_jc!19sChIJ0_lj_8HNHkcRuccjbNqG4so?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/TACHI+SUSHI/data=!4m7!3m6!1s0x471ea554aad4d099:0x8c2e477b092cefc4!8m2!3d52.4190169!4d20.7308294!16s%2Fg%2F11cmshcdsw!19sChIJmdDUqlSlHkcRxO8sCXtHLow?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/San+Sushi+-+restauracja+Sushi,+makarony,+dania+tajskie,+kawa,+drinki,+desery/data=!4m7!3m6!1s0x471ea5552122aa59:0xab4925fe3eca4ade!8m2!3d52.4292942!4d20.7087808!16s%2Fg%2F11byxfvhj2!19sChIJWaoiIVWlHkcR3krKPv4lSas?authuser=0&hl=en&rclk=1"',
'https://www.google.com.ua/maps/place/Iwo+Sushi/data=!4m7!3m6!1s0x471f2e7ff0b5cd31:0x1fb25b3cbc27089c!8m2!3d52.1782111!4d21.5632044!16s%2Fg%2F11byky3k6v!19sChIJMc218H8uH0cRnAgnvDxbsh8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Saijo+Sushi/data=!4m7!3m6!1s0x47192e735d2fd59d:0x4ae24e4a7450fd0!8m2!3d52.0932391!4d21.0394215!16s%2Fg%2F113gnn9s1!19sChIJndUvXXMuGUcR0A9Fp-QkrgQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Okinawa+Sushi/data=!4m7!3m6!1s0x47194959323c6abd:0x34fd068d2274629a!8m2!3d52.10438!4d20.6345852!16s%2Fg%2F11gyx6y7l_!19sChIJvWo8MllJGUcRmmJ0Io0G_TQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Takara+Sushi+-+Grodzisk+Mazowiecki/data=!4m7!3m6!1s0x471948eb0b357c6b:0x919ef9465f07ee3c!8m2!3d52.1085877!4d20.6409172!16s%2Fg%2F1tfc9y1h!19sChIJa3w1C-tIGUcRPO4HX0b5npE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/EBI+SUSHI+Grodzisk+Mazowiecki/data=!4m7!3m6!1s0x471948ba4c46e3e3:0xf3658b5fec700ed2!8m2!3d52.1026116!4d20.6162201!16s%2Fg%2F11cn73hx4p!19sChIJ4-NGTLpIGUcR0g5w7F-LZfM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Mi%C5%84sk/data=!4m7!3m6!1s0x471f2fc29bf6b257:0x775a1aaa819b50dc!8m2!3d52.1833755!4d21.5571761!16s%2Fg%2F11pbvb86jd!19sChIJV7L2m8IvH0cR3FCbgaoaWnc?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Warszawa+-+Sushi+World/data=!4m7!3m6!1s0x471ecc813ff809b5:0x4c0e9b87abe1f59e!8m2!3d52.2380338!4d20.9857997!16s%2Fg%2F11c6zp6wkt!19sChIJtQn4P4HMHkcRnvXhq4ebDkw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Stacja+Sushi+Konrad/data=!4m7!3m6!1s0x471f2c2e5004a137:0xba0d2d3af02e6ab3!8m2!3d52.1779708!4d21.561393!16s%2Fg%2F11bx43ptbj!19sChIJN6EEUC4sH0cRs2ou8DotDbo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Sake+sushi+Grodzisk+Mazowiecki/data=!4m7!3m6!1s0x4719492fc274a037:0xc130bdea45f3f48f!8m2!3d52.1050642!4d20.618045!16s%2Fg%2F11lrhg272p!19sChIJN6B0wi9JGUcRj_TzReq9MME?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/TATO+SUSHI/data=!4m7!3m6!1s0x471ecf1f6a13db8f:0x340a00e49f689310!8m2!3d52.3248233!4d21.1060775!16s%2Fg%2F11p3p60zz2!19sChIJj9sTah_PHkcREJNon-QACjQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SUSHI+GO/data=!4m7!3m6!1s0x471eb81bd87a7e63:0x90e8db2751e01c45!8m2!3d52.392601!4d20.9357051!16s%2Fg%2F1thfd5k7!19sChIJY3562Bu4HkcRRRzgUSfb6JA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sumada+Sushi/data=!4m7!3m6!1s0x471eccf271112f6d:0xe59cdd9964f5f111!8m2!3d52.2268361!4d21.0114891!16s%2Fg%2F11fym5rykd!19sChIJbS8RcfLMHkcREfH1ZJndnOU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Ebi+Sushi+Piast%C3%B3w/data=!4m7!3m6!1s0x471935364235575b:0x580af9796fc563c8!8m2!3d52.1837221!4d20.8388423!16s%2Fg%2F11fktgq8kv!19sChIJW1c1QjY1GUcRyGPFb3n5Clg?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Mango+Marki/data=!4m7!3m6!1s0x471ecf7788e1b4a3:0x7b2f749067d795fe!8m2!3d52.3219985!4d21.0833492!16s%2Fg%2F11pcp0pxp_!19sChIJo7ThiHfPHkcR_pXXZ5B0L3s?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Saiko+Sushi/data=!4m7!3m6!1s0x471ebbfd6c2a3ff7:0x21c38a91881b996c!8m2!3d52.4288271!4d20.7155753!16s%2Fg%2F11p11j0r8p!19sChIJ9z8qbP27HkcRbJkbiJGKwyE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Weso%C5%82a/data=!4m7!3m6!1s0x471ed22a7be9a6af:0xb42acce0a51a6c9!8m2!3d52.2479307!4d21.1918854!16s%2Fg%2F1hc5qknsd!19sChIJr6bpeyrSHkcRyaZRCs6sQgs?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Masami+Sushi/data=!4m7!3m6!1s0x471ecb6249d2b8c5:0xc33ed0676929acde!8m2!3d52.2301356!4d20.9695037!16s%2Fg%2F11b77d5tmt!19sChIJxbjSSWLLHkcR3qwpaWfQPsM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Kais%C5%8D+Sushi+Radzymin/data=!4m7!3m6!1s0x471ec574787f03cf:0xae6edb2c4d86d916!8m2!3d52.4167977!4d21.1743463!16s%2Fg%2F11n12pl_66!19sChIJzwN_e"HTFHkcRFtmGTSzbbq4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Asami+Sushi+Wieliszew/data=!4m7!3m6!1s0x471eb9305a8ab1cf:0x2f94f7bf2b07b4b0!8m2!3d52.4470155!4d20.9778531!16s%2Fg%2F11q1qcgfgl!19sChIJz7GKWjC5HkcRsLQHK7_3lC8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Mania/data=!4m7!3m6!1s0x471f2c2a93015d89:0x6a1dc317c0c60540!8m2!3d52.1776364!4d21.5581321!16s%2Fg%2F11cnb18tg0!19sChIJiV0BkyosH0cRQAXGwBfDHWo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Izumi+Sushi+Plac+Zbawiciela/data=!4m7!3m6!1s0x471ecce6010cab07:0x8b01b02f76724c5f!8m2!3d52.2194794!4d21.0172906!16s%2Fg%2F1tftvqhm!19sChIJB6sMAebMHkcRX0xydi-wAYs?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SushiZushi/data=!4m7!3m6!1s0x471eccf115aaf49f:0x2d344e6262a91a3b!8m2!3d52.2291725!4d21.0182356!16s%2Fg%2F1thnmjnh!19sChIJn_SqFfHMHkcROxqpYmJONC0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/TOKYO+SUSHI/data=!4m7!3m6!1s0x471932d89393ef83:0xc83ec0b4c89c6e2b!8m2!3d52.1801854!4d21.0050253!16s%2Fg%2F1tftd1t5!19sChIJg--Tk9gyGUcRK26cyLTAPsg?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Pracownia+Sushi/data=!4m7!3m6!1s0x471ecb0c7c24776b:0x345f23301848bdc!8m2!3d52.2260111!4d20.9815861!16s%2Fg%2F1pp2tjmg0!19sChIJa3ckfAzLHkcR3IuEATPyRQM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+na+gastro/data=!4m7!3m6!1s0x47192f1912b90319:0x23d269b26c860658!8m2!3d52.0696188!4d21.0286251!16s%2Fg%2F11q4gg1mxx!19sChIJGQO5EhkvGUcRWAaGbLJp0iM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Tokyo+Sushi+-+Nowy+%C5%9Awiat/data=!4m7!3m6!1s0x471ecd3bb82b709d:0x8f3685e3d1f77f45!8m2!3d52.2349252!4d21.0188633!16s%2Fg%2F11flqhvx6k!19sChIJnXAruDvNHkcRRX_30eOFNo8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Bar+Kaiseki/data=!4m7!3m6!1s0x471053044afc09d7:0xd91a21baf04f9bbe!8m2!3d50.6669035!4d17.9250757!16s%2Fg%2F1tjt0nkf!19sChIJ1wn8SgRTEEcRvptP8LohGtk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Seii+Sushi+Opole/data=!4m7!3m6!1s0x47105345d30deab1:0x15958eaaca28cf64!8m2!3d50.6555128!4d17.9316455!16s%2Fg%2F11gnpz8jkh!19sChIJseoN00VTEEcRZM8oyqqOlRU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Smaki/data=!4m7!3m6!1s0x4710547891a7d9ab:0xe4067f91386d7370!8m2!3d50.667625!4d17.9300969!16s%2Fg%2F11f3p0_4z1!19sChIJq9mnkXhUEEcRcHNtOJF_BuQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Okinawa+Sushi+Bar+%26+Japan+Restaurant+w+Opolu/data=!4m7!3m6!1s0x47105320e72299a9:0xc5404027ecb4d1a6!8m2!3d50.6734932!4d17.9564556!16s%2Fg%2F11q386wb24!19sChIJqZki5yBTEEcRptG07CdAQMU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+%26+Friends/data=!4m7!3m6!1s0x47105328587d6655:0x58c9cfe324fabbf8!8m2!3d50.6503755!4d17.9001371!16s%2Fg%2F11p4qjc_j5!19sChIJVWZ9WC"hTEEcR-Lv6JOPPyVg?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SUSHI+drive/data=!4m7!3m6!1s0x47105383a166a1ed:0xb1d58944b7dae58e!8m2!3d50.6677589!4d17.9381789!16s%2Fg%2F11fsyf8kfm!19sChIJ7aFmoYNTEEcRjuXat0SJ1bE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi-Shop/data=!4m7!3m6!1s0x47105306a72dc8f5:0xcc1b8166a25a610e!8m2!3d50.6667518!4d17.9253559!16s%2Fg%2F1hc11m373!19sChIJ9cgtpwZTEEcRDmFaomaBG8w?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Vegan+Friends/data=!4m7!3m6!1s0x471053b93d20e91d:0x22732ca4b5eb73ba!8m2!3d50.650117!4d17.9002121!16s%2Fg%2F11rkc6td63!19sChIJHekgPblTEEcRunPrtaQscyI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi-Profi+Hurtowania+ceramiki+akcesori%C3%B3w+i+dekoracji+azjatyckich/data=!4m7!3m6!1s0x471053df97bd626f:0x85f4c2162bb2d94e!8m2!3d50.6669423!4d17.9251437!16s%2Fg%2F11fn6yvdy9!19sChIJb2K9l99TEEcRTtmyKxbC9IU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Ha+Noi+Smaki+Azji/data=!4m7!3m6!1s0x471052fde695a1cb:0x39295d7f8429ccc8!8m2!3d50.6697094!4d17.9138074!16s%2Fg%2F11b6smmblx!19sChIJy6GV5v1SEEcRyMwphH9dKTk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Bistro+TejkE%C5%82ej/data=!4m7!3m6!1s0x471053084fd78eb9:0x51b6834655b9dbdf!8m2!3d50.6702094!4d17.9345692!16s%2Fg%2F11b6x7887h!19sChIJuY7XTw"hTEEcR39u5VUaDtlE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Tulsi/data=!4m7!3m6!1s0x4710530f89c1408b:0xfa00cb98ffba7917!8m2!3d50.6642982!4d17.9277355!16s%2Fg%2F11c0rvkk8h!19sChIJi0DBiQ9TEEcRF3m6_5jLAPo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Bar+Orientalny+QUANG+-+NGOC/data=!4m7!3m6!1s0x4710539c74586a01:0x80a04219541a69e4!8m2!3d50.6734216!4d17.959341!16s%2Fg%2F11c6fgf6v_!19sChIJAWpYdJxTEEcR5GkaVBlCoIA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi_Ja.Krapkowice/data=!4m7!3m6!1s0x4711a99860f5d41d:0xaa6995d3149b69da!8m2!3d50.477351!4d17.9659231!16s%2Fg%2F11ll74j355!19sChIJHdT1YJipEUcR2mmbFNOVaao?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Bistro+SmaczneGO/data=!4m7!3m6!1s0x4710531d7c46ff87:0x1af4940ddf44e38c!8m2!3d50.6782286!4d17.9439371!16s%2Fg%2F11tcbt7xgx!19sChIJh_9GfB1TEEcRjONE3w2U9Bo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/KARCZMA+BIDA+w+Opolu/data=!4m7!3m6!1s0x47104d0677ac2621:0xd302e9e8e8bea1aa!8m2!3d50.6861549!4d17.8125558!16s%2Fg%2F12qhh5w39!19sChIJISasdwZNEEcRqqG-6OjpAtM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/KFC+Opole+Solaris+2/data=!4m7!3m6!1s0x47105306f092c961:0x23881f0e5328ef4b!8m2!3d50.6703212!4d17.9263101!16s%2Fg%2F11c1qbxh3x!19sChIJYcmS8AZTEEcRS-8oUw4fiCM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/KAISEKI+GH+KAROLINKA/data=!4m7!3m6!1s0x4710528792b8c5bf:0xd47155a5d3d37a11!8m2!3d50.6811666!4d17.8731893!16s%2Fg%2F11ryg_44jh!19sChIJv8W4kodSEEcREXrT06VVcdQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Starka/data=!4m7!3m6!1s0x47105302257df38b:0xcc5adea6f7149cab!8m2!3d50.6688889!4d17.9177778!16s%2Fg%2F1tmbtv"ht!19sChIJi_N9JQJTEEcRq5wU96beWsw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Klubokawiarnia+Laba/data=!4m7!3m6!1s0x4710533dce522acd:0x447e75717f036678!8m2!3d50.650333!4d17.925038!16s%2Fg%2F1ptxl17pr!19sChIJzSpSzj1TEEcReGYDf3F1fkQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Tak+Robimy/data=!4m7!3m6!1s0x47105331e1a171fb:0x54a05d7f7b8f84f5!8m2!3d50.6666105!4d17.9292419!16s%2Fg%2F11pyn6hc39!19sChIJ-3Gh4TFTEEcR9YSPe39doFQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SushiTU/data=!4m7!3m6!1s0x471113c7058d8ccd:0x72ef752281d0dc70!8m2!3d50.3328031!4d18.1454806!16s%2Fg%2F11h_db8dkf!19sChIJzYyNBccTEUcRcNzQgSJ173I?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Piano/data=!4m10!3m9!1s0x47105302fe44a785:0x3f029f35b7f12e98!5m2!4m1!1i2!8m2!3d50.6688096!4d17.9177957!16s%2Fg%2F1q6b676dk!19sChIJhadE_gJTEEcRmC7xtzWfAj8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Atelier+Cafe/data=!4m7!3m6!1s0x471053ba5635d8f9:0x2e3cd41b91c3b4e8!8m2!3d50.6701721!4d17.9112832!16s%2Fg%2F11fn06gv9j!19sChIJ-dg1VrpTEEcR6LTDkRvUPC4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Alanya+Kebab/data=!4m7!3m6!1s0x471053093f0f9d3d:0xe5b2da9a1d5a8c7a!8m2!3d50.6678082!4d17.9356179!16s%2Fg%2F11bxf4m00d!19sChIJPZ0PPwlTEEcReoxaHZrasuU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Mustafa+Kebab/data=!4m7!3m6!1s0x47105384227fd305:0xc9d8340eb04b4bd5!8m2!3d50.6722192!4d17.9284435!16s%2Fg%2F11fq9qrdlf!19sChIJBdN_IoRTEEcR1UtLsA402Mk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Smakosz/data=!4m7!3m6!1s0x471053a34b02c867:0xfd61a7e131b197b5!8m2!3d50.680651!4d17.947991!16s%2Fg%2F11ckstynpc!19sChIJZ8gCS6NTEEcRtZexMeGnYf0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Energobistro+Opole/data=!4m7!3m6!1s0x4711ab40724e8c0b:0x442b6777d5f9d804!8m2!3d50.6046425!4d17.9662374!16s%2Fg%2F11h"htw2crw!19sChIJC4xOckCrEUcRBNj51XdnK0Q?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Da+Ci+Kumo+Sushi+K%C4%99dzierzyn-Ko%C5%BAle/data=!4m7!3m6!1s0x471111b70ed6a511:0x2cc8e07fa309bde4!8m2!3d50.3476134!4d18.2190097!16s%2Fg%2F11jm7ft52g!19sChIJEaXWDrcREUcR5L0Jo3_gyCw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Nale%C5%9Bnikarnia+Polanka/data=!4m7!3m6!1s0x471053891d3afd5d:0x53c6a7b79a670c09!8m2!3d50.6794039!4d17.8903422!16s%2Fg%2F11h4nbc94j!19sChIJXf06HYlTEEcRCQxnmrenxlM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Ima+Sushi/data=!4m7!3m6!1s0x473cfb7a544fcf65:0xfc816475e6c255e!8m2!3d50.0356947!4d21.9998937!16s%2Fg%2F11jfp34xx_!19sChIJZc9PVHr7PEcRXiVsXkcWyA8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/IKEDA+sushi/data=!4m7!3m6!1s0x473cfbbd40e9dd91:0x4bab7386f9cac7bb!8m2!3d50.0126546!4d21.9988296!16s%2Fg%2F11nxrw8tqh!19sChIJkd3pQL37PEcRu8fK-YZzq0s?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/AKITA+SUSHI/data=!4m7!3m6!1s0x473cfb6dbeffffff:0x4175ab9f465c17a9!8m2!3d50.0491927!4d21.976293!16s%2Fg%2F11q9hl_d5p!19sChIJ____vm37PEcRqRdcRp-rdUE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+House+77/data=!4m7!3m6!1s0x473cfb1c7ccdc0c9:0xeb217b932cd54c80!8m2!3d50.0287364!4d22.0004696!16s%2Fg%2F11q8smwdwh!19sChIJycDNfBz7PEcRgEzVLJN7Ies?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+World+Rzesz%C3%B3w/data=!4m7!3m6!1s0x473cfbc73dffeba7:0xf85bb1bad2ce52ae!8m2!3d50.0413459!4d21.9530372!16s%2Fg%2F11rtlrbldg!19sChIJp-v_Pcf7PEcRrlLO0rqxW_g?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Toshi+Sushi/data=!4m7!3m6!1s0x473cfb8b5d0be235:0x1e56c9bf864c78fd!8m2!3d50.0386854!4d22.0019483!16s%2Fg%2F11rx3j06r6!19sChIJNeILXYv7PEcR_XhMhr_JVh4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Zori+Sushi/data=!4m7!3m6!1s0x473cfb022aac29c1:0xa2b825a3293c785b!8m2!3d50.037312!4d22.001828!16s%2Fg%2F1ptzsbdml!19sChIJwSmsKgL7PEcRW3g8KaMluKI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Hoshi+Sushi+Japanese+Restaurant+%26+Sushi+Bar/data=!4m7!3m6!1s0x473cfa57c9ef96dd:0xc3f4cd52d6b6d0b1!8m2!3d50.0281121!4d22.0130986!16s%2Fg%2F1hc8n6szv!19sChIJ3ZbvyVf6PEcRsdC21lLN9MM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Take+Sushi/data=!4m7!3m6!1s0x473c9bd9f5ada701:0x1471954dfd053c4a!8m2!3d50.0185662!4d22.681835!16s%2Fg%2F11c6cq09ck!19sChIJAaet9dmbPEcRSjwF_U2VcRQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Pan+Krewetka+Rzesz%C3%B3w+shripms+slow+food+%26+sushi+bar/data=!4m7!3m6!1s0x473cfbfb95e384a9:0x4bc6f6489618ec2c!8m2!3d50.0380214!4d22.003675!16s%2Fg%2F11k6lrw5hx!19sChIJqYTjlfv7PEcRLOwYlkj2xks?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/PINK+SUSHI+RZESZ%C3%93W/data=!4m7!3m6!1s0x473cfb6267fae221:0xfc8f85b2ca6f5de0!8m2!3d50.0278538!4d22.013181!16s%2Fg%2F11s5tv_1dk!19sChIJIeL6Z2L7PEcR4F1vyrKFj_w?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/YOSO+Sushi+Rzesz%C3%B3w/data=!4m7!3m6!1s0x473cfb5b7c374359:0xbfcd8415c34f5d62!8m2!3d50.0491927!4d21.976293!16s%2Fg%2F11r977msph!19sChIJWUM3fFv7PEcRYl1PwxWEzb8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Akita+Sushi+Bar/data=!4m7!3m6!1s0x473cfbd11bf4761f:0xadf494911148bb08!8m2!3d50.0378184!4d22.002985!16s%2Fg%2F11gxnv_806!19sChIJH3b0G9H7PEcRCLtIEZGU9K0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NOVA+SUSHI+Rzesz%C3%B3w/data=!4m7!3m6!1s0x473cfbdda88fe435:0x42cca93c83c0a658!8m2!3d50.0275207!4d22.038242!16s%2Fg%2F11ll3_5kcv!19sChIJNeSPqN37PEcRWKbAgzypzEI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Jojo+Sushi/data=!4m7!3m6!1s0x473cfb085b4f6eef:0xb505553d0e3aec1f!8m2!3d50.047356!4d22.0067666!16s%2Fg%2F11jnqrbb86!19sChIJ725PWwj7PEcRH-w6Dj1VBbU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Shinobi+Ramen+Bar/data=!4m7!3m6!1s0x473cfbb056741c35:0x9210e6386f482da2!8m2!3d50.042035!4d22.0104925!16s%2Fg%2F11fqcws5h1!19sChIJNRx0VrD7PEcRoi1IbzjmEJI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Under+SEOUL/data=!4m7!3m6!1s0x473cfbecc3079127:0x794a1997f764fe69!8m2!3d50.032786!4d21.9971204!16s%2Fg%2F11fv0ys1_g!19sChIJJ5EHw-z7PEcRaf5k95cZSnk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Rzeszowskie+Kulinaria/data=!4m7!3m6!1s0x473cfb6be8ba9b93:0x5954a24eb1b9a89a!8m2!3d50.053643!4d21.978711!16s%2Fg%2F11gfxm_6y6!19sChIJk5u66Gv7PEcRmqi5sU6iVFk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Rzeszowskie+S%C5%82oiki/data=!4m7!3m6!1s0x473cfbcf2f974a8d:0xd64c83bffe224da7!8m2!3d50.0392445!4d21.9994258!16s%2Fg%2F11hyqqsxmr!19sChIJjUqXL8_7PEcRp00i_r-DTNY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Shish+Kebab/data=!4m7!3m6!1s0x473cf183c85c737d:0xd90ce0a1205549e0!8m2!3d50.0478583!4d22.1225916!16s%2Fg%2F11rwry6xg9!19sChIJfXNcyIPxPEcR4ElVIKHgDNk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Simple+Rzesz%C3%B3w+-+Nowa+Wie%C5%9B/data=!4m7!3m6!1s0x473ce5a0a6fff4a9:0x7d2a3c06430073e9!8m2!3d50.0893671!4d22.0466826!16s%2Fg%2F11h3kh2_yt!19sChIJqfT_pqDlPEcR6XMAQwY8Kn0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Taborowe+Smaki/data=!4m7!3m6!1s0x473cfbce906acf2f:0xf4ae3aaf13fb1814!8m2!3d50.0086647!4d21.9729876!16s%2Fg%2F11h0vpvpb2!19sChIJL89qkM77PEcRFBj7E686rvQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Klub+pod+palmami/data=!4m7!3m6!1s0x473d1915ba647df5:0xa3862c4f38a4fbe9!8m2!3d50.2314477!4d21.7875058!16s%2Fg%2F11j109dty_!19sChIJ9X1kuhUZPUcR6fukOE8shqM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Hotel+Pod+Herbami/data=!4m10!3m9!1s0x473dade6a7104be7:0x393953595daff7e4!5m2!4m1!1i2!8m2!3d49.8458813!4d21.6103707!16s%2Fg%2F11fm2j9kgg!19sChIJ50sQp-atPUcR5PevXVlTOTk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Jani+Sushi/data=!4m7!3m6!1s0x473d84a815a6e32f:0xa71c17948b016b5a!8m2!3d50.0139769!4d20.978365!16s%2Fg%2F1hm24pbdj!19sChIJL-OmFaiEPUcRWmsBi5QXHKc?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/ToTujemy/data=!4m7!3m6!1s0x473cfb56ec499afb:0x6dffd8dc34ee932c!8m2!3d50.0301171!4d21.9975569!16s%2Fg%2F11pwwtpkk7!19sChIJ-5pJ7Fb7PEcRLJPuNNzY_20?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+Indyjska+RANI+Rzeszow/data=!4m7!3m6!1s0x473cfb88e22e7f2d:0xb2ffaf3ab4f3b897!8m2!3d50.0418846!4d22.0084722!16s%2Fg%2F11gnpvhkh0!19sChIJLX8u4oj7PEcRl7jztDqv_7I?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Hanoi+Rzesz%C3%B3w/data=!4m7!3m6!1s0x473cfb87d7e1205d:0xc1dd2c9c50ccdc86!8m2!3d50.0411678!4d22.004587!16s%2Fg%2F11g10nscz0!19sChIJXSDh14f7PEcR"htzMUJws3cE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NOBO+restauracja/data=!4m7!3m6!1s0x473cfb1ace12af19:0xa3af19c28af279a!8m2!3d50.0193692!4d21.995579!16s%2Fg%2F11fq932td_!19sChIJGa8Szhr7PEcRmievKJzxOgo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Restauracja+OLIMP/data=!4m7!3m6!1s0x473cfb0525fd69e7:0xbca0aa7eb109e1b4!8m2!3d50.0420482!4d21.9979302!16s%2Fg%2F11c6rxy7rk!19sChIJ52n9JQX7PEcRtOEJsX6qoLw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/FUTU+SUSHI/data=!4m7!3m6!1s0x471ffc054ebf1f4f:0xb357c47897ef6357!8m2!3d53.1331177!4d23.155138!16s%2Fg%2F1hc0_sv4q!19sChIJTx-_TgX8H0cRV2Pvl3jEV7M?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/DOHO+Sushi/data=!4m7!3m6!1s0x471ffc08b1df6933:0xaa03b6dfad22efb7!8m2!3d53.1288504!4d23.1483562!16s%2Fg%2F11c1q8_70_!19sChIJM2nfsQj8H0cRt-8ird-2A6o?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/MAHO+Sushi/data=!4m7!3m6!1s0x471ffc1acf58d005:0x2d86a238dd4a8fac!8m2!3d53.1338882!4d23.1568905!16s%2Fg%2F11ggrlg420!19sChIJBdBYzxr8H0cRrI9K3Tiihi0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Bia%C5%82ystok+-+Restauracja+Koku+Sushi+ul.+Kili%C5%84skiego/data=!4m7!3m6!1s0x471ffc1cd8ddcadd:0x52122fe93eb99e9d!8m2!3d53.1322916!4d23.16619!16s%2Fg%2F1hc1gfl83!19sChIJ3crd2Bz8H0cRnZ65PukvElI?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NOVA+SUSHI+Bia%C5%82ystok/data=!4m7!3m6!1s0x471ffd63083dfab9:0x3edeb2127a88ca6!8m2!3d53.1337906!4d23.1445523!16s%2Fg%2F11r1ycsvyc!19sChIJufo9CGP9H0cRpoyoJyHr7QM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Susharnia+Sushi+Bar+Bia%C5%82ystok/data=!4m7!3m6!1s0x471ffdbbdb0777a7:0x91eb52965206878e!8m2!3d53.125083!4d23.1537452!16s%2Fg%2F11rckv5_t1!19sChIJp3cH27v9H0cRjocGUpZS65E?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/PKS+-+Piwo+Kaczka+Sushi+-+Sushi+Bar+%26+Chinese+Food/data=!4m7!3m6!1s0x471ffea73a22ae11:0xf642f248ed6ce3e1!8m2!3d53.1348129!4d23.1681269!16s%2Fg%2F11g1z2h62j!19sChIJEa4iOqf-H0cR4eNs7UjyQvY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Wytw%C3%B3rnia+Sushi/data=!4m7!3m6!1s0x471ffdaa33d3e941:0xf28385f163ec988f!8m2!3d53.1318809!4d23.1344004!16s%2Fg%2F11gwmcdjl5!19sChIJQenTM6r9H0cRj5jsY_GFg_I?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/KOKU+Sushi/data=!4m7!3m6!1s0x471ffdbdac2995a5:0xe178b3e5406a6b89!8m2!3d53.1327182!4d23.1603777!16s%2Fg%2F11g0g52xpg!19sChIJpZUprL39H0cRiWtqQOWzeOE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Bia%C5%82ystok,+SushiToGo+Bia%C5%82ystok/data=!4m7!3m6!1s0x471ffc6930927b99:0x50411bb91678619e!8m2!3d53.154962!4d23.1640499!16s%2Fg%2F11ybpk7vz!19sChIJmXuSMGn8H0cRnmF4FrkbQVA?authuser=0&hl=en&rclk=1"',
'https://www.google.com.ua/maps/place/Rany+Julek+sushi+%26+bar/data=!4m7!3m6!1s0x471ffde4cea0d6eb:0x1cf0ff2e9ae49864!8m2!3d53.133384!4d23.15401!16s%2Fg%2F11s1tvpqy8!19sChIJ69agzuT9H0cRZJjkmi7_8Bw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Moye+Sushi/data=!4m7!3m6!1s0x471fe545c210c5e5:0x2a22f16281b1cb4c!8m2!3d53.149151!4d22.994109!16s%2Fg%2F11sp4wkp2_!19sChIJ5cUQwkXlH0cRTMuxgWLxIio?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Koku+Sushi,+Bema+st.+Lomza,+POLAND/data=!4m7!3m6!1s0x471e33894e576b93:0x4f5a9250127e2519!8m2!3d53.1633063!4d22.0674721!16s%2Fg%2F11b6cm3x60!19sChIJk2tXTokzHkcRGSV-ElCSWk8?authuser=0&hl=en&rclk=1"',
'https://www.google.com.ua/maps/place/Restauracja+MOI+sushi+%26+more/data=!4m7!3m6!1s0x471fff6e16dfff6b:0xf963dcdb9a41bd4d!8m2!3d53.1255725!4d23.1675838!16s%2Fg%2F11rmrb0_ww!19sChIJa__fFm7_H0cRTb1BmtvcY_k?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Wytw%C3%B3rnia+Sushi/data=!4m7!3m6!1s0x471ffc01860fc929:0xfcff76db23f595d9!8m2!3d53.126169!4d23.162132!16s%2Fg%2F11kmc9m8ky!19sChIJKckPhgH8H0cR2ZX1I9t2__w?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Bia%C5%82ystok-+Restauracja+KOKU+Sushi+ul.+Antoniuk+Fabryczny/data=!4m7!3m6!1s0x471ffd5c45ecee1b:0x231c57d45e8704a4!8m2!3d53.1462034!4d23.1243109!16s%2Fg%2F11rpgyyksk!19sChIJG-7sRVz9H0cRpASHXtRXHCM?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/KOKU+Sushi/data=!4m7!3m6!1s0x471ffb34c8e7a825:0xb07b2cde870598ec!8m2!3d53.1143217!4d23.1414168!16s%2Fg%2F11hry8vy59!19sChIJJajnyDT7H0cR7JgFh94se7A?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/NOVA+SUSHI/data=!4m7!3m6!1s0x471ffb362c40d667:0xb21fe6f2f36ed14d!8m2!3d53.1116389!4d23.1200289!16s%2Fg%2F11rkd06br1!19sChIJZ9ZALDb7H0cRTdFu8_LmH7I?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Time4sushi/data=!4m7!3m6!1s0x471ffd0e8e160b2b:0x71fb0dd95a921c0b!8m2!3d53.1499361!4d23.156712!16s%2Fg%2F11h8bkjwk0!19sChIJKwsWjg79H0cRCxySWtkN-3E?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Takeaway+Bielsk+Podlaski/data=!4m7!3m6!1s0x472023cc2cde6541:0x4fa5a8d49ec68325!8m2!3d52.7651915!4d23.1874885!16s%2Fg%2F11js_td237!19sChIJQWXeLMwjIEcRJYPGntSopU8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Nikko+Sushi/data=!4m7!3m6!1s0x471e336f01daa31f:0xaaae434d66aca5fc!8m2!3d53.1739028!4d22.0686295!16s%2Fg%2F11gr1_vtp4!19sChIJH6PaAW8zHkcR_KWsZk1Drqo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sayuri+Sushi/data=!4m7!3m6!1s0x46e1023b87aa09f9:0xb5cf79ba13c63660!8m2!3d54.0974977!4d22.9317286!16s%2Fg%2F1hm2fpqqj!19sChIJ-QmqhzsC4UYRYDbGE7p5z7U?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/FUKI+SUSHI/data=!4m7!3m6!1s0x46e101ecd0c30c19:0x95b485a1d696a485!8m2!3d54.080127!4d22.9316432!16s%2Fg%2F11fwglhnft!19sChIJGQzD0OwB4UYRhaSW1qGFtJU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/TAKI+SUSHI/data=!4m7!3m6!1s0x46e050fbcc5b93c7:0xfe3571387acc3d54!8m2!3d53.1063603!4d23.1258094!16s%2Fg%2F11f3b1fn7f!19sChIJx5NbzPtQ4EYRVD3MejhxNf4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/KAMAI+Sushi/data=!4m7!3m6!1s0x46e103fef53465db:0x5abed7369edaadc2!8m2!3d54.1003683!4d22.9339168!16s%2Fg%2F11fsngvfwp!19sChIJ22U09f4D4UYRwq3anjbXvlo?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/TANOSHII+Sushi/data=!4m7!3m6!1s0x471ffc0528bae2d5:0xcfd460f9ed3d87ef!8m2!3d51.9537505!4d19.1343786!16s%2Fg%2F11cff5dvn!19sChIJ1eK6KAX8H0cR74c97flg1M8?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Eat+Point+Bia%C5%82ystok+-+CH+Atrium+Bia%C5%82a/data=!4m7!3m6!1s0x471ffeadd038229f:0x8c763653b126753a!8m2!3d53.121893!4d23.1773325!16s%2Fg%2F1ptwr_tzh!19sChIJnyI40K3-H0cROnUmsVM2dow?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SushiGo!/data=!4m7!3m6!1s0x471ffd172a23784f:0x1e89ce43318f6df5!8m2!3d53.1446325!4d23.137189!16s%2Fg%2F11rv9q1lg6!19sChIJT3gjKhf9H0cR9W2PMUPOiR4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Rany+Julek/data=!4m7!3m6!1s0x471ffde575050435:0xee0ad67191f4343f!8m2!3d53.134242!4d23.1488231!16s%2Fg%2F11hym5n9sy!19sChIJNQQFdeX9H0cRPzT0kXHWCu4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Wej%C5%9Bcie+Smoka/data=!4m7!3m6!1s0x471ffd5ce610998f:0x44835c9239af7401!8m2!3d53.1308036!4d23.1594808!16s%2Fg%2F11fv520w1_!19sChIJj5kQ5lz9H0cRAXSvOZJcg0Q?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Osaka+Sushi/data=!4m7!3m6!1s0x46fd9f87c5d3023b:0x99c40af5d9de0848!8m2!3d54.423498!4d18.472268!16s%2Fg%2F11b88vkpvx!19sChIJOwLTxYef_UYRSAje2fUKxJk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Mito+Sushi/data=!4m7!3m6!1s0x46fd730aa84b545b:0xa7478a83a8a2322a!8m2!3d54.3511399!4d18.6550183!16s%2Fg%2F1pp2x880w!19sChIJW1RLqApz_UYRKjKiqIOKR6c?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Dom+Sushi/data=!4m7!3m6!1s0x46fd7376f41b6c45:0x873bb399020e801c!8m2!3d54.3527222!4d18.6579084!16s%2Fg%2F1yfp49ph_!19sChIJRWwb9HZz_UYRHIAOApmzO4c?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Timo+Sushi+Gda%C5%84sk/data=!4m7!3m6!1s0x46fd759e25b8a82d:0xf50f18f2222ff00c!8m2!3d54.3720109!4d18.5208006!16s%2Fg%2F11gb3n5lsl!19sChIJLai4JZ51_UYRDPAvIvIYD_U?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Hashi+Sushi+Gda%C5%84sk/data=!4m7!3m6!1s0x46fd74d4137f3015:0xc7393901572dbc95!8m2!3d54.402178!4d18.590987!16s%2Fg%2F11btwwhj_d!19sChIJFTB_E9R0_UYRlbwtVwE5Occ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Siedem/data=!4m7!3m6!1s0x46fd0b1d613983ff:0x248118fe9dbcc4f6!8m2!3d54.3503589!4d18.6572319!16s%2Fg%2F11knl7dr_v!19sChIJ_4M5YR0L_UYR9sS8nf4YgSQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Hokkaido+Sushi+and+Japan+Cuisine/data=!4m7!3m6!1s0x46fd733915b497ed:0xfe594e2a06f935a9!8m2!3d54.348896!4d18.652417!16s%2Fg%2F11pt_23n7l!19sChIJ7Ze0FTlz_UYRqTX5BipOWf4?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Rolki+-+Sushi+to+go/data=!4m7!3m6!1s0x46fd75c83a000d45:0xb813775a8bb449c5!8m2!3d54.3525533!4d18.5136145!16s%2Fg%2F11r0hmbbf9!19sChIJRQ0AOsh1_UYRxUm0i1p3E7g?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Izakaya+Sushi+Bar/data=!4m7!3m6!1s0x46fd73a0d2900961:0x14405c0008fccdd1!8m2!3d54.34815!4d18.6606889!16s%2Fg%2F11bwm4nhdr!19sChIJYQmQ0qBz_UYR0c38CABcQBQ?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Fusion+Sushi/data=!4m7!3m6!1s0x46fd749565444d61:0x1d056011f729d278!8m2!3d54.3771323!4d18.6088582!16s%2Fg%2F11c5h49vjl!19sChIJYU1EZZV0_UYReNIp9xFgBR0?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Yokai+Sushi/data=!4m7!3m6!1s0x46fd73801bffcca7:0x2b52b13fb7dee910!8m2!3d54.3501094!4d18.6563245!16s%2Fg%2F11rs2jfjtx!19sChIJp8z_G4Bz_UYREOnetz-xUis?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/SushiRola/data=!4m7!3m6!1s0x46fd75051503789d:0x86fedfdb6292f039!8m2!3d54.3495998!4d18.5347699!16s%2Fg%2F11f9fnt62b!19sChIJnXgDFQV1_UYROfCSYtvf_oY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/YAMA+SUSHI/data=!4m7!3m6!1s0x46fd75630c565583:0x3c64817dcbee1564!8m2!3d54.3953786!4d18.6432439!16s%2Fg%2F11rs2tvljh!19sChIJg1VWDGN1_UYRZBXuy32BZDw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/MaMi+Sushi/data=!4m7!3m6!1s0x46fd74e817227387:0x957bc63daaf36d45!8m2!3d54.3832932!4d18.5894527!16s%2Fg%2F11c5hkc4ry!19sChIJh3MiF-h0_UYRRW3zqj3Ge5U?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/KOKU+Sushi+Gda%C5%84sk/data=!4m7!3m6!1s0x46fd752ef3056383:0x1a525e6b30b8869d!8m2!3d54.4027688!4d18.5715213!16s%2Fg%2F11b6jddlff!19sChIJg2MF8y51_UYRnYa4MGteUho?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Timo+Sushi+Zajezdnia+Wrzeszcz/data=!4m7!3m6!1s0x46fd752fdd7e09ad:0x4899b7dc27a24cf7!8m2!3d54.3929299!4d18.6186102!16s%2Fg%2F11jz0y1lvr!19sChIJrQl-3S91_UYR90yiJ9y3mUg?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Time/data=!4m7!3m6!1s0x46fd75ee67ccb20d:0xf16ba9240d24f0a2!8m2!3d54.3829197!4d18.6052765!16s%2Fg%2F11hsxf_7w2!19sChIJDbLMZ-51_UYRovAkDSSpa_E?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Ryba+i+Ry%C5%BC+Sushi+Bar/data=!4m7!3m6!1s0x46fd0ba61f8d8d4b:0x106c75d58b9bc14e!8m2!3d54.4072307!4d18.6134768!16s%2Fg%2F11qns3s4k3!19sChIJS42NH6YL_UYRTsGbi9V1bBA?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Gyozilla+Sushi+%26+Cocktails/data=!4m7!3m6!1s0x46fd75ce5583a6d5:0x196d05e94fcecfaa!8m2!3d54.3816262!4d18.5874848!16s%2Fg%2F11t7vqy49x!19sChIJ1aaDVc51_UYRqs_OT-kFbRk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Shama/data=!4m7!3m6!1s0x46fd73c4b02f622b:0x610d82963c08d791!8m2!3d54.3336359!4d18.6160648!16s%2Fg%2F11rjkbwx9k!19sChIJK2IvsMRz_UYRkdcIPJaCDWE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Express/data=!4m7!3m6!1s0x46fd73a88cb318f5:0xb6a1883a3d92c485!8m2!3d54.3491532!4d18.6437054!16s%2Fg%2F11hf35z4g6!19sChIJ9RizjKhz_UYRhcSSPTqIobY?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/MusheSushi/data=!4m7!3m6!1s0x46fd75761ce5ac85:0x80bb62ad3a74d064!8m2!3d54.3966803!4d18.6034437!16s%2Fg%2F11sfphpl5w!19sChIJhazlHHZ1_UYRZNB0Oq1iu4A?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Nabogato+Sushi+Bar/data=!4m7!3m6!1s0x46fd758be3491da3:0x9ea0b0b574d2209!8m2!3d54.3511003!4d18.5869809!16s%2Fg%2F11j0hpp0zd!19sChIJox1J44t1_UYRCSJNVwsL6gk?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Home/data=!4m7!3m6!1s0x46fd7559da8318cb:0xdad5ffe0b821182c!8m2!3d54.373635!4d18.62635!16s%2Fg%2F11s5yy9wdy!19sChIJyxiD2ll1_UYRLBghuOD_1do?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Dla+Mnie+Galeria+Morena/data=!4m7!3m6!1s0x46fd75ee73631b3b:0x1b78c92429440b7!8m2!3d54.3526378!4d18.594005!16s%2Fg%2F11rr1qryn2!19sChIJOxtjc-51_UYRt0CUQpKMtwE?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Sushi+Express/data=!4m7!3m6!1s0x46fd0b9b6c99bba3:0x77896f9c822072a4!8m2!3d54.4092891!4d18.5913834!16s%2Fg%2F11rrp2s3q6!19sChIJo7uZbJsL_UYRpHIggpxviXc?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Nova+Sushi/data=!4m7!3m6!1s0x46fd75561b09c571:0x9b1d31706859d2d1!8m2!3d54.3760454!4d18.6229102!16s%2Fg%2F11p76wcdb_!19sChIJccUJG1Z1_UYR0dJZaHAxHZs?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/Brilliant+Sushi/data=!4m7!3m6!1s0x46fd75a09191f2f1:0x254f485e5de59b8a!8m2!3d54.3280314!4d18.5818006!16s%2Fg%2F11rtmz89jw!19sChIJ8fKRkaB1_UYRipvlXV5ITyU?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/MaMi+Sushi/data=!4m7!3m6!1s0x46fd7545ac811ba1:0xac267f98a06bcc05!8m2!3d54.3390632!4d18.559218!16s%2Fg%2F11k12k9409!19sChIJoRuBrEV1_UYRBcxroJh_Jqw?authuser=0&hl=en&rclk=1',
'https://www.google.com.ua/maps/place/PING+PONG+ramen%2Fsushi/data=!4m7!3m6!1s0x46fd0b3744dde42d:0xd1b91d45cb88811a!8m2!3d54.4183443!4d18.5671564!16s%2Fg%2F11spn9r0g_!19sChIJLeTdRDcL_UYRGoGIy0UdudE?authuser=0&hl=en&rclk=1',
]

let currentIteratorStep = 0;
function placesLinksIterator(array) {
  if (currentIteratorStep === array.length) {
    log.debug('process finished succesfully');
    return false;
  }

  ++currentIteratorStep
  // log.info(array[currentIteratorStep-1]);
  return array[currentIteratorStep - 1]
}

async function parseLink(url) {
  if (url === false) {
    log.debug('exit');
    exit();
  }

  await axios(url)
    .then(response => {
      log.info(response.status)

      // handleResponseData(response.data)
      
      //returns data array
      log.info(handleResponseData(response.data))

    })
    .catch(error => {
      log.error(error)
    });


  await parseLink(placesLinksIterator(gmapsPlacesLinksArray))
}



parseLink(placesLinksIterator(gmapsPlacesLinksArray))

function handleResponseData(data) {
  const currentLine = {}


  
  const infoStrEnd = data.indexOf('itemprop="name">');
  const infoStrStart = data.lastIndexOf('<meta content=', infoStrEnd);
  let infoStr = data.slice(infoStrStart + 15, infoStrEnd - 2);

  infoStr = infoStr.split(' · ');
  currentLine.name = infoStr[0];
  currentLine.address = infoStr[1];

  const activityStrEnd = data.indexOf('" itemprop="description">');
  const activityStrStart = data.lastIndexOf('<meta content="', activityStrEnd)
  const activity = data.slice(activityStrStart + 23, activityStrEnd);

  currentLine.activity = activity;

  const phoneStrStart = data.indexOf('tel:')
  const phoneStrEnd = data.indexOf('",', phoneStrStart);
  if (phoneStrStart !== -1 ) {
    currentLine.phone = data.slice(phoneStrStart + 4, phoneStrEnd - 1);
  } else {
    currentLine.phone = 'null';
  }

  const siteStrStart = data.indexOf(`],null,null,[\\"/url?q\\\\u003dhttp`)
  const siteStrEnd = data.indexOf(`u0026sa`, siteStrStart);
  if (siteStrStart !== -1 ) {
    try {
      currentLine.site = data.slice(siteStrStart + 28, siteStrEnd - 2 )
      currentLine.site = decodeURIComponent(currentLine.site);
      currentLine.site = decodeURIComponent(currentLine.site);
    } catch (error) {
      log.error(error)
    }
  } else {
    currentLine.site = 'null';
  }
  
  // log.warn(`site:${currentLine.site}`)

  return currentLine
}