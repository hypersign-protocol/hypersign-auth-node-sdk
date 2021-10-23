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