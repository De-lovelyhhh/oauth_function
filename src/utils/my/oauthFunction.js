import regeneratorRuntime from '../third-party/runtime' // eslint-disable-line
import { throwError } from '../lib/error'

const app = getApp()

const oauth = async function (account, password, res1) {
    const login = async function() {
        let getCookie = function () {
            const promise = new Promise(function (resolve, reject) {
                wx.request({
                    url: 'http://139.199.224.230:7001/oauth/login',
                    method: 'POST',
                    needLogin: false,
                    data: { account, password },
                    success: function (res) {
                        console.log(res)
                        let oauthSessionKey
                        let oauthSessionValue
                        try {
                            [oauthSessionKey, oauthSessionValue] = res.header['set-cookie'].split(';')[0].split('=')
                            console.log('login success')
                        } catch (e) {
                            throwError(`获取session失败: ${e}`)
                        }
                        // 存储资源服务器session
                        app.globalData.oauthSession = { oauthSessionKey, oauthSessionValue }
                        resolve(app.globalData.oauthSession)
                    },
                    fail: function (res) {
                        reject(res)
                    }
                })
            })
            return promise
        }
        const cookieb = await getCookie()
        console.log(cookieb)
        return cookieb
    }

    const getOauth = async function() {
        let cookieb = await login(account, password)
        let { oauthSessionKey, oauthSessionValue } = cookieb
        let getCode = function() {
            const promise = new Promise(function (resolve, reject) {
                wx.request({
                    url: 'http://139.199.224.230:7001/oauth/authorize',
                    method: 'GET',
                    header: { cookie: `${oauthSessionKey}=${oauthSessionValue}` },
                    needLogin: false,
                    data: {
                        response_type: 'code',
                        client_id: res1.client_id,
                        state: res1.state,
                        scope: res1.scope,
                        from: 'mini'
                    },
                    success: function (res) {
                        console.log(res)
                        resolve(res.data.authorization_code)
                    },
                    fail: function (res) {
                        reject(res)
                    }
                })
            })
            return promise
        }
        const result = await getCode()
        console.log(result)
        return result
    }
    let code = await getOauth()
    return code
}



const getOauthData = async function() {
    let json
    let get = function() {
        const promise = new Promise(function (resolve, reject) {
            wx.request({
                url: 'http://139.199.224.230:7002/user/get_oauth_data',
                method: 'GET',
                needLogin: false,
                data: { from: 'mini' },
                success: function (res) {
                    console.log(res)
                    let cookieAKey
                    let cookieAValue;
                    [cookieAKey, cookieAValue] = res.header['set-cookie'].split(';')[0].split('=')
                    app.globalData.cookieA = { cookieAKey, cookieAValue }
                    json = {
                        client_id: res.data.client_id,
                        state: res.data.state,
                        scope: res.data.scope,
                        redirect_uri: res.data.redirect_uri
                    }
                    resolve(json)
                },
                fail: function (res) {
                    reject(res)
                }
            })
        })
        return promise
    }
    const result = await get()
    console.log(result)
    return result
}


const url = async function(code, res1) {
    let getRes = function () {
        const promise = new Promise(function (resolve, reject) {
            let { cookieAKey, cookieAValue } = app.globalData.cookieA
            wx.request({
                url: res1.redirect_uri,
                method: 'GET',
                header: { cookie: `${cookieAKey}=${cookieAValue}` },
                needLogin: false,
                data: {
                    code: code,
                    state: res1.state,
                    from: 'mini'
                },
                success: function (res) {
                    console.log(res)
                    resolve(res)
                },
                fail: function (res) {
                    reject(res)
                }
            })
        })
        return promise
    }
    const getres = await getRes()
    console.log(getres)
    return getres
}

const redirect = async function(username, password) {
    let res = await getOauthData()
    let code = await oauth(username, password, res)
    let res1 = await url(code, res)
    console.log(res1)
    return res1
}

export {
    redirect
}
