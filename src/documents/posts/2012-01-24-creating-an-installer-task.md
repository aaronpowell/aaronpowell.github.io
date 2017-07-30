---
  title: "Creating an installer task"
  metaTitle: "Creating an installer task"
  description: "A look at the v5 task system, particularly how to create an installer task"
  revised: "2012-01-24"
  date: "2012-01-24"
  tags: 
    - "umbraco"
    - "umbraco-5"
  migrated: "true"
  urls: 
    - "/umbraco/creating-an-installer-task"
  summary: ""
---
As you possibly know I'm working on an extension for Umbraco 5 called [Stats It][1] and I've initially been focusing on making the install process nice and smooth for people who want to get up and running with the package. A good install experience will do wonders for giving your project credibility.

For this I have had to do a bit of digging into the **Task** system which is coming in v5, which is acting as a replacement for the traditional .NET event system, and in this article I'm going to share some tips when building **installer tasks**.

# Right task for the job

In v5 there are two kinds of tasks available, **Standard Tasks** (my name) and **Configuration Tasks** and depending on what you're wanting to do you'll need to choose the right kind of task. Here's a quick overview of the two task types:

## Standard Task

This is the most common type of task that you'll be creating; a task inherits from `Umbraco.Cms.Web.Tasks.AbstractWebTask` and requires a `Umbraco.Framework.Tasks.TaskAttribute` to be added so that the Umbraco framework layer will be able to find it (and you need to provide the attribute with a Guid for identification). This task type is very basic and can be used for any task that is raised in the system and then execute a piece of code, because of this you can think of it as being very similar to the event handlers that were in the Umbraco 4 system (or that you'll find in any .NET application).

## Configuration Tasks

This task is primarily used in the install/ uninstall process of Umbraco 5 and inherits from `Umbraco.Cms.Web.Tasks.ConfigurationTask`. Where the previous task type you require an attribute the Configuration Tasks **don't** and you'll get some very undesired results if you *do* include the attribute. The power of this task type though is it allows you to specify values in the configuration file for the task, providing static values into the task as it is executed.

*Side note - there is another task type `Umbraco.Framework.Tasks.AbstractTask` which is the base class for the `AbstractWebTask` but instead of relying on the web-side of Umbraco 5 it can be run without any web references. This would what you want if you are using the Umbraco framework outside of a web context, which it can do in-theory, but it's well beyond the scope of this post :P.*

# Task configuration

In addition to creating a class you'll also need to add a section in your configuration file that your task definition will reside within. There are two ways to do this:

1. Add to the master web.config file (not recommended as it can have upgrade issues)
2. Add your own package

I'm going to make the assumption that you're creating your own package here and you'll have your own web.config that you want to work against. First off you need to ensure you have the right web.config section:

    <configuration>
      <configSections>
        <sectionGroup name="umbraco.cms">
          <section name="tasks" type="Umbraco.Cms.Web.Configuration.Tasks.TasksConfiguration, Umbraco.Cms.Web" requirePermission="false" />
        </sectionGroup>
      </configSections>
     </configuration>

This is the basis of your web.config file (and assuming there's nothing else in it yet) and what we've done is created a new web.config section called **umbraco.cms** and in that included the **tasks** section which uses a type provided by Umbraco.

Next we need to register our tasks:

	  <umbraco.cms>
	    <tasks>
	      <add type="MyPackages.Tasks.MyAwesomeTask, MyPackage" trigger="post-package-install" />
	    </tasks>
	  </umbraco.cms>

This section would appear after the `</configSections>` node and adds the section which we defined and then within that we add our tasks. There are two pieces of information we have to provide it:

1. The fully qualified type of our task (namespace + classname + assembly)
2. A trigger for the task, for install tasks there is one called `post-package-install`

So that's the setup, now to make a task.

# Creating your first task

So you're working on the next awesome package for Umbraco 5 and you need some stuff to happen when you install your package, well let's get cracking and make your first task. We'll do a basic task which will email you on package install, kind of a basic pingback to tell you when someone has installed the package. First up we'll make a class:

    using System;
    using Umbraco.Cms.Web.Context;
    using Umbraco.Cms.Web.Tasks;
    using Umbraco.Framework;
    using Umbraco.Framework.Tasks;
    
    namespace TaskDemo
    {
        [Task("{C1C251E1-CACF-447A-9516-694251C16B08}", TaskTriggers.PostPackageInstall)]
        public class EmailOnInstall : AbstractWebTask
        {
            public EmailOnInstall(IUmbracoApplicationContext applicationContext) : base(applicationContext)
            {
            }
    
            public override void Execute(TaskExecutionContext context)
            {
                throw new NotImplementedException();
            }
        }
    }

This is as empty a file as you can possibly have for an Umbraco 5 task, currently this will just error on install, pretty useful!

The important stuff will be happening within the `Execute` method, this is the method that is invoked when task is run and obviously where you want to put your logic, so let's build it out:

    public override void Execute(TaskExecutionContext context)
    {
        var email = new MailMessage
                        {
                            From = new MailAddress("phone-home@demo.com")
                        };
        email.To.Add(new MailAddress("new-install@demo.com"));
        email.Subject = "A new install has happened!";
        email.Body = "Hey dude,\r\nSomeone has installed your awesome package!\r\nH5YR!";

        var smtpClient = new SmtpClient();
        //server config skipped
        smtpClient.Send(email);
    }

There we go, a *very* basic implementation of a task has been done! Here's the config for this:

    <?xml version="1.0" encoding="utf-8" ?>
    <configuration>
      <configSections>
        <sectionGroup name="umbraco.cms">
          <section name="tasks" type="Umbraco.Cms.Web.Configuration.Tasks.TasksConfiguration, Umbraco.Cms.Web" requirePermission="false" />
        </sectionGroup>
      </configSections>
    
      <umbraco.cms>
        <tasks>
          <add type="TaskDemo.EmailOnInstall, TaskDemo" trigger="post-package-install" />
        </tasks>
      </umbraco.cms>
    </configuration>

Something you may notice is that in my config **and** in my class I've had to specify the trigger, this could be a mistake that I've made in my understanding thus-far but it seems to me that that is needed, someone feel free to correct me ;).

