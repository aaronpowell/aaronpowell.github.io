---
  title: "Heroku, SendGrid and NodeJS"
  metaTitle: "Heroku, SendGrid and NodeJS"
  description: "A quick guide to sending emails from nodejs on Heroku using SendGrid"
  revised: "2012-01-05"
  date: "2012-01-05"
  tags: 
    - "nodejs"
    - "heroku"
  migrated: "true"
  urls: 
    - "/nodejs/heroku-sendgrid-nodejs"
  summary: ""
---
Last night I launched the registration site for [Stats It][1], and Umbraco 5 add-on I'm working on and I wanted to get the site out quickly and well... cheaply so I decided that I'd just do a 1 page site in NodeJS.

For hosting I wanted to go with [Heroku][2] as I just love how simply I can get a site from my local machine to deployed with the platform and I also love how many [add-ons][3] there are available.

To send emails there's a couple of choices, I decided to go with [SendGrid][4] for no reason other than they were the first that I saw :P.

So install SendGrid into your heroku app (I'm using the free version):

    heroku addons:add sendgrid:starter

And now you need something to send emails from NodeJS, for this I've gone with [node_mailer][5] as it was the first in my search results and it's got a dead simple API. What's really cool about Heroku is that when you have add-ons such as SendGrid installed you get the config options injected, meaning sending an email is as simple as this:

    var email = require('mailer');

	email.send({
		host: 'smtp.sendgrid.net',
		port: '587',
		authentication: 'plain',
		username: process.env.SENDGRID_USERNAME,
		password: process.env.SENDGRID_PASSWORD,
		domain: 'heroku.com',
		to: 'someone@somewhere.com',
		from: 'someone@somewhere-else.com',
		subject: 'You sent an email',
		body: 'Hey look at that!'
	}, function (err, result) {
		//Do your error handling
	});

You have to hard-code these settings:

* `host: 'smtp.sendgrid.net'`
* `port: '587'`
* `authentication: 'plain'`

But Heroku will inject the username & password for you, both of which will be on the `process.env` object, like so:

* `process.env.SENDGRID_USERNAME`
* `process.env.SENDGRID_PASSWORD`

And there you have it, you're not ready to send emails from NodeJS on Heroku.

  [1]: http://stats-it.com
  [2]: http://heroku.com
  [3]: http://addons.heroku.com/
  [4]: http://addons.heroku.com/sendgrid
  [5]: https://github.com/Marak/node_mailer