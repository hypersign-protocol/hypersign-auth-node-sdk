'use strict'

$(document).ready(function() {
    $('.login').show();
    $('.profile').hide();
    $('.register').hide();
    initiate();

});

function reg(){
    $('.login').hide();
    $('.profile').hide();
    $('.register').show();
}

async function register() {
    $('.loader').show();
    let data = { user: {}};
    $("form :input").each(function(index) {
        let input = $(this);
        if (input.attr('type') == 'text') data["user"][input.attr('name')] = input.val();
    });
    console.log(data)
    $.post(
        `http://${window.location.host}/hs/api/v2/register`,
        data,
        (err, status) => {
            $('span.loader').hide();
            if (err) console.log(err)
            alert('Your credential is sent to you in your email, scan the QR code to receive credential in your Hypersign Identity Wallet')
        });
}

function formattedMessage(m) {
    return JSON.stringify({
        type: 'client',
        message: m
    })
}

function initiate() {
    $('.register').hide();
    $('.profile').hide();

    let clientId = Math.floor(Math.random(10) * 100);
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    if (!window.WebSocket) {
        alert('Sorry, but your browser doesn\'t support WebSocket.')
        return;
    }

    let ws = new WebSocket(`ws://${window.location.host}`);
    ws.onopen = function() {};

    ws.onmessage = function({
        data
    }) {
        let messageData = JSON.parse(data);
        console.log(messageData)
        $("#qrcode").html("");
        $('#profile').html('');
        if (messageData.op == 'init') {
            $("#qrcode").qrcode({
                "width": 250,
                "height": 250,
                "text": JSON.stringify(messageData.data)
            });


            const weblink = encodeURI(
                "https://hswallet-stage.netlify.app/deeplink?url=" + JSON.stringify(messageData.data)
            );
            $(".web").html(
                ` <button class='btn btn-primary' onclick="window.open('${weblink}', 'popUpWindow','height=800,width=400,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');">LOGIN USING WEB WALLET</button>`
            );
        } else if (messageData.op == 'end') {
            ws.close();
            $("#qrcode").hide();
            const { accessToken, refreshToken } = messageData.data.hypersign.data
            const url = `http://${window.location.host}/protected`
            console.log(url)
            fetch(url, {
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    },
                    method: "POST"
                }).then(res => res.json())
                .then(json => {
                    if (json.status == 403) {
                        console.log('eroor 403')
                    } else {
                        $('.register').hide();
                        $('.login').hide();
                        $('.profile').show();
                        $('#profile').html(JSON.stringify(json.message))
                    }
                })
                .catch((e) => {
                    console.log(e)
                })
        }
    };

    ws.onerror = function(error) {};

}