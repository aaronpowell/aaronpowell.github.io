---
  title: "Reading Azure config in ASPNet5"
  date: "2015-01-03"
  tags: 
    - "aspnet"
    - "aspnet5"
  description: "There's a new config system in ASPNet5, so when you use an Azure Website how can you read the values stored in the Azure config?"
  urls: 
    - "/posts/2015-01-03-reading-azure-config-in-aspnet5.html"
---

In my rush to make the awesome website [What the Commit?](http://whatthecommit.azurewebsites.net) live I completely forgot that I'd committed the GitHub private key to the git repository. Whoops!

*Sorry I have since reset the keys so no, you can't use them :P.*

In ASPNet5 there's no dependency on IIS which in turn means there's no `Web.config`. This poses an interesting question of where you get your configuration values from and how would you do different values per environment (aka, config transforms). If you're not familiar with the the new configuration system [check out this blog](http://whereslou.com/2014/05/23/asp-net-vnext-moving-parts-iconfiguration/).

# On Azure Websites

When using Azure Websites if you go to the Configure section towards the bottom there is `app settings`. Here you can define settings that will be loaded up by your application when it starts.

Since we've got a completely new config pipeline how would we access them?

I decided to poke around in the loaded configs, which turns out to be a bit harder as it's so abstract (I created some [sample code](https://github.com/aaronpowell/config-testing) for those interested) and what I learnt was **they are available as Environment Variables**.

# Loading Environment Variables

If you want to use Environment Variables as a config source you need to make sure you load it, here's what I did for my sample:

    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            // Setup configuration sources.
            Configuration = new Configuration()
                .AddJsonFile("config.json")
                .AddEnvironmentVariables();
        }

Here I'm defining two configuration sources. First is a JSON file which contains configuration options I'm unlikely to change per environment, maybe the number of results per page. Secondly I add the Environment Variables source, meaning that anything I've defined in there trumps what I have defined in the JSON file.

# Conclusion

If you're using Azure Websites and want to have different settings or load in sensitive settings then they are available as Environment Variables, which can be accessed in an ASPNet5 app using the appropriate configuration source.
