---
title: "Payments demo with shipping address"
date: 2017-09-19T10:08:13+10:00
draft: false
hidden: true
---

Click the button to simulate a payment flow that requires a shipping address. Don't worry, I'm not going to actually try and submit a payment, you can see the code below :wink:.

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
            shippingOptions: [{
                id: 'standard',
                label: 'Standard shipping',
                amount: {currency: 'AUD', value: '0.00'},
                selected: true,
            },
            {
                id: 'express',
                label: 'Express shipping',
                amount: {currency: 'AUD', value: '12.00'},
            }]
        };

        const opts = {
            requestShipping: true
        };

        const request = new PaymentRequest(methods, paymentDetails, opts);

        request.addEventListener('shippingaddresschange', (e) => {
            e.updateWith(Promise.resolve(paymentDetails));
        }, false);

         request.addEventListener('shippingoptionchange', (evt) => {
            evt.updateWith(new Promise((resolve, reject) => {
                var selectedShippingOption, otherShippingOption;
                switch (request.shippingOption) {
                    case 'standard':
                        selectedShippingOption = paymentDetails.shippingOptions[0];
                        otherShippingOption = paymentDetails.shippingOptions[1];
                        paymentDetails.total.amount.value = 42;
                        break;

                    case 'express':
                        selectedShippingOption = paymentDetails.shippingOptions[1];
                        otherShippingOption = paymentDetails.shippingOptions[0];
                        paymentDetails.total.amount.value = 30;
                        break;

                    default:
                        reject(`Shipping option ${request.shippingOption} is not supported`);
                        return;
                }

                selectedShippingOption.selected = true;
                otherShippingOption.selected = false;
                paymentDetails.displayItems.splice(1, 1, selectedShippingOption);
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