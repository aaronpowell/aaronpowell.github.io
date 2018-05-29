---
  title: "Creating a location service with F# and Twitter"
  metaTitle: "Creating a location service with F# and Twitter"
  description: "Using Twitter to stalk someone has never been so easy!"
  revised: "2010-06-16"
  date: "2010-06-16"
  tags: 
    - "f#"
    - "twitter"
    - "geo-location"
  migrated: "true"
  urls: 
    - "/location-service-with-fsharp-and-twitter"
  summary: ""
---
A while ago [Tatham Oddie][1] sent me a small app he'd built which allowed you to find recent locations which he had been at, data which is scraped via twitter (you can see it [here][2]). It's rather a nifty little thing and it's done with approximately 50 lines of ruby (although I must point out that he is using some external libraries which do mean that he's got a lot more code, just not all his :P).

I'd always contemplated having a crack at doing something like this as it's a good way to investigate some functional programming.

Well while sitting in the Qantas club lounge waiting for my flight back from Remix earlier this month I decided to write it, using F#. Hey, why the hell not!

## Getting started

So today I finally got around to finishing the code and deploying it onto my website, in fact you can see it in action via [https://www.aaron-powell.com/findme][3]. I've also made this in a way which you can test with any username, say, Tatham's - [https://www.aaron-powell.com/findme/tathamoddie][4].

I also added support for Twitter lists, so say, readify - [https://www.aaron-powell.com/findme/digory/readify][5].

What you'll see is that this is actually just a redirect to Google Maps, passing in a URL like [https://www.aaron-powell.com/findme/kml/slace][6]. If you hit this URL you'll get back an XML file, well actually you'll get back a *KML* file, which stands for Keyhole Markup Language.

### KML

KML is the markup language for geo-location which Google is backing (in fact Keyhole is the original name of the company which Google Earth came from), and all it does is defines a series of points and a series of styles.

This is what a basic KML file looks like:

	<?xml version="1.0" encoding="utf-8" standalone="yes"?>
	<kml>
	  <Document>
		<name>@slace tracking</name>
		<Style id="icon-000">
		  <IconStyle>
			<color>ffffffff</color>
			<colorMode>normal</colorMode>
			<Icon>
			  <href>http://aaron-powell.com/get/map-pins/0010.png</href>
			</Icon>
		  </IconStyle>
		</Style>
		<Placemark>
		  <name>001. Wed 16 Jun 09:42:11 2010</name>
		  <styleUrl>#icon-000</styleUrl>
		  <Point>
			<coordinates>151.25144901, -33.91480491</coordinates>
		  </Point>
		</Placemark>
	  </Document>
	</kml>

As you can see I define a style element (which has an image) and a point (which has the longitude and latitude). 

If you want to learn more about KML I suggest you look [here][7].

### Getting our data

As I mentioned this app is scrapping via twitter, and if you're using twitter you're probably aware that you can choose to geotag your tweets, most twitter clients support this.

All I'm doing is using some of the public REST API's which twitter has to pull down the data I require, and then filtering it for what I want.

## Looking at some code

So we need to scrape some data from twitter. To do this you can use an existing .NET API such as [TweetSharp][8], but at the moment I've rolled my own very basic twitter API in F# (also, as part of my learning experience). 

*Disclaimer - I don't suggest writing a full API in F#, it's definitely not the best language for class libraries :P*

I've made a simple little method which you can invoke from my API which takes a URL and gives you back the various statuses:

	let TwitterStatusGet (url:string) = 
		let webRequest = HttpWebRequest.Create url

		// set the method to GET
		webRequest.Method  <- "GET"
	 
		// set up the stream
		let reqStream = webRequest.GetResponse()
		reqStream.Headers.Add(HttpResponseHeader.CacheControl, "public, max-age=300")
		let streamReader = new StreamReader(reqStream.GetResponseStream())
		let response = streamReader.ReadToEnd()

		// close the stream
		reqStream.Close()
		streamReader.Close()

		let xml = XDocument.Parse(response)
		xml.Descendants(!!"status")
			|> Seq.map(fun e -> new Status(e))

So this is defining a method named `TwitterStatusGet` which has a `String` input value. This is passed to the `HttpWebRequest.Create` method, and then we invoke the request and turn the response into XML. We then take the tranformed XML, find all the descendants with the name status and then turn them into a .NET type which I've created (the internals of it are irrelevant here), and then returns them.

The method `Seq.map` is essentially an F# version of the `IEnumerable.Select`.

Then we need to filter them for ones which haven't been geotagged:

    let statuses = TwitterStatusGet ("http://api.twitter.com/1/statuses/user_timeline.xml?screen_name=" + username + "&count=" + count.ToString())
	let taggedStatuses = statuses
					|> Seq.filter(fun e -> e.Geo.Lat <> 0.0)

Then I just add a bit of code to get rid of statuses which are next to each other (saying to had several tweets from the same place isn't very interesting):

    let points = new List<Status>()
    for i in 0 .. taggedStatuses.Count()-1 do
        let curr = taggedStatuses.ElementAt(i);
        if points.Count > 0 then
            let prev = points.ElementAt(points.Count-1)
            if calculate_displacement prev.Geo curr.Geo > 0.5 then
                points.Add(curr)
        else
            points.Add(curr)

To do this I've got a funky little method for calculating the distance between two points:

	let rad deg = 
		deg*(Math.PI/180.0)

	let calculate_displacement (point1: LatLon) (point2: LatLon) : float =
		let radius = 6371.0
		let dLat = rad(point2.Lat-point1.Lat)
		let dLon = rad(point2.Lon-point1.Lon)
		let a = Math.Sin(dLat/2.0) * Math.Sin(dLat/2.0) +
				Math.Cos(rad(point1.Lat)) * Math.Cos(rad(point2.Lat)) *
				Math.Sin(dLon/2.0) * Math.Sin(dLon/2.0)
		radius * (2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0-a)))

I'm sure I could write this is a much *F#-y* way, and if someone wants to do that please show me how, but we're just doing some simple calculations based on the points and then returning the distance between them.

The last piece of the puzzle is tranforming the unique points which we now have into KML. I'm going to spare that bit of code for the moment, I'm using LINQ to XML to do this, and working with LINQ to XML in F# requires a whole blog post of its own.

## Putting it all together

So now that I've got all this data I can now just add a reference into my blog project which then return the data. I've noticed that Google Maps has a very quick timeout which means that sometimes you'll get an error for your requests, but hit it again after a minute or two and it generally comes back. Also, I've added a 1 hour output cache on each request so if you do new tweets they wont appear immediately.

I just set up a few simple routes which support both username and list name passing.

And there you go, that's how you can use twitter to scrape the data about where someone has been tweeting from. Feel free to use my service, I'm thinking of setting up a CG10 list which you can then track people who are coming to CodeGarden this year ;).



  [1]: http://tath.am
  [2]: http://tath.am/where
  [3]: /findme
  [4]: /findme/tathamoddie
  [5]: /findme/digory/readify
  [6]: /findme/kml/slace
  [7]: http://code.google.com/apis/kml/documentation/
  [8]: http://tweetsharp.codeplex.com/