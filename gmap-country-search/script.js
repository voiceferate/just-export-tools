const { exit } = require('process');
const  countriesList  = require('./countries').countries;
const log = require('cllc')();

const arguments = process.argv.slice(2)

if (arguments.length == 0 || arguments.length !== 2) {
  log.e('arguments empty or has a wrong format');
  exit();
}
if (!countriesList.hasOwnProperty(arguments[1].toUpperCase())) {
  log.e('you have entered nonexistent country shortname');
  exit();
}

function makeQueriesArray(arg) {
  let arr = []
  countriesList[arg[1].toUpperCase()].forEach(element => {
    arr.push(`${arg[0]} at ${element[1]}, ${element[0]}`)
  });
  return arr;
}



log(makeQueriesArray(arguments))
