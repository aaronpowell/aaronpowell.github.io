---
title: "Payments demo with shipping address - complex"
date: 2017-09-19T10:08:13+10:00
draft: false
hidden: true
---

Click the button to simulate a payment flow that requires a shipping address. If you enter a specific suburb you'll get a secret discount.

Don't worry, I'm not going to actually try and submit a payment, you can see the code below :wink:.

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
            amount: {currency: 'AUD', value: '0.00'},
            selected: true,
        }, {
            id: 'express',
            label: 'Express shipping',
            amount: {currency: 'AUD', value: '12.00'},
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
            shippingOptions: standardShippingOptions
        };

        const opts = {
            requestShipping: true
        };

        const request = new PaymentRequest(methods, paymentDetails, opts);

        request.addEventListener('shippingaddresschange', (e) => {
            e.updateWith(new Promise((resolve) => {
                const address = request.shippingAddress;

                if (address.country === 'AU' && address.city === 'Tempe') {
                    paymentDetails.shippingOptions = [{
                        id: 'secret',
                        label: 'Free shipping',
                        amount: { currency: 'AUD', value: 42 },
                        selected: true
                    }];
                    paymentDetails.total.amount.value = 0;
                } else {
                    paymentDetails.total.amount.value = 42;
                    paymentDetails.shippingOptions = standardShippingOptions;
                }

                paymentDetails.displayItems.splice(1, 1, paymentDetails.shippingOptions.filter(x => x.selected)[0]);

                resolve(paymentDetails);
            }));
        }, false);

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