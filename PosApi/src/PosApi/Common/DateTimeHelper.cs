namespace PosApi.Common;

public static class DateTimeHelper
{
    private static readonly TimeZoneInfo MexicoCentral =
        TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows()
                ? "Central Standard Time"
                : "America/Mexico_City"
        );

    public static DateTime Now =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MexicoCentral);

    public static DateTime ToLocal(DateTime utcDate) =>
        TimeZoneInfo.ConvertTimeFromUtc( DateTime.SpecifyKind(utcDate, DateTimeKind.Utc), MexicoCentral);
}