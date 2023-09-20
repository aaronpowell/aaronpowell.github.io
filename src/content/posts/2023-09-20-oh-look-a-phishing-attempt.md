+++
title = "Oh Look a Phishing Attempt"
date = 2023-09-20T04:06:20Z
description = "It seems to be my lucky day, I've gotten about a dozen of these in the last 24 hours."
draft = false
tags = ["security"]
tracking_area = "javascript"
tracking_id = ""
+++

A little over a year ago [I wrote about dissecting some phishing attempts]({{<ref "/posts/2022-08-23-more-phishing-attempts.md">}}) and while I still got the odd one here and there, nothing really was slipping through the M365 spam filters.

Until yesterday that is. Over the last 24 hours I've gotten around a dozen phishing attempts to one of the sub-addresses on my domain, and given that there was so many I figured I'd take a look at them.

## Taking it apart

The first thing I noticed about this one is that it had gotten through my spam filter, and when I opened the email I could see why, the email wasn't a text-with-image email, it was a HTML email with a single image in it.

![The phishing email](/images/2023-09-20-oh-look-a-phishing-attempt/001.png)

Since that is just a large image in the email body, and with no alt-text, there's nothing for the spam filter to scan for, without it doing OCR. Also, it's surprisingly lacking in spelling mistakes, which are a really easy way to catch these things. It is worth noting that the image wasn't displayed initially, I had to tell Outlook to allow the image to be displayed for an untrusted email address.

## Where to next

Unlike the last ones which had you download a HTML file and then it was all done locally, this linked me off to an external website. Here's the address http://allallaossn.lat/cl/5394_d/6/72997/137/35/77720 although you probably shouldn't click on it, unless you want to go digging yourself. The address bounced through a few other locations, presumably setting some cookies or capturing other bits of info about me, and then it landed me here:

![The phishing website](/images/2023-09-20-oh-look-a-phishing-attempt/002.png)

Interestingly enough when I opened it in Chrome I ended up at a different page with a different survey pipeline:

![The phishing website in Chrome](/images/2023-09-20-oh-look-a-phishing-attempt/003.png)

