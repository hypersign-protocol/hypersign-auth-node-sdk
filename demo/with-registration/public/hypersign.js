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
    fetch(`http://${window.location.host}/hs/api/v2/register`,{
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then((res) => {
        console.log(res)
        if(res.status != 200){
            throw new Error("Invalid")
        }
        return res.json()
    })
    .then((json) =>{
        alert('Your credential is sent to you in your email, scan the QR code to receive credential in your Hypersign Identity Wallet')
    })
    .catch(e => {
        console.error(e)
    })
    
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
    callAndGetUserProfile();
}


function callAndGetUserProfile(){

    document.addEventListener('hs-success', function (e) {
        const { accessToken, refreshToken } = e.detail
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
    });

            
}