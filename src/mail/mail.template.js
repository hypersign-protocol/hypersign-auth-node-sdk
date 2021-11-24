const template = `
<html>

<head>
    <style>
        .colored {
            color: blue;
        }

        #body {
            background-color: #80808021
            font-size: 18px;
            border: 1px solid #80808021;
            padding:20px;
        }

        .center{
            margin: auto;
            width: 50%;
        }

        .mobile {
            display: none;
        }
        .web {
            display:block;
        }
        .button {
            background-color: #272831;
            /* blakish */
            border: none;
            color: #f1f1f1;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            text-decoration: none;
            font-size: 16px;
            cursor: pointer;
            width:30%;
        }

        @media only screen and (max-device-width : 640px) {

            /* Styles */
            .mobile {
                display: block;
            }
            .web {
                display:none;
            }
        }

        @media only screen and (max-device-width: 768px) {

            /* Styles */
            .mobile {
                display: block;
            }
            .web {
                display:none;
            }
        }
    </style>
</head>

<body>
    <div id='body' class="center">
        <p class='center'><h3>Hi @@RECEIVERNAME@@,</h3></p>
        <p class='center' style='width:100%'><h5>Welcome to @@APPNAME@@!</h5></p>
        <p class='colored'>
            @@APPNAME@@ credential is being issued to you. 
        </p>
        <p class='colored'>Tap 'Get Credential' button (or link) to receieve the credential in your Hypersign Identity Wallet.</p>
        <br/>
        <p><a href='@@DEEPLINKURL@@' class="button">Get credential</a></p>
        <br/>
        <br/>
        <p>Thanks & Regards, <br />Team @@APPNAME@@!</p>
        <p></p>
    </div>
</body>

</html>
`;
module.exports = template;
