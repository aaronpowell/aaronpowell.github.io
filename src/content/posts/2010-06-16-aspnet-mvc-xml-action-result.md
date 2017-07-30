---
  title: "ASP.NET MVC XML Action Result"
  metaTitle: "ASP.NET MVC XML Action Result"
  description: "An easy way to return XML from ASP.NET MVC"
  revised: "2010-06-16"
  date: "2010-06-16"
  tags: 
    - "asp.net"
    - "asp.net-mvc"
    - "c#"
    - "xml"
  migrated: "true"
  urls: 
    - "/aspnet-mvc-xml-action-result"
  summary: ""
---
For my [Location Service in F#][1] I needed a way to be able to return XML from MVC (which powers my site), but I couldn't find a way to do this out of the box with XML.

Luckily creating your very own `ActionResult` is really quite easy in MVC.

First you need to implement the `ActionResult` class:

    public class XmlActionResult : ActionResult
    {
        public override void ExecuteResult(ControllerContext context)
        {

        }
    }

I'm going to add a couple of public properties:

        public XDocument Xml { get; private set; }
        public string ContentType { get; set; }
        public Encoding Encoding { get; set; }

I've put the `ContentType` publicly settable so you can customize the content type which will be set on the response. And I'll have a constructor which takes the `XDocument`:

        public XmlActionResult(XDocument xml)
        {
            this.Xml = xml;
            this.ContentType = "text/xml";
            this.Encoding = Encoding.UTF8;
        }

Here I've set the default `ContentType` as text/xml so that's what'll generally be returned from the ActionResult.

And implementing `ExecuteResult` is really quite simple:

        public override void ExecuteResult(ControllerContext context)
        {
            context.HttpContext.Response.ContentType = this.ContentType;
            context.HttpContext.Response.HeaderEncoding = this.Encoding;
            XmlTextWriter writer = new XmlTextWriter(context.HttpContext.Response.OutputStream, Encoding.UTF8);
            Xml.WriteTo(writer);
            writer.Close();
        }

All you have to do is to write the XML into the Response stream (you can't just return the XML, if you do you'll strip out the XML declaration).

To then use it in your `View` it's just like this:

            var kml = AaronPowell.FindMe.KmlGenerator.TwitterToKml("@" + twitterUser + " tracking", statuses);

            return new XmlActionResult(kml)
            {
                ContentType = "application/vnd.google-earth.kml+xml"
            };

And that's why I left the `ContentType` as modifiable, it means I can say that I'm sending out KML instead of standard XML. You can easily use this for RSS, Atom, etc. In fact I should probably port the RSS feed within this site :P.

  [1]: /location-service-with-fsharp-and-twitter