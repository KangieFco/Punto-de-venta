using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace PosApi.Controllers;

[ApiController]
[Route("api/qz")]
[Authorize]
public class QzController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<QzController> _logger;

    public QzController(
        IWebHostEnvironment environment,
        ILogger<QzController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpGet("certificate")]
    public async Task<IActionResult> GetCertificate()
    {
        var certificatePath = GetCertificatePath(
            "digital-certificate.txt"
        );

        if (!System.IO.File.Exists(certificatePath))
        {
            return NotFound(new
            {
                success = false,
                message =
                    "No se encontró el certificado público de QZ Tray."
            });
        }

        var certificate =
            await System.IO.File.ReadAllTextAsync(
                certificatePath
            );

        return Content(
            certificate,
            "text/plain",
            Encoding.UTF8
        );
    }

    [HttpPost("sign")]
    public async Task<IActionResult> Sign(
        [FromBody] QzSignRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Request))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "No se recibió contenido para firmar."
            });
        }

        var privateKeyPath = GetCertificatePath(
            "private-key.pem"
        );

        if (!System.IO.File.Exists(privateKeyPath))
        {
            return NotFound(new
            {
                success = false,
                message =
                    "No se encontró la clave privada de QZ Tray."
            });
        }

        try
        {
            var privateKeyPem =
                await System.IO.File.ReadAllTextAsync(
                    privateKeyPath
                );

            using var rsa = RSA.Create();

            rsa.ImportFromPem(privateKeyPem);

            var requestBytes =
                Encoding.UTF8.GetBytes(request.Request);

            var signatureBytes = rsa.SignData(
                requestBytes,
                HashAlgorithmName.SHA512,
                RSASignaturePadding.Pkcs1
            );

            var signature =
                Convert.ToBase64String(signatureBytes);

            return Ok(new
            {
                success = true,
                data = new
                {
                    signature
                }
            });
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "No se pudo firmar la solicitud de QZ Tray."
            );

            return StatusCode(500, new
            {
                success = false,
                message =
                    "No se pudo firmar la solicitud de impresión."
            });
        }
    }

    private string GetCertificatePath(string fileName)
    {
        return Path.Combine(
            _environment.ContentRootPath,
            "QzCertificates",
            fileName
        );
    }
}

public sealed class QzSignRequest
{
    public string Request { get; set; } =
        string.Empty;
}