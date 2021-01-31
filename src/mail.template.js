const template =
    `
<html>

<head>
    <style>
        .colored {
            color: blue;
        }

        #body {
            font-size: 16px;
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
    <div id='body'>
        <p>Hi @@RECEIVERNAME@@,</p>
        <p>Welcome to @@APPNAME@@!</p>
        <p>Hypersign is a decentralised identity and access management infrastructure for an enterprise that makes sure
            your employees and customers are who they say they are. It leverages use of technologies like public key
            infrastructure (PKI) and blockchain to provide passwordless authentication which integrates in minutes and
            is compatible with legacy IAM systems at a very affordable price. Watch <a
                href='https://youtu.be/QE2JQc6LoRk' target='_blank'>demo on YouTube</a> to see how it works. </p>
        <p><img alt="Logo" title="Logo" height="200" width="600" style="display:block"
                src="https://pbs.twimg.com/profile_banners/1302473442466226176/1599398616/1500x500"></p>

        <p></p>
        <p class='colored'>
            Hypersign Auth Credential is being issued to you. 
            Please scan the QR code attached with this email to receieve the @@APPNAME@@ Auth Credential. 
            You should be able to login into websites that supports
            @@APPNAME@@ login.
        </p>
        <p><a href='@@DEEPLINKURL@@' class="button">Get credential</a></p>
        <p></p>
        <p>Thanks & Regards, <br />Team @@APPNAME@@!</p>
        <p></p>
    </div>
</body>

</html>
`
module.exports = template