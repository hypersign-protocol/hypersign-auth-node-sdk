export function getFormatedMessage(op, data) {
    return JSON.stringify({
        op,
        data
    })
}