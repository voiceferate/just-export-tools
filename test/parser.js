const axios = require('axios');
const fs = require('fs');
const { loadavg } = require('os');


const file_input_array = fs.readFileSync('src.txt').toString().split("\r\n");

let arr = [];

file_input_array.forEach(function (currentValue, index, array) {
  let url = currentValue;

  console.log(url)

  axios(url)
    .then(response => {
      const html = response.data;
      arr.push(html)

      // console.log(html)

    }).then(()=>{
      console.log('parsed line');
      fs.writeFile(

        './my.json',
      
        JSON.stringify(arr),
      
        function (err) {
            if (err) {
                console.error('Crap happens');
            }
        }
      );
    })
    .catch(error => {
      console.log('some error happend')
    });
  });








function delBrLink (s) {return s.replace (/\s{1,}/g, '')};
function delBr (s) {return s.replace (/\s{2,}/g, ' ')};

