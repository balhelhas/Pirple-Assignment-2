/*
*
*  Tokens Handler
*
*/

//Dependencies 
const _data = require('../data')
const configs = require('../configs')
const helpers = require('../helpers')
const util = require('util')
const debug = util.debuglog('tokens')

//Define tokens
const tokens = {}

//Tokens handler
tokens.handler = (data, callback) => {
    configs.acceptMethods.indexOf(data.method) > -1 ? tokens._methods[data.method](data,callback) : callback(405)
}

//Tokens methods container
tokens._methods = {}

// Tokens - POST
// Required: email, password
// Optional: none
tokens._methods.post = (data, callback) => {
    const email = typeof data.payload.email == 'string' && helpers.checkEmailString(data.payload.email.trim()) ? data.payload.email.trim() : false;
    const password = typeof data.payload.password == 'string' && helpers.checkPasswordString(data.payload.password.trim()) ? data.payload.password.trim() : false;
    debug('\x1b[35m%s\x1b[0m','Payload: ',data);
    if(email && password)
        //Lookup user
        _data.read('users', email, (err,data) => {
            if(!err && data){
                //Hash the password, and compare it to the password stored in the user object
                const hashedPassword = helpers.hashString(password)
                if(data.password == hashedPassword){
                    //If valid, create a new token with a random id, with a experation date one hour after created.
                    const tokenObject = {
                        'email': email,
                        'id': helpers.createRandomString(20),
                        'expires': Date.now() + 1000 * 60 * 60
                    }
                    //Store the token
                    _data.create('tokens', tokenObject.id, tokenObject, err => {
                        if(!err) callback(200,tokenObject)
                        else callback(500,{'ERROR' : 'Could not create the token!'})
                    })
                }else callback(400,{'ERROR' : 'Password did not match the specified user\'s password!'})
            }else callback(400,{'ERROR' : 'Could not find especified user!'})
        })
    else callback(400,{'ERROR' : 'Missing or invalid required fields.\nPassword needs to be eigth or more characters long, have one upper case and special(not reserved RegEx) character!\nMust pass an email!'}), debug('\x1b[31m%s\x1b[0m', '[400] Email: '+email+' Password: '+password)
}

//Tokens - GET
//Required: tokenId 
//Optional: none
tokens._methods.get = (data, callback) => {
    const  tokenId = typeof data.queryStrObj.id == 'string' && data.queryStrObj.id.trim().length == 20 ? data.queryStrObj.id.trim() : false;
    if(tokenId)
        _data.read('tokens', tokenId, (err, tokenData) => {
            if(!err && tokenData) callback(200,tokenData);
            else callback(404)
        })
    else callback(400,{'ERROR' : 'Missing required fields!'})
}

// Tokens - put
// Required data: tokenId, extend
// Optional data: none
tokens._methods.put = (data,callback) => {
    const id = typeof data.payload.id == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof data.payload.extend == 'boolean' && data.payload.extend == true ? true : false;

    if(id && extend)
        // Lookup token
        _data.read('tokens',id, (err,tokenData) => {
            if(!err && tokenData)
                //Check to make sure the token isn't already expired
                if(tokenData.expires > Date.now()){
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000*60*60
                    // Store the new updates
                    _data.update('tokens', id, tokenData, err => {
                        if(!err) callback(200)
                        else callback(500,{'ERROR' : 'Could not update the token\'s expiration date!'})
                    });
                }else callback(400, {'ERROR' : 'Token has already expired, and cannot be extended!'})   
            else callback(400, {'ERROR' : 'Specified token does not exist!'})
        })
    else callback(400,{'ERROR' : 'Missing required field(s) or field(s) are invalid!'})
}

// Tokens - DELETE
// Required data: email, tokenId
// Optional data: none
tokens._methods.delete = (data,callback) => {
    //Check if email is valid 
    const email = typeof data.queryStrObj.email == 'string' && helpers.checkEmailString(data.queryStrObj.email.trim()) ? data.queryStrObj.email.trim() : false
    if(email){
        // Check if token is valid
        const tokenId = typeof data.headers.token == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false
        if(tokenId)
            tokens._methods.verifyToken(token, email, isValid => { 
                if(isValid)
                    //Remove the hashed password from the user object before returning it to the request
                    _data.delete('tokens',tokenId,(err) => {
                        if(!err) callback(200)
                        else callback(500,{'ERROR' : 'Could not delete the token!'})
                    })
                else callback(404,{'ERROR' : 'Could not find especified token or it is expired!'})
            })
        else callback(400,{'ERROR' : 'Missing or invalid token in headers!'})
    }else callback(400,{'ERROR': 'Missing or invalid email query string!'})
}

//Verify if a given token id is currently valid for a given user
tokens._methods.verifyToken = (id, email, callback) => {
    //Lookup the token
    _data.read('tokens', id, (err, tokenData) => { 
        if(!err && tokenData)
            //Check that the token is for the given user and has not expired
            if(tokenData.email == email && tokenData.expires > Date.now()) callback(true)
            else callback(false)
        else callback(false)
    })
}

//Verify if token is currently valid 
tokens._methods.validateToken = (id, callback) => {
    //Lookup the token
    _data.read('tokens', id, (err, tokenData) => { 
        if(!err && tokenData)
            //Check that the token is for the given user and has not expired
            if(tokenData.expires > Date.now()) callback(tokenData)
            else callback(false)
        else callback(false)
    })
}

//Export module
module.exports = tokens