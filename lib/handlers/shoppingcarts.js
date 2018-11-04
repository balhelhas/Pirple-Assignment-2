/*
* 
*   ShoppingCarts Handler
*   
*/

//Dependencies
const _data = require('../data')
const configs = require('../configs')
const helpers = require('../helpers')
const tokens = require('./tokens')

//Define shopping carts
const shoppingCarts = {}

//Shopping carts handler
shoppingCarts.handler = (data, callback) => {
    configs.acceptMethods.indexOf(data.method) > -1 ? shoppingCarts._methods[data.method](data, callback) : callback(405)
}

//Shopping carts methods container
shoppingCarts._methods = {}

//Shopping carts POST
//Required data: menuId, quantity, token
//Optional data: none
shoppingCarts._methods.post = (data, callback) => {
    //Check if required field are valid 
    const menu = typeof data.payload.menu == 'number' && data.payload.menu % 1 === 0 && data.payload.menu >= 1 ? data.payload.menu : false
    const quantity = typeof data.payload.quantity == 'number' && data.payload.quantity % 1 === 0 && data.payload.quantity >= 1 ? data.payload.quantity : false
    if(menu, quantity){
        //Check if token is valid
        const token = typeof data.headers.token == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false
        if(token)
            tokens._methods.validateToken(token, tokenData => {
                if(tokenData)
                    //Get the selected menu data
                    _data.read('menus', menu, (err, menuData) => {
                        if(!err, menuData)
                            //Get the user data 
                            _data.read('users', tokenData.email, (err, userData) => {
                                if(!err, userData){
                                    //Check if user already as a shopping card if not create
                                    const shoppingCart = typeof userData.shoppingCart == 'object' ? userData.shoppingCart : { 'items': {}, 'total': 0}
                                    //Get the item number
                                    const itemNumber = Object.keys(shoppingCart.items).length+1
                                    //Add quantity to menu Data
                                    menuData['quantity'] = quantity
                                    //Set the new item on shopping cart item
                                    shoppingCart.items[itemNumber] = menuData
                                    //Calculate the total to pay for the items
                                    shoppingCart.total += menuData.price*menuData.quantity
                                    //Update user data with the items inserted in the shopping cart
                                    userData.shoppingCart = shoppingCart
                                    _data.update('users', userData.email, userData, err => {
                                        if(!err) delete userData.password, callback(200,userData)
                                        else callback(500,{'ERROR': 'Couldn\'t inserted item in shopping cart, error while updating user!'})
                                    })
                                }else callback(500, {'ERROR': 'Couldn\'t get user data!'})
                            })
                        else callback(400,{'ERROR': 'Specified menu does not exit!'}) 
                    })
                else callback(401,{'ERROR': 'The specified token does not exist or it is expired!'}) 
            })
        else callback(403,{'ERROR': 'Missing or invalid token in headers!'})   
    }else callback(400,{'ERROR': 'Missing or invalid required fields'})
}

//Shopping carts GET
//Required data: email, token
//Optional data: none
shoppingCarts._methods.get = (data, callback) => {
    //Check if required data is valid
    const email = typeof data.queryStrObj.email == 'string' && helpers.checkEmailString(data.queryStrObj.email.trim()) ? data.queryStrObj.email : false
    if(email){
        //Verify is token is valid for the given email
        const token = typeof data.headers.token == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false
        tokens._methods.verifyToken(token, email, validToken => {
            if(validToken)
                //Lookup for the specified user
                _data.read('users', email, (err, data) => {
                    //Callback the shopping cart of the user, if no error encountered 
                    if(!err, data) callback(200, data.shoppingCart)
                    else callback(500, {'ERROR': 'Couldn\'t get the specific user!'}) 
                })
            else callback(403, {'ERROR': 'Missing or invalid token in headers!'})
        })
    }else callback(400,{'ERROR': 'Missing or invalid required fields!'})
}

