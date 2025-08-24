import { AttributePlugin, PluginType, Requirement, RuntimeContext, CleanupUpdateCallback, MutationUpdateCallback } from '../../../engine/types';
import { jsStrToObject } from '../../../utils/text';

export const GraphQLPlugin: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'graphql',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: (ctx: RuntimeContext) => {
    const { el, value: queryStringOrSignal, signals, effect, runtimeErr, genRX } = ctx;

    // Parse configuration from attributes
    const urlAttr = el.getAttribute('data-graphql-url') || '/graphql';
    const variablesAttr = el.getAttribute('data-graphql-variables') || '{}';
    const operationNameAttr = el.getAttribute('data-graphql-operation-name');
    const methodAttr = el.getAttribute('data-graphql-method') || 'POST';
    const headersAttr = el.getAttribute('data-graphql-headers') || '{}';
    const resultSignalPath = el.getAttribute('data-graphql-result-signal') || 'graphql.result';
    const errorSignalPath = el.getAttribute('data-graphql-error-signal') || 'graphql.error';
    const loadingSignalPath = el.getAttribute('data-graphql-loading-signal') || 'graphql.loading';
    const onSuccessExpr = el.getAttribute('data-graphql-on-success');
    const onErrorExpr = el.getAttribute('data-graphql-on-error');
    const onCompleteExpr = el.getAttribute('data-graphql-on-complete');
    const refetchOnChangeAttr = el.getAttribute('data-graphql-refetch-on-change');
    const pollInterval = parseInt(el.getAttribute('data-graphql-poll-interval') || '0', 10);

    // Initialize signals
    signals.upsertIfMissing(resultSignalPath, null);
    signals.upsertIfMissing(errorSignalPath, null);
    signals.upsertIfMissing(loadingSignalPath, false);

    let pollTimer: number | undefined;

    const executeGraphQL = async () => {
      signals.setValue(loadingSignalPath, true);
      signals.setValue(errorSignalPath, null); // Clear previous errors

      try {
        // Resolve reactive attributes
        const url = genRX()(urlAttr) as string;
        const query = genRX()(queryStringOrSignal) as string;
        const variables = jsStrToObject(genRX()(variablesAttr) as string);
        const operationName = operationNameAttr ? genRX()(operationNameAttr as string) as string : undefined;
        const headers = jsStrToObject(genRX()(headersAttr) as string);

        // Construct GraphQL request body
        const requestBody = {
          query,
          variables,
          operationName,
        };

        // Use fetch directly
        const response = await fetch(url, {
          method: methodAttr,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          signals.setValue(errorSignalPath, { networkError: true, status: response.status, ...errorData });
          if (onErrorExpr) genRX()(onErrorExpr as string, { evt: { detail: { error: errorData, networkError: true } } });
          return;
        }

        const graphqlResponse = await response.json();

        if (graphqlResponse.errors) {
          signals.setValue(errorSignalPath, graphqlResponse.errors);
          if (onErrorExpr) genRX()(onErrorExpr as string, { evt: { detail: { errors: graphqlResponse.errors } } });
        } else {
          signals.setValue(resultSignalPath, graphqlResponse.data);
          if (onSuccessExpr) genRX()(onSuccessExpr as string, { evt: { detail: { data: graphqlResponse.data, errors: graphqlResponse.errors } } });
        }

      } catch (e: any) {
        signals.setValue(errorSignalPath, { message: e.message, error: e });
        runtimeErr('GraphQLFetchFailed', { error: e.message });
        if (onErrorExpr) genRX()(onErrorExpr as string, { evt: { detail: { error: e, networkError: true } } });
      } finally {
        signals.setValue(loadingSignalPath, false);
        if (onCompleteExpr) genRX()(onCompleteExpr as string, { evt: {} });
      }
    };

    // Initial fetch
    executeGraphQL();

    // Refetch on signal change
    let refetchEffectCleanup: CleanupUpdateCallback | undefined;
    if (refetchOnChangeAttr) {
      refetchEffectCleanup = effect(() => {
        // This effect will re-run when any of the specified signals change
        // We need to ensure it's not re-run on initial setup or when GraphQL signals change
        // A simple way is to just trigger executeGraphQL
        executeGraphQL();
      });
    }

    // Polling
    if (pollInterval > 0) {
      pollTimer = setInterval(executeGraphQL, pollInterval) as any;
    };

    const cleanupCallback: CleanupUpdateCallback = () => {
      refetchEffectCleanup?.();
      if (pollTimer) clearInterval(pollTimer);
    };

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      // If the query string itself changes, re-execute
      if (newValue && newValue !== queryStringOrSignal) {
        executeGraphQL();
      }
      // Re-evaluate refetch-on-change if attribute changes
      if (refetchOnChangeAttr) {
        refetchEffectCleanup?.(); // Re-run effect to pick up new signal path if it changed
      }
      // Re-evaluate polling if attribute changes
      if (pollInterval > 0 && !pollTimer) {
        pollTimer = setInterval(executeGraphQL, pollInterval) as any;
      } else if (pollInterval === 0 && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
      }
    };

    return { cleanupCallback, mutationCallback };
  },
};