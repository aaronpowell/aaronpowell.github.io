---
  title: "Are you ready for January 12?"
  date: "2016-01-03"
  tags: 
    - "internet-explorer"
  description: "Are you ready for the end of old Internet Explorer?"
---

[On January 12 all versions of Internet Explorer prior to version 11 will reach end of life](https://www.microsoft.com/en-us/WindowsForBusiness/End-of-IE-support).

Assuming you're running Windows 8.1 or 10 this won't be a problem as IE11 was the only version you could install. If you're running Windows 7 you are probably already running IE11 as it was a mandatory update shipped via Windows Updates so unless you disabled automatic updates you're also safe.

If you're running any other Windows version then you're already running software that has end of life and you should probably upgrade anyway.

# What version of IE am I running?

If you're unsure what version of IE you have on your machine it's pretty easy to check:

1. Open Internet Explorer
2. Go to Help (you may need to press ALT if it's you can't see the menu)
3. Choose _About Internet Explorer_

# Why does it matter?

Security, it all comes down to security. Browsers are a very common attack vector for hackers so browser makers are constantly working to ensure they protect against newly discovered issues. So with IE < 11 no longer being supported you run the risk of having another potential entry point for hackers.

As a web developer I have another reason for why this matters, interoperability. The IE team spent a lot of time in IE11 to [improve interoperability](https://blogs.msdn.microsoft.com/ie/2014/07/31/the-mobile-web-should-just-work-for-everyone/) including adding a bunch of `webkit` vendor prefixes. While I don't agree with having to add `webkit` prefixes around the shop, having the web just work across all browsers is something I can get behind.

# My company has an app requiring IE <old version here>

While the argument of "well, just upgrade it" might be the preferred option it's not always the simplest option, and if that's the case then you should check out [Enterprise Mode](https://technet.microsoft.com/en-us/library/dn640687.aspx) for IE11. This gives your users the power of IE11 for the general web, but allows you to invoke a legacy mode for your internal applications.

# Conclusion

It's time to upgrade!