//Shopping carts PUT
//Required data: email, itemNumber, token
//Optional data: menu, quantity(at least one must be passed)
shoppingCarts._methods.put = (data, callback) => {
    //Verify required data
    const email = typeof data.queryStrObj.email == 'string' && helpers.checkEmailString(data.queryStrObj.email.trim()) ? data.queryStrObj.email.trim() : false
    const item = typeof data.payload.item == 'number' && data.payload.item % 1 === 0 && data.payload.item >= 1 ? data.payload.item : false
    if(email, item){
        //Verify if there is at least one optional field specified
        const menu = typeof data.payload.menu == 'number' && data.payload.menu % 1 === 0 && data.payload.menu >= 1 ? data.payload.menu : false
        const quantity = typeof data.payload.quantity == 'number' && data.payload.quantity % 1 === 0 && data.payload.quantity >= 1 ? data.payload.quantity : false
        if(menu || quantity){
            //Verify the token for the specific email
            const token = typeof data.headers.token == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false
            tokens._methods.verifyToken(token, email, validToken => {
                if(validToken)
                    //Get the user data
                    _data.read('users', email, (err, userData) => {
                        if(!err, userData){
                            //Check if the user shopping cart has items
                            const shoppingCartItems = userData.shoppingCart.items
                            const shoopingCartLength = Object.keys(shoppingCartItems).length
                            if(shoopingCartLength > 0, shoopingCartLength >= item){
                                //Get the shopping cart item
                                const getMenu = async() => {
                                    return new Promise(resolve => {
                                        _data.read('menus', menu, (err, menuData) =>{
                                            if(!err, menuData){
                                                menuData['quantity'] = shoppingCartItems[item].quantity
                                                resolve(shoppingCartItems[item] = menuData)
                                            }else callback(404, {'ERROR': 'Could not get the specified menu or it does not exist!'})
                                        })
                                    })
                                }
                                const updateTotal = () => {
                                    let total = 0
                                    for(let item in shoppingCartItems){
                                        total += shoppingCartItems[item].price * shoppingCartItems[item].quantity
                                    }
                                    return total
                                }
                                const updateShoppingCart = async() => {
                                    if(menu) await getMenu()    
                                    if(quantity) shoppingCartItems[item].quantity = quantity
                                    //Update total to pay
                                    userData.shoppingCart.total = updateTotal()
                                    //Update the user data
                                    _data.update('users', email, userData, err => {
                                        if(!err) callback(200, userData.shoppingCart)
                                        else callback(500, {'ERROR': 'Could not update the user data!'})
                                    })
                                }
                                updateShoppingCart()
                            }else callback(400, {'ERROR': 'There is no items on the shopping cart or the specified item does not exist!'})
                        }else callback(500, {'ERROR': 'Couldn\'t get the user data!'})
                    })
                else callback(403, {'ERROR': 'Missing or invalid token for the specified user!'})
            })
        }else callback(400, {'ERROR': 'Missing or invalid optional fields, must pass alteast one!'})
    }else callback(400, {'ERROR': 'Missing or invalid required fields!'})
}

//Shopping cart DELETE
//Required data: email, item, token 
//Optional data: none 
shoppingCarts._methods.delete = (data, callback) => {
    //Verify required data
    const email = typeof data.queryStrObj.email == 'string' && helpers.checkEmailString(data.queryStrObj.email.trim()) ? data.queryStrObj.email.trim() : false
    const item = typeof data.payload.item == 'number' && data.payload.item % 1 === 0 && data.payload.item >= 1 ? data.payload.item : false
    if(email, item){
        //Verify the token for the specific email
        const token = typeof data.headers.token == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false
        tokens._methods.verifyToken(token, email, validToken => {
            if(validToken)
                //Get the user data
                _data.read('users', email, (err, userData) => {
                    if(!err, userData){
                        //Check if the user shopping cart has items
                        const shoppingCartItems = userData.shoppingCart.items
                        const shoopingCartLength = Object.keys(shoppingCartItems).length
                        if(shoopingCartLength > 0, shoopingCartLength >= item){
                            //Delete the item in the shopping cart
                            delete shoppingCartItems[item]
                            //Create new shopping cart data without the deleted item
                            let newShoppingCartItems = {}
                            let newItemNumber = 0
                            let newTotal = 0
                            for(let oldItemNumber in shoppingCartItems){
                                newItemNumber++
                                newShoppingCartItems[newItemNumber] = shoppingCartItems[oldItemNumber] 
                                newTotal += shoppingCartItems[oldItemNumber].price * shoppingCartItems[oldItemNumber].quantity
                            }
                            //Update shopping cart items and total
                            userData.shoppingCart.items = newShoppingCartItems
                            userData.shoppingCart.total = newTotal
                            //Update the user data with the new shopping cart
                            _data.update('users', email, userData, err => {
                                if(!err) delete userData.password, callback(200,userData)
                                else callback(500,{'ERROR': 'Unable to update user data!'})
                            })
                        }else callback(400, {'ERROR': 'There is no items on the shopping cart or the specified item does not exist!'})
                    }else callback(500, {'ERROR': 'Couldn\'t get the user data!'})
                })
            else callback(403, {'ERROR': 'Missing or invalid token for the specified user!'})
        })
    }else callback(400, {'ERROR': 'Missing or invalid required fields!'})
}


//Export shopping cart module
module.exports = shoppingCarts