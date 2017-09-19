---
title: "Payments demo 'slow' price calculation"
date: 2017-09-19T10:08:13+10:00
draft: false
hidden: true
---

Click the button to simulate a payment flow that takes a while to calculate shipping costs. The idea here is that you are doing server side calculations. Don't worry, I'm not going to actually try and submit a payment, you can see the code below :wink:.

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
        }];

        const standardShippingOptions = [{
            id: 'standard',
            label: 'Standard shipping',
            amount: {currency: 'AUD', value: 0},
            selected: true,
        }, {
            id: 'express',
            label: 'Express shipping',
            amount: {currency: 'AUD', value: 12},
        }];

        let paymentDetails = {
            total: {
                label: 'You owe me',
                amount: {
                    currency: 'AUD',
                    value: 42
                }
            },
            displayItems: [{
                label: 'Original amount you owe me',
                amount: {
                    currency: 'AUD',
                    value: 42
                }
            }, {
                label: 'Standard shipping',
                amount: {
                    currency: 'AUD',
                    value: 0
                }
            }],
            shippingOptions: []
        };

        const opts = {
            requestShipping: true
        };

        const request = new PaymentRequest(methods, paymentDetails, opts);

        request.addEventListener('shippingaddresschange', (e) => {
            e.updateWith(new Promise((resolve) => {
                setTimeout(() => {
                    paymentDetails.shippingOptions = standardShippingOptions;
                    resolve(paymentDetails);
                }, 5000);
            }));
        }, false);

         request.addEventListener('shippingoptionchange', (evt) => {
            evt.updateWith(new Promise((resolve, reject) => {
                const shippingOption = paymentDetails.shippingOptions.filter((option) => option.id === request.shippingOption)[0];

                paymentDetails.shippingOptions.forEach((option) => {
                    option.selected = option.id === shippingOption.id;
                });

                paymentDetails.total.amount.value = 42 - shippingOption.amount.value;

                paymentDetails.displayItems.splice(1, 1, shippingOption);
                resolve(paymentDetails);
            }));
        });

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