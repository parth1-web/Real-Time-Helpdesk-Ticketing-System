namespace Helpdesk.Infrastructure.Storage;

public interface IAttachmentStorage
{
    Task<string> SaveAsync(string storedName, Stream content, CancellationToken ct = default);
    Task<Stream> OpenAsync(string storagePath, CancellationToken ct = default);
}

public class LocalAttachmentStorage : IAttachmentStorage
{
    private readonly string _root;
    public LocalAttachmentStorage(Microsoft.Extensions.Configuration.IConfiguration config)
    {
        _root = config["Storage:Root"] ?? "uploads";
        Directory.CreateDirectory(_root);
    }
    public async Task<string> SaveAsync(string storedName, Stream content, CancellationToken ct = default)
    {
        var safe = Path.GetFileName(storedName); // prevent traversal
        var path = Path.Combine(_root, safe);
        using var fs = File.Create(path);
        await content.CopyToAsync(fs, ct);
        return path;
    }
    public Task<Stream> OpenAsync(string storagePath, CancellationToken ct = default)
        => Task.FromResult<Stream>(File.OpenRead(storagePath));
}

public static class AttachmentRules
{
    public static readonly string[] AllowedExtensions = { ".pdf", ".png", ".jpg", ".jpeg", ".txt", ".log", ".zip" };
    public static readonly string[] AllowedMime = { "application/pdf", "image/png", "image/jpeg", "text/plain", "application/zip" };
    public const long MaxBytes = 10 * 1024 * 1024;
    public static void Validate(string fileName, string contentType, long size)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext)) throw new InvalidOperationException("File type not allowed.");
        if (!AllowedMime.Contains(contentType)) throw new InvalidOperationException("MIME type not allowed.");
        if (size <= 0 || size > MaxBytes) throw new InvalidOperationException("File size must be 1B..10MB.");
        if (fileName.Contains("..") || Path.IsPathRooted(fileName)) throw new InvalidOperationException("Unsafe filename.");
    }
}
