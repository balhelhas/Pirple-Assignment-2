/*
* 
*   Server
* 
*/

//Dependecies
const fs = require('fs')
const url = require('url')
const util = require('util')
const path = require('path')
const http = require('http')
const https = require('https')
const stringDecoder = require('string_decoder').StringDecoder
const debug = util.debuglog('server')
const configs = require('./configs')
const helpers = require('./helpers')
const users = require('./handlers/users')
const orders = require('./handlers/orders')
const tokens = require('./handlers/tokens')
const menus = require('./handlers/menus')
const shoppingcarts = require('./handlers/shoppingcarts')


//Define server
const server = {}

//Instantiate the HTTP server
server.httpServer = http.createServer((req,res) => {
    server.startServer(req,res)
});

//Instantiate HTTPS server options
server.httpsSvrOpts = {
    'key': fs.readFileSync(path.join(__dirname,'../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'../https/cert.pem'))
}

//Instantiate the HTTPS server
server.httpsServer = https.createServer(server.httpsSvrOpts,(req,res) => {
    server.startServer(req,res)
})

//Start-server method with both http and https logic
server.startServer = (req,res) => {
    //Get the url and parse it
    let parsedURL = url.parse(req.url,true)
    //Get path from the parsed url
    let path = parsedURL.pathname.replace(/^\/+|\/+$/g, '')
    //Get the query string as an object
    let queryStrObj = parsedURL.query
    //Get the method
    let method = req.method.toLowerCase()
    //Get the headers
    let headers = req.headers
    //Define string decoder
    let decoder = new stringDecoder('utf-8')
    //Intialize payload buffer
    let payloadBuffer = ''
    //Handling request
    req.on('data',(data) => {
        //Get payload data if any
        payloadBuffer += decoder.write(data);
    }).on('end',() =>{
        payloadBuffer += decoder.end();
        //Construct the data object for the handlers
        let data = {
            'path': path,
            'queryStrObj': queryStrObj,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(payloadBuffer)
        }
        //Pick the handler, if it doesn't existe send notFound route
        let choseHandler = typeof(server.router[path]) !== 'undefined' ? server.router[path] : server.router['notFound'];
        //Route the request to the specified handler
        choseHandler(data,(statusCode,payload) => {
            //Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200
            //Use the payload called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {}
            //COnvert payload to a string
            let strPayload = JSON.stringify(payload)
            //Return the response
            res.setHeader('Content-Type','application/json')
            res.writeHead(statusCode)
            res.end(strPayload)
            //Debugging the server response
            if(statusCode == 200) debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+path+' '+statusCode)
            else debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+path+' '+statusCode)
        })
    })
}

//Define request router
server.router = {
    'users' : users.handler,
    'orders' : orders.handler,
    'tokens' : tokens.handler,
    'menus' : menus.handler,
    'shoppingcarts' : shoppingcarts.handler, 
    'notFound': (data,callback) => callback(404), 
};

//Server initialization
server.init = () => {
    //Start the HTTP server
    server.httpServer.listen(configs.httpPort,() => {
        console.log('\x1b[34m%s\x1b[0m','The server is listenning on port ' + configs.httpPort);
    })
    //Start the HTTPS server
    server.httpsServer.listen(configs.httpsPort,() => {
        console.log('\x1b[35m%s\x1b[0m','The server is listenning on port ' + configs.httpsPort);
    })
}

// Export the module
module.exports = server;