I'm going to stick with dissecting the Edge version, as that's what I started with. It's also worth noting that while I expected this to be a standard phishing attempt, it's actually a survey scam, which is a little different. The goal of this is to get you to complete a survey, and then you get a prize. The prize could be a lot of different things (we'll see my prizes later on), but the goal of this scam is to get you to subscribe to a paid service that is really hard to get out of.

## The page make up

I opened up the source of the page and it turned out that it doesn't really contain any HTML, just some JavaScript includes. You'll find [a gist of the source](https://gist.github.com/aaronpowell/a95d258a99074ae0b0649df7948aa79a) if you want to play along.

I expected that it'd work similar to the local file ones I looked at last time, and that turned out to be correct. There's a huge string of text and some obfuscated functions in the code. This is the most interesting part (formatted for readability):

```js
var _0xc50e = [
  "",
  "split",
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/",
  "slice",
  "indexOf",
  "",
  "",
  ".",
  "pow",
  "reduce",
  "reverse",
  "0",
];
function _0xe23c(d, e, f) {
  var g = _0xc50e[2][_0xc50e[1]](_0xc50e[0]);
  var h = g[_0xc50e[3]](0, e);
  var i = g[_0xc50e[3]](0, f);
  var j = d[_0xc50e[1]](_0xc50e[0])
    [_0xc50e[10]]()
    [_0xc50e[9]](function (a, b, c) {
      if (h[_0xc50e[4]](b) !== -1)
        return (a += h[_0xc50e[4]](b) * Math[_0xc50e[8]](e, c));
    }, 0);
  var k = _0xc50e[0];
  while (j > 0) {
    k = i[j % f] + k;
    j = (j - (j % f)) / f;
  }
  return k || _0xc50e[11];
}
```

## What's it doing?

We'll notice the array, `_0xc50e` which starts it off and it's essentially acting as a utility for the rest of the code, as those are the relevant pieces of info to make up a string.

The function `_0xe23c` is then invoked several times to decode HTML chunks to then generate the HTML that goes into the page, and this works by looking at parts of `_0xc50e` and then using that to decode the string that was passed into it. Let's take it line by line:

```js
var g = _0xc50e[2][_0xc50e[1]](_0xc50e[0]);
```

Admittedly this isn't that readable, but lets deobfuscate it. `_0xc50e[2]` is the string `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/` and then it's calling `split` on it, which will split it into an array of characters. So `g` is now an array of characters.

```js
var g = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/"[
  "split"
]("");
```

There, that's readable. Next up:

```js
var h = g[_0xc50e[3]](0, e);
```

This is a bit more interesting, it's calling `slice` on the array, which will return a new array with the elements from the start index to the end index. So `h` is now an array of characters from the start of `0` to the value of `e`. When debugging, the first time through `e` was `6`, so we ended up as an array of the first 6 characters of the string, which are the numbers 0 to 5. The next line is similar, just with a different end point in the string.

We then come to this lovely bit of code:

```js
var j = d[_0xc50e[1]](_0xc50e[0])
  [_0xc50e[10]]()
  [_0xc50e[9]](function (a, b, c) {
    if (h[_0xc50e[4]](b) !== -1)
      return (a += h[_0xc50e[4]](b) * Math[_0xc50e[8]](e, c));
  }, 0);
```

Let's deobfuscate it and look at what it's doing now:

```js
var j = d["split"]("")
  ["reverse"]()
  ["reduce"](function (a, b, c) {
    if (h["indexOf"](b) !== -1)
      return (a += h["indexOf"](b) * Math["pow"](e, c));
  }, 0);
```

So it's taking the string that was passed in, splitting it into an array of characters, reversing that array and then reducing it. The reduce function is then looking at each character in the array and if it's in the `h` array (which is the first 6 characters of the string) then it's adding the index of that character in the `h` array multiplied by `e` to the accumulator. The accumulator is initialised to `0` so the first time through it'll be `0 + 0 * 6` which is `0`. The next time through it'll be `0 + 1 * 6` which is `6`. The next time through it'll be `6 + 2 * 6` which is `18`. And so on.

Finally, we have our loop and return value:

```js
var k = _0xc50e[0];
while (j > 0) {
  k = i[j % f] + k;
  j = (j - (j % f)) / f;
}
return k || _0xc50e[11];
```

Deobfuscation won't help much, the magic variables point to `''` within the array, creating a starting string. We then loop around while using `remainder` operator to jump through `i` and find a number to return. This number is then used by the calling function to look up character in another array which is decoded elsewhere as a character code to then get the string character. Here's a calling function:

```js
function (h, u, n, t, e, r) {
  r = "";
  for (var i = 0, len = h.length; i < len; i++) {
    var s = "";
    while (h[i] !== n[e]) {
      s += h[i];
      i++;
    }
    for (var j = 0; j < n.length; j++)
      s = s.replace(new RegExp(n[j], "g"), j);
    r += String.fromCharCode(_0xe23c(s, e, 10) - t);
  }
  return decodeURIComponent(escape(r));
}
```

And it was receiving a huge string like `ZQvZvxZZQvZxZQvZZxZZZZZxZZQZvxZQvvQxZZQvQxZZZZQxZvZvxZZZvQxZZZQZxZZ` (only with 50k characters in it), and the values `89,"QZvxOrGpf",4,3,35`, which is then used to decode the string.

Ultimately, it generated the html you'll find in `generated-html.html` [of the attached gist](https://gist.github.com/aaronpowell/a95d258a99074ae0b0649df7948aa79a). The page actually runs this sort of code 3 more times, but with different keys. Inspecting the other ones showed that they were doing output that was injecting JavaScript into the page using `eval` (which is how the stuff was executed at the end of the decoding). Here's the output I found:

```js
// Decode #1
LNG = "1";
CMP = "Aussie";
CNT = "14";
BID = "393074817";
FNP = "c267f14ded62310d74cffcc6dc2d9395";
CMPID = "175";

// Decode #2
API_URL = "https://amplinesrv.com";
const st = 0;
var currentdate = new Date();
var months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
$(".date-full").html(
  months[currentdate.getMonth()] +
    " " +
    currentdate.getDate() +
    ", " +
    currentdate.getFullYear()
);
if ($("#comment-page").length > 0) {
  $(".footer").addClass("fr2");
}

// Decode #3
aff_id = "350115";
click_id = "1057046844";
Brand = "1782";
lpid = "3038";
lpow = "35";
prepop = "email:;phone:;zipcode:".split(";");
emailURL = prepop[0].split(":")[1].replace(/\s+/g, "");
phoneURL = prepop[1].split(":")[1];
zipcodeURL = prepop[2].split(":")[1];
cityURL = "";
stateURL = "";
languageCode = "EN";
countryCode = "AU";
popUrl =
  '{"popunder_mode":[{"id":"1431","id_campaign":"3079","id_popunder":"0","type":"0","refresh_id":"0","device":"0","active":"1","popunder_refresh_id":"0"}],"urls":""}';

// Decode #4
var answered = 0;
var prevProgress = 0;
var stepsTotal = 0;
var progress = 0;
var cheerstx = "";
var txt = "";
function cheers(prog = "100") {
  if (prog == 0) {
    txt = "- Let's begin! Go for that reward";
  }
  if (prog > 0 && prog < 25) {
    txt = "- What a start! Let's go for it";
  }
  if (prog >= 25 && prog < 50) {
    txt = "- What! Almost half way there";
  }
  if (prog == 50) {
    cheerstx = "- You're half way there!";
  }
  if (prog > 50 && prog < 75) {
    txt = "- Superb job! Almost there";
  }
  if (prog >= 75 && prog < 100) {
    txt = "- Great! Almost done";
  }
  if (prog == "100") {
    txt = "- Done!";
  }
  $(".pb-cheers").text(txt);
}
```

I was a little disappointed that I didn't have the element matching `$('.pb-cheers')` anywhere on the page to get congratulated as I progressed through the survey. Poor form phishers, if you're going to have code to cheer me on, at least use it! (also, it's weird that 50% doesn't write to `txt` but to a different variable that isn't used anywhere else)

## Taking the survey

Naturally, the next thing I had to do was actually take the survey. Clicking each option would result in this function being called:

```js
function nextQuestionU(args) {
  aId = args.aId;
  reg = "reg" in args ? args.reg : false;
  rval = "rval" in args ? args.rval : null;
  multi = "multi" in args ? args.multi : false;
  pos = "pos" in args ? args.pos : false;
  dyn = "dyTyId" in args ? args.dyTyId : false;
  dy_ind = "dyIndId" in args ? args.dyIndId : false;
  dy_prod = "dyProdId" in args ? args.dyProdId : false;
  let moref = "&pos=" + pos;
  if (reg) {
    var multiData = "";
    if (multi) {
      multiData = "&multi=true";
    }
    moref += "&reg=true&regVal=" + rval + multiData;
  }
  if (dyn) {
    moref += "&dyId=" + dyn + "&dy_ind=" + dy_ind + "&dy_prod=" + dy_prod;
  }
  $(".answerOption").removeAttr("onclick");
  $.ajax({
    type: "POST",
    // url: "",
    // data: "_type=ajax&_action=master-saveAnswer&sid="+sId+'&qid='+qId+'&aid='+aId+'&step='+numStep+moref,
    url: API_URL + "/survey/saveAnswer",
    data:
      "bid=" +
      BID +
      "&fnp=" +
      FNP +
      "&sid=" +
      sId +
      "&lid=" +
      LNG +
      "&cmp=" +
      encodeURIComponent(CMP) +
      "&cnt=" +
      CNT +
      "&qid=" +
      qId +
      "&aid=" +
      aId +
      "&step=" +
      numStep +
      moref,
    dataType: "json",
    success: function (d) {
      let data = d;
      // let data = d.data;
      let prevProgress = $(".pb-percent").text();
      let answered = data.step - 1;
      if (answered == 1) {
        mfq_tags("first-question");
      }
      let stepsTotal = data.totalSteps;
      let progress = (answered / stepsTotal) * 100;
      $(".sprogress").css("width", progress + "%");
      $({ someValue: prevProgress }).animate(
        { someValue: progress },
        {
          duration: 1000,
          easing: "swing",
          step: function () {
            $(".pb-percent").text(Math.round(this.someValue));
          },
        }
      );
      if (data.id) {
        numStep = data.step;
        $("#questionBody, #questionText, #questionFooter").html("");
        /* $("#container-survey").css({backgroundImage: 'none'}); */
        $(".sprogressbar").slideDown();
        $("#questionText").removeClass("email-title");
        $("#questionFooter").removeClass("email-sub");
        $("#questionText").append(data.question);
        $("#questionFooter").html(data.text_footer);
        switchTypeQuestionsU(data);
      } else {
        mfq_tags("last-question");
        showOfferWallU();
      }
      cheers(progress);
    },
  });
}
```

The `args` being passed in is a reference to which answer you've selected, which came back from the server in the AJAX call (and shout-out to jQuery for still being around, this reminds me of years gone by 😜). The request doesn't contain anything much of interest:

```
bid: 393074817
fnp: c267f14ded62310d74cffcc6dc2d9395
sid: 39
lid: 1
cmp: Aussie
cnt: 14
qid: 26
aid: 649
step: 1
pos: false
```

What I can gather is that the `fnp` is the unique tracking ID for me and `cmp` is the "campaign" they are pretending to be (Aussie is my broadband provider). The value of `bid` seems static across sessions too, so I'd assume it's just another part of their tracking.

And here's a sample response back:

```json
{
  "id": "6",
  "sort": "2",
  "question": "What is your age range?",
  "questions_type_id": "1",
  "text_disclaimer": null,
  "text_footer": null,
  "is_conditional": "0",
  "conditional_rules": null,
  "answers": [
    {
      "id": "51",
      "actId": null,
      "regId": null,
      "cusId": null,
      "sort": "1",
      "posId": null,
      "dynamic": "0",
      "dynamic_type_id": null,
      "dynamic_industry_id": null,
      "dynamic_product_category_id": null,
      "aid": "35",
      "cusName": null,
      "text": "18-29"
    },
    {
      "id": "52",
      "actId": null,
      "regId": null,
      "cusId": null,
      "sort": "2",
      "posId": null,
      "dynamic": "0",
      "dynamic_type_id": null,
      "dynamic_industry_id": null,
      "dynamic_product_category_id": null,
      "aid": "72",
      "cusName": null,
      "text": "30-39"
    },
    {
      "id": "53",
      "actId": null,
      "regId": null,
      "cusId": null,
      "sort": "3",
      "posId": null,
      "dynamic": "0",
      "dynamic_type_id": null,
      "dynamic_industry_id": null,
      "dynamic_product_category_id": null,
      "aid": "74",
      "cusName": null,
      "text": "40-49"
    },
    {
      "id": "54",
      "actId": null,
      "regId": null,
      "cusId": null,
      "sort": "4",
      "posId": null,
      "dynamic": "0",
      "dynamic_type_id": null,
      "dynamic_industry_id": null,
      "dynamic_product_category_id": null,
      "aid": "40",
      "cusName": null,
      "text": "50-64"
    },
    {
      "id": "55",
      "actId": null,
      "regId": null,
      "cusId": null,
      "sort": "5",
      "posId": null,
      "dynamic": "0",
      "dynamic_type_id": null,
      "dynamic_industry_id": null,
      "dynamic_product_category_id": null,
      "aid": "41",
      "cusName": null,
      "text": "65+"
    }
  ],
  "totalSteps": 8,
  "step": 2,
  "jkey": null,
  "trf": "0"
}
```

I've got to admit, there's quite a lot of data in the response, sure, it's mostly `null`, but that's a large property set and none of the responses ever populated them. I guess there's a variety of flows that could use this backend and they just return the same data structure for all of them, adjusting the data in the response as needed.

The questions that you go through are pretty standard, it's the illusion of profiling you through age, shopping habits, gender (which in this one only had Male and Female, but the one Chrome got had Male, Female and Other - yay for inclusion?), etc. but interestingly enough there was no real data capture like name, email, the stuff you'd expect they are really after.

Once the survey was completed I was told my details were being checked:

![Checking my details](/images/2023-09-20-oh-look-a-phishing-attempt/004.png)

Shockingly, the progress bar and "checks" aren't doing anything:

```js
setTimeout(function () {
  $(".check1")
    .removeClass("fa-spinner fa-spin")
    .addClass("fa-check-circle")
    .show();
  $(".load_text1.loadtxstrip").css({ color: "#e4e3e3" });
  $("#percent_s").html("30%");
  $(".pb_process").css({ width: "30%" });
  $(".load_text2").fadeIn(1000);
}, 3000);
setTimeout(function () {
  $(".check2")
    .removeClass("fa-spinner fa-spin")
    .addClass("fa-check-circle")
    .show();
  $(".load_text2.loadtxstrip").css({ color: "#e4e3e3" });
  $("#percent_s").html("60%");
  $(".pb_process").css({ width: "60%" });
  $(".load_text3").fadeIn(1000);
}, 5000);
setTimeout(function () {
  $(".check3")
    .removeClass("fa-spinner fa-spin")
    .addClass("fa-check-circle")
    .show();
  $(".load_text3.loadtxstrip").css({ color: "#e4e3e3" });
  $("#percent_s").html("100%");
  $(".pb_process").css({ width: "100%" });
}, 7500);
setTimeout(function () {
  $(".validate_s").slideUp();
  $(".ms_init").fadeOut(function () {
    $("#thankyou-container").fadeIn();
  });
  $(".reward-page").slideDown(500);
}, 7750);
```

I really admire the staggered `setTimeout` calls, because if something caused one of them to error or run longer, you could end up with things out of order! 🤣

It is making another server call at the same time, which gets the HTML for the prizes, but it also doesn't wait for the checks to finish before rendering the HTML, so depending on the network connection you can see the prizes before the checks are done, or the checks can be done and dismissed well before the prizes are rendered.

Anyway, here's what I "won":

![The prize](/images/2023-09-20-oh-look-a-phishing-attempt/005.png)

Clicking these links sent me off to another site, https://gifturcards.net/l/hI65ff1SfppIxFiro7kF?_luuid=988bf154-bb2b-4606-b300-14c6a07c53ae for example (again, remember that this is a scam site) where they are finally doing some data capture!

![The prize site](/images/2023-09-20-oh-look-a-phishing-attempt/006.png)

I didn't dig too much into the prize site as it's pretty clear how the scam is going to go from here, and looking at the code it's not doing anything that isn't overly obvious, there's a form, it captures your info and moves yo along to get more info until you hand over a credit card and you're subscribed to something that you probably won't get out of with ease.

## Wrapping up

I find it fascinating the level of complexity in the obfuscation that is used to create a page like this, the fact that there was multiple cyphers in the page and the decoding of the code to result in the HTML or JS that was injected was really quite complex.

Anyway, that was a fun way to spend a few hours!
