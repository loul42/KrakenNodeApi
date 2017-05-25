var KrakenClient = require('kraken-api');
var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Preferences = require('preferences');
var Spinner     = CLI.Spinner;
var GitHubApi   = require('github');
var git         = require('simple-git')();
var touch       = require('touch');
var fs          = require('fs');
var clc = require('cli-color');
var kraken = null ;
var prefs = new Preferences('krakenapi');
var winston = require ('winston')

/*
winston.stream().on('error', function(log) {
    new Line(balanceBuffer)
        .column( log,20,[clc.red]
        ).fill
        .store();
})*/


initApp();


// Ask for Api keys of kraken is never done before
// keys are encrypted with an independant password and saved
function initApp() {

    //conf logger
    winston.configure({
        transports: [
            new (winston.transports.File)({ filename: 'krakenapi.log' })
           // , new (winston.transports.Console)()
        ]
    });



    getKrakenAPIKeys(function(data,callback){
        if (data) {
            prefs.apikeys = {
                api_key : data.api_key,
                api_secret : data.api_secret
            };
        }

        kraken = new KrakenClient(prefs.apikeys.api_key, prefs.apikeys.api_secret);

        getEthCurrentPrice();




        });



}

function  getEthCurrentPrice(bool){


     var statuPrice = new Spinner('Trying to connect to get current ETH price , please wait...');
        statuPrice.start();
        //Get current ETH price
        kraken.api('Ticker', {"pair": 'XETHZEUR'}, function (error, data) {
            if (error) {
                statuPrice.stop();
                console.log("Error retrieving Eth price");

            }
            else {
                var line, line2, line3, line4;

                var lastprice = data.result['XETHZEUR']['c'][0];
                var low = data.result['XETHZEUR']['l'][0];
                var high = data.result['XETHZEUR']['h'][0];
                var numberoftradelast24h = data.result['XETHZEUR']['t'][1];

                statuPrice.stop();
                console.log("---------- ETH PRICE ----------");
                console.log("Last : " + lastprice);
                console.log("Low : " + low);
                console.log("High : " + high);
                console.log("Number of trade 24H : " + numberoftradelast24h);

            }

            getBalance();


        });


}

function getBalance(){


    var status = new Spinner('Trying to connect to get your balance, please wait...');
    status.start();

    // Display user's balance
    kraken.api('Balance', null, function(error, data,callback) {
        if(error) {
            status.stop();
            console.log("Error with retriving balance");
        }
        else {

            status.stop();

            console.log("---------- MY BALANCE ----------");
            console.log( "EUR : " + data.result['ZEUR']);
            console.log( "ETH : " + data.result['XETH']);
            console.log( "ICN : " + data.result['XICN']);
            console.log( "REP : " + data.result['XREP']);


        }
        choices( function(data){
            if (data && data.confirm == true){
                switch (data.buyorsell){

                    case 'BUY WITH LIMIT':
                        winston.error(data);
                        buy(data.amount,data.limit);
                        break;
                    case 'SELL WITH LIMIT':
                        winston.error(data);
                        sell(data.amount,data.limit);
                        break;
                    case 'SHOW OPEN ORDERS':
                        showCurrOrders();
                        break;
                    case 'CANCEL ORDER':
                        cancelOrder(data.txid);
                        break;
                    case 'REFRESH MODE':
                        refreshAll();
                        break;
                    default:
                        console.log("Sorry nothing happened");
                        exit;
                }

        }

        });
    });
}

// buy xx Amount ETH @ price
function buy(amount,limit){
    var status = new Spinner('Trying to buy ' + amount + ' ETH at '+  limit + ' € , please wait...');
    status.start();


    var json_buy = {
        "pair": 'XETHZEUR',
        "type": 'buy',
        "ordertype": 'limit',
        "price": limit,
        "volume": amount
    };

    kraken.api('AddOrder', json_buy, function(error, data,callback) {
        if(error) {
            status.stop();
            console.log(error);
            winston.error(error);
            console.log("Error BUYING ");
            showCurrOrders();
        }
        else {

            status.stop();
            winston.error(data);
            console.log("---------- BUY ORDER DONE ----------");
            console.log(data);
            showCurrOrders();
        }
    });
}

// sell xx Amount ETH @ price
function sell(amount,limit){
    var status = new Spinner('Trying to sell ' + amount + ' ETH at '+  limit + ' € , please wait...');
    status.start();


    var json_buy = {
        "pair": 'XETHZEUR',
        "type": 'sell',
        "ordertype": 'limit',
        "price": limit,
        "volume": amount
    };

    kraken.api('AddOrder', json_buy, function(error, data,callback) {
        if(error) {
            status.stop();
            console.log(error);
            winston.error(error);
            console.log("Error SELLING ");
            showCurrOrders();
        }
        else {

            status.stop();
            winston.error(data);
            console.log("---------- SELL ORDER DONE ----------");
            console.log(data);
            showCurrOrders();
        }
    });

}


// cancel orders
function cancelOrder(txid){
    var status = new Spinner('Trying to connect to cancel order ' + txid + ', please wait...');
    status.start();

    var json_cancel ={
        "txid" : txid
    };
    // Display user's balance
    kraken.api('CancelOrder', txid , function(error, data,callback) {
        if(error) {
            status.stop();
            console.log("Error with cancelling order" + txid);
            winston.error(error);
        }
        else {

            status.stop();

            console.log("---------- OPEN ORDERS ----------");
            console.log(data.result);
            console.log("---------- END OPEN ORDERS ----------");


        }
    });
}

