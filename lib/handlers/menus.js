/*
*
*   Menus Handler
*
*/

//Dependencies 
const _data = require('../data')
const tokens = require('./tokens')

//Define Menus
const menus = {}

//Menus handler
menus.handler = (data, callback) => {
    ['get'].indexOf(data.method) > -1 ? menus._methods[data.method](data, callback) : callback(405)
}

//Menus methods container
menus._methods = {}

//Menus GET
//Require data: token
menus._methods.get = (data, callback) => {
    const token = typeof data.headers.token == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false
    if(token)
        tokens._methods.validateToken(token, isValid => {
            if(isValid)
                _data.list('menus', (err, menuList) => {
                    if(!err && menuList){
                        let menus = []
                        const getMenus = async(menu) => {
                            return new Promise(resolve => (_data.read('menus', menu, (err, data) => {
                                if(!err && data) resolve(menus.push(data))
                                else callback(500,{'ERROR': 'Could not read menu'+menu})
                            })))
                        }
                        const loopList = async() => {
                            for(let menu of menuList) await getMenus(menu)
                            callback(200,menus)
                        }
                        loopList()
                    }else callback(404,{'ERROR': 'There is no menus to dysplay!'})
                })
            else callback(401,{'ERROR': 'Given token is invalid, as expired!'})
        })
    else callback(400,{'ERROR': 'Missing or invalid token in headers!'})
}

//Export menus handler
module.exports = menus;