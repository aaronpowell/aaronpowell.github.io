---
  title: "Internet Explorer bug with assigning CSS classes"
  metaTitle: "Internet Explorer bug with assigning CSS classes"
  description: "An interesting problem when assigning CSS classes in JavaScript"
  revised: "2010-11-11"
  date: "2010-11-10"
  tags: 
    - "css"
    - "javascript"
    - "internet-explorer"
    - "web"
  migrated: "true"
  urls: 
    - "/ie-bug-with-assigning-css-classes"
  summary: ""
---
Today I was fixing a problem on a site in which some background images weren't showing up on certain elements in Internet Explorer but they were showing up under Firefox and Chrome.

The page is quite a complex one which does a lot of client-side building of DOM elements so I started digging around in there, finding the section which was creating the element.

The code was very simple, all it did was create a `<span />` tag, assign some CSS classes to it and eventually add it to the DOM. Nothing overly complex about it but it was breaking none-the-less.

So I fired up the (lovely...) IE7 (yes, I'm on a SOE with IE7) and inspected the DOM. Sure enough the element was in the DOM, but when I looked at the applied styles in the inspector I noticed that the styles from the CSS class **did not exist**. According to the DOM inspector the CSS class *was* applied, just none of the rules were. I started to be confused, I tried manipulating the stylesheet, adding some more sizing to the element, but nothing caused the rules to be applied. But if I started playing in the DOM inspector I could influence it but only with what I was custom adding.

After scratching my head for a while I took another look at the element creation process, and then I noticed something very strange...

    span.setAttribute('class', 'someClass');

The developer who wrote the JavaScript was using `setAttribute` method on the DOM element to set the CSS class, not the `className` property. I've never done it via the method, so I changed it to use the property and vola the CSS class was applied!

I then created a very simple little piece of HTML to test with to ensure it wasn't something more of a problem from the overall page, but **it always fails in IE**, here's my sample code:

	<html>
		<head>
			<title>IE CSS assignment testing</title>
			<style type="text/css">
				.c { background-color:#ff0000;}
				.s { padding-top:10px; background-color:#00ff00;}
			</style>
		</head>
		<body>
			<div id="s"></div>
			
			<script type="text/javascript">
				var txt = document.createElement('span');
				txt.innerHTML = "Hello World";
				txt.setAttribute('class', 'c');
				
				var s = document.getElementById('s');			
				s.appendChild(txt);
				s.setAttribute('class', 's');
			</script>
		</body>
	</html>

Save that as a HTML file and open it in IE7, IE9 Beta (I don't have 8 or 6 on a machine), Firefox 3.6.11 and Chrome 8. In both the IEs I tested the background colour & padding is not applied, despite the inspector saying that the element has the classes applied to it.

I'll be reporting this as a bug in IE shortly, but of future note to developers **use `element.className` not `elemnet.setAttribute` for CSS class assignment!**