// show open orders
function showCurrOrders(){
    var status = new Spinner('Trying to connect to show current orders, please wait...');
    status.start();

    // Display user's balance
    kraken.api('OpenOrders', null, function(error, data,callback) {
        if(error) {
            status.stop();
            console.log("Error with retriving open orders");
            winston.error(error);
        }
        else {

            status.stop();

            console.log("---------- OPEN ORDERS ----------");
            console.log(data.result.open);
            console.log("---------- END OPEN ORDERS ----------");


        }
    });
}

function choices(callback){
    console.log( "MENU, CANCEL ORDER,market thing IS NOT WORKING");
    var questions = [
        {
            name: 'buyorsell',
            type: 'list',
            choices: [  new inquirer.Separator(),"BUY WITH LIMIT", "SELL WITH LIMIT", "BUY MARKET", "SELL MARKET", "CANCEL ORDER", "SHOW OPEN ORDERS", "CANCEL ORDER", "REFRESH MODE" ],
            message: 'Buy or sell eth :',
            validate : function(value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Pleas enter sth';
                }
            }},
        {
            name: 'txid',
            type: 'input',
            message: 'Enter txid to cancel order :',
            validate: function(value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Pleas enter sth';
                }
            },
            when : function(value){
                if (value.buyorsell == 'CANCEL ORDER'){
                    showCurrOrders();
                    return true;
                }else{
                    return false;
                }
            }
        },
        {
            name: 'amount',
            type: 'input',
            message: 'Enter the amount (use dot . if decimal) :',
            validate: function(value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Pleas enter sth';
                }
            },
            when : function(value){
                if (value.buyorsell == 'SHOW OPEN ORDERS' || value.buyorsell == 'CANCEL ORDER' || value.buyorsell == 'REFRESH MODE'){
                    return false;
                }else{
                    return true;
                }
            }
        },
        {
            name: 'limit',
            type: 'input',
            message: 'Enter the price limit (use dot . if decimal)  :',
            validate: function(value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Pleas enter sth';
                }
            },
            when : function(value){
                if (value.buyorsell == 'SHOW OPEN ORDERS' || value.buyorsell == 'CANCEL ORDER' || value.buyorsell == 'REFRESH MODE'){
                    return false;
                }else{
                    return true;
                }
            }
        },
        {
            name: 'confirm',
            type: 'confirm',
            message: 'DO YOU CONFIRM ORDER ? :',
            validate: function(value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Pleas enter sth';
                }
            }
        }
];


    inquirer.prompt(questions).then(callback);


}

function getKrakenAPIKeys(callback) {

    var questions = [
        {
            name: 'api_key',
            type: 'input',
            message: 'Enter your Kraken API Key:',
            validate: function( value ) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your Kraken API Key';
                }
            }
        },
        {
            name: 'api_secret',
            type: 'input',
            message: 'Enter your Kraken API secret :',
            validate: function(value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your Kraken API Secret';
                }
            }
        }
    ];

    if (!prefs.apikeys) {
        inquirer.prompt(questions).then(callback);
    }else{
        callback();
    }

}

function refreshAll() {
    clear();


    setInterval(getEthCurrentPrice_2, 1000);

    setInterval(getBalance_2, 20000);

    /*
    setInterval(getEthCurrentPrice_2, 1000);
    setInterval(getBalance_2, 1000);
    setInterval(showCurrOrders, 1000);*/


}


function  getEthCurrentPrice_2(){


    var statuPrice = new Spinner('Trying to connect to get current ETH price , please wait...');
    statuPrice.start();
    //Get current ETH price
    kraken.api('Ticker', {"pair": 'XETHZEUR'}, function (error, data) {
        if (error) {
            statuPrice.stop();
            console.log("Error retrieving Eth price");

        }
        else {
            var line, line2, line3, line4;

            var lastprice = data.result['XETHZEUR']['c'][0];
            var low = data.result['XETHZEUR']['l'][0];
            var high = data.result['XETHZEUR']['h'][0];
            var numberoftradelast24h = data.result['XETHZEUR']['t'][1];

            statuPrice.stop();
            console.log("---------- ETH PRICE ----------");
            console.log("ETH LAST PRICE  : " + lastprice);


        }




    });

}



function getBalance_2(){

    clear();
    var status = new Spinner('Trying to connect to get your balance, please wait...');
    status.start();

    // Display user's balance
    kraken.api('Balance', null, function(error, data,callback) {
        if(error) {
            status.stop();
            console.log("Error with retriving balance");
        }
        else {

            status.stop();

            console.log("---------- MY BALANCE ----------");
            console.log( "EUR : " + data.result['ZEUR']);
            console.log( "ETH : " + data.result['XETH']);
            console.log( "ICN : " + data.result['XICN']);
            console.log( "REP : " + data.result['XREP']);

            showCurrOrders_2();
        }


        });
}


// show open orders
function showCurrOrders_2(){

    var status = new Spinner('Trying to connect to show current orders, please wait...');
    status.start();

    // Display user's balance
    kraken.api('OpenOrders', null, function(error, data,callback) {
        if(error) {
            status.stop();
            console.log("Error with retriving open orders");
            winston.error(error);
        }
        else {

            status.stop();

            console.log("---------- OPEN ORDERS ----------");
            console.log(data.result.open);
            console.log("---------- END OPEN ORDERS ----------");


        }
    });
}