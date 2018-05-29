---
  title: "LINQ to XML to... Excel?"
  metaTitle: "LINQ to XML to... Excel?"
  description: "Easily generating Excel documents using LINQ to XML"
  revised: "2010-04-08"
  date: "2010-04-08"
  tags: 
    - "linq"
    - "linq-to-xml"
    - "excel"
    - "c#"
  migrated: "true"
  urls: 
    - "/linq-to-xml-to-excel"
  summary: ""
---
The other day one of the guys I work with was trying to work out the best way to generate an Excel document from .NET as the client had some wierd requirements around how the numerical data needed to be formatted (4 decimal places, but Excel treats a CSV to only show 2).

The next day my boss came across a link to a demo of how to use LINQ to XML to generate a XML file using the Excel schema sets which allow for direct opening in Excel.
One problem with the demo, it was using VB 9, and anyone who's seen VB 9 will know it has a really awesome way of handling XML literals in the IDE. This isn't a problem if you're coding in VB 9, but if you're in C# it can be.

The VB 9 video can be found here: [http://msdn.microsoft.com/en-us/vbasic/bb927708.aspx][1]

I recommend it be watched before progressing as it'll make a lot more sense against the following post. It'll also cover how to create the XML file, which I'm going to presume is already done.

## In the beginning ##

Because C# doesn't have a nice way to handle XML literals like VB 9 does we're going to have to do a lot of manual coding of XML, additionally we need to ensure that the appropriate namespaces are used on the appropriate nodes.

The Excel XML using 4 distinct namespaces, in 5 declarations (yes, I'll get to that shortly) so we'll start off by defining them like so:

    XNamespace mainNamespace = XNamespace.Get("urn:schemas-microsoft-com:office:spreadsheet");
    XNamespace o = XNamespace.Get("urn:schemas-microsoft-com:office:office");
    XNamespace x = XNamespace.Get("urn:schemas-microsoft-com:office:excel");
    XNamespace ss = XNamespace.Get("urn:schemas-microsoft-com:office:spreadsheet");
    XNamespace html = XNamespace.Get("http://www.w3.org/TR/REC-html40");

Notice how the 'main namespace' and 'ss' are exactly the same, well this is how they are handled within the XML document. The primary namespace for the file is urn:schemas-microsoft-com:office:spreadsheet but in some locations it's also used as a prefix.

For this demo I'm going to be using the obligatory Northwind database and I'm going to just have a simple query against the customers table like so:

	var dataToShow = from c in ctx.Customers
					 select new
					{
						CustomerName = c.ContactName,
						OrderCount = c.Orders.Count(),
						Address = c.Address
					};

Now we have to start building our XML, the root element is named Workbook and then we have the following child groups:

* DocumentProperties
* ExcelWorkbook
* Styles
* Worksheet
* WorksheetOptions

Each with variying child properties.

First thing we need to do is set up our XElement and apply the namespaces, like so:

	XElement workbook = new XElement(mainNamespace + "Workbook",
		new XAttribute(XNamespace.Xmlns + "html", html),
		CreateNamespaceAtt(XName.Get("ss", "http://www.w3.org/2000/xmlns/"), ss),
		CreateNamespaceAtt(XName.Get("o", "http://www.w3.org/2000/xmlns/"),o),
		CreateNamespaceAtt(XName.Get("x", "http://www.w3.org/2000/xmlns/"), x),
		CreateNamespaceAtt(mainNamespace),

I'm using a helper method to create the namespace attribute (which you'll be able to find in the attached source), but notice how the "main" namespace is the last one we attach, if we don't do it this way we'll end up with the XElement detecting the same namespace and only adding it once. Also, you need to ensure that you're prefixing the right namespace to the XElement tag!

## DocumentProperties and ExcelWorkbook ##

These two node groups are not overly complex, they hold the various meta-data about the Excel document we are creating, I'll skip them as they aren't really interesting and can easily be found in the source.

## Styles ##

This section is really important and handy for configuring custom looks within the document. There are way to many options to configure here to cover in the demo, it's easiest to generate the styles in Excel and save the file as an XML document (or read the XSD if you really want!). If you're doing custom styles make sure you note the ID you give the style so you can use it later in your document.

Also, these styles are workbook wide, not worksheet so you can reuse them on each worksheet you create. I have a very simple bold header.

## Generating a Worksheet ##

Here is where the fun starts, we need to generate our worksheet. There are 4 bits of data we need to output here:

* Number of columns
* Number of Rows
* Header
* Data Rows

To illistrate the power of LINQ I've actually dynamically generated the header row:
Update: You should get dataToShow.First() not dataToShow.ToList() so you can get the properties for the header

	var headerRow = from p in dataToShow.First().GetType().GetProperties()
					select new XElement(mainNamespace + "Cell",
						new XElement(mainNamespace + "Data",
							new XAttribute(ss + "Type", "String"), 
							p.Name
							)
						);

This is just a little bit of fun using LINQ and Reflection to dynamically generate the column headers ;)

Next we need to output the number of columns and number of rows (keep in mind the rows is the data count + header row count):

	new XAttribute(ss + "ExpandedColumnCount", headerRow.Count()),
	new XAttribute(ss + "ExpandedRowCount", dataToShow.Count() + 1),

Now we put out the header cells:

	new XElement(mainNamespace + "Row",
		new XAttribute(ss + "StyleID", "Header"),
		headerRow
	),

Then lastly we generate the data cells (note - this can be done like the header, just chose to do it differently to illistrate that it can be done several ways):

![][2]

(yes I used an image this time, the formatting is a real bitch in the Umbraco WYSIWYG editor!).

Lastly there needs to be a WorksheetOptions node, and then you can combine all the XElements together, add it to an XDocument object and save!

There you have it, how to create an Excel document using LINQ to XML and C#.

[Download the source here.][3]


  [1]: http://msdn.microsoft.com/en-us/vbasic/bb927708.aspx
  [2]: https://www.aaron-powell.com/get/media/1198/linq_to_excel001.png
  [3]: /get/csharp/excelgenerator.zip