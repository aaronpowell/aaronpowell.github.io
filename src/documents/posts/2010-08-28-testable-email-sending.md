---
  title: "Testable email sending"
  metaTitle: "Testable email sending"
  description: "Creating an integration test of sending an email"
  revised: "2010-08-28"
  date: "2010-08-28"
  tags: 
    - "c#"
    - "testing"
  migrated: "true"
  urls: 
    - "/testable-email-sending"
  summary: "This article was migrated from my old website, originally dated 17/07/2009"
---
Yesterday [Shannon][1] finally got with the times and learnt about the `System.Net` and how it can be used to [dump emails to your file system][2].

Something I then mentioned to him on Twitter was that you can also use this method to test the email that was sent.

First off lets write ourselves a very basic email sending test:

	[TestMethod]
	public void EmailSender() {
		var mail = new MailMessage();
		mail.To.Add("example@somewhere.com");
		mail.From = new MailAddress("example2@somewhere.com");
		mail.Subject = "Testing Email";
		mail.Body = "Sending Email. Woo!";
		var smtp = new SmtpClient();
		smtp.Send(mail);
	}

So we're assuming that we've set our config up so that we're dumping the email to the file system. This is all well and good but how do we assert that the email was sent to the right person, and that the body/ subject was what we wanted? Well that can easily be done, if you know the structure of the .eml file which is generated when dumping the mail to the file system.

I wrote a handy little class which can do this:

	public sealed class EmlHelper
	{
		public string Path { get; set; }
		public string From { get; set; }
		public string To { get; set; }
		public string Subject { get; set; }
		public string Urls { get; set; }

		public EmlHelper(string path)
		{
			Path = path;
			string fc = new StreamReader(path).ReadToEnd();
			From = Regex.Matches(fc, "From: (.+)")[0].ToString().Replace("From: ", string.Empty).Trim();
			To = Regex.Matches(fc, "To: (.+)")[0].ToString().Replace("To: ", string.Empty).Trim();
			Subject = Regex.Matches(fc, "Subject: (.+)")[0].ToString().Replace("Subject: ", string.Empty).Trim();
			Urls = string.Empty;
			foreach (Match m in Regex.Matches(fc, @"https?://([a-zA-Z\.]+)/"))
			{
				Urls += m.ToString() + ' ';
			}
		}
	}

It's a fairly basic class which you just need to understand the structure of the eml file, I used some regexes to break it apart. They may be a bit brittle (my regex skills aren't crash hot) and I don't support reading the body (as you really need to customise that for plain text vs HTML, and yeah, good luck there :P).

Now all that we need to do is pass in the file name of the email which was generated. 

The problem is that there isn't really a good way to determine the email (someone know a way?), so you can just use LINQ to locate the file ordered by created date or something, but for this example I'm going to assume that there aren't any other files in there anyway. So lets update our test method:

	[TestMethod]
	public void EmailSender() {
		var mail = new MailMessage();
		mail.To.Add("example@somewhere.com");
		mail.From = new MailAddress("example2@somewhere.com");
		mail.Subject = "Testing Email";
		mail.Body = "Sending Email. Woo!";
		var smtp = new SmtpClient();
		smtp.Send(mail);

		var emailSettings = (MailSettingsSectionGroup)ConfigurationManager
                     .OpenExecConfiguration(ConfigurationUserLevel.Now)
                     .GetSectionGroup("system.net/mailSettings");
		var folder = emailSettings.MailSettings.Smtp.SpecifiedPickupDirectory.PickupDirectoryLocation;
		var eml = new EmlHelper(new DirectoryInfo(folder).GetFiles().First().FullName);

		//Assert
		Assert.AreEqual(mail.ToAddresses[0].Address, eml.To);
		Assert.AreEqual(mail.Subject, eml.Subject);
		//and so on
	}

So there you have it, it's very basic to use and make testable email sending.

  [1]: http://twitter.com/shazwazza
  [2]: http://farmcode.org/post/2009/07/16/Testing-Outgoing-SMTP-Emails-So-Simple!.aspx
