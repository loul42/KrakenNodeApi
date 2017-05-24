var KrakenClient = require('kraken-api');
var kraken = new KrakenClient('', '');

// Display user's balance
kraken.api('Balance', null, function(error, data) {
    if(error) {
        console.log(error);
    }
    else {
        console.log(data.result);
    }
});

// Display user's orders
kraken.api('OpenOrders', null, function(error, data) {
    if(error) {
        console.log(error);
    }
    else {
        console.log(data.result);
    }
});

// Display Depth
kraken.api('Depth', null, function(error, data) {
    if(error) {
        console.log(error);
    }
    else {
        console.log(data.result);
    }
});
