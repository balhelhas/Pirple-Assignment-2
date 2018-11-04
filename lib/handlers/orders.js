/*
*
*  Orders Handler
*
*/

//Dependencies 
const _data = require('../data')
const configs = require('../configs')
const helpers = require('../helpers')
const tokens = require('./tokens')


//Define orders
const orders = {}

//Orders handler
orders.handler = (data,callback) => {
    configs.acceptMethods.indexOf(data.method) > -1 ? orders._methods[data.method](data,callback) : callback(405)
}

//orders
//Orders methods container
orders._methods = {};

//Orders POST
//Required data: email, token
//Optional data: none
orders._methods.post = (data,callback) => {
    //Verify required data
    const email = typeof data.queryStrObj.email == 'string' && helpers.checkEmailString(data.queryStrObj.email.trim()) ? data.queryStrObj.email.trim() : false;
    if(email){
        //Validate the given token with the email
        //Verify is token is valid for the given email
        const token = typeof data.headers.token == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false
        tokens._methods.verifyToken(token, email, validToken => {
            if(validToken)
                //Lookup for the specified user
                _data.read('users', email, (err, userData) => {
                    //Callback the shopping cart of the user, if no error encountered 
                    if(!err, userData){
                        //Creater a Order Id
                        const orderId = Date.now().toString() + '_' + email
                        //Get the shopping cart from the user data
                        const shoppingCart = userData.shoppingCart
                        //Check if theres  items in the shopping cart
                        if(Object.keys(shoppingCart.items).length > 0){
                            //Make a Stripe charge
                            helpers.stripeCharge(Number(shoppingCart.total.toFixed(2))*100,'eur','Pizza deleviry charges','tok_visa', err => {
                                if(!err){
                                    //Create message and send it with Mailgun
                                    const message = `Hello ${userData.name}.\nThanks for your order:\n\tID: ${orderId}\n\tTotal: ${shoppingCart.total}€\n\nYour order will arrive as soon as possible!`
                                    helpers.mailgunReceipt(email, '[PIZZA-DELIVERY] Order Confirmation', message, err => {
                                        if(!err){
                                            //Create order
                                            _data.create('orders', orderId, shoppingCart, err => {
                                                if(!err){
                                                    //Clear user shopping cart data
                                                    shoppingCart.items = {}
                                                    shoppingCart.total = 0
                                                    //Update user data
                                                    _data.update('users', email, userData, err => {
                                                        if(!err) callback(200)
                                                        else callback(500, {'ERROR': 'Unable to update user data!'})
                                                    })
                                                }else callback(500, {'ERROR': 'Unable to create order data!'})
                                            })
                                        }else callback(500, {'ERROR': 'Unable to send email confirmation!'})
                                    })
                                }else callback(500, {'ERROR': 'Unable to proceed with payment!'})
                            })
                        }else callback(400, {'ERROR': 'Theres no items in the shopping cart to make a order!'})
                    }else callback(500, {'ERROR': 'Couldn\'t get the specific user!'}) 
                })
            else callback(403, {'ERROR': 'Missing or invalid token in headers!'})
        })
    }else callback(400, {'ERROR': 'Missing or invalid required data!'})
}

//Export orders handler
module.exports = orders;
