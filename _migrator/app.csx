#load "Post.csx"
#load "Settings.csx"
#load "Formatters.csx"

using System;
using System.Data.SqlClient;
using System.IO;
using Dapper;
using LibGit2Sharp;

static Repository InitOrOpen(string path) {
    var gitBasePath = Repository.Discover(path);
    if (gitBasePath == null)
    {
        Console.WriteLine("And we're creating a new git repo people!");
        return Repository.Init(path);
    }
    Console.WriteLine("Found existing repo, keep on trucking");
    return new Repository(gitBasePath);
}

using (var repo = InitOrOpen(Settings.OutputPath)) {
    Console.WriteLine("It's time to rock and rooooooooll");

    using (var conn = new SqlConnection(Settings.ConnectionString)) {
        conn.Open();
        var items = conn.Query<Post>(@"
SELECT  [t1].[Name] AS [Path],
        [t1].[Title],
        [t1].[TagsCommaSeparated] AS [Tags],
        [t0].[Body] AS [Contents],
        [t0].[Revised] AS [Date],
        [t0].[Reason],
        [t1].[Summary],
        [t1].[MetaDescription] AS [Desc],
        [t1].[MetaTitle],
        [t1].[Published],
        [t1].[Status],
        [t0].[Format]
FROM [Revision] AS [t0]
INNER JOIN [Entry] AS [t1] ON [t0].[EntryId] = [t1].[Id]
WHERE [t1].[Status] <> 'Private'
ORDER BY [t1].[Published], [t0].[Revised]
");

        foreach (var item in items) {
            var tags = item.Tags.Split(',')
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrEmpty(x));
            var uriParts = item.Path.Split('/');

            if (uriParts.Count() > 1) {
                tags = tags.Union(uriParts.Take(uriParts.Count() - 1));
            }

            var postPath = Path.Combine(Settings.OutputPath, item.Published.ToString("yyyy-MM-dd") + "-" + uriParts.Last()) + ".html.md";
            if (!File.Exists(postPath))
                File.CreateText(postPath).Close();

            using (var sw = new StreamWriter(postPath)) {
                sw.WriteLine("--- cson");
                sw.WriteLine(Formatters.CreateMetaData("title", item.Title));
                sw.WriteLine(Formatters.CreateMetaData("metaTitle", item.MetaTitle));
                sw.WriteLine(Formatters.CreateMetaData("description", item.Desc));
                sw.WriteLine(Formatters.CreateMetaData("revised", item.Date));
                sw.WriteLine(Formatters.CreateMetaData("date", item.Published));
                sw.WriteLine(Formatters.CreateMetaData("tags", tags));
                sw.WriteLine(Formatters.CreateMetaData("migrated", "true"));
                sw.WriteLine(Formatters.CreateMetaData("urls", new[] {"/" + item.Path}));
                sw.WriteLine(Formatters.CreateMetaDataMultiLine("summary", item.Summary));
                sw.WriteLine("---");
                sw.Write(item.Contents);
            }

            var commitMessage = string.IsNullOrEmpty(item.Reason) ? "I should have given a reason" : item.Reason;

            repo.Index.Stage("*");
            repo.Commit(commitMessage, new Signature("Aaron Powell", "me@aaron-powell.com", (DateTime) item.Date));

        }
    }
}
Console.WriteLine("And we're done");
Console.ReadLine();