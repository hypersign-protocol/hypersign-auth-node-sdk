(()=>{const e="hs-error",t="hs-success",n="POLLING",o="SOCKET";function s({accessToken:n,refreshToken:o}){if(!n||!o)return document.dispatchEvent(new CustomEvent(e,{detail:"Could not fetch accessToken or refreshToken after authentication",bubbles:!0}));document.dispatchEvent(new CustomEvent(t,{detail:{accessToken:n,refreshToken:o},bubbles:!0}))}function r({hsWalletBaseURL:e,hsLoginBtnDOM:t,hsLoginQRDOM:n,qrDataStr:o,hsloginBtnText:s}){if(t){const n=encodeURI(e+"/deeplink?url="+o);t.innerHTML=`<button onclick="window.open('${n}', 'popUpWindow','height=800,width=400,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');">${s}</button>`}}async function a({rpBaseURL:e,hsLoginBtnDOM:t,hsLoginQRDOM:n,hsloginBtnText:o,hsWalletBaseURL:a,hsPollingInterval:l,rpChallengeResource:h,rpPollResource:i}){const c=e.endsWith("/")?e.substr(0,e.length-1):e,L=h.startsWith("/")?h.substr(1,h.length):h,R=i.startsWith("/")?i.substr(1,i.length):i,u=`${c}/${L}`,E=await fetch(u,{method:"POST",headers:{"Content-type":"application/json"}}),g=await E.json(),{hypersign:S}=g,{data:d}=S,{challenge:T}=d;if(r({hsWalletBaseURL:a,hsLoginBtnDOM:t,hsLoginQRDOM:n,qrDataStr:JSON.stringify(d),hsloginBtnText:o}),!T)throw new Error("HSAuth:: Could Not Fetch New Challenge from API");{const e=await function({hsPollingInterval:e,challenge:t,sanitizeBaseUrl:n,sanitizePollResource:o}){return new Promise((function(s,r){const a=setInterval((function(){return fetch(`${n}/${o}?challenge=${t}`).then((e=>e.json())).then((e=>{const{hypersign:t}=e,{success:n,data:o}=t;n&&!0===n&&(clearInterval(a),s(o))})).catch((e=>{r(e)}))}),e)}))}({hsPollingInterval:l,challenge:T,sanitizeBaseUrl:c,sanitizePollResource:R}),{accessToken:t,refreshToken:n}=e;s({accessToken:t,refreshToken:n})}}!function(t){try{const{LISTENER_MODE:e}=t,l=document.getElementById("hs-auth-btn"),h=document.getElementById("hs-auth-qr");if(!l&&!h)throw new Error("HSAuth:: No DOM Element Found With Id 'hs-auth-btn' or 'hs-auth-qr'");switch(e){case o:{if(window.WebSocket=window.WebSocket||window.MozWebSocket,!window.WebSocket)throw new Error("HSAuth:: Sorry, Your Browser Doesn't Support WebSocket. Use Polling Instead.");const{RP_SOCKET_URL:e}=t;if(!e)throw new Error("HSAuth:: Relying Party Socket URL Must Be Passed for Websocket Mode");const n=new URL(e);console.log(n),function({rpServerSocketURL:e,hsLoginBtnDOM:t,hsLoginQRDOM:n,hsloginBtnText:o,hsWalletBaseURL:a}){if(!e)throw new Error("HSAuth:: Relying Party Websocket URL must passed");let l=new WebSocket(e);l.onopen=function(){},l.onmessage=function({data:e}){let h=JSON.parse(e);if("init"==h.op)r({hsWalletBaseURL:a,hsLoginBtnDOM:t,hsLoginQRDOM:n,qrDataStr:JSON.stringify(h.data),hsloginBtnText:o});else if("end"==h.op){l.close();const{accessToken:e,refreshToken:t}=h.data.hypersign.data;s({accessToken:e,refreshToken:t})}},l.onerror=function(e){document.dispatchEvent(new CustomEvent("hs-error",{detail:e.message}))},l.close=function(){}}({rpServerSocketURL:n.href,hsLoginBtnDOM:l,hsLoginQRDOM:h,hsloginBtnText:t.LOGIN_BUTTON_TEXT,hsWalletBaseURL:t.HS_WALLET_BASEURL});break}case n:{let{RP_SERVER_BASEURL:e,POLLING_INTERVAL:n}=t;if(!e)throw new Error("HSAuth:: Relying Party Base Url Must Be Passed For Polling Mode");const o=new URL(e);console.log(o),n||(n=5e3),a({rpBaseURL:o.href,hsLoginBtnDOM:l,hsLoginQRDOM:h,hsloginBtnText:t.LOGIN_BUTTON_TEXT?t.LOGIN_BUTTON_TEXT:"LOGIN USING HYPERSIGN",hsWalletBaseURL:t.HS_WALLET_BASEURL,hsPollingInterval:n,rpChallengeResource:t.RP_CHALLENGE_RESOURCE?t.RP_CHALLENGE_RESOURCE:"api/v1/auth/challenge",rpPollResource:t.RP_POLLING_RESOURCE?t.RP_POLLING_RESOURCE:"api/v1/auth/poll"});break}default:throw new Error("HSAuth:: Invalid Listener Mode")}}catch(t){document.dispatchEvent(new CustomEvent(e,{detail:t.message,bubbles:!0}))}}({LISTENER_MODE:n,RP_SOCKET_URL:"ws://localhost:4006",RP_SERVER_BASEURL:"http://localhost:4006",RP_CHALLENGE_RESOURCE:"/challenge",RP_POLLING_RESOURCE:"/poll",LOGIN_BUTTON_TEXT:"LOGIN USING HYPERSIGN",HS_WALLET_BASEURL:"https://hswallet-stage.netlify.app",POLLING_INTERVAL:5e3})})();
//# sourceMappingURL=index.js.map