# Creating a configuration task

As stipulated the above task is **very** basic but it does show you how you can work with the basics of a task. Well let's say that you want to create something a bit more advanced, say you want to have a task that will grant permissions to your custom application when the package is installed (this is a common problem solved in the PackageActionContrib in v4). For this we'll leverage the Configuration Task type so that we can make it a reusable task.

    using System;
    using Umbraco.Cms.Web.Context;
    using Umbraco.Cms.Web.Tasks;
    using Umbraco.Framework.Tasks;
    
    namespace TaskDemo
    {
        public class GrantPermissions : ConfigurationTask
        {
            public GrantPermissions(ConfigurationTaskContext configurationTaskContext) : base(configurationTaskContext)
            {
            }
    
            public override void Execute(TaskExecutionContext context)
            {
                throw new NotImplementedException();
            }
        }
    }
    
So again we've got our skeleton class but this time we inherit from `ConfigurationTask` so that we can provide it with configuration values.

Inside the `Execute` method we can access the `ConfigurationTaskContext.Parameters` property which will contain the parameters that are passed in from our configuration file, like so:

    public override void Execute(TaskExecutionContext context)
    {
        if (!ConfigurationTaskContext.Parameters.ContainsKey("application"))
            throw new ArgumentException("No application supplied");
    }

A simple check to make sure that we did get an application supplied, I want that as a pre-condition so that people don't break things on me!

But let's do something with the application provided:

*Note: We're diving into the Hive here, I'm going to glance over how Hive works here, that's beyond the scope of this article, just believe me when I say that the code does work :P*

    public override void Execute(TaskExecutionContext context)
    {
        if (!ConfigurationTaskContext.Parameters.ContainsKey("application"))
            throw new ArgumentException("No application supplied");

        var controller = (Controller)context.EventSource;
        //Get the ID of the current user
        var id = ((UmbracoBackOfficeIdentity)controller.User.Identity).Id;
        //Access the Hive user store
        using (var uow = ApplicationContext.Hive.OpenWriter<ISecurityStore>())
        {
            //find the current user in Hive
            var entity = uow.Repositories.Get<User>(id);
            //Add the specified app to their permissions
            var apps = new List<string>(entity.Applications)
                            {
                                ConfigurationTaskContext.Parameters["application"]
                            };
            //Update their permissions
            entity.Applications = apps;
            //Tell Hive to update the object -- possibly not needed
            uow.Repositories.AddOrUpdate(entity);
            //tell Hive that we want to save the changes to its store
            uow.Complete();
            controller.HttpContext.CreateUmbracoAuthTicket(entity);
        }
    }
    
I've put some comments inline to explain the code as it goes but the important part is that we are reading the task parameters out and adding it to the users permissions.

Once this is all updated it amazingly will just give a new icon in the applications tray on the install of the package!

Now let's have a look at the config:

        <tasks>
          <add type="TaskDemo.GrantPermissions, TaskDemo" trigger="post-package-install">
              <parameter name="application" value="my-awesome-app" />
          </add>
        </tasks>

# Conclusion

While the code above may look a little bit scare to begin with it's actually not that bad when it comes to creating tasks. There's a few simple rules which you need to remember:

1. Pick the right type of task for your work, do you want to pass in config values or can you compile everything together?
1. Do you need to work with anything web specific or is just the base FrameworkContext going to be enough?
1. Make sure you subscribe to the right event!

There's a few tasks built into the core of Umbraco 5 for copying files so that can also provide a good reference source.

  [1]: http://stats-it.com