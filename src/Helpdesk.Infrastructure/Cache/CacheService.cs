using Microsoft.Extensions.Caching.Memory;

namespace Helpdesk.Infrastructure.Cache;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);
}

public class MemoryCacheService : ICacheService
{
    private readonly MemoryCache _cache = new(new MemoryCacheOptions());
    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
        => Task.FromResult(_cache.TryGetValue(key, out T? v) ? v : default);
    public Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct = default)
    { _cache.Set(key, value, ttl); return Task.CompletedTask; }
    public Task RemoveAsync(string key, CancellationToken ct = default)
    { _cache.Remove(key); return Task.CompletedTask; }
}
