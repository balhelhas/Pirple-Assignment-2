/*
*
*  Users Handler
*
*/

//Dependencies 
const _data = require('../data')
const configs = require('../configs')
const helpers = require('../helpers')
const tokens = require('./tokens')
const util = require('util')
const debug = util.debuglog('users')

//Define users
const users = {}

//Users handler
users.handler = (data, callback) => {
    configs.acceptMethods.indexOf(data.method) > -1 ? users._methods[data.method](data,callback) : callback(405)
}

//Users methods container
users._methods = {};

//Users - POST
//Required: name, email, address, password
//Optional: none
users._methods.post = (data, callback) => {
    //Check if required fields were field
    const name = typeof data.payload.name == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false
    const email = typeof data.payload.email == 'string' && helpers.checkEmailString(data.payload.email.trim()) ? data.payload.email.trim() : false
    const address = typeof data.payload.address == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false
    const password = typeof data.payload.password == 'string' && helpers.checkPasswordString(data.payload.password.trim()) ? data.payload.password.trim() : false

    if(name && email && address && password)
        //Make sure if user doesn't already exist
        _data.read('users', email, (err, data) => {
            if(err){
                //Hash the string password
                const hashedPassword = helpers.hashString(password)
                //Create user
                if(hashedPassword){
                    const user = {
                        'name': name,
                        'email': email,
                        'address': address,
                        'password': hashedPassword
                    }
                    //Store user data
                    _data.create('users', email, user, err => {
                        if(!err) callback(200);
                        else callback(400,{'ERROR': 'Unable to create user!'})
                    })
                }else callback(500,{'ERROR': 'Hashing password failed!'})
            }else callback(400,{'ERROR': 'Already exists a user with the email('+email+')!'})
        })
    else callback(400,{'ERROR': 'Missing or invalid required fields! Password needs to be eigth or more characters long, have one upper case and special(not reserved RegEx) character! Must pass an email!'}), debug('\x1b[31m%s\x1b[0m', '[400] Email: '+email+' Password: '+password+' Name: '+name+' Address: '+address)
}

//Users GET
//Required; email
//Optinal: none
users._methods.get = (data,callback) => {
    //Check if email is valid
    const email = typeof data.queryStrObj.email == 'string' && helpers.checkEmailString(data.queryStrObj.email.trim()) ? data.queryStrObj.email.trim() : false
    debug('\x1b[35m%s\x1b[0m','GET Data: ',data);
    if(email){
        //Get token from headers
        const token = typeof data.headers.token == 'string' && data.headers.token.trim().length == 20? data.headers.token.trim() : false
        //Verify if the given token is valid for the email
        tokens._methods.verifyToken(token, email, tokenValid => {
            if (tokenValid)
                _data.read('users', email, (err, data) => {
                    if (!err && data){
                        //Remove the hashed password
                        delete data.password
                        callback(200, data)
                    }else callback(404)
                })
            else callback(403,{'ERROR':'Missing required token in headers, or token invalid!'}), debug('\x1b[31m%s\x1b[0m', '[403] Valid Token: '+tokenValid)
        })
    }else callback(400,{'ERROR':'Missing or invalid required fields!'}), debug('\x1b[31m%s\x1b[0m', '[400] Email: '+email)
}

//Users PUT
//Required: email
//Optional(atleast one): name, address, password
users._methods.put = (data, callback) => {
    //Check required field
    const email = typeof data.queryStrObj.email == 'string' && helpers.checkEmailString(data.queryStrObj.email.trim()) ? data.queryStrObj.email.trim() : false;

    //Check optional fields
    const name = typeof data.payload.name == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false
    const address = typeof data.payload.address == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false
    const password = typeof data.payload.password == 'string' && helpers.checkPasswordString(data.payload.password.trim()) ? data.payload.password.trim() : false

    if(email){
        if(name || address || password){
            //Get token from headers
            const token = typeof data.headers.token == 'string' ? data.headers.token : false
            //Verify if the given token is valid for the email
            tokens._methods.verifyToken(token, email, tokenValid => {
                if (tokenValid)
                    //Lookup the user
                    _data.read('users',email, (err, userData) => {
                        if(!err && userData){
                            if(name) userData.name = name
                            if(address) userData.address = address
                            if(password) userData.password = password
                            //Update user data
                            _data.update('users', email, userData, err => {
                                if(!err) callback(200)
                                else callback(500,{'ERROR':'Couldn\'t update user'})
                            }) 
                        }else callback(404)
                    })
                else callback(403,{'ERROR':'Missing required token in headers, or token invalid!'})
            })
        }else callback(400,{'ERROR':'Missing or invalid optional fields.\nPassword needs to be eigth or more characters long, have one upper case and special(not reserved RegEx) character!'})
    }else callback(400,{'ERROR':'Missing or invalid required fields, it needs to be an email!'})
}

//Users DELETE
//Required: email
//Optional: none
//@TODO Delete all user data
users._methods.delete = (data, callback) => { 
    //Check if email is valid
    const email = typeof data.queryStrObj.email == 'string' && helpers.checkEmailString(data.queryStrObj.email.trim()) ? data.queryStrObj.email.trim() : false

    if(email){
        //Get token from headers
        const token = typeof data.headers.token == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false
        //Verify if the given token is valid for the email
        tokens._methods.verifyToken(token, email, tokenValid => {
            if (tokenValid)
                //Lookup the user
                _data.read('users',email, (err, userData) => {
                    if(!err && userData){
                        //Remove user data
                        _data.delete('users', email, err => {
                            if(!err) callback(200)
                            else callback(500,{'ERROR':'Couldn\'t delete the user!'}) 
                        })
                    }else callback(400,{'ERROR':'Couldn\'t find the user!'})
                })
                else callback(403,{'ERROR':'Missing required token in headers, or token invalid!'}) 
        })
    }else callback(400,{'ERROR':'Missing or invalid required fields, it needs to be an email!'})
}

//Export users handler
module.exports = users;
