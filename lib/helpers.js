/*
*
*   Helpers
*
*/

//Dependencies
const configs = require('./configs')
const crypto = require('crypto')
const https = require('https')
const querystring = require('querystring')

//Define helpers container
const helpers = {}

//Regex check if string is email
helpers.checkEmailString = string => {
    const emailRegex = /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/;
    return emailRegex.test(string);
}

//Regex check 
helpers.checkPasswordString = string => {
    //Password must have aleast:
    //      *at least 8 characters
    //      *at least 1 numeric character
    //      *at least 1 lowercase letter
    //      *at least 1 uppercase letter
    //      *at least 1 special character
    const passwordRegex =  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/
    return passwordRegex.test(string);
} 

//Create SHA256 hash
helpers.hashString = string => {
    if(typeof string == 'string' && string.length > 0) return crypto.createHmac('sha256', configs.hashingSecret).update(string).digest('hex')
    else return false
}

//Parse JSON string to an object to all cases, without throwing
helpers.parseJsonToObject = string => {
    try {return JSON.parse(string)}
    catch (err) {return {}}
}

//Create string of random alphanumeric characters, of a given length
helpers.createRandomString = length => {
    length = typeof length == 'number' && length > 0 ? length: false
    //Define all possible characters
    let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    //Define random string container
    let randomString = '';
    //Create random string
    for(let i=0;i<length;i++){
        //Append random character from possible characters to random string
        randomString += possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length))
    }
    //Return random string
    return randomString
}

//Stripe API Request
helpers.stripeCharge = (amount, currency, description, source, callback) => {
    //Stripe payload
    const payload = {
        'amount': amount,
        'currency': currency,
        'description': description,
        'source': source
    }

    //Stringify the payload
    const strPayload = querystring.stringify(payload)

    //Configure the request details
    const reqDetails = {
        'protocol': 'https:',
        'hostname': 'api.stripe.com',
        'method': 'POST',
        'auth': configs.stripe.secKey,
        'path': '/v1/charges',
        'payload': strPayload,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(strPayload)
        }
    }
    
    //Instanciate the resquest object
    const req = https.request(reqDetails, res => {
        //Grab the status of the response
        const status = res.statusCode
        //Callback successfully if request went through
        status == 200 || status == 201 ? callback(false) : callback('Status code returned was '+status)
    }).on('error', err => {
        callback(err)
    })

    //Add the payload
    req.write(strPayload)

    //End the request
    req.end()
}

//Mailgun API request
helpers.mailgunReceipt = (to, subject, content, callback) => {
    //Mailgun payload
    const payload = {
        'from': configs.mailgun.from,
        'to': to,
        'subject': subject,
        'text': content
    }

    //Stringify the payload
    const strPayload = querystring.stringify(payload)
    
    //Configure the request details
    const reqDetails = {
        'protocol': 'https:',
        'hostname': 'api.mailgun.net',
        'method': 'POST',
        'path': '/v3/'+configs.mailgun.domain+'/messages',
        'auth': 'api:'+configs.mailgun.apiKey,
        'payload': strPayload,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(strPayload)
        }
    }

    //Instanciate the resquest object
    const req = https.request(reqDetails, res => {
        //Grab the status of the response
        const status = res.statusCode
        //Callback successfully if request went through
        status == 200 || status == 201 ? callback(false) : callback('Status code returned was '+status)
    }).on('error', err => {
        callback(err)
    })

    //Add the payload
    req.write(strPayload)

    //End the request
    req.end()
}

//Export module
module.exports = helpers