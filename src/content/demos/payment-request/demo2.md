---
title: "Payments demo with Android Pay and credit cards"
date: 2017-09-19T10:08:13+10:00
draft: false
hidden: true
---

Click the button to simulate a payment flow. On an android device you will be able to use android pay as well. Don't worry, I'm not going to actually try and submit a payment, you can see the code below :wink:.

<button>Pay!</button>
<ul></ul>

<script data-preview-code>
    document.getElementsByTagName('button')[0].addEventListener('click', (e) => {
        const methods = [{
            supportedMethods: ['basic-card'],
            data: {
                supportedNetworks: ['visa', 'mastercard', 'amex'],
                supportedTypes: ['credit', 'debit']
            }
        }, {
            supportedMethods: ['https://android.com/pay'],
            data: {
                merchantName: 'Android Pay Demo',
                // Place your own Android Pay merchant ID here. The merchant ID is tied to
                // the origin of the website.
                merchantId: '00184145120947117657',
                // If you do not yet have a merchant ID, uncomment the following line.
                // environment: 'TEST',
                allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'],
                paymentMethodTokenizationParameters: {
                    tokenizationType: 'GATEWAY_TOKEN',
                    parameters: {
                        'gateway': 'stripe',
                        // Place your own Stripe publishable key here. Use a matching Stripe
                        // secret key on the server to initiate a transaction.
                        'stripe:publishableKey': 'pk_live_lNk21zqKM2BENZENh3rzCUgo',
                        'stripe:version': '2016-07-06',
                    },
                },
            },
        }];

        const paymentDetails = {
            total: {
                label: 'You owe me',
                amount: {
                    currency: 'AUD',
                    value: 42
                }
            }
        };

        const opts = {
            requestPayerName: true,
            requestPayerPhone: true,
            requestPayerEmail: true
        };

        const request = new PaymentRequest(methods, paymentDetails, opts);

        request.show()
            .then((instrument) => {
                let details = instrument.details;
                details.cardNumber = 'XXXX-XXXX-XXXX-' + details.cardNumber.substr(12);
                details.cardSecurityCode = '***';

                const ul = document.getElementsByTagName('ul')[0];
                ul.innerHTML = '';

                Object.keys(details).forEach((key) => {
                    const el = document.createElement('li');
                    el.innerHTML = `${key}: ${JSON.stringify(details[key])}`;
                    ul.appendChild(el);
                });

                instrument.complete('success');
            })
            .catch((e) => {
                console.error(e);
                e.complete('error');
            });
    }, false);
</script>