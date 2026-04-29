namespace PosApi.Common.Exceptions;

// Errores de reglas de negocio (stock, caja cerrada, etc.)
public class BusinessException : AppException
{
    public BusinessException(string message)
        : base(message, 422) { }
}