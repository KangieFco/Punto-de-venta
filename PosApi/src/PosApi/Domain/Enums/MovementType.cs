namespace PosApi.Domain.Enums;

public enum MovementType
{
    Entry = 1,        // Entrada de mercancía
    Output = 2,       // Salida manual
    SalePending = 3,       // Descuento por venta
    CancellationReturn = 4, // Regreso por cancelación
    Adjustment = 5    // Ajuste manual
}