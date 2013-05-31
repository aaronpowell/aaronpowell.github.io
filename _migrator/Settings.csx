using System.IO;

public static class Settings {
	public static readonly string ConnectionString = @"Data Source=(local);Initial Catalog=test;Integrated Security=SSPI";
	public static readonly string OutputPath = Path.GetFullPath(@"..\src\documents\posts");
}