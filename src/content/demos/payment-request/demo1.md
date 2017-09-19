---
title: "Really basic demo of using web payments"
date: 2017-09-19T10:08:13+10:00
draft: false
hidden: true
---

Click the button to simulate starting a payment flow. Don't worry, I'm not going to actually try and submit a payment, you can see the code below :wink:.

<button>Pay!</button>
<ul></ul>

<script data-preview-code>
    document.getElementsByTagName('button')[0].addEventListener('click', (e) => {
        const methods = {
            supportedMethods: ['basic-card'],
            data: {
                supportedNetworks: ['visa', 'mastercard', 'amex'],
                supportedTypes: ['credit', 'debit']
            }
        };

        const paymentDetails = {
            total:{
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

        const request = new PaymentRequest([methods], paymentDetails, opts);

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