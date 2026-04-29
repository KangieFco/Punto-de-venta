namespace PosApi.Common.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string resource, object id)
        : base($"{resource} con id '{id}' no encontrado.", 404) { }

    public NotFoundException(string message)
        : base(message, 404) { }
}