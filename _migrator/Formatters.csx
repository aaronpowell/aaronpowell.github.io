public static class Formatters {
    public static string Encode(string s) {
        return s.Replace("\"", @"\""");
    }

    public static string CreateMetaData(string key, string value) {
        return string.Format("{0}: \"{1}\"", key, Encode(value));
    }

    public static string CreateMetaDataMultiLine(string key, string value) {
        return string.Format("{0}: \"\"\"{1}{2}{1}\"\"\"", key, Environment.NewLine, Encode(value));
    }

    public static string CreateMetaData(string key, DateTime value) {
        return CreateMetaData(key, value.ToString("yyyy-MM-dd"));
    }

    public static string CreateMetaData(string key, IEnumerable<string> value) {
        value = value.Select(x => "\"" + Encode(x.Trim()) + "\"");

        return string.Format("{0}: [{1}]", key, string.Join(",", value));
    }

}