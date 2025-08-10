namespace AereaCo.NexusUX.FSharp

open AereaCo.NexusUX.FSharp.Utility

[<AbstractClass; Sealed>]
type ServerSentEventGenerator =
    static member MergeFragments(fragments, options:MergeFragmentsOptions) =
        { EventType = MergeFragments
          Id = options.EventId
          Retry = options.Retry
          DataLines = [|
            if (options.Selector |> ValueOption.isSome) then $"{Consts.StateDatalineSelector} {options.Selector |> ValueOption.get |> Selector.value}"
            if (options.MergeMode <> Consts.DefaultFragmentMergeMode) then $"{Consts.StateDatalineMergeMode} {options.MergeMode |> Consts.FragmentMergeMode.toString}"
            if (options.UseViewTransition <> Consts.DefaultFragmentsUseViewTransitions) then $"{Consts.StateDatalineUseViewTransition} %A{options.UseViewTransition}"
            yield! (fragments |> String.split String.newLines |> Seq.map (fun fragmentLine -> $"{Consts.StateDatalineFragments} %s{fragmentLine}"))
            |] }
    static member MergeFragments fragments = ServerSentEventGenerator.MergeFragments (fragments, MergeFragmentsOptions.defaults)

    static member RemoveFragments(selector, options:RemoveFragmentsOptions) =
        { EventType = RemoveFragments
          Id = options.EventId
          Retry = options.Retry
          DataLines = [|
            $"{Consts.StateDatalineSelector} {selector |> Selector.value}"
            if (options.UseViewTransition <> Consts.DefaultFragmentsUseViewTransitions) then $"{Consts.StateDatalineUseViewTransition} %A{options.UseViewTransition}"
            |] }
    static member RemoveFragments selector = ServerSentEventGenerator.RemoveFragments(selector, RemoveFragmentsOptions.defaults)

    static member MergeSignals(signals, options:MergeSignalsOptions) =
        { EventType = MergeSignals
          Id = options.EventId
          Retry = options.Retry
          DataLines = [|
            if (options.OnlyIfMissing <> Consts.DefaultMergeSignalsOnlyIfMissing) then $"{Consts.StateDatalineOnlyIfMissing} %A{options.OnlyIfMissing}"
            yield! signals |> Signals.value |> String.split String.newLines |> Seq.map (fun dataLine -> $"{Consts.StateDatalineSignals} %s{dataLine}")
            |] }
    static member MergeSignals signals = ServerSentEventGenerator.MergeSignals(signals, MergeSignalsOptions.defaults)

    static member RemoveSignals(signalPaths, options:EventOptions) =
        let paths' = signalPaths |> Seq.map SignalPath.value |> String.concat " "
        { EventType = RemoveSignals
          Id = options.EventId
          Retry = options.Retry
          DataLines = [| $"{Consts.StateDatalinePaths} {paths'}" |] }
    static member RemoveSignals signalPaths = ServerSentEventGenerator.RemoveSignals(signalPaths, EventOptions.defaults)

    static member ExecuteScript(script, options:ExecuteScriptOptions) =
        { EventType = ExecuteScript
          Id = options.EventId
          Retry = options.Retry
          DataLines = [|
            if (options.AutoRemove <> Consts.DefaultExecuteScriptAutoRemove) then $"{Consts.StateDatalineAutoRemove} %A{options.AutoRemove}"
            if (not <| Seq.forall2 (=) options.Attributes [| Consts.DefaultExecuteScriptAttributes |] ) then
                yield! options.Attributes |> Seq.map (fun attr -> $"{Consts.StateDatalineAttributes} {attr}")
            yield! script |> String.split String.newLines |> Seq.map (fun scriptLine -> $"{Consts.StateDatalineScript} %s{scriptLine}")
            |] }
    static member ExecuteScript script = ServerSentEventGenerator.ExecuteScript(script, ExecuteScriptOptions.defaults)