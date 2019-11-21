module JsonExtensions

open System.Text.Json.Serialization
open System
open System.Text.Json

type InvalidDateTimeConverter() =
    inherit JsonConverter<DateTimeOffset>()

    override ``_``.Read(reader: byref<Utf8JsonReader>, typeToConvert: Type, options: JsonSerializerOptions) =
        try
            DateTimeOffset.Parse(reader.GetString())
        with _ -> DateTimeOffset.MinValue

    override ``_``.Write(writer: Utf8JsonWriter, value: DateTimeOffset, options: JsonSerializerOptions) =
        writer.WriteStringValue(value.ToString())
