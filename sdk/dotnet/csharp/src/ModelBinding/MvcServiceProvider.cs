using Microsoft.Extensions.DependencyInjection;
using AereaCo.NexusUX.DependencyInjection;

namespace AereaCo.NexusUX.ModelBinding;

public static class ServiceCollectionExtensionMethods
{
    public static IServiceCollection AddNexusUXMvc(this IServiceCollection serviceCollection)
    {
        // ReSharper disable once SuspiciousTypeConversion.Global
        if (!serviceCollection.Any(_ => _.ServiceType == typeof(IStateSignalsReaderService)))
        {
            throw new Exception($"{nameof(AddNexusUXMvc)} requires that {nameof(AereaCo.NexusUX.DependencyInjection.ServiceCollectionExtensionMethods.AddNexusUX)} is added first");
        }

        serviceCollection.AddControllers(options => options.ModelBinderProviders.Insert(0, new SignalsModelBinderProvider()));
        return serviceCollection;
    }
}