+++
title = "LINQ to XML to... Excel?"
date = "2008-09-16"
draft = false
tags = ["linq", "generic .net"]
+++

<p>
The other day one of the guys I work with was trying to work out the best way to generate an Excel document from .NET as the client had some wierd requirements around how the numerical data needed to be formatted (4 decimal places, but Excel treats a CSV to only show 2). 
</p>
<p>
The next day my boss came across a link to a demo of how to use LINQ to XML to generate a XML file using the Excel schema sets which allow for direct opening in Excel.<br>
One problem with the demo, it was using VB 9, and anyone who's seen VB 9 will know it has a really awesome way of handling XML literals in the IDE. This isn't a problem if you're coding in VB 9, but if you're in C# it can be. 
</p>
<p>
The VB 9 video can be found here: <a href="http://msdn.microsoft.com/en-us/vbasic/bb927708.aspx" target="_blank">http://msdn.microsoft.com/en-us/vbasic/bb927708.aspx</a> 
</p>
<p>
I recommend it be watched before progressing as it'll make a lot more sense against the following post. It'll also cover how to create the XML file, which I'm going to presume is already done. 
</p>
<p>
<strong>In the beginning</strong> 
</p>
<p>
Because C# doesn't have a nice way to handle XML literals like VB 9 does we're going to have to do a lot of manual coding of XML, additionally we need to ensure that the appropriate namespaces are used on the appropriate nodes. 
</p>
<p>
The Excel XML using 4 distinct namespaces, in 5 declarations (yes, I'll get to that shortly) so we'll start off by defining them like so: 
</p>
<p>
<span class="const">XNamespace</span> mainNamespace = <span class="const">XNamespace</span>.Get(<span class="string">"urn:schemas-microsoft-com:office:spreadsheet"</span>); 
</p>
<p>
<span class="const">XNamespace</span> o = <span class="const">XNamespace</span>.Get(<span class="string">"urn:schemas-microsoft-com:office:office"</span>); 
</p>
<p>
<span class="const">XNamespace</span> x = <span class="const">XNamespace</span>.Get(<span class="string">"urn:schemas-microsoft-com:office:excel"</span>); 
</p>
<p>
<span class="const">XNamespace</span> ss = <span class="const">XNamespace</span>.Get(<span class="string">"urn:schemas-microsoft-com:office:spreadsheet"</span>); 
</p>
<p>
<span class="const">XNamespace</span> html = <span class="const">XNamespace</span>.Get(<span class="string">"http://www.w3.org/TR/REC-html40"</span>); 
</p>
<p>
Notice how the 'main namespace' and 'ss' are exactly the same, well this is how they are handled within the XML document. The primary namespace for the file is <em>urn:schemas-microsoft-com:office:spreadsheet</em> but in some locations it's also used as a prefix. 
</p>
<p>
For this demo I'm going to be using the obligatory <strong>Northwind</strong> database and I'm going to just have a simple query against the customers table like so: 
</p>
<span class="keyword">var</span> dataToShow = <span class="keyword">from</span> c in ctx.Customers 
<blockquote>
	<p>
	<span class="keyword">select</span> <span class="keyword">new</span> 
	</p>
</blockquote>
<blockquote>
	<p>
	{ 
	</p>
</blockquote>
<blockquote>
	<blockquote>
		<p>
		CustomerName = c.ContactName, 
		</p>
	</blockquote>
</blockquote>
<blockquote>
	<blockquote>
		<p>
		OrderCount = c.Orders.Count(), 
		</p>
	</blockquote>
</blockquote>
<blockquote>
	<blockquote>
		<p>
		Address = c.Address 
		</p>
	</blockquote>
</blockquote>
<blockquote>
	<p>
	}; 
	</p>
</blockquote>
<p>
&nbsp;
</p>
<p>
Now we have to start building our XML, the root element is named <strong>Workbook</strong> and then we have the following child groups: 
</p>
<ul>
	<li>
	<div>
	DocumentProperties 
	</div>
	</li>
	<li>
	<div>
	ExcelWorkbook 
	</div>
	</li>
	<li>
	<div>
	Styles 
	</div>
	</li>
	<li>
	<div>
	Worksheet 
	</div>
	</li>
	<li>
	<div>
	WorksheetOptions 
	</div>
	</li>
</ul>
<p>
Each with variying child properties. 
</p>
<p>
First thing we need to do is set up our <span class="const">XElement</span> and apply the namespaces, like so: 
</p>
<span class="const">XElement</span> workbook = <span class="keyword">new</span> <span class="const">XElement</span>(mainNamespace + <span class="string">"Workbook"</span>, 
<p>
<span class="keyword">new</span> <span class="const">XAttribute</span>(<span class="const">XNamespace</span>.Xmlns + <span class="string">"html"</span>, html), 
</p>
<p>
CreateNamespaceAtt(<span class="const">XName</span>.Get(<span class="string">"ss"</span>, <span class="string">"http://www.w3.org/2000/xmlns/"</span>), ss), 
</p>
<p>
CreateNamespaceAtt(<span class="const">XName</span>.Get(<span class="string">"o"</span>, <span class="string">"http://www.w3.org/2000/xmlns/"</span>),o), 
</p>
<p>
CreateNamespaceAtt(<span class="const">XName</span>.Get(<span class="string">"x"</span>, <span class="string">"http://www.w3.org/2000/xmlns/"</span>), x), 
</p>
<p>
CreateNamespaceAtt(mainNamespace), 
</p>
<p>
I'm using a helper method to create the namespace attribute (which you'll be able to find in the attached source), but notice how the "main" namespace is the last one we attach, if we don't do it this way we'll end up with the XElement detecting the same namespace and only adding it once. Also, you need to ensure that you're prefixing the right namespace to the XElement tag! 
</p>
<p>
<strong>DocumentProperties and ExcelWorkbook</strong> 
</p>
<p>
These two node groups are not overly complex, they hold the various meta-data about the Excel document we are creating, I'll skip them as they aren't really interesting and can easily be found in the source. 
</p>
<p>
<strong>Styles</strong> 
</p>
<p>
This section is really important and handy for configuring custom looks within the document. There are way to many options to configure here to cover in the demo, it's easiest to generate the styles in Excel and save the file as an XML document (or read the XSD if you <em>really</em> want!). If you're doing custom styles make sure you note the ID you give the style so you can use it later in your document. 
</p>
<p>
Also, these styles are <strong>workbook</strong> wide, not <strong>worksheet</strong> so you can reuse them on each worksheet you create. I have a very simple bold header. 
</p>
<p>
<strong>Generating a Worksheet</strong> 
</p>
<p>
Here is where the fun starts, we need to generate our worksheet. There are 4 bits of data we need to output here: 
</p>
<ul>
	<li>
	<div>
	Number of columns 
	</div>
	</li>
	<li>
	<div>
	Number of Rows 
	</div>
	</li>
	<li>
	<div>
	Header 
	</div>
	</li>
	<li>
	<div>
	Data Rows 
	</div>
	</li>
</ul>
<p>
To illistrate the power of LINQ I've actually dynamically generated the header row: 
</p>
<p>
<span class="keyword">var</span> headerRow = <span class="keyword">from</span> p <span class="keyword">in</span> dataToShow.ToList().GetType().GetProperties() 
</p>
<blockquote>
	<blockquote>
		<span class="keyword">select</span> <span class="keyword">new</span> <span class="const">XElement</span>(mainNamespace +<span class="string"> </span>"Cell", 
		<blockquote>
			<blockquote>
				<blockquote>
					<p>
					<span class="keyword">new</span> <span class="const">XElement</span>(mainNamespace + "Data", 
					</p>
					<blockquote>
						<blockquote>
							<blockquote>
								<blockquote>
									<span class="keyword">new</span> <span class="const">XAttribute</span>(ss + "Type", "String"), p.Name 
									<blockquote>
										<blockquote>
											<p>
											) 
											</p>
										</blockquote>
									</blockquote>
									<blockquote>
										<p>
										); 
										</p>
									</blockquote>
								</blockquote>
							</blockquote>
						</blockquote>
					</blockquote>
				</blockquote>
			</blockquote>
		</blockquote>
	</blockquote>
</blockquote>
<p>
This is just a little bit of fun using LINQ and Reflection to dynamically generate the column headers ;) 
</p>
<p>
Next we need to output the number of columns and number of rows (keep in mind the rows is the data count + header row count): 
</p>
<span class="keyword">new</span> <span class="const">XAttribute</span>(ss +<span class="string"> "ExpandedColumnCount"</span>, headerRow.Count()), 
<p>
<span class="keyword">new</span> <span class="const">XAttribute</span>(ss + <span class="string">"ExpandedRowCount"</span>, dataToShow.Count() + 1), 
</p>
<p>
Now we put out the header cells: 
</p>
<span class="keyword">new</span> <span class="const">XElement</span>(mainNamespace + <span class="string">"Row"</span>, 
<blockquote>
	<p>
	<span class="keyword">new</span> <span class="const">XAttribute</span>(ss + <span class="string">"StyleID"</span>, <span class="string">"Header"</span>), 
	</p>
	headerRow 
	<p>
	), 
	</p>
</blockquote>
<p>
Then lastly we generate the data cells (note - this can be done like the header, just chose to do it differently to illustrate that it can be done several ways): 
</p>
<p>
<img src="/get/media/1198/linq_to_excel001.png" width="345" height="310" alt="linq_to_excel001.png"> 
</p>
<p>
(yes I used an image this time, the formatting is a real bitch in the Umbraco WYSIWYG editor!). 
</p>
<p>
Lastly there needs to be a WorksheetOptions node, and then you can combine all the XElements together, add it to an XDocument object and save! 
</p>
<p>
There you have it, how to create an Excel document using LINQ to XML and C#. <a href="/get/media/1204/excelgenerator.zip" target="_blank">Source code can be found here.</a> 
</p>