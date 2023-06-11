let output_arr = []

import('https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js').then(({ test }) => {
  console.log('juqery imported');

  $('.Nv2PK.THOPZb').each(function(){
    let company_name =     $(this).find('.NrDZNb').text().trim().replace(/,/g, ".")
    let company_activity = $(this).find('.Z8fK3b .W4Efsd .W4Efsd:nth-child(1) span:nth-child(1) span').text().replace(/,/g, ".")
    let company_address =  $(this).find('.Z8fK3b .W4Efsd .W4Efsd:nth-child(1) span:nth-child(2) span').text().replace(/,/g, ".")
    let phone =            $(this).find('.Z8fK3b .UaQhfb .W4Efsd .W4Efsd:nth-child(2)>span:nth-child(2)>span:nth-child(2)').text().replace(/,/g, ".")
    let site_link =        $(this).find('.Rwjeuc a').first().attr('href')

    output_arr.push([company_name, company_activity, company_address, phone, site_link]);
  })

  const generatedCSV = []

  output_arr.forEach((element, index, array) => {
    let currentStr = ''
    currentStr = element.join()
    generatedCSV.push(currentStr)
  })
  console.log('result_________________________________________, \r\n')
  console.log(generatedCSV.join("\r\n"))
});