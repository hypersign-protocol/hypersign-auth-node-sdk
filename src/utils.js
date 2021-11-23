export function getFormatedMessage(op, data) {
    return JSON.stringify({
        op,
        data
    })
}

export function responseMessageFormat(success, message, data = {} ){
    return { 
        hs: {
            success,
            message,
            data: JSON.stringify(data)
        }
    }
}  