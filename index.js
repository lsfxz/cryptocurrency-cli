#! /usr/bin/env node

const supportsColor = require('supports-color');
const request = require('request');
const ctx = require('chalk');
const chalk = new ctx.constructor({level: 3});
// const blue = chalk.hex('#5cadff')
// const green = chalk.hex('#5add60')
const Table = require('cli-table');
const figlet = require('figlet');
const Barcli = require("barcli");
const path = require('path');
const fs = require('fs');
const os = require('os');
const program = require('commander');
const getSymbolFromCurrency = require('currency-symbol-map');
var portfolio;
fs.exists(path.resolve(path.join(os.homedir(),'portfolio.json')), function (exists) {
  if (exists)
  {
    portfolio = require(path.resolve(path.join(os.homedir(),'portfolio.json')));
  }
  else
  {
    portfolio = require(path.resolve(__dirname,'portfolio.json'));
  }
});


/**
 * Command Line Options
 */

program
  .version('1.4.3')
  .option('-c, --currency [value]', 'An optional currency value', 'USD')
  .parse(process.argv);

/**
 * Set currency
 */
var curUp = program.currency.toUpperCase();
var curLow = program.currency.toLowerCase();
var curSym = getSymbolFromCurrency(curUp);

/**
 * Loading Message Figlet Style
 */

figletLog('Crypto Portfolio Loading...');

/**
 * Request and table
 */
const requestUrl = 'https://api.coinmarketcap.com/v1/ticker/?convert=' + curUp + '&limit=-1';

request(requestUrl, function (error, response, body) {
  var data = JSON.parse(body);
  var table = new Table({ head: [
    chalk.keyword('skyblue')('Rank'),
    chalk.keyword('skyblue')('Coin'),
    chalk.keyword('skyblue')(`${curUp} Price`),
    chalk.keyword('skyblue')('Coins Owned'),
    chalk.keyword('skyblue')('Net Worth'),
    chalk.keyword('skyblue')('24 Hour Volume'),
    chalk.keyword('skyblue')('Market Cap'),
    chalk.keyword('skyblue')('1 Hour'),
    chalk.keyword('skyblue')('24 Hours'),
    chalk.keyword('skyblue')('7 Days'),
    chalk.keyword('skyblue')('Last Updated'),
  ] });
  var portfolioTotal = 0;
  var barData = {};
  data.forEach(function (value, key) {
    if(portfolio.hasOwnProperty(value.id)) {
      table.push([
        chalk.keyword('skyblue')(value.rank),
        chalk.keyword('darkseagreen')(value.id),
        chalk.keyword('darkseagreen')(curSym+addCommas(value['price_'+curLow])),
        chalk.keyword('darkseagreen')(addCommas(portfolio[value.id])),
        chalk.keyword('darkseagreen')(curSym+addCommas(Number(Math.round(value['price_'+curLow] * portfolio[value.id])))),
        chalk.keyword('darkseagreen')(curSym+addCommas(addZeroes(value['24h_volume_'+curLow]))),
        chalk.keyword('darkseagreen')(curSym+addCommas(addZeroes(value['market_cap_'+curLow]))),
        chalk.keyword('darkseagreen')(`${value.percent_change_1h}%`),
        chalk.keyword('darkseagreen')(`${value.percent_change_24h}%`),
        chalk.keyword('darkseagreen')(`${value.percent_change_7d}%`),
        chalk.keyword('darkseagreen')(timeSince(new Date(value.last_updated * 1000)) + ' ago'),
      ]);
      var totalValue = Number(Math.round(value['price_'+curLow] * portfolio[value.id]));
      var coinName = value.id;
      barData[coinName] = totalValue;
      portfolioTotal += totalValue;
    }
  });
  barGraph(barData, portfolioTotal);
  console.log('\n'+table.toString());
  console.log(chalk.keyword('skyblue').underline(`Portfolio Total: ${curSym}${portfolioTotal}`));
  console.log(' ');
});

/**
 * Figlet console log
 */

function figletLog(text) {
  figlet(text, function(err, data) {
    if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
    }
    console.log(data)
  });
}

/**
 * Bar Graphs For Coins
 */

function barGraph(barData, total) {
  Object.keys(barData).forEach(function(key) {
    var label = `${key} ${curSym}${barData[key]}`;
    var graph = new Barcli({
      label: label,
      range: [0, 100],
    });
    var percent = Math.round((barData[key] / total) * 100);
    graph.update(percent);
  });
}

/**
* Add zero if number only has one zero
* Example: $666,888.0 >> $666,888.00
* Fixes coinmarketcap API issues for market caps
* https://stackoverflow.com/a/24039448
*/

function addZeroes(num) {
  if (!num)
    return '?';
  var value = Number(num);
  var res = num.split(".");
  if(num.indexOf('.') === -1) {
    value = value.toFixed(2);
    num = value.toString();
  } else if (res[1].length < 3) {
    value = value.toFixed(2);
    num = value.toString();
  }
  return num
}

/**
* Comma seperate big numbers
* Took multiple answers
* from https://stackoverflow.com/questions/1990512/add-comma-to-numbers-every-three-digits/
* This work with small coins like dogecoin and does not comma seperate AFTER decimals
*/

function addCommas(nStr){
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
};


/**
* Pretty time format X ago function
* https://stackoverflow.com/a/3177838
*/

function timeSince(date) {
  var seconds = Math.floor((new Date() - date) / 1000);
  var interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return interval + " years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}

