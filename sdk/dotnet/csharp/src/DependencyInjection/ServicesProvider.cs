using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Core = AereaCo.NexusUX.FSharp;

namespace AereaCo.NexusUX.DependencyInjection;

public static class ServiceCollectionExtensionMethods
{
    public static IServiceCollection AddNexusUX(this IServiceCollection serviceCollection)
    {
        serviceCollection
            .AddHttpContextAccessor()
            .AddScoped<IStateSignalsReaderService>(svcPvd =>
            {
                IHttpContextAccessor? httpContextAccessor = svcPvd.GetService<IHttpContextAccessor>();
                Core.IReadSignals signalsHttpHandler = new Core.SignalsHttpHandler(httpContextAccessor!.HttpContext!.Request);
                return new SignalsReaderService(signalsHttpHandler);
            })
            .AddScoped<IStateServerSentEventService>(svcPvd =>
            {
                IHttpContextAccessor? httpContextAccessor = svcPvd.GetService<IHttpContextAccessor>();
                Core.ISendServerEvent sseHttpHandler = new Core.ServerSentEventHttpHandler(httpContextAccessor!.HttpContext!.Response);
                return new ServerSentEventService(sseHttpHandler);
            });
        return serviceCollection;
    }
}