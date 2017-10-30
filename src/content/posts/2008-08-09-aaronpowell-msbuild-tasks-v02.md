+++
title = "AaronPowell.MSBuild.Tasks v0.2"
date = "2008-08-09"
draft = false
tags = ["MSBuild"]
+++

<p>
Ok, well it's <em>actually</em> v0.2.3143.41238 but who's counting :stuck_out_tongue:
</p>
<p>
So I've got a new version of my MSBuild tasks ready, and in this new minor release I added a new namespace and two new tasks. The new namespace is <strong>AaronPowell.MSBuild.Tasks.Sql</strong> and the new tasks are <strong>DatabaseBackup </strong>and <strong>DatabaseRestore</strong>.<br>
I'm sure you're smart enough to work out what these two tasks do, but for those who are a little slow to catch on. 
</p>
<p>
<strong>DatabaseBackup</strong> 
</p>
<p>
This task is designed to make it easier to backup a database as part of a build. It generates a Sql command, adds the appropriate parameters and then runs it nicely.<br>
You can specify any location and filename to backup to, provided the Sql Server is able to connect to it to run the backup. 
</p>
<p>
Note - it only supports MS SQL servers and full database backups. 
</p>
<p>
<a href="/get/media/794/databasebackup01.png" target="_blank"><img src="/get/media/794/databasebackup01.png" width="500" height="59" alt="databaseBackup01.png"></a> 
</p>
<p>
The above shows how to use the MSBuild task in use. 
</p>
<p>
<strong>DatabaseRestore</strong> 
</p>
<p>
This task is designed to restore a database from a backup, it is slightly more advanced as it requires a few more parameters, such as where to find the log and data files of the database (full path on the Sql server). 
</p>
<p>
<a href="/get/media/810/databaserestore01.png" target="_blank"><img src="/get/media/810/databaserestore01.png" width="491" height="80" alt="databaseRestore01.png"></a>&nbsp; 
</p>
<p>
With the above example there are two parameters left out, if the name within the data/ log files within the backup these can be provided within the <em>DataName</em> and <em>LogName</em> properties. 
</p>
<p>
&nbsp;
</p>
<p>
So there we go, two pretty new tasks. Get <a href="/get/media/804/v0.2.3143.41238.zip" target="_blank">v0.2.3143.41238</a> now! 
</p>