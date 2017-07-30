---
  title: "Oh woe is (Mobile)Me"
  metaTitle: "Oh woe is (Mobile)Me"
  description: ""
  revised: "2010-04-25"
  date: "2010-04-25"
  tags: 
    - "mobile-me"
    - "fail"
  migrated: "true"
  urls: 
    - "/oh-woe-is-mobile-me"
  summary: "This post was migrated from my old blog. Originally posted on 07/01/2010"
---
Anyone who is (lucky enough to be) on my msn contact list (and signed in during my work hours) will have seen something curious happening over the past week since I returned back to work.

For those of you not, basically I was signing in and out constantly with a frequency of say every 10 minutes.
This oddly made is surprisingly hard to hold a conversation with someone.
But more problematic was that not only was msn dropping out but the whole internet was. You could hardly even achieve a successful Google search.

And this wasn't just a problem for me, but for everyone here at TheFARM.

The first assumption was that it was something wrong with our ISP, we're not on a super faster internet connection, and no one had problems outside of work, so it seemed like a logical assumption... right?

Well it turns out that when you assume you make an ass out of you and me (ha, see what I did there! :P).
The problem wasn't our internet, in fact the problem could be blamed on one individual, yep you guessed it, me :(.

Turns out that when I wasn't on the network everything was fine, everyone could use the web, chat on msn, do what ever they wanted, but as soon as I plugged in, BAM, the internet died.
So after a bit of detective work (mostly by Shannon) it was concluded that my computer was doing something nasty to the network.
So we cracked out a copy of [Wireshark][1] and decided to do some detective work with packet sniffing.

Immediately it was obvious what was happening, I was flooding our DNS server with requests, requests that the DNS server was returned as invalid. 
The requests kept looking for a URL along the lines of tcp.members.mac.com and after a bit of searching it turned out that that URL is related to the Apple MobileMe service.
So Shan asked if I was signed up with MobileMe, to which I responded "I don't believe so", but it turned out again I was wrong, I had signed up to MobileMe, but it must have been when I first got my iPhone.
When you get an iPhone you can sign up with a 60 day trail, something I must have done (hey, it said I was signed in, guess I signed up at some point :P).
After doing some quick math I concluded that it was ~60 days since I got my iPhone when we first started having internet problems (the last working week last year).

I instantly signed out of MobileMe, and low and behold the DNS flooding stopped happening!

 

Thank you Apple for producing a service which is capable of bringing down an office network, you've just made sure I strongly consider not purchasing MobileMe in the future!

Oh and I'm never going to live this down at work, Shan isn't a fan of Apple so this is just adding fuel to the fire!


  [1]: http://www.wireshark.org/