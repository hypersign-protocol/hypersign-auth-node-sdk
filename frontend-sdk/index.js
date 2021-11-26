/**
 * Checks if browser support WebSocket
 * @returns Boolean
 */
function checkForWebSocketSupport(){
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    if (!window.WebSocket) {
        return false;
    }
    return true;
}


/**
 * Initiates Socket and Does all the work for fetching the challenge and access tokens.
 */
function initiate({ rpSocketURL, hsLoginBtnDOM, hsLoginQRDOM, hsloginBtnText, hsWalletBaseURL  }) {
    let ws = new WebSocket(rpSocketURL);
    
    ws.onopen = function() {
    };

    ws.onmessage = function({
        data
    }) {
        let messageData = JSON.parse(data);
        if (messageData.op == 'init') {
            // Display the Login Button
            if(hsLoginBtnDOM){
                const weblink = encodeURI(
                    hsWalletBaseURL + "/deeplink?url=" + JSON.stringify(messageData.data)
                );
                hsLoginBtnDOM.innerHTML = `<button onclick="window.open('${weblink}', 'popUpWindow','height=800,width=400,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');">${hsloginBtnText}</button>`;
            }
            
            // Display the QR code
            if(hsLoginQRDOM){
                // display QR code
            }
        } else if (messageData.op == 'end') {
            ws.close();
            const { accessToken, refreshToken } = messageData.data.hypersign.data
            if(!accessToken || !refreshToken){
                return document.dispatchEvent(new CustomEvent("hs-error", {
                    detail: "Could not fetch accessToken or refreshToken after authentication"
                }));    
            }
            
            document.dispatchEvent(new CustomEvent("hs-success", {
                detail: { accessToken, refreshToken },
                bubbles: true
            }));
        
        } 
    };

    ws.onerror = function(e) {
        document.dispatchEvent(new CustomEvent("hs-error", {
            detail: e.message
        }));   
    };

    ws.close = function() {
    }

}

/**
 * Starts the program
 * @returns void
 */
function start(options){
    if(!checkForWebSocketSupport()){
        console.error('HSAuth:: Sorry, Your Browser Doesn\'t Support WebSocket. Use Polling Instead.')
        return;
    }

    const hsLoginBtnDOM = document.getElementById('hs-auth-btn');
    const hsLoginQRDOM = document.getElementById('hs-auth-qr');
    
    if(!hsLoginBtnDOM && !hsLoginQRDOM){
        console.error('HSAuth:: No DOM Element Found With Id \'hs-auth-btn\' or \'hs-auth-qr\'')
        return;
    }

    initiate({ 
        rpSocketURL: options.WEBSOCKET_CONN_URL, 
        hsLoginBtnDOM, 
        hsLoginQRDOM,
        hsloginBtnText: options.LOGIN_BUTTON_TEXT,
        hsWalletBaseURL: options.HS_WALLET_BASEURL
     });
}

const options = {
    WEBSOCKET_CONN_URL: 'ws://localhost:4006',
    LOGIN_BUTTON_TEXT: 'LOGIN USING WEB WALLET',
    HS_WALLET_BASEURL: 'https://hswallet-stage.netlify.app'
}

start(options);

