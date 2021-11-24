const fetch = require('node-fetch');

export function getFormatedMessage(op, data) {
    return JSON.stringify({
        op,
        data
    })
}

export function sanetizeUrl(url) {
    if (!url) throw new Error("Url is empty");
    if (url.substr(url.length - 1) == '/') {
        return url.substr(0, url.length - 1)
    } else return url;
}


export async function fetchData(url, options) {
    const resp = await fetch(url, options)
    const json = await resp.json();
    return json;
}

export function checkSlash(baseUrl) {
    if(!baseUrl) throw new Error("baseUrl is null or empty");
    baseUrl = baseUrl.trim();
    if (!baseUrl.endsWith('/')) 
        return baseUrl + '/';
    else
        return baseUrl;
}

export function extractToken(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
}

export function extractRfToken(req) {
    // TODO:  need to find out what is the proper way of sending a refresh token, 
    // we are sending via "refresh_token": "Bearer <Refresh token>" header
    if (req.headers.refreshtoken && req.headers.refreshtoken.split(' ')[0] === 'Bearer') {
        return req.headers.refreshtoken.split(' ')[1];
    }
    return null;
}


export function responseMessageFormat(success, message, data = {} ){
    return { 
        hypersign: {
            success,
            message,
            data
        }
    }
} 