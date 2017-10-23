+++
title = "Unit Testing LINQ to SQL"
date = "2008-06-10"
draft = false
tags = ["unit testing", "linq to sql"]
+++

<div>
Unit testing is a vital role of development these days, and with recent development within the .NET framework and the Visual Studio system it is easier than ever to create unit tests. 
</div>
<div>
</div>
<div>
One pain point with unit testing a database-driven application is always the state of the database prior to the tests and after the tests. You have to make a call as to whether you have a separate database which you run your tests against or use your primary database and potentially fill it with junk results all the time. 
</div>
<div>
</div>
<div>
I'm fairly familiar with the DataContext in LINQ to SQL, but as with all things there's always more to learn about, which a friend of mine pointed out to me the other day. 
</div>
<div>
</div>
<div>
</div>
<div>
<strong>More than just a connection</strong> 
</div>
<div>
The DataContext is more than just a connection manager for your database, it also contains information about your database and schema, let me introduce two neglected methods of the DataContext: 
</div>
<div>
</div>
<ul>
	<li>context.DatabaseExists() </li>
	<li>context.CreateDatabase()</li>
</ul>
<p>
Because a DBML file has the full schema (will, full <em>known</em> schema) your DataContext will know whether or not your database specified in your connection string actually exists, and you can create it yourself if needed. <br>
This is where unit testing comes in. 
</p>
<p>
Oh, and there is one other method which can be used as well if you want to do complete clean up: 
</p>
<ul>
	<li>context.DeleteDatabase()</li>
</ul>
<p>
<strong>So... unit testing?</strong> 
</p>
<p>
With unit testing you often don't care about the data created during the test, provided that all your Asserts are successful you can just delete it all when your done, but you'll want to make sure that your CRUD is working so you need somewhere to write to, this is when we can pull out te CreateDatabase() method. 
</p>
Another idea which can be coupled with this is randomly-generated databases purely used for the test execusion. Here's a sample test method I've got: 
<p>
[TestMethod] 
</p>
public void DatabaseTesting() 
<p>
{ 
</p>
<blockquote>
	<p>
	&nbsp;
	</p>
	string connstring = "Data Source=apowell-vm-vist;Initial Catalog=TestDriven_" + new Random().Next() + ";Integrated Security=True"; using (TDDDataContext ctx = new TDDDataContext(connstring)) 
	<blockquote>
		<p>
		{ 
		</p>
	</blockquote>
	<blockquote>
		<blockquote>
			if (ctx.DatabaseExists()) 
			<blockquote>
				<blockquote>
					<p>
					{ 
					</p>
				</blockquote>
				<blockquote>
					<blockquote>
						<p>
						ctx.CleanDatabase(); 
						</p>
					</blockquote>
				</blockquote>
			</blockquote>
			<blockquote>
				<blockquote>
					<p>
					} 
					</p>
				</blockquote>
			</blockquote>
			<blockquote>
				<blockquote>
					else 
					<blockquote>
						<blockquote>
							<p>
							{ 
							</p>
						</blockquote>
						<blockquote>
							<blockquote>
								<p>
								ctx.CreateDatabase(); 
								</p>
							</blockquote>
						</blockquote>
					</blockquote>
					<blockquote>
						<blockquote>
							<p>
							} 
							</p>
						</blockquote>
					</blockquote>
					<blockquote>
						<p>
						} 
						</p>
					</blockquote>
					<p dir="ltr">
					} 
					</p>
				</blockquote>
			</blockquote>
		</blockquote>
	</blockquote>
</blockquote>
<p dir="ltr">
<em>Oh - CleanDatabase() is an extension method&nbsp;I wrote just as an example, but you could do some Asserts to ensure the lookup data is already in there.</em> 
</p>
<p dir="ltr">
As you can see from the example I'm randomly creating a database name, and creating it if it exists. 
</p>
<p dir="ltr">
So there you have it, simply creating test databases with LINQ to SQL :D 